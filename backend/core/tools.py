from langchain_core.tools import tool
from typing import Optional
from core.rag import Rag
from api.scraper import Scraper

retriever = Rag.create_vectordb_retriever()

@tool
def vectorstore_retriever_tool(query : str) -> str:
  """Search and return information about Lilian Weng blog posts on LLM agents, prompt engineering, and adversarial attacks on LLMs.

  Args:
      query: The query to use to search the vector database

  Returns:
      Relevant information from the vector database"""
  docs = retriever.invoke(query)
  def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)
  relevant_info = format_docs(docs)
  return relevant_info

@tool
def publicapi_retriever_tool(work_mode: Optional[str] = None, job_type: Optional[str] = None) -> str:
  """Fetches relevant jobs from HerKey with optional parameters like work mode and job type. Works without any parameters as well.

    Args:
        work_mode : Optional string representing the work mode of the job. Should be one of work-from-home, work-from-office, or hybrid.
        job_type : Optional string representing the type of the job. Should be one of full-time, part-time, returnee-program, freelance/projects or volunteer.

    Returns:
        String containing all the relevant informations from public api"""

  herkey_jobs_url = "https://www.herkey.com/jobs"

  if work_mode and job_type:
    herkey_jobs_url += f"/search?work_mode={work_mode}&job_type={job_type}"
  elif work_mode:
    herkey_jobs_url += f"/search?work_mode={work_mode}"
  elif job_type:
    herkey_jobs_url += f"/search?job_type={job_type}"

  extracted_jobs = Scraper.scrape_herkey_jobs(herkey_jobs_url, wait_time=30)
  relevant_jobs = ""
  for i, job in enumerate(extracted_jobs):
    relevant_jobs += f"Job {i+1}:\n"
    relevant_jobs += f"Title: {job['title']}\n"
    relevant_jobs += f"Company: {job['company']}\n"
    relevant_jobs += f"Location: {job['location']}\n"
    relevant_jobs += f"Work Mode: {job['work_mode']}\n"
    relevant_jobs += f"Experience: {job['experience']}\n"
    relevant_jobs += f"Skills: {job['skills']}\n\n"
  return relevant_jobs

# tools = [vectorstore_retriever_tool, publicapi_retriever_tool]