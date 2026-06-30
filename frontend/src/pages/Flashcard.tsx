import { useState } from "react"
import { BookOpen, PanelLeftClose, PanelLeft, RotateCcw, Layers, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { AnimatePresence, motion } from "framer-motion"
// import { useAuth } from "@/context/AuthContext"

interface Flashcard {
  front: string
  back: string
}

export default function Flashcard() {
  const [topic, setTopic] = useState("")
  const [count, setCount] = useState(5)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [started, setStarted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // const { user, signOut } = useAuth()

  const generateFlashcards = async () => {
    setLoading(true)
    setError("")
    setCards([])
    setFlipped(false)
    setCurrent(0)

    try {
      const res = await fetch("https://qa-chatbot-1-tcvg.onrender.com/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim() || "general",
          num_cards: count
        })
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setCards(data.flashcards)
        setStarted(true)
      }
    } catch (err) {
      setError("Failed to connect to backend.")
    }

    setLoading(false)
  }

  const handleNext = () => {
    setFlipped(false)
    setTimeout(() => setCurrent((c) => Math.min(c + 1, cards.length - 1)), 150)
  }

  const handlePrev = () => {
    setFlipped(false)
    setTimeout(() => setCurrent((c) => Math.max(c - 1, 0)), 150)
  }

  const handleRestart = () => {
    setStarted(false)
    setCards([])
    setCurrent(0)
    setFlipped(false)
    setError("")
  }

  const renderContent = () => {

    // ---- SETUP SCREEN ----
    if (!started) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6 text-center">

            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
              <Layers className="w-10 h-10 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground">Flashcards</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Generate flashcards from your study materials
              </p>
            </div>

            <div className="bg-card border rounded-2xl p-5 space-y-4 text-left">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Topic (or leave blank for general)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. neural networks, loss functions..."
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Number of flashcards (1–20, default 5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <button
                onClick={generateFlashcards}
                disabled={loading}
                className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    Generate Flashcards
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )
    }

    // ---- FLASHCARD SCREEN ----
    const card = cards[current]

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">

        {/* Progress */}
        <div className="flex items-center justify-between w-full max-w-lg">
          <span className="text-sm font-medium text-foreground">
            Card {current + 1} of {cards.length}
          </span>
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Cards
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-lg bg-gray-100 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${((current + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Flashcard */}
        <div
          className="w-full max-w-lg cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={() => setFlipped((f) => !f)}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d", position: "relative" }}
            className="w-full"
          >
            {/* Front */}
            <div
              className="w-full min-h-[280px] bg-card border-2 border-border rounded-3xl p-8 flex flex-col items-center justify-center space-y-4"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
                Question
              </span>
              <p className="text-lg font-medium text-foreground text-center leading-relaxed">
                {card.front}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Click to reveal answer
              </p>
            </div>

            {/* Back */}
            <div
              className="w-full min-h-[280px] bg-primary rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 absolute top-0 left-0"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              <span className="text-xs font-semibold text-primary-foreground/70 uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                Answer
              </span>
              <p className="text-lg font-medium text-primary-foreground text-center leading-relaxed">
                {card.back}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            disabled={current === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-xs text-muted-foreground">
            {flipped ? "✓ Revealed" : "Tap card to flip"}
          </span>

          <button
            onClick={handleNext}
            disabled={current === cards.length - 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Done message */}
        {current === cards.length - 1 && flipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 text-center"
          >
            <p className="text-green-700 font-medium text-sm">
              🎉 You've completed all flashcards!
            </p>
            <button
              onClick={handleRestart}
              className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
            >
              Generate new cards
            </button>
          </motion.div>
        )}
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
            <Layers className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">
              QA Study Buddy
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Flashcard Mode
            </p>
          </div>
        </div>

        {/* User + logout */}
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

      {/* Body */}
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