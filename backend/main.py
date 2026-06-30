import os
import json
from fastapi import FastAPI, UploadFile, File
from dotenv import load_dotenv
from pypdf import PdfReader
from groq import Groq
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

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins="https://qa-chatbot-seven.vercel.app/",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Groq setup
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# ✅ Helper function
def ask_groq(prompt: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=4096,
    )
    return response.choices[0].message.content

# Global DB
vector_store = None
retriever = None

# ✅ Embeddings — always BAAI/bge-small-en
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

# Splitter
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)

# -------- Models -------- #

class YouTubeRequest(BaseModel):
    urls: List[str]

class ChatRequest(BaseModel):
    question: str
    marks: int

class QuizRequest(BaseModel):
    topic: str = "general"
    num_questions: int = 5

class FlashcardRequest(BaseModel):
    topic: str = "general"
    num_cards: int = 5


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

            temp_path = f"temp_{file.filename}"
            with open(temp_path, "wb") as buffer:
                buffer.write(await file.read())

            extracted_text = ""
            with open(temp_path, "rb") as pdf_file:
                pdf_reader = PdfReader(pdf_file)
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text += text + "\n"

            if os.path.exists(temp_path):
                os.remove(temp_path)

            docs = splitter.create_documents([extracted_text])
            documents.extend(docs)

        if vector_store is not None:
            vector_store.add_documents(documents)
        else:
            vector_store = FAISS.from_documents(documents, embeddings)
            vector_store.save_local("faiss_index")

        retriever = vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 15, "fetch_k": 30}
        )

        return {
            "message": "PDF processed",
            "chunks_added": len(documents)
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

        try:
            transcript = YouTubeTranscriptApi().fetch(video_id)
        except Exception as e:
            return {"error": f"Transcript failed: {str(e)}"}

        text = " ".join([entry.text for entry in transcript])
        docs = splitter.create_documents([text])
        all_documents.extend(docs)

    if vector_store is not None:
        vector_store.add_documents(all_documents)
    else:
        vector_store = FAISS.from_documents(all_documents, embeddings)
        vector_store.save_local("faiss_index")

    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 15, "fetch_k": 30}
    )

    return {
        "message": "YouTube processed",
        "chunks_added": len(all_documents)
    }


# -------- Quiz -------- #

@app.post("/quiz")
def generate_quiz(request: QuizRequest):
    global retriever

    if retriever is None:
        return {"error": "Upload PDF or YouTube first"}

    docs = retriever.invoke(request.topic)
    if not docs:
        return {"error": "No relevant content found"}

    context = "\n\n".join([d.page_content for d in docs])

    prompt = f"""You are an expert quiz generator for students.

Generate exactly {request.num_questions} high quality MCQ questions based on the CONCEPTS and KNOWLEDGE in the context below.

STRICT RULES:
- Questions must test understanding of concepts, definitions, and ideas
- NEVER mention page numbers, chapters, or "according to the text"
- NEVER reference the document itself
- Questions should work even without the source material
- Each question must have exactly 4 options
- Only one option is correct
- Each time generate new questions, never repeat

Return ONLY a valid JSON array. No markdown. No explanation. Start with [ end with ]

Each object must follow this exact format:
{{
  "question": "concept based question here",
  "options": ["First option", "Second option", "Third option", "Fourth option"],
  "answer": 0
}}

"answer" is the INDEX (0, 1, 2, or 3) of the correct option.

Context:
{context}

JSON array:"""

    try:
        text = ask_groq(prompt)
        text = text.replace("```json", "").replace("```", "").strip()
        start = text.find("[")
        end = text.rfind("]") + 1
        quiz_data = json.loads(text[start:end])
        return {"quiz": quiz_data}
    except Exception as e:
        print("PARSE ERROR:", e)
        return {"error": "Failed to parse quiz"}


# -------- Flashcards -------- #

