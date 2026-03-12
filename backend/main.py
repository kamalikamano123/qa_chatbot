

import os
import io
from fastapi import FastAPI, UploadFile, File
from dotenv import load_dotenv
from pypdf import PdfReader
from google import genai
from youtube_transcript_api import YouTubeTranscriptApi
from pydantic import BaseModel
from typing import List

# LangChain
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

# Global vector database + retriever
vector_store = None
retriever = None

# Shared embedding model
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

# Text splitter
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=250
)

# -------- Request Models -------- #

class YouTubeRequest(BaseModel):
    urls: List[str]

class ChatRequest(BaseModel):
    question: str
    marks: int


# -------- Home -------- #

@app.get("/")
def home():
    return {"message": "RAG Server is running"}


# -------- Upload PDF -------- #

@app.post("/upload-pdf")
async def upload_pdf(files: List[UploadFile] = File(...)):
    global vector_store, retriever

    try:
        documents = []

        print(f"DEBUG: Received {len(files)} files")

        for file in files:
            print(f"DEBUG: Processing {file.filename}")
            
            # Save file temporarily to disk 
            temp_path = f"temp_{file.filename}"
            with open(temp_path, "wb") as buffer:
                buffer.write(await file.read())

            # Read from the saved temp file
            extracted_text = ""
            with open(temp_path, "rb") as pdf_file:
                pdf_reader = PdfReader(pdf_file)
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text += text + "\n"

            # Clean up the temp file
            import os
            if os.path.exists(temp_path):
                os.remove(temp_path)

            docs = splitter.create_documents([extracted_text])
            documents.extend(docs)

        # Add to vector store
        if vector_store is not None:
            vector_store.add_documents(documents)
        else:
            vector_store = FAISS.from_documents(documents, embeddings)

        # Create retriever
        retriever = vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 15, "fetch_k": 30}
        )

        return {
            "message": "PDF processed and stored in vector DB",
            "total_chunks_added": len(documents)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


# -------- Upload YouTube -------- #

@app.post("/upload-youtube")
def upload_youtube(request: YouTubeRequest):
    global vector_store, retriever

    all_documents = []

    for url in request.urls:

        if "v=" in url:
            video_id = url.split("v=")[-1].split("&")[0]
        else:
            video_id = url.split("/")[-1].split("?")[0]

        transcript = YouTubeTranscriptApi().fetch(video_id)

        text = " ".join([entry.text for entry in transcript])

        docs = splitter.create_documents([text])
        all_documents.extend(docs)

    # Add to vector store
    if vector_store is not None:
        vector_store.add_documents(all_documents)
    else:
        vector_store = FAISS.from_documents(all_documents, embeddings)

    # Create retriever
    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 15, "fetch_k": 30}
    )

    return {
        "message": "YouTube videos processed",
        "chunks_added": len(all_documents)
    }


# -------- Chat -------- #

@app.post("/chat")
def chat(request: ChatRequest):
    global retriever

    try:
        question = request.question
        marks = request.marks

        if retriever is None:
            return {"error": "Upload PDF or YouTube first."}

        # Retrieve relevant documents
        docs = retriever.invoke(question)

        if not docs:
            return {"answer": "No relevant information found in uploaded sources."}

        context = "\n\n".join([doc.page_content for doc in docs])

        # Marks based instruction
        if marks == 2:
            instruction = "Answer in 4-5 concise lines. Use short paragraphs and highlight key points."
        elif marks == 5:
            instruction = "Answer in a well explained paragraph with important key points."
        elif marks == 10:
            instruction = "Give a detailed explanation with multiple paragraphs, examples, and depth."
        else:
            instruction = "Give a clear detailed answer."

        print(f"DEBUG: Generating content for question: {question}")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""
You are an academic assistant.

Use ONLY the provided context to answer.
If the answer is not in the context, say it is not available.

{instruction}

Context:
{context}

Question:
{question}
"""
        )

        return {"answer": response.text}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Server error: {str(e)}"}
