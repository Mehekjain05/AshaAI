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



class BiasDetection(BaseModel):
  """Detecting bias and relevance in a user query"""
  bias_detected : bool = Field(description="Boolean value representing the presence of bias. True if bias is present, False if absent")
  bias_score : int = Field(description="A score between 0 and 100 representing the level of bias")
  response : str = Field(description="Response in first person to be given directly back to the user as the Asha AI chatbot in case bias is detected. Explaining why the user query felt biased, redirecting user to original mission of the chatbot and warning the user")

class LearningPath(BaseModel):
    """Stage and Topics to be covered in a Learning Path"""
    stage : str = Field(description="The Learning Stage for example : Beginner, Intermediate, Advanced, etc. ")
    topics : list[str] = Field(description="A List of topics to learn in this stage")
    
class CareerResponse(BaseModel):
    """Career Goal and a Structured Learning Path for a user query """
    goal : str = Field(description="the name of the career or job. For example Data Scientist, etc.")
    learning_path : List[LearningPath]