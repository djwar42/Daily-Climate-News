import arxiv
from vercel_kv import VercelKV
import os
from datetime import datetime, timedelta

# Initialize Vercel KV client
kv = VercelKV(os.environ['KV_REST_API_URL'], os.environ['KV_REST_API_TOKEN'])

def fetch_and_store_articles():
    # Get yesterday's date
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

    # Set up the ArXiv search for "climate change"
    search = arxiv.Search(
        query=f'"climate change" AND submittedDate:[{yesterday}0000 TO {yesterday}2359]',
        max_results=10,
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending
    )

    # Fetch and store articles
    for result in search.results():
        article_data = {
            "title": result.title,
            "authors": [author.name for author in result.authors],
            "summary": result.summary,
            "published": result.published.isoformat(),
            "pdf_url": result.pdf_url,
            "entry_id": result.entry_id
        }
        
        # Use the entry_id as the key in Vercel KV
        kv.set(f"climate_article:{result.entry_id}", article_data)

        # Print the title (for logging purposes)
        print(f"Stored article: {result.title}")

    print(f"Fetched and stored climate change articles for {yesterday}")

def handler(event, context):
    fetch_and_store_articles()
    return {
        "statusCode": 200,
        "body": "Climate change articles fetched and stored successfully"
    }