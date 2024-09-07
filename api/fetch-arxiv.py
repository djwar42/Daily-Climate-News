from http.server import BaseHTTPRequestHandler
import arxiv
import json
import datetime
import os
from time import time

try:
    from vercel_kv import VercelKV as kv
    kv_client = kv(os.environ.get('KV_REST_API_URL'), os.environ.get('KV_REST_API_TOKEN'))
except ImportError:
    print("VercelKV not available. Running in local mode.")
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
            # Store paper data
            kv_client.set(f"paper:{result.entry_id}", json.dumps(paper))
            
            # Add to sorted set
            timestamp = int(result.published.timestamp())
            kv_client.zadd("climate_papers", {result.entry_id: timestamp})

    return papers

def get_latest_papers(count=10):
    if not kv_client:
        return []
    
    # Get the latest paper IDs
    latest_ids = kv_client.zrevrange("climate_papers", 0, count-1)
    
    # Fetch paper data for each ID
    papers = []
    for paper_id in latest_ids:
        paper_data = kv_client.get(f"paper:{paper_id}")
        if paper_data:
            papers.append(json.loads(paper_data))
    
    return papers

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if kv_client:
            papers = get_latest_papers()
            message = f"Retrieved {len(papers)} papers from Vercel KV"
        else:
            papers = fetch_and_store_climate_papers()
            message = f"Fetched {len(papers)} papers about climate change"
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = {
            "message": message,
            "papers": papers
        }
        
        self.wfile.write(json.dumps(response).encode())
        return

# For local testing
if __name__ == "__main__":
    papers = fetch_and_store_climate_papers()
    print("Fetched and stored papers:")
    for paper in papers:
        print(f"- {paper['title']} (Published: {paper['published']})")
    
    if kv_client:
        print("\nRetrieving latest papers from KV store:")
        latest_papers = get_latest_papers()
        for paper in latest_papers:
            print(f"- {paper['title']} (Published: {paper['published']})")
    else:
        print("\nNote: Vercel KV not available locally. Papers were not stored.")