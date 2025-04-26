import os
import yaml
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

# Pinecone setup
from pinecone import Pinecone, ServerlessSpec

# Hardcoded API key
PINECONE_API_KEY = (
    "pcsk_q5jJE_4WByBYX8UtQS6iWHwnALwU1b5Adhpo9b5zqv46RVFvv4PQJ3PLvKBhLC2xzdsAU"
)
PINECONE_ENV = "us-east-1"

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# Index setup
index_name = "jobs-index"

# If you don't want to delete the existing index, comment out this block
# if index_name in pc.list_indexes().names():
#     print(f"Deleting existing index: {index_name}")
#     pc.delete_index(index_name)

if index_name not in pc.list_indexes().names():
    print(f"Creating new index: {index_name}")
    pc.create_index(
        name=index_name,
        dimension=768,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region=PINECONE_ENV),
    )

index = pc.Index(index_name)


def parse_insomnia_yaml(yaml_path):
    """Parse Insomnia YAML file and extract API requests."""
    with open(yaml_path, "r") as file:
        data = yaml.safe_load(file)

    requests = []

    def extract_requests(items):
        for item in items:
            if "children" in item:
                extract_requests(item["children"])
            elif "url" in item and "method" in item:
                # This is a request
                req = {
                    "name": item.get("name", "Unnamed Request"),
                    "url": item["url"],
                    "method": item["method"],
                    "parameters": [],
                    "headers": [],
                }

                # Extract parameters
                if "parameters" in item:
                    for param in item["parameters"]:
                        if not param.get("disabled", False):
                            req["parameters"].append(
                                {
                                    "name": param.get("name", ""),
                                    "value": param.get("value", ""),
                                }
                            )

                # Extract headers
                if "headers" in item:
                    for header in item["headers"]:
                        if not header.get("disabled", False):
                            req["headers"].append(
                                {
                                    "name": header.get("name", ""),
                                    "value": header.get("value", ""),
                                }
                            )

                requests.append(req)

    # Start extraction from collection
    if "collection" in data:
        extract_requests(data["collection"])

    return requests


def fetch_api_data(requests):
    """Fetch data from APIs using the extracted requests."""
    job_data = []

    for req in requests:
        print(f"Fetching data from: {req['name']} - {req['url']}")

        # Build parameters dictionary
        params = {param["name"]: param["value"] for param in req["parameters"]}

        # Build headers dictionary
        headers = {header["name"]: header["value"] for header in req["headers"]}

        try:
            response = requests.request(
                method=req["method"],
                url=req["url"],
                params=params,
                headers=headers,
                timeout=10,
            )

            if response.status_code == 200:
                try:
                    # Try to parse as JSON
                    data = response.json()

                    # Process data based on the API
                    processed_jobs = process_api_response(data, req["url"])
                    if processed_jobs:
                        job_data.extend(processed_jobs)
                        print(
                            f"  Processed {len(processed_jobs)} jobs from {req['name']}"
                        )
                    else:
                        print(f"  No jobs extracted from {req['name']}")
                except json.JSONDecodeError:
                    print(f"  Error: Response is not valid JSON for {req['name']}")
            else:
                print(
                    f"  Error: Received status code {response.status_code} for {req['name']}"
                )

        except Exception as e:
            print(f"  Error fetching data from {req['name']}: {str(e)}")

    return job_data


