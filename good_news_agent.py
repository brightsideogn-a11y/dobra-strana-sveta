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
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import random

# CONFIGURATION
RSS_SOURCES = [
  {"name": "Good News Network", "url": "https://www.goodnewsnetwork.org/feed/"},
  {"name": "Positive News", "url": "https://www.positive.news/feed/"},
  {"name": "The Optimist Daily", "url": "https://www.optimistdaily.com/feed/"},
  {"name": "Reasons to be Cheerful", "url": "https://reasonstobecheerful.world/feed/"},
  {"name": "Yes! Magazine", "url": "https://www.yesmagazine.org/feed/"},
  {"name": "The Guardian - The Upside", "url": "https://www.theguardian.com/world/series/the-upside/rss"},
  {"name": "NASA Breaking News", "url": "https://www.nasa.gov/feed/"},
  {"name": "Google News - Uplifting", "url": "https://news.google.com/rss/search?q=uplifting+news+OR+good+news+OR+positive+news&hl=en-US&gl=US&ceid=US:en"}
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
                    
            # 4. Fallback webpage image scraping is deferred to main() after selection to save time/requests
                
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
def save_stories_to_firestore(new_stories):
    # Initialize Firebase Admin SDK
    cred_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
    if cred_env:
        try:
            # Check if it's a JSON string
            cred_json = json.loads(cred_env)
            # Ensure newlines in private key are correctly processed
            if "private_key" in cred_json:
                cred_json["private_key"] = cred_json["private_key"].replace("\\n", "\n")
            cred = credentials.Certificate(cred_json)
        except Exception as e:
            # If not valid JSON, treat it as a file path
            print(f"FIREBASE_SERVICE_ACCOUNT_KEY is not a valid JSON string or key structure: {e}")
            cred = credentials.Certificate(cred_env)
    else:
        local_key = "service-account-key.json"
        if os.path.exists(local_key):
            with open(local_key, "r", encoding="utf-8") as f:
                cred_json = json.load(f)
                if "private_key" in cred_json:
                    cred_json["private_key"] = cred_json["private_key"].replace("\\n", "\n")
                cred = credentials.Certificate(cred_json)
        else:
            print("Error: FIREBASE_SERVICE_ACCOUNT_KEY is not set.")
            print("Please set the environment variable or create 'service-account-key.json'.")
            sys.exit(1)

    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass # Already initialized

    db = firestore.client()
    
    added_count = 0
    for s in new_stories:
        link = s.get("link")
        title = s.get("title")
        
        # Check if story already exists in Firestore by link or title
        exists = False
        if link:
            docs = db.collection("stories").where("link", "==", link).limit(1).get()
            if len(docs) > 0:
                exists = True
        else:
            docs = db.collection("stories").where("title", "==", title).limit(1).get()
            if len(docs) > 0:
                exists = True
                
        if exists:
            print(f"Story already exists in Firestore: {title}. Skipping.")
            continue
            
        doc_data = {
            "title": title,
            "category": s.get("category", "kindness"),
            "content": s.get("content", ""),
            "author": s.get("author", "Scraper"),
            "link": link or "",
            "image": s.get("image") or "",
            "date": s.get("date") or datetime.now().strftime("%d %b %Y"),
            "timestamp": int(datetime.now().timestamp() * 1000),
            "likes": 0,
            "status": "approved"
        }
        
        db.collection("stories").add(doc_data)
        print(f"Successfully added story to Firestore: {title}")
        added_count += 1
        
    print(f"Finished writing to Firestore. Added {added_count} new stories.")

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
        
    # Shuffle the list to get a random mix of stories from all sources
    random.shuffle(raw_stories)
    
    # Limit number of raw articles processed to save tokens/avoid rate limits (e.g. max 20)
    raw_stories = raw_stories[:20]

    # 2. Process with Gemini
    scraped_stories = process_stories_with_gemini(api_key, raw_stories)
    
    # 3. Save to Firestore
    if scraped_stories:
        # Match back image URLs to their summarized stories by link
        raw_image_map = {s["link"]: s["image"] for s in raw_stories if s.get("link")}
        for s in scraped_stories:
            link = s.get("link")
            img_url = raw_image_map.get(link, "")
            
            # If no image was found in RSS feed, scrape the webpage now ONLY for this curated story
            if not img_url and link:
                print(f"Scraping cover image fallback from webpage: {link}...")
                img_url = extract_og_image(link)
                
            s["image"] = img_url or ""
                
        save_stories_to_firestore(scraped_stories)
        print("Scraper run completed successfully.")
    else:
        print("No new stories added.")

if __name__ == "__main__":
    main()
