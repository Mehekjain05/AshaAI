# test_db.py
from data_model import MongoDB

def test_connection():
    try:
        db = MongoDB()
        # List all collections in the database
        collections = db.db.list_collection_names()
        print(f"Connected to MongoDB! Collections: {collections}")
        
        # Insert a test document
        test_job = {
            "title": "Software Engineer",
            "company": "Test Company",
            "location": "Remote",
            "work_mode": "Hybrid",
            "experience": "2-5 years",
            "skills": "Python, MongoDB, FastAPI"
        }
        
        result = db.insert_job(test_job)
        print(f"Inserted test document with ID: {result.inserted_id}")
        
        # Retrieve the document
        jobs = db.get_jobs({"title": "Software Engineer"})
        print(f"Retrieved {len(jobs)} jobs")
        for job in jobs:
            print(f"- {job.title} at {job.company}")
            
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

if __name__ == "__main__":
    test_connection()