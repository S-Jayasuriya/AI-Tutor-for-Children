import google.generativeai as genai
import os
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
from io import BytesIO

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

def get_pdf_texts(pdf_docs):
    text = ""
    if pdf_docs:
        pdf_reader = PdfReader(pdf_docs)
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text


def get_text_chunks(text):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=5000, chunk_overlap=500)
    chunks = text_splitter.split_text(text)
    return chunks


def get_vector_store(text_chunks, file_id):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
    # Create a directory based on the file_id (if it doesn't exist)
    folder_path = f"vector_stores/{file_id}"
    os.makedirs(folder_path, exist_ok=True)
    # Save the vector store to the specified path
    vector_store.save_local(folder_path)
    return f"Vector store saved to: {folder_path}"

def save_vector_from_pdf(file_id):
    get_pdf_path = f'../node/uploads/{file_id}.pdf'
    raw_text = get_pdf_texts(get_pdf_path)
    text_chunks = get_text_chunks(raw_text)
    return get_vector_store(text_chunks, file_id)