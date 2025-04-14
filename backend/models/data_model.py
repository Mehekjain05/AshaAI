from pydantic import BaseModel, Field
from typing import List
class JobResponse(BaseModel):
    """Information of relevant job based on a user query"""

    title: str= Field(description="title of the job")
    company: str= Field(description="name of the company")
    location: str= Field(description="location of the job")
    work_mode: str= Field(description="work mode of the job")
    experience: str= Field(description="experience of the job")
    skills: str= Field(description="skills of the job")

class JobResponseList(BaseModel):
    """A list of job responses"""
    jobs: List[JobResponse]
