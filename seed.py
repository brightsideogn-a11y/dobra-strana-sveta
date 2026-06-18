import os
import sys
import json
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import datetime

DEFAULT_STORIES = [
  {
    "title": "Biodegradable plastic made from algae helps clean oceans",
    "category": "science",
    "content": "A team of young scientists has successfully developed a new type of biodegradable packaging made from brown marine algae. Unlike traditional plastic which takes centuries to decompose, this organic material completely degrades in seawater in under six weeks, leaving no harmful microplastics or residues behind. Several global companies have already announced plans to adopt this eco-friendly material.",
    "author": "Science & Ecology",
    "link": "https://example.com/algae-plastic",
    "date": "15 Jun 2026",
    "likes": 245,
    "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"
  },
  {
    "title": "Retired carpenter crafts free wooden toys for kids",
    "category": "kindness",
    "content": "Miloje (72), a retired carpenter, has spent the last three years in his workshop crafting wooden toys. He gives all of them—cars, houses, puzzles, and hobby horses—for free to children from low-income families and local orphanages. He has distributed over 600 unique hand-crafted toys so far, stating that seeing a child's smile is the only reward he needs.",
    "author": "Local News",
    "link": "",
    "date": "14 Jun 2026",
    "likes": 512,
    "image": "https://images.unsplash.com/photo-1581844144558-f7b6059d2f2d?w=600&auto=format&fit=crop&q=80"
  },
  {
    "title": "Blue whale population shows rapid recovery",
    "category": "nature",
    "content": "The latest report by marine biologists brings great news: after decades of strict protection and conservation efforts, the blue whale population in the South Atlantic has recovered to nearly 95% of its historical numbers. These ocean giants are once again roaming the seas in large groups, representing one of the greatest ecological victories of this century.",
    "author": "Green Planet",
    "link": "https://example.com/whales-recovery",
    "date": "12 Jun 2026",
    "likes": 189,
    "image": "https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=600&auto=format&fit=crop&q=80"
  },
  {
    "title": "AI discovers powerful new antibiotic to fight superbugs",
    "category": "science",
    "content": "In a historic medical breakthrough, researchers used advanced artificial intelligence algorithms to screen millions of chemical compounds in a matter of days. The AI successfully identified a completely new molecular structure that destroys superbugs resistant to all known drugs. This discovery could save millions of lives globally.",
    "author": "Medical Magazine",
    "link": "https://example.com/ai-antibiotic",
    "date": "10 Jun 2026",
    "likes": 367,
    "image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80"
  },
  {
    "title": "Public street piano turns strangers into an orchestra",
    "category": "culture",
    "content": "A public piano was placed in the city center with a sign reading 'Play me, the world is listening'. The idea was simply to enrich public space, but the reaction has exceeded all expectations. Every day, people of all ages—from children to professional pianists and seniors—stop by to play, creating beautiful moments of community and joy for passersby.",
    "author": "Culture Guide",
    "link": "",
    "date": "08 Jun 2026",
    "likes": 304,
    "image": "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&auto=format&fit=crop&q=80"
  },
  {
    "title": "Students launch 'Warm Winter for Everyone' clothing drive",
    "category": "humanity",
    "content": "A group of students organized a self-initiated drive to collect winter clothing, blankets, and food for homeless people. Instead of standard collection centers, they hung warm jackets and coats on park trees with a tag: 'If you need it, take it. If you have extra, leave it'. The initiative has quickly spread to other cities.",
    "author": "Humanitarian Network",
    "link": "",
    "date": "05 Jun 2026",
    "likes": 418,
    "image": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80"
  }
]

def main():
    cred_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
    if cred_env:
        try:
            cred_json = json.loads(cred_env)
            cred = credentials.Certificate(cred_json)
        except Exception as e:
            cred = credentials.Certificate(cred_env)
    else:
        local_key = "service-account-key.json"
        if os.path.exists(local_key):
            cred = credentials.Certificate(local_key)
        else:
            print("Error: FIREBASE_SERVICE_ACCOUNT_KEY is not set.")
            print("Please run this script with FIREBASE_SERVICE_ACCOUNT_KEY or service-account-key.json.")
            sys.exit(1)

    firebase_admin.initialize_app(cred)
    db = firestore.client()

    print("Checking if stories collection is empty...")
    docs = db.collection("stories").limit(1).get()
    if len(docs) > 0:
        print("Database already contains stories. Skipping seeding.")
        return

    print("Seeding default stories...")
    for i, story in enumerate(DEFAULT_STORIES):
        story_data = {
            "title": story["title"],
            "category": story["category"],
            "content": story["content"],
            "author": story["author"],
            "link": story["link"],
            "image": story["image"],
            "date": story["date"],
            "timestamp": int(datetime.now().timestamp() * 1000) - (len(DEFAULT_STORIES) - i) * 60000,
            "likes": story["likes"],
            "status": "approved"
        }
        db.collection("stories").add(story_data)
        print(f"Added: {story['title']}")

    print("Seeding complete successfully.")

if __name__ == "__main__":
    main()
