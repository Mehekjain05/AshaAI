from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS

class Rag:
    @staticmethod
    def create_vectordb_retriever():
        embd = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
            #------------------pdf path----------------------
        urls = [
            "https://lilianweng.github.io/posts/2023-06-23-agent/",
            "https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/",
            "https://lilianweng.github.io/posts/2023-10-25-adv-attack-llm/",
        ]

        docs = [WebBaseLoader(url).load() for url in urls]
        # urls = [
        #     "/content/free-legal-information-disclaimer.pdf",
        #     "/content/rfp-2022-006_request_for_proposal_amendment_1.pdf",
        # ]

        # # Load
        # docs = [PyPDFLoader(url).load() for url in urls]
        docs_list = [item for sublist in docs for item in sublist]

        # Split
        text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=500, chunk_overlap=100
        )
        doc_splits = text_splitter.split_documents(docs_list)

        # index = faiss.IndexFlatL2(len(embd.embed_query("hello world")))
        index = faiss.IndexFlatL2(768)

        vector_store = FAISS(
            embedding_function=embd,
            index=index,
            docstore=InMemoryDocstore(),
            index_to_docstore_id={},
        )

        vector_store.add_documents(doc_splits)
        retriever = vector_store.as_retriever()
        
        return retriever