from http.server import BaseHTTPRequestHandler
import arxiv
import json
import datetime
import os
from time import time
import requests
from typing import Optional
from pydantic import BaseModel

class KVConfig(BaseModel):
    url: str
    rest_api_url: str
    rest_api_token: str
    rest_api_read_only_token: str

class Opts(BaseModel):
    ex: Optional[int] = None
    px: Optional[int] = None
    exat: Optional[int] = None
    pxat: Optional[int] = None
    keepTtl: Optional[bool] = None

class KV:
    def __init__(self, kv_config: Optional[KVConfig] = None):
        if kv_config is None:
            self.kv_config = KVConfig(
                url=os.getenv("VERCEL_KV_URL"),
                rest_api_url=os.getenv("VERCEL_KV_REST_API_URL"),
                rest_api_token=os.getenv("VERCEL_KV_REST_API_TOKEN"),
                rest_api_read_only_token=os.getenv("VERCEL_KV_REST_API_READ_ONLY_TOKEN"),
            )
        else:
            self.kv_config = kv_config

    def get_kv_conf(self) -> KVConfig:
        return self.kv_config

    def has_auth(self) -> bool:
        headers = {
            'Authorization': f'Bearer {self.kv_config.rest_api_token}',
        }
        resp = requests.get(self.kv_config.rest_api_url, headers=headers)
        return resp.status_code != 401

    def set(self, key, value, opts: Optional[Opts] = None) -> bool:
        headers = {
            'Authorization': f'Bearer {self.kv_config.rest_api_token}',
        }
        url = f'{self.kv_config.rest_api_url}/set/{key}/{value}'
        if opts is not None and opts.ex is not None:
            url = f'{url}/ex/{opts.ex}'
        resp = requests.get(url, headers=headers)
        return resp.json().get('result', False)

    def get(self, key) -> Optional[str]:
        headers = {
            'Authorization': f'Bearer {self.kv_config.rest_api_token}',
        }
        resp = requests.get(f'{self.kv_config.rest_api_url}/get/{key}', headers=headers)
        return resp.json().get('result')

    def zadd(self, key, mapping):
      headers = {
          'Authorization': f'Bearer {self.kv_config.rest_api_token}',
          'Content-Type': 'application/json',
      }
      url = f'{self.kv_config.rest_api_url}/zadd/{key}'
      
      # Format the data as expected by Upstash Redis
      data = [item for pair in mapping.items() for item in pair]
      
      print(f"Attempting to zadd: URL: {url}, Data: {json.dumps(data)}")
      
      resp = requests.post(url, headers=headers, json=data)
      
      print(f"ZADD Response status: {resp.status_code}")
      print(f"ZADD Response content: {resp.text}")
      
      result = resp.json().get('result', 0)
      print(f"ZADD Result: {result}")
      
      return result

    def zrevrange(self, key, start, stop):
        headers = {
            'Authorization': f'Bearer {self.kv_config.rest_api_token}',
        }
        url = f'{self.kv_config.rest_api_url}/zrevrange/{key}/{start}/{stop}'
        resp = requests.get(url, headers=headers)
        return resp.json().get('result', [])

try:
    kv_client = KV()
    print(f"KV client initialized. Has auth: {kv_client.has_auth()}")
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
                stored_papers = []
                message = f"Fetched {len(papers)} papers about climate change (KV storage not available or not authenticated)"
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "message": message,
                "papers": papers if not kv_client or not kv_client.has_auth() else stored_papers,
                "kv_auth": kv_client.has_auth() if kv_client else False,
                "debug_info": {
                    "kv_client_available": kv_client is not None,
                    "kv_client_has_auth": kv_client.has_auth() if kv_client else False
                }
            }
            
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            print(f"Error in handler: {str(e)}")
            self.send_error(500, f"Internal Server Error: {str(e)}")

# For local testing
if __name__ == "__main__":
    papers = fetch_and_store_climate_papers()
    print(f"\nFetched {len(papers)} papers about climate change")
    
    if kv_client and kv_client.has_auth():
        print("\nRetrieving latest papers from KV store:")
        latest_papers = get_latest_papers()
        for paper in latest_papers:
            print(f"- {paper['title']} (Published: {paper['published']})")
    else:
        print("\nNote: Vercel KV not available or not authenticated. Papers were not stored.")