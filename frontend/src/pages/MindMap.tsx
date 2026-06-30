import { useState, useCallback } from "react"
import { BookOpen, PanelLeftClose, PanelLeft, GitBranch, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { AnimatePresence } from "framer-motion"
// import { useAuth } from "@/context/AuthContext"
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

interface Branch {
  title: string
  children: string[]
}

interface MindMapData {
  center: string
  branches: Branch[]
}

const BRANCH_COLORS = [
  { bg: "#dcfce7", border: "#16a34a", text: "#15803d" },
  { bg: "#dbeafe", border: "#2563eb", text: "#1d4ed8" },
  { bg: "#fef9c3", border: "#ca8a04", text: "#a16207" },
  { bg: "#fce7f3", border: "#db2777", text: "#be185d" },
  { bg: "#ede9fe", border: "#7c3aed", text: "#6d28d9" },
  { bg: "#ffedd5", border: "#ea580c", text: "#c2410c" },
]

function buildGraph(data: MindMapData): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Center node
  nodes.push({
    id: "center",
    position: { x: 0, y: 0 },
    data: { label: data.center },
    style: {
      background: "#14532d",
      color: "white",
      border: "2px solid #14532d",
      borderRadius: "50%",
      width: 140,
      height: 140,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "13px",
      fontWeight: "700",
      textAlign: "center",
      padding: "10px",
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  })

  const branchCount = data.branches.length
  const angleStep = (2 * Math.PI) / branchCount
  const branchRadius = 320

  data.branches.forEach((branch, bIdx) => {
    const angle = angleStep * bIdx - Math.PI / 2
    const bx = Math.cos(angle) * branchRadius
    const by = Math.sin(angle) * branchRadius
    const color = BRANCH_COLORS[bIdx % BRANCH_COLORS.length]
    const branchId = `branch-${bIdx}`

    // Branch node
    nodes.push({
      id: branchId,
      position: { x: bx, y: by },
      data: { label: branch.title },
      style: {
        background: color.bg,
        color: color.text,
        border: `2px solid ${color.border}`,
        borderRadius: "12px",
        width: 140,
        height: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "600",
        textAlign: "center",
        padding: "8px",
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    })

    // Edge from center to branch
    edges.push({
      id: `e-center-${branchId}`,
      source: "center",
      target: branchId,
      style: { stroke: color.border, strokeWidth: 2 },
      animated: false,
    })

    // Children nodes
    const childCount = branch.children.length
    const childSpacing = 70
    const childStartY = by - ((childCount - 1) * childSpacing) / 2
    const childRadius = 220
    const childX = bx + (bx >= 0 ? childRadius : -childRadius)

    branch.children.forEach((child, cIdx) => {
      const childId = `child-${bIdx}-${cIdx}`
      const cy = childStartY + cIdx * childSpacing

      nodes.push({
        id: childId,
        position: { x: childX, y: cy },
        data: { label: child },
        style: {
          background: "white",
          color: color.text,
          border: `1.5px solid ${color.border}`,
          borderRadius: "8px",
          width: 160,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          textAlign: "center",
          padding: "6px",
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      })

      edges.push({
        id: `e-${branchId}-${childId}`,
        source: branchId,
        target: childId,
        style: { stroke: color.border, strokeWidth: 1.5 },
      })
    })
  })

  return { nodes, edges }
}

export default function MindMap() {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [started, setStarted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  // const { user, signOut } = useAuth()

  const generateMindMap = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("https://qa-chatbot-1-tcvg.onrender.com/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() || "general" })
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        const { nodes: n, edges: e } = buildGraph(data.mindmap)
        setNodes(n)
        setEdges(e)
        setStarted(true)
      }
    } catch (err) {
      setError("Failed to connect to backend.")
    }

    setLoading(false)
  }

  const handleRestart = () => {
    setStarted(false)
    setNodes([])
    setEdges([])
    setError("")
    setTopic("")
  }

  const renderContent = () => {

    // ---- SETUP ----
    if (!started) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6 text-center">

            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
              <GitBranch className="w-10 h-10 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground">Mind Map</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Visualize concepts from your study materials
              </p>
            </div>

            <div className="bg-card border rounded-2xl p-5 space-y-4 text-left">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Topic (or leave blank for full document)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateMindMap()}
                  placeholder="e.g. neural networks, deep learning..."
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <button
                onClick={generateMindMap}
                disabled={loading}
                className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Mind Map...
                  </>
                ) : (
                  <>
                    <GitBranch className="w-4 h-4" />
                    Generate Mind Map
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )
    }

    // ---- MIND MAP ----
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <p className="text-sm text-muted-foreground">
            🗺️ Drag to pan • Scroll to zoom • Pinch to resize
          </p>
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border rounded-xl px-3 py-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Mind Map
          </button>
        </div>

        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background color="#e5e7eb" gap={20} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const bg = (node.style?.background as string) || "#fff"
                return bg
              }}
              maskColor="rgba(0,0,0,0.05)"
            />
          </ReactFlow>
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
            <GitBranch className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">
              QA Study Buddy
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Mind Map Mode
            </p>
          </div>
        </div>

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