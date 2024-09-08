from http.server import BaseHTTPRequestHandler
import arxiv
import json
import datetime
import os
from time import time

try:
    from vercel_kv import KV
    kv_client = KV()
    print(f"KV client initialized. Has auth: {kv_client.has_auth()}")
except ImportError:
    print("VercelKV not available. Running in local mode.")
    kv_client = None
except Exception as e:
    print(f"Error initializing KV client: {str(e)}")
    kv_client = None

def fetch_and_store_climate_papers():
    search = arxiv.Search(
        query="climate",
        max_results=10,
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
        
        if kv_client and kv_client.has_auth():
            try:
                kv_client.set(f"paper:{result.entry_id}", json.dumps(paper))
                timestamp = int(result.published.timestamp())
                kv_client.zadd("climate_papers", {result.entry_id: timestamp})
                print(f"Stored paper: {result.entry_id}")
            except Exception as e:
                print(f"Error storing paper {result.entry_id}: {str(e)}")

    return papers

def get_latest_papers(count=10):
    if not kv_client or not kv_client.has_auth():
        return []
    
    try:
        latest_ids = kv_client.zrevrange("climate_papers", 0, count-1)
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
        try:
            papers = fetch_and_store_climate_papers()
            
            if kv_client and kv_client.has_auth():
                stored_papers = get_latest_papers()
                message = f"Fetched {len(papers)} papers and retrieved {len(stored_papers)} from Vercel KV"
            else:
                message = f"Fetched {len(papers)} papers about climate change (KV storage not available or not authenticated)"
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "message": message,
                "papers": papers if not kv_client or not kv_client.has_auth() else stored_papers,
                "kv_auth": kv_client.has_auth() if kv_client else False
            }
            
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            print(f"Error in handler: {str(e)}")
            self.send_error(500, f"Internal Server Error: {str(e)}")

# For local testing
# if __name__ == "__main__":
#     papers = fetch_and_store_climate_papers()
#     print(f"\nFetched {len(papers)} papers about climate change")
    
#     if kv_client and kv_client.has_auth():
#         print("\nChecking stored data:")
#         try:
#             stored_papers = kv_client.zrevrange("climate_papers", 0, -1)
#             print(f"Found {len(stored_papers)} papers in the sorted set")
#             for paper_id in stored_papers[:5]:  # Check the first 5 papers
#                 paper_data = kv_client.get(f"paper:{paper_id}")
#                 if paper_data:
#                     print(f"Retrieved paper: {paper_id}")
#                 else:
#                     print(f"Failed to retrieve paper: {paper_id}")
#         except Exception as e:
#             print(f"Error checking stored data: {str(e)}")
        
#         print("\nRetrieving latest papers from KV store:")
#         latest_papers = get_latest_papers()
#         for paper in latest_papers:
#             print(f"- {paper['title']} (Published: {paper['published']})")
#     else:
#         print("\nNote: Vercel KV not available or not authenticated. Papers were not stored.")