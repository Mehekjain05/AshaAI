from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
import os
from pinecone import Pinecone
from dotenv import load_dotenv
from langchain_community.vectorstores import Pinecone as LangchainPinecone
from langchain_pinecone import PineconeVectorStore

load_dotenv()

class Rag:
    @staticmethod
    def create_vectordb_retriever():
        # Load environment variables
        # Load credentials
        pinecone_api_key = os.environ.get('PINECONE_API_KEY')
        index_name = "jobs-index"
        pinecone_env = os.environ.get("PINECONE_ENV")

        
        # Create Pinecone client 
        pc = Pinecone(api_key=pinecone_api_key)
        
        index = pc.Index(index_name)

        # Check if index exists (optional safety)
        if index_name not in pc.list_indexes().names():
            raise ValueError(f"Pinecone index '{index_name}' does not exist")
        
        # Setup embedding model (same as used while populating Pinecone)
        embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

        docsearch = PineconeVectorStore(
            index=index,
            pinecone_api_key=os.environ.get('PINECONE_API_KEY'),
            # index_name=index_name,
            embedding=embedding
        )

        return docsearch.as_retriever()