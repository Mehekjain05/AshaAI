from pymongo import MongoClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime

load_dotenv()

# Pydantic models for type validation and documentation

class UserProfile(BaseModel):
    "Save the user's preferences"
    name: str
    preferred_name: str
    response_style_preference: str
    special_skills: list[str]
    other_preferences: list[str]
    preferred_work_mode: str = Field(description="Preferred work mode of the user")
class JobResponse(BaseModel):
    """Information of relevant job based on a user query"""
    title: str = Field(description="title of the job")
    company: str = Field(description="name of the company")
    location: str = Field(description="location of the job")
    work_mode: str = Field(description="work mode of the job")
    experience: str = Field(description="experience of the job")
    skills: str = Field(description="skills of the job")

class JobResponseList(BaseModel):
    """A list of job responses"""
    jobs: List[JobResponse]
    
class EventResponse(BaseModel):
    """Information of relevant event based on a user query"""
    title: str = Field(description="title of the event")
    image: str = Field(description="image of the event")
    categories: List[str] = Field(description="categories/tags associated with the event")
    mode: str = Field(description="mode of the event (online or offline)")
    date: str = Field(description="date range of the event")
    time: str = Field(description="time range of the event")
    venue: str = Field(description="venue of the event")
    price: str = Field(description="price of the event")
    event_url: str = Field(description="official event URL")
    register_url: str = Field(description="URL to register for the event")
    
        
class CurrentEvents(BaseModel):
    """A list of job responses"""
    events: List[EventResponse]    

class BiasDetection(BaseModel):
    """Detecting bias and relevance in a user query"""
    bias_detected: bool = Field(description="Boolean value representing the presence of bias. True if bias is present, False if absent")
    bias_score: int = Field(description="A score between 0 and 100 representing the level of bias")
    response: str = Field(description="Response in first person to be given directly back to the user as the Asha AI chatbot in case bias is detected. Explaining why the user query felt biased, redirecting user to original mission of the chatbot and warning the user")

class LearningPath(BaseModel):
    """
    Represents a structured stage in an all-inclusive and comprehensive learning journey
    toward a specific career goal.
    """
    stage: str = Field(
        description="The name of the learning stage. Examples: 'Foundation', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Mastery', or 'Specialization'."
    )
    topics: List[str] = Field(
        description="A comprehensive list of topics, concepts, tools, and techniques to be learned at this stage."
    )

class CareerResponse(BaseModel):
    """
    Represents a detailed and structured roadmap for achieving a specific career goal.
    """
    goal: str = Field(
        description="The name of the career goal or profession."
    )
    learning_path: List[LearningPath] = Field(
        description="A detailed list of stages representing the comprehensive learning journey towards the specified career goal."
    )

# Helper for Pydantic model to MongoDB document conversion
def pydantic_to_dict(model: BaseModel) -> Dict[str, Any]:
    """Convert Pydantic model to MongoDB-compatible dictionary"""
    return model.model_dump()

def dict_to_pydantic(model_class, data: Dict[str, Any]):
    """Convert MongoDB document to Pydantic model"""
    # Handle MongoDB ObjectId if present
    if "_id" in data:
        data["id"] = str(data["_id"])
        del data["_id"]
    return model_class(**data)

# MongoDB connection and operations
class MongoDB:
    def __init__(self):
        self.client = MongoClient(os.getenv("MONGODB_URI"))
        self.db = self.client["asha_ai_db"]
        
        # Initialize collections
        self.jobs_collection = self.db["jobs"]
        self.events_collection = self.db["events"]
        self.mentorship_collection = self.db["mentorship_programs"]
        self.sessions_collection = self.db["user_sessions"]
        self.careers_collection = self.db["careers"]
    
    # Job operations with Pydantic model support
    def insert_job(self, job_data):
        """Insert job data, accepts either dictionary or JobResponse model"""
        if isinstance(job_data, JobResponse):
            job_data = pydantic_to_dict(job_data)
        return self.jobs_collection.insert_one(job_data)
    
    def get_jobs(self, query=None) -> List[JobResponse]:
        """Get jobs matching query, returns list of JobResponse models"""
        if query is None:
            query = {}
        jobs = list(self.jobs_collection.find(query))
        return [dict_to_pydantic(JobResponse, job) for job in jobs]
    
    # Event operations
    def insert_event(self, event_data):
        return self.events_collection.insert_one(event_data)
    
    def get_events(self, query=None):
        if query is None:
            query = {}
        return list(self.events_collection.find(query))
    
    # Mentorship operations
    def insert_mentorship(self, mentorship_data):
        return self.mentorship_collection.insert_one(mentorship_data)
    
    def get_mentorships(self, query=None):
        if query is None:
            query = {}
        return list(self.mentorship_collection.find(query))
    
    # Career path operations with Pydantic model support
    def insert_career(self, career_data):
        """Insert career data, accepts either dictionary or CareerResponse model"""
        if isinstance(career_data, CareerResponse):
            career_data = pydantic_to_dict(career_data)
        return self.careers_collection.insert_one(career_data)
    
    def get_careers(self, query=None) -> List[CareerResponse]:
        """Get career paths matching query, returns list of CareerResponse models"""
        if query is None:
            query = {}
        careers = list(self.careers_collection.find(query))
        return [dict_to_pydantic(CareerResponse, career) for career in careers]
    
    # Session operations
    def create_session(self, user_id):
        """Create a new user session"""
        session_data = {
            "user_id": user_id,
            "conversation": [],
            "created_at": datetime.datetime.now()
        }
        result = self.sessions_collection.insert_one(session_data)
        return str(result.inserted_id)
    
    def get_session(self, session_id):
        """Get session by ID"""
        return self.sessions_collection.find_one({"_id": ObjectId(session_id)})
    
    def update_session(self, session_id, session_data):
        """Update session data"""
        return self.sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": session_data}
        )

    def cache_job_url(self, url, jobs_data):
        """
        Store job search results in cache with URL as the key
        
        Args:
            url (str): The URL used to fetch the jobs
            jobs_data (list): List of job dictionaries
            
        Returns:
            pymongo.results.InsertOneResult: Result of the insert operation
        """
        from datetime import datetime, timedelta
        
        # Set expiration time (e.g., cache valid for 24 hours)
        expiry_time = datetime.utcnow() + timedelta(hours=24)
        
        cache_data = {
            "url": url,
            "jobs": jobs_data,
            "timestamp": datetime.utcnow(),
            "expires_at": expiry_time
        }
        
        # Create job_cache collection if not exists
        if "job_cache" not in self.db.list_collection_names():
            self.db.create_collection("job_cache")
            # Create TTL index to automatically expire old entries
            self.db["job_cache"].create_index("expires_at", expireAfterSeconds=0)
        
        return self.db["job_cache"].insert_one(cache_data)


    def get_cached_jobs(self, url):
        """
        Get cached job results for a specific URL
        
        Args:
            url (str): The URL used to fetch the jobs
            
        Returns:
            list: List of job dictionaries if cache exists, None otherwise
        """
        result = self.db["job_cache"].find_one({"url": url})
        if result:
            return result["jobs"]
        return None