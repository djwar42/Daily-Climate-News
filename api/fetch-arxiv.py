from http.server import BaseHTTPRequestHandler
import arxiv
import json
import datetime
import os
from time import time

try:
    from vercel_kv import VercelKV as kv
    kv_client = kv(os.environ.get('KV_REST_API_URL'), os.environ.get('KV_REST_API_TOKEN'))
    print("Successfully connected to Vercel KV")
except ImportError:
    print("VercelKV not available. Running in local mode.")
    kv_client = None
except Exception as e:
    print(f"Error connecting to Vercel KV: {str(e)}")
    kv_client = None

def fetch_and_store_climate_papers():
    search = arxiv.Search(
        query="climate",
        max_results=100,
        sort_by=arxiv.SortCriterion.SubmittedDate
    )

    papers = []
    for result in search.results():
        paper = {
            "title": result.title,
            "authors": [author.name for author in result.authors],
            "summary": result.summary,
            "published": result.published.isoformat(),
            "link": result.entry_id,
            "pdf_url": result.pdf_url,
            "categories": result.categories
        }
        papers.append(paper)
        
        if kv_client:
            try:
                # Store paper data
                kv_client.set(f"paper:{result.entry_id}", json.dumps(paper))
                print(f"Stored paper: {result.entry_id}")
                
                # Add to sorted set
                timestamp = int(result.published.timestamp())
                kv_client.zadd("climate_papers", {result.entry_id: timestamp})
                print(f"Added to sorted set: {result.entry_id}")
            except Exception as e:
                print(f"Error storing paper {result.entry_id}: {str(e)}")

    return papers

def get_latest_papers(count=10):
    if not kv_client:
        return []
    
    try:
        # Get the latest paper IDs
        latest_ids = kv_client.zrevrange("climate_papers", 0, count-1)
        
        # Fetch paper data for each ID
        papers = []
        for paper_id in latest_ids:
            paper_data = kv_client.get(f"paper:{paper_id}")
            if paper_data:
                papers.append(json.loads(paper_data))
            else:
                print(f"Failed to retrieve paper: {paper_id}")
        
        return papers
    except Exception as e:
        print(f"Error retrieving latest papers: {str(e)}")
        return []

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        papers = fetch_and_store_climate_papers()
        
        if kv_client:
            stored_papers = get_latest_papers()
            message = f"Fetched {len(papers)} papers and retrieved {len(stored_papers)} from Vercel KV"
        else:
            message = f"Fetched {len(papers)} papers about climate change (KV storage not available)"
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = {
            "message": message,
            "papers": papers if not kv_client else stored_papers
        }
        
        self.wfile.write(json.dumps(response).encode())
        return

# For local testing
if __name__ == "__main__":
    papers = fetch_and_store_climate_papers()
    print(f"\nFetched {len(papers)} papers about climate change")
    
    if kv_client:
        print("\nChecking stored data:")
        try:
            stored_papers = kv_client.zrevrange("climate_papers", 0, -1)
            print(f"Found {len(stored_papers)} papers in the sorted set")
            for paper_id in stored_papers[:5]:  # Check the first 5 papers
                paper_data = kv_client.get(f"paper:{paper_id}")
                if paper_data:
                    print(f"Retrieved paper: {paper_id}")
                else:
                    print(f"Failed to retrieve paper: {paper_id}")
        except Exception as e:
            print(f"Error checking stored data: {str(e)}")
        
        print("\nRetrieving latest papers from KV store:")
        latest_papers = get_latest_papers()
        for paper in latest_papers:
            print(f"- {paper['title']} (Published: {paper['published']})")
    else:
        print("\nNote: Vercel KV not available. Papers were not stored.")