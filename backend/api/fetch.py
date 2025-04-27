import os
import requests
import json
from uuid import uuid4
import sys
from dotenv import load_dotenv
from pathlib import Path

# Add the parent directory to the path to import from core
sys.path.append(str(Path(__file__).parent.parent))
from core.pinecone_data import get_gemini_embedding

# Load environment variables
load_dotenv()

from pinecone import Pinecone, ServerlessSpec

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
RAPIDAPI_KEY = os.environ.get("RAPIDAPI_KEY") 

PINECONE_ENV = "us-east-1"
pc = Pinecone(api_key=PINECONE_API_KEY)
index_name = "jobs-index"

if index_name not in pc.list_indexes().names():
    print(f"Creating new index: {index_name}")
    pc.create_index(
        name=index_name,
        dimension=768,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region=PINECONE_ENV),
    )

index = pc.Index(index_name)

# API Details (example: JSSearch API on RapidAPI)
JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"

HEADERS = {
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
}


def search_jobs(query, location="", page=1):
    """Hit the job search API with user-provided query."""
    params = {
        "query": query,
        "page": page,
        "num_pages": 1,   # You can customize if needed
    }
    if location:
        params["location"] = location

    try:
        response = requests.get(JSEARCH_URL, headers=HEADERS, params=params)
        if response.status_code == 200:
            data = response.json()
            return process_api_response(data)
        else:
            print(f"Error: {response.status_code} {response.text}")
            return []
    except Exception as e:
        print(f"Error hitting API: {str(e)}")
        return []


def process_api_response(data):
    """Parse response."""
    jobs = []
    if "data" in data:
        for item in data.get("data", []):
            job = {
                "title": item.get("job_title", ""),
                "company": item.get("employer_name", ""),
                "location": item.get("job_city", "") + ", " + item.get("job_country", ""),
                "work_mode": item.get("job_is_remote", False) and "Remote" or "On-site",
                "experience": "",  # Not directly available
                "skills": ", ".join(item.get("job_required_skills", [])),
                "source": "JSSearch API",
                "url": item.get("job_apply_link", ""),
                "description": item.get("job_description", ""),
            }
            jobs.append(job)
    return jobs


def store_jobs_in_pinecone(jobs):
    """Store job data into Pinecone."""
    print(f"Storing {len(jobs)} jobs in Pinecone...")
    for job in jobs:
        text = f"{job['title']} at {job['company']}, {job['location']}"
        if job["work_mode"]:
            text += f", Mode: {job['work_mode']}"
        if job["experience"]:
            text += f", Experience: {job['experience']}"
        if job["skills"]:
            text += f", Skills: {job['skills']}"
        if job["description"]:
            desc_summary = job["description"][:500].replace("\n", " ")
            text += f". {desc_summary}..."

        try:
            embedding = get_gemini_embedding(text)
            vector_id = str(uuid4())
            metadata = job.copy()
            metadata["text"] = text

            index.upsert(vectors=[{"id": vector_id, "values": embedding, "metadata": metadata}])
            print(f"  Stored job: {job['title']} at {job['company']}")
        except Exception as e:
            print(f"  Error storing job {job['title']}: {str(e)}")


def main():
    query = input("Enter job search query (e.g., Data Scientist, Backend Developer): ")
    location = input("Enter location (optional, leave blank if remote/global): ")

    jobs = search_jobs(query, location)
    print(f"Fetched {len(jobs)} jobs")

    if jobs:
        store_jobs_in_pinecone(jobs)
        print("Jobs stored in Pinecone successfully")
