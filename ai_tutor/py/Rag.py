import google.generativeai as genai
import ollama
import os
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
from io import BytesIO

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

# Initialize generative model
# model = genai.GenerativeModel("gemini-1.5-flash")
# model = ollama.chat(model="llama3.2:1b", stream=True)

def get_conversational_chain():
    prompt_template = """
    Answer the question as detailed as possible by using chunk data in this book.
    Context:\n{context}\n
    Question:\n{question}\n
    Answer:"""
    model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3)
    # model = ollama.chat(model="llama3.2:1b", stream=True)
    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
    chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)
    return chain


def get_answer_from_pdf(file_id, user_question):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    # embeddings = OllamaEmbeddings(model="llama3.2:1b")

    # Construct the path to the FAISS index correctly
    faiss_index_path = os.path.join("./vector_stores", str(file_id))

    # Check if the FAISS index exists before loading
    if os.path.exists(faiss_index_path):
        new_db = FAISS.load_local(faiss_index_path, embeddings, allow_dangerous_deserialization=True)
        docs = new_db.similarity_search(user_question)
        chain = get_conversational_chain()
        response = chain(
            {"input_documents": docs, "question": user_question},
            return_only_outputs=True
        )
        return response["output_text"]
    else:
        return "FAISS index not found. Please upload and process the PDF first."

# Example usage of the function:
def get_ai_response(file_id, user_question):
    answer = get_answer_from_pdf(file_id, user_question)
    # print(f"Answer: {answer}")
    return answer

# if __name__ == '__main__':
#     print(get_ai_response('1742920351876','Tell about Internship'))