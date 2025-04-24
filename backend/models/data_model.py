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
    """
    Represents a structured stage in an all-inclusive and comprehensive learning journey
    toward a specific career goal.

    Each stage should build on the previous one, progressing from fundamental concepts to advanced
    and specialized topics. This journey should be end-to-end, helping learners move from foundational knowledge
    to expert-level skills with a focus on both theory and hands-on application.

    The topics should cover technical skills, industry-standard tools, soft skills, and project-based learning relevant
    to the career goal.
    """
    stage: str = Field(
        description="The name of the learning stage. Examples: 'Foundation', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Mastery', or 'Specialization'. Each stage represents a progressive level of complexity, starting from basic understanding to mastering the field."
    )
    topics: list[str] = Field(
        description="A comprehensive list of topics, concepts, tools, and techniques to be learned at this stage. Topics should be specific, relevant to the career, and enable the learner to apply knowledge to real-world projects. These should encompass both theoretical foundations and practical applications."
    )

class CareerResponse(BaseModel):
    """
    Represents a detailed and structured roadmap for achieving a specific career goal.

    This roadmap should cover all stages, from beginner to mastery, and be designed to ensure
    the learner progresses logically through all essential areas. Each stage should include
    relevant topics, tools, and resources to ensure the learner acquires both the hard and soft skills necessary for job readiness.

    The learning path should be end-to-end, ensuring the learner can move from fundamental skills to specialized expertise,
    with project-based learning included at each stage.
    """
    goal: str = Field(
        description="The name of the career goal or profession. Examples include 'Data Scientist', 'Software Engineer', 'UX Designer', 'Cloud Architect', etc. This is the specific job title or career the learner aims to pursue."
    )
    learning_path: List[LearningPath] = Field(
        description="A detailed list of stages representing the comprehensive learning journey towards the specified career goal. The stages should logically progress from beginner concepts to expert-level mastery, ensuring all required skills, tools, and knowledge areas are covered along the way."
    )
