from langchain_core.tools import tool
from typing import Optional
from core.rag import Rag
from api.scraper import Scraper
from langchain_community.tools.tavily_search import TavilySearchResults
from models.data_model import MongoDB

db = MongoDB()

retriever = Rag.create_vectordb_retriever()
tavily = TavilySearchResults(max_results=5)

@tool
def vectorstore_retriever_tool(query : str) -> str:
  """Search and return jobs according to the given user query.

  Args:
      query: The query to use to search the vector database
      
  Returns:
      Relevant information from the vector database"""
  docs = retriever.get_relevant_documents(query)
  if not docs:
    return "No relevant jobs found."
  def format_docs(docs):
    relevant_jobs = ""
    for i, doc in enumerate(docs):
        metadata = doc.metadata
        relevant_jobs += f"Job {i+1}:\n"
        relevant_jobs += f"Title: {metadata.get('title', 'N/A')}\n"
        relevant_jobs += f"Company: {metadata.get('company', 'N/A')}\n"
        relevant_jobs += f"Location: {metadata.get('location', 'N/A')}\n"
        relevant_jobs += f"Work Mode: {metadata.get('work_mode', 'N/A')}\n"
        relevant_jobs += f"Experience: {metadata.get('experience', 'N/A')}\n"
        relevant_jobs += f"Skills: {metadata.get('skills', 'N/A')}\n\n"
    return relevant_jobs
  relevant_info = format_docs(docs)
  return relevant_info

@tool
def publicapi_retriever_tool(work_mode: Optional[str] = None, job_type: Optional[str] = None, keyword: Optional[str]= None) -> str:
  """Fetches relevant jobs from HerKey with optional parameters like work mode and job type. Works without any parameters as well.

    Args:
        work_mode : Optional string representing the work mode of the job. Should be one of work-from-home, work-from-office, or hybrid.
        job_type : Optional string representing the type of the job. Should be one of full-time, part-time, returnee-program, freelance/projects or volunteer.
        keyword : Optional string (kebab case) representing the job title or keywords to search for. For example, "data-scientist", "ai-engineer". Can be multiple keywords separated by commas like "ai-engineer,data-analyst". 
    Returns:
        String containing all the relevant informations from public api"""
  
  base_url = "https://www.herkey.com/jobs"
  search_url = base_url + "/search"

    # Build query string manually
  params = []
  if work_mode:
      params.append(f"work_mode={work_mode}")
  if job_type:
      params.append(f"job_type={job_type}")
  if keyword:
      params.append(f"keyword={keyword}")

  if params:
      herkey_jobs_url = search_url + "?" + "&".join(params)
  else:
      herkey_jobs_url = base_url


  # added code to check if jobs in cache
  cached_jobs = db.get_cached_jobs(herkey_jobs_url)
  
  if cached_jobs:
    print(f"Using cached results for URL: {herkey_jobs_url}")
    extracted_jobs = cached_jobs
  else:
    print(f"Fetching new results for URL: {herkey_jobs_url}")
    # Make the API call
    extracted_jobs = Scraper.scrape_herkey_jobs(herkey_jobs_url, wait_time=30)
    
    # Store the results in MongoDB
    db.cache_job_url(herkey_jobs_url, extracted_jobs)

#  extracted_jobs = Scraper.scrape_herkey_jobs(herkey_jobs_url, wait_time=30)

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

@tool
def career_guidance_tool(query : str) -> str:
  """Explores online resources for providing personalized guidance to help users navigate and advance their careers.

  Args:
      query: The query to use to search from online resources.

  Returns:
      Relevant information from the internet for Personalised Career Guidance"""
  results = tavily.invoke(input=query)
  return results

@tool
def current_events_tool():
  """Fetching the current live events /sessions from the HerKeys

    Args: None
    Returns:
        String containing all the relevant events / sessions from api"""

  herkey_events_url = "https://events.herkey.com/events"
  
  extracted_events = Scraper.scrape_herkey_events(herkey_events_url, wait_time=30)
  print(extracted_events)
  relevant_events = ""
  for i, event in enumerate(extracted_events):
      relevant_events += f"Event {i+1}:\n"
      relevant_events += f"Title: {event['title']}\n"
      relevant_events += f"Image: {event['image_url']}\n"
      relevant_events += f"Categories: {', '.join(event['categories'])}\n"   
      relevant_events += f"Mode: {event['mode']}\n"
      relevant_events += f"Date: {event['date']}\n"
      relevant_events += f"Time: {event['time']}\n"
      relevant_events += f"Venue: {event['venue']}\n"
      relevant_events += f"Price: {event['price']}\n"
      relevant_events += f"Event URL: {event['event_url']}\n"
      relevant_events += f"Register URL: {event['register_url']}\n\n"
      
  return relevant_events