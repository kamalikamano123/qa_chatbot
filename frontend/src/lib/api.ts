const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export async function uploadPDFs(files: File[]): Promise<any> {
  const formData = new FormData()
  files.forEach(file => formData.append("files", file))
  const res = await fetch(`${API_URL}/upload-pdf`, {
    method: "POST",
    body: formData
  })
  return res.json()
}

export async function uploadYouTube(urls: string[]): Promise<any> {
  const res = await fetch(`${API_URL}/upload-youtube`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls })
  })
  return res.json()
}

export async function askQuestion(question: string, marks: number): Promise<any> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, marks })
  })
  return res.json()
}

export async function generateQuiz(topic: string = "general", numQuestions: number = 5): Promise<any> {
  const res = await fetch(`${API_URL}/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, num_questions: numQuestions })
  })
  return res.json()
}