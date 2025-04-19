import os
from pinecone import Pinecone, ServerlessSpec
import google.generativeai as genai
from uuid import uuid4
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

genai.configure(api_key=os.environ.get('GOOGLE_API_KEY'))

def get_gemini_embedding(text: str) -> list:
    # model = genai.GenerativeModel('embedding-001')
    response = genai.embed_content(
        model="models/embedding-001",
        content=text,
        task_type="RETRIEVAL_DOCUMENT"
    )
    return response['embedding']

index_name = "jobs-index"

if index_name in pc.list_indexes().names():
    pc.delete_index(index_name)

if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=768,
        metric="cosine",
        spec=ServerlessSpec(cloud='aws', region='us-east-1')  # adjust as needed
    )

index = pc.Index(index_name)

sample_jobs = [
    {
        "title": "Software Engineer",
        "company": "Google",
        "location": "Remote",
        "work_mode": "Work From Home",
        "experience": "2 years",
        "skills": "Python, Cloud, Machine Learning"
    },
    {
        "title": "Data Analyst",
        "company": "Netflix",
        "location": "California",
        "work_mode": "Hybrid",
        "experience": "1-3 years",
        "skills": "SQL, Tableau, Python"
    }
]

for job in sample_jobs:
    text = f"{job['title']} at {job['company']}, {job['location']}, Mode: {job['work_mode']}, Experience: {job['experience']}, Skills: {job['skills']}"
    embedding = get_gemini_embedding(text)
    vector_id = str(uuid4())
    index.upsert(vectors=[{"id": vector_id, "values": embedding, "metadata": job}])
