import { useState, useEffect } from "react"
import { BookOpen, ArrowRight, RotateCcw, Trophy, PanelLeftClose, PanelLeft } from "lucide-react"
import { generateQuiz } from "../lib/api"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/context/AppContext"
// import { useAuth } from "@/context/AuthContext"

interface Question {
  question: string
  options: string[]
  answer: number
}

export default function Quiz() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState<number>(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState<number>(0)
  const [showScore, setShowScore] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [moreCount, setMoreCount] = useState<number>(5)
  const [topic, setTopic] = useState<string>("general")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const { materialsReady } = useAppContext()
  // const { user, signOut } = useAuth()

  useEffect(() => {
    if (materialsReady) {
      loadQuiz("general", 5)
    } else {
      setLoading(false)
    }
  }, [])

  const loadQuiz = async (t: string, n: number) => {
    setLoading(true)
    setError("")
    setQuestions([])
    setCurrent(0)
    setSelected(null)
    setScore(0)
    setShowScore(false)

    const data = await generateQuiz(t, n)

    if (data.error) {
      setError(data.error)
    } else {
      setQuestions(data.quiz)
    }
    setLoading(false)
  }

  const handleOptionClick = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    if (idx === questions[current].answer) {
      setScore((s) => s + 1)
    }
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setShowScore(true)
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
    }
  }

  const getOptionStyle = (idx: number): string => {
    if (selected === null) {
      return "bg-white border-gray-200 hover:border-teal-400 hover:bg-teal-50 cursor-pointer"
    }
    if (idx === questions[current].answer) {
      return "bg-green-50 border-green-400 text-green-800"
    }
    if (idx === selected && idx !== questions[current].answer) {
      return "bg-red-50 border-red-400 text-red-800"
    }
    return "bg-white border-gray-200 opacity-50 cursor-not-allowed"
  }

  const renderContent = () => {

    // ---- LOADING ----
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm">
              Generating quiz from your materials...
            </p>
          </div>
        </div>
      )
    }

    // ---- ERROR ----
    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-500 font-medium">{error}</p>
            <p className="text-muted-foreground text-sm">
              Upload a PDF or YouTube video using the sidebar first, then generate your quiz.
            </p>
            <button
              onClick={() => loadQuiz("general", 5)}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    // ---- SCORE SCREEN ----
    if (showScore) {
      const percentage = Math.round((score / questions.length) * 100)
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
              <Trophy className="w-12 h-12 text-primary" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {score}/{questions.length}
              </h2>
              <p className="text-muted-foreground mt-1">
                {percentage >= 80
                  ? "Excellent work! 🎉"
                  : percentage >= 60
                  ? "Good job! Keep it up 👍"
                  : "Keep studying, you got this! 💪"}
              </p>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-primary transition-all duration-700"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="bg-card border rounded-2xl p-5 space-y-4 text-left">
              <p className="font-medium text-sm text-foreground">
                Want more questions?
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Topic (or leave as "general")
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. neural networks, backpropagation..."
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Number of questions
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={moreCount}
                    onChange={(e) => setMoreCount(Number(e.target.value))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button
                  onClick={() => loadQuiz(topic, moreCount)}
                  className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Generate New Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

   // ---- QUIZ ----
if (!questions || questions.length === 0) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-muted-foreground text-sm">No questions loaded yet.</p>
    </div>
  )
}
const q = questions[current]
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Question {current + 1} of {questions.length}
            </span>
            <div className="flex gap-3">
              <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full">
                ✓ {score} correct
              </span>
              <span className="text-xs bg-gray-50 border text-muted-foreground px-3 py-1 rounded-full">
                {current - score} incorrect
              </span>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="bg-card border rounded-2xl p-6 space-y-5">
            <p className="text-base font-medium text-foreground leading-relaxed">
              {q.question}
            </p>

            <div className="space-y-3">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  disabled={selected !== null}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${getOptionStyle(idx)}`}
                >
                  <span className="font-medium mr-2 text-muted-foreground">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {opt}
                </button>
              ))}
            </div>

            {selected !== null && (
              <div className="space-y-3 pt-2 border-t">
                {selected === q.answer ? (
                  <p className="text-green-600 text-sm font-medium">✓ Correct!</p>
                ) : (
                  <p className="text-red-500 text-sm font-medium">
                    ✗ Incorrect — correct answer is{" "}
                    <span className="font-semibold">
                      {String.fromCharCode(65 + q.answer)}. {q.options[q.answer]}
                    </span>
                  </p>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {current + 1 >= questions.length ? "See Results" : "Next Question"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">

      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-xl h-9 w-9"
        >
          {sidebarOpen
            ? <PanelLeftClose className="w-4 h-4" />
            : <PanelLeft className="w-4 h-4" />
          }
        </Button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">
              QA Study Buddy
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Quiz Mode
            </p>
          </div>
        </div>

        {/* User email + logout */}
        {/* <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {user?.email}
          </span>
          <button
            onClick={signOut}
            className="text-xs px-3 py-1.5 rounded-xl border hover:bg-muted transition-colors text-muted-foreground"
          >
            Logout
          </button>
        </div> */}
      </header>

      {/* Body with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence>
          {sidebarOpen && <ChatSidebar isOpen={sidebarOpen} />}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0">
          {renderContent()}
        </div>
      </div>

    </div>
  )
}