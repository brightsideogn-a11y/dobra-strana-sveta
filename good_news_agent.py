#!/usr/bin/env python3
import os
import sys
import json
import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import email.utils
from datetime import datetime

# CONFIGURATION
RSS_SOURCES = [
  {"name": "Good News Network", "url": "https://www.goodnewsnetwork.org/feed/"},
  {"name": "Positive News", "url": "https://www.positive.news/feed/"}
]
STORIES_FILE = "stories.json"
MAX_STORIES = 40

# Clean HTML tags from RSS content
def clean_html(text):
    if not text:
        return ""
    # Remove script/style tags
    text = re.sub(r'<(script|style).*?>.*?</\1>', '', text, flags=re.DOTALL)
    # Remove all HTML tags
    text = re.sub(r'<[^>]*>', '', text)
    # Clean whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Scrape full article HTML for Open Graph Image (og:image)
def extract_og_image(url):
    if not url:
        return ""
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode('utf-8', errors='ignore')
        
        # Extract target meta tags and get content attribute
        for meta in re.findall(r'<meta\s+[^>]*>', html, re.IGNORECASE):
            is_target = re.search(r'property=["\'](og:image|twitter:image)["\']', meta, re.IGNORECASE) or \
                        re.search(r'name=["\'](og:image|twitter:image)["\']', meta, re.IGNORECASE)
            if is_target:
                content_match = re.search(r'content=["\']([^"\']+)["\']', meta, re.IGNORECASE)
                if content_match:
                    return content_match.group(1)
    except Exception as e:
        print(f"Failed to extract og:image from {url}: {e}", file=sys.stderr)
    return ""

# Fetch and parse RSS feed
def fetch_rss_stories(source):
    print(f"Fetching RSS feed from: {source['name']}...")
    stories = []
    try:
        req = urllib.request.Request(
            source["url"], 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PositiveNewsAgent/1.0'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        
        # Find all <item> tags
        for item in root.findall('.//item'):
            title = item.find('title')
            link = item.find('link')
            desc = item.find('description')
            pub_date = item.find('pubDate')
            
            title_text = title.text if title is not None else ""
            link_text = link.text if link is not None else ""
            desc_text = desc.text if desc is not None else ""
            pub_date_text = pub_date.text if pub_date is not None else ""
            
            # Parse date to "DD MMM YYYY"
            formatted_date = ""
            try:
                if pub_date_text:
                    dt = email.utils.parsedate_to_datetime(pub_date_text)
                    formatted_date = dt.strftime("%d %b %Y")
            except Exception:
                pass
            
            if not formatted_date:
                formatted_date = datetime.now().strftime("%d %b %Y")
                
            # Try to extract cover image URL
            image_url = ""
            
            # 1. Media:content (Media RSS namespace)
            media_content = item.find('{http://search.yahoo.com/mrss/}content')
            if media_content is not None and media_content.get('url'):
                image_url = media_content.get('url')
                
            # 2. Enclosure
            if not image_url:
                enclosure = item.find('enclosure')
                if enclosure is not None and enclosure.get('url') and 'image' in (enclosure.get('type') or ''):
                    image_url = enclosure.get('url')
                    
            # 3. Regex on description HTML
            if not image_url and desc_text:
                img_match = re.search(r'<img [^>]*src=["\']([^"\']+)["\']', desc_text)
                if img_match:
                    image_url = img_match.group(1)
                    
            # 4. Scrape the full article page for og:image fallback
            if not image_url and link_text:
                print(f"Scraping cover image from webpage: {link_text}...")
                image_url = extract_og_image(link_text)
                
            stories.append({
                "raw_title": title_text,
                "raw_description": clean_html(desc_text)[:500], # Limit payload size
                "link": link_text,
                "date": formatted_date,
                "source": source["name"],
                "image": image_url
            })
            
        print(f"Successfully loaded {len(stories)} raw articles from {source['name']}.")
    except Exception as e:
        print(f"Error fetching RSS from {source['name']}: {e}", file=sys.stderr)
        
    return stories

# Call Gemini API to filter and summarize stories
def process_stories_with_gemini(api_key, raw_stories):
    if not raw_stories:
        return []
        
    print(f"Analyzing and summarizing {len(raw_stories)} articles using Gemini...")
    
    # We send them in chunks or in one go. Gemini 2.5 Flash can easily handle 30 articles.
    prompt = """
    You are a positive news curator. You will receive a JSON list of raw news articles.
    Your task is to:
    1. Filter out articles that are NOT positive, are advertisements, website announcements, or duplicate stories. Keep only genuine positive news (humanity, ecology, science, art, kindness).
    2. Translate/rewrite and summarize each kept story in English into exactly 2-3 inspiring sentences.
    3. Categorize each story into one of these exact categories: "humanity", "science", "nature", "kindness", "culture".
    4. Format the output as a valid JSON array of objects, with these exact keys:
       - "id": A unique string starting with "story-scraped-" followed by a unique timestamp/number.
       - "title": A concise, engaging title in English.
       - "category": The category string.
       - "content": The 2-3 sentence summary in English.
       - "author": The source name (provided in raw data).
       - "link": The article link.
       - "date": The date string (provided in raw data).
       - "likes": 0
    
    You must output ONLY a raw JSON array. Do not wrap it in markdown code blocks like ```json ... ```. Do not include any explanations.
    
    Articles to process:
    """ + json.dumps(raw_stories, ensure_ascii=False)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    data = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    try:
        body = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(
            url, 
            data=body, 
            headers={"Content-Type": "application/json"}
        )
        
        with urllib.request.urlopen(req, timeout=90) as response:
            res_data = response.read().decode("utf-8")
            
        res_json = json.loads(res_data)
        
        # Extract response text
        text_content = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        # Safe check for markdown wrappers just in case
        if text_content.startswith("```"):
            text_content = re.sub(r'^```(json)?', '', text_content)
            text_content = re.sub(r'```$', '', text_content)
            text_content = text_content.strip()
            
        scraped_stories = json.loads(text_content)
        print(f"Gemini approved and summarized {len(scraped_stories)} positive stories.")
        return scraped_stories
        
    except Exception as e:
        print(f"Error calling Gemini API: {e}", file=sys.stderr)
        return []

# Merge new stories with existing stories.json, de-duplicating by link
def merge_and_save_stories(new_stories):
    existing_stories = []
    
    if os.path.exists(STORIES_FILE):
        try:
            with open(STORIES_FILE, "r", encoding="utf-8") as f:
                existing_stories = json.load(f)
            print(f"Loaded {len(existing_stories)} existing scraped stories.")
        except Exception as e:
            print(f"Error reading existing stories.json: {e}", file=sys.stderr)
            
    # Combine and de-duplicate by link
    combined = []
    seen_links = set()
    
    # Put new stories first (since they are newer)
    for s in new_stories:
        link = s.get("link")
        if link and link not in seen_links:
            combined.append(s)
            seen_links.add(link)
            
    # Add old stories if they aren't duplicate
    for s in existing_stories:
        link = s.get("link")
        if link and link not in seen_links:
            combined.append(s)
            seen_links.add(link)
            
    # Keep only up to MAX_STORIES
    final_stories = combined[:MAX_STORIES]
    
    # Save back to file
    try:
        with open(STORIES_FILE, "w", encoding="utf-8") as f:
            json.dump(final_stories, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved {len(final_stories)} stories to {STORIES_FILE}.")
    except Exception as e:
        print(f"Error writing to stories.json: {e}", file=sys.stderr)

def main():
    # Load API key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Check if .env file exists in the directory
        if os.path.exists(".env"):
            with open(".env", "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
                        
    if not api_key:
        print("Error: GEMINI_API_KEY is not set. Please set it in your environment or in a .env file.", file=sys.stderr)
        print("To get a free key, visit: https://aistudio.google.com/app/api-keys", file=sys.stderr)
        sys.exit(1)

    # 1. Fetch raw stories
    raw_stories = []
    for source in RSS_SOURCES:
        raw_stories.extend(fetch_rss_stories(source))
        
    if not raw_stories:
        print("No articles fetched from RSS. Exiting.")
        sys.exit(0)
        
    # Limit number of raw articles processed to save tokens/avoid rate limits (e.g. max 20)
    raw_stories = raw_stories[:10]

    # 2. Process with Gemini
    scraped_stories = process_stories_with_gemini(api_key, raw_stories)
    
    # 3. Merge and Save
    if scraped_stories:
        # Match back image URLs to their summarized stories by link
        raw_image_map = {s["link"]: s["image"] for s in raw_stories if s.get("link")}
        for s in scraped_stories:
            link = s.get("link")
            if link and link in raw_image_map:
                s["image"] = raw_image_map[link]
            else:
                s["image"] = ""
                
        merge_and_save_stories(scraped_stories)
        print("Scraper run completed successfully.")
    else:
        print("No new stories added.")

if __name__ == "__main__":
    main()