def process_api_response(data, api_url):
    """Process API response and extract job data based on the API."""
    jobs = []

    # Different APIs have different response structures
    if "jsearch.p.rapidapi.com" in api_url:
        # JSSearch API
        if "data" in data:
            for item in data.get("data", []):
                job = {
                    "title": item.get("job_title", ""),
                    "company": item.get("employer_name", ""),
                    "location": item.get("job_city", "")
                    + ", "
                    + item.get("job_country", ""),
                    "work_mode": item.get("job_is_remote", False)
                    and "Remote"
                    or "On-site",
                    "experience": "",  # Not directly available
                    "skills": ", ".join(item.get("job_required_skills", [])),
                    "source": "JSSearch API",
                    "url": item.get("job_apply_link", ""),
                    "description": item.get("job_description", ""),
                }
                jobs.append(job)

    elif "linkedin-api8.p.rapidapi.com" in api_url:
        # LinkedIn API
        for item in data.get("jobs", []):
            job = {
                "title": item.get("title", ""),
                "company": item.get("companyName", ""),
                "location": item.get("location", ""),
                "work_mode": item.get("workplaceType", ""),
                "experience": "",  # Not directly available
                "skills": "",  # Not directly available
                "source": "LinkedIn API",
                "url": item.get("applyUrl", ""),
                "description": item.get("description", ""),
            }
            jobs.append(job)

    elif "glassdoor-real-time.p.rapidapi.com" in api_url:
        # Glassdoor API
        for item in data.get("jobs", []):
            job = {
                "title": item.get("jobTitle", ""),
                "company": item.get("employer", {}).get("name", ""),
                "location": item.get("location", ""),
                "work_mode": "",  # Not directly available
                "experience": item.get("seniorityLevel", ""),
                "skills": "",  # Not directly available
                "source": "Glassdoor API",
                "url": item.get("jobViewUrl", ""),
                "description": item.get("jobDesc", ""),
            }
            jobs.append(job)

    elif "api.adzuna.com" in api_url:
        # Adzuna API
        for item in data.get("results", []):
            job = {
                "title": item.get("title", ""),
                "company": item.get("company", {}).get("display_name", ""),
                "location": item.get("location", {}).get("display_name", ""),
                "work_mode": "",  # Not directly available
                "experience": "",  # Not directly available
                "skills": "",  # Not directly available
                "source": "Adzuna API",
                "url": item.get("redirect_url", ""),
                "description": item.get("description", ""),
            }
            jobs.append(job)

    elif "remoteok.io" in api_url:
        # RemoteOK API
        for item in data:
            if isinstance(item, dict) and "position" in item:
                job = {
                    "title": item.get("position", ""),
                    "company": item.get("company", ""),
                    "location": "Remote",
                    "work_mode": "Remote",
                    "experience": "",  # Not directly available
                    "skills": ", ".join(item.get("tags", [])),
                    "source": "RemoteOK API",
                    "url": item.get("url", ""),
                    "description": item.get("description", ""),
                }
                jobs.append(job)

    return jobs


def store_jobs_in_pinecone(jobs):
    """Store job data in Pinecone."""
    print(f"Storing {len(jobs)} jobs in Pinecone...")

    for job in jobs:
        # Create a text representation for embedding
        text = f"{job['title']} at {job['company']}, {job['location']}"
        if job["work_mode"]:
            text += f", Mode: {job['work_mode']}"
        if job["experience"]:
            text += f", Experience: {job['experience']}"
        if job["skills"]:
            text += f", Skills: {job['skills']}"

        # Add description summary if available
        if job["description"] and len(job["description"]) > 0:
            # Truncate description to avoid embedding issues
            desc_summary = job["description"][:500].replace("\n", " ")
            text += f". {desc_summary}..."

        # Generate embedding
        try:
            embedding = get_gemini_embedding(text)
            vector_id = str(uuid4())

            # Prepare metadata
            metadata = job.copy()
            metadata["text"] = text

            # Store in Pinecone
            index.upsert(
                vectors=[{"id": vector_id, "values": embedding, "metadata": metadata}]
            )
            print(f"  Stored job: {job['title']} at {job['company']}")

        except Exception as e:
            print(f"  Error storing job {job['title']}: {str(e)}")


def main():
    yaml_path = os.path.join(os.path.dirname(__file__), "Insomnia_2025-04-24.yaml")

    print(f"Parsing Insomnia YAML file: {yaml_path}")
    requests = parse_insomnia_yaml(yaml_path)
    print(f"Found {len(requests)} API requests in the YAML file")

    job_data = fetch_api_data(requests)
    print(f"Fetched {len(job_data)} jobs from APIs")

    store_jobs_in_pinecone(job_data)
    print("Job data stored in Pinecone successfully")


if __name__ == "__main__":
    main()