@app.post("/flashcards")
def generate_flashcards(request: FlashcardRequest):
    global retriever

    if retriever is None:
        return {"error": "Upload PDF or YouTube first"}

    docs = retriever.invoke(request.topic)
    if not docs:
        return {"error": "No relevant content found"}

    context = "\n\n".join([d.page_content for d in docs])

    prompt = f"""Generate exactly {request.num_cards} flashcards from the context below.

Return ONLY a valid JSON array. No markdown. No explanation.
Start with [ and end with ]

Each object must follow this exact format:
{{
  "front": "question or concept here",
  "back": "clear and concise answer here"
}}

Rules:
- Front should be a question or concept
- Back should be a clear concise answer
- Never reference the document or page numbers
- Based on concepts and knowledge only

Context:
{context}

JSON array:"""

    # try:
    #     text = ask_groq(prompt)
    #     text = text.replace("```json", "").replace("```", "").strip()
    #     start = text.find("[")
    #     end = text.rfind("]") + 1
    #     flashcard_data = json.loads(text[start:end])
    #     return {"flashcards": flashcard_data}
    # except Exception as e:
    #     print("PARSE ERROR:", e)
    #     return {"error": "Failed to parse flashcards"}
    try:
        text = ask_groq(prompt)
        text = text.replace("```json", "").replace("```", "").strip()
    # ← Fix: use single braces
        start = text.find("{")
        end = text.rfind("}") + 1
        mindmap_data = json.loads(text[start:end])
        return {"mindmap": mindmap_data}
    except Exception as e:
        print("PARSE ERROR:", e)
        print("RAW:", text)  # ← add this to see what Groq returns
        return {"error": "Failed to parse mindmap"}

class MindMapRequest(BaseModel):
    topic: str = "general"

@app.post("/mindmap")
def generate_mindmap(request: MindMapRequest):
    global retriever

    if retriever is None:
        return {"error": "Upload PDF or YouTube first"}

    docs = retriever.invoke(request.topic)
    if not docs:
        return {"error": "No relevant content found"}

    context = "\n\n".join([d.page_content for d in docs])

    prompt = f"""Create a mind map about "{request.topic}" using the context below.

Return ONLY valid JSON. No markdown, no explanation, no extra text.

Example format:
{{"center": "{request.topic}", "branches": [{{"title": "Branch 1", "children": ["subtopic 1", "subtopic 2", "subtopic 3"]}}, {{"title": "Branch 2", "children": ["subtopic 1", "subtopic 2"]}}]}}

Rules:
- center must be "{request.topic}"
- 4 to 6 branches about "{request.topic}" only
- 2 to 4 children per branch
- Keep all titles short and clear
- Focus ONLY on "{request.topic}" from the context

Context:
{context}

JSON only:"""

    try:
        text = ask_groq(prompt)
        print("RAW RESPONSE:", text)
        text = text.replace("```json", "").replace("```", "").strip()
        start = text.find("{")
        end = text.rfind("}") + 1
        if start == -1 or end == 0:
            return {"error": "Failed to parse mindmap"}
        mindmap_data = json.loads(text[start:end])
        return {"mindmap": mindmap_data}
    except Exception as e:
        print("PARSE ERROR:", e)
        print("RAW:", text)
        return {"error": "Failed to parse mindmap"}
# -------- Chat -------- #

@app.post("/chat")
def chat(request: ChatRequest):
    global retriever

    try:
        question = request.question
        marks = request.marks

        if retriever is None:
            return {"error": "Upload PDF or YouTube first"}

        docs = retriever.invoke(question)

        if not docs:
            return {"answer": "No relevant information found in uploaded materials."}

        context = "\n\n".join([d.page_content for d in docs])

        if marks == 2:
            instruction = "Answer in 4-5 concise lines only. Be direct and to the point."
        elif marks == 5:
            instruction = "Answer with key points in a well structured paragraph."
        elif marks == 10:
            instruction = "Give a detailed explanation with multiple paragraphs, examples and depth."
        else:
            instruction = "Give a clear and helpful answer."

        prompt = f"""You are an academic study assistant.

Use ONLY the provided context to answer the question.
If the answer is not in the context, say "This topic is not covered in your uploaded materials."

{instruction}

Context:
{context}

Question:
{question}"""

        answer = ask_groq(prompt)
        return {"answer": answer}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Server error: {str(e)}"}