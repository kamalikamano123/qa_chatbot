import { useState, useRef, useEffect } from "react";
import { BookOpen, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import {
  ChatMessage,
  TypingIndicator,
  type Message,
} from "@/components/chat/ChatMessage";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { ChatInput } from "@/components/chat/ChatInput";
import { AnimatePresence } from "framer-motion";
import { askQuestion } from "../lib/api";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (content: string, markType: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      type: markType,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      if (markType === "MCQ") {
        const botMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "👉 Head over to the Quiz section in the sidebar to generate MCQ questions from your materials!",
          type: markType,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
        return;
      }

      let marks = 5;

      if (markType === "Short Answer") marks = 2;
      else if (markType === "Long Answer") marks = 10;
      else if (markType === "Explain") marks = 10;

      const res = await askQuestion(content, marks);

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.answer || "No response from AI",
        type: markType,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);

      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "⚠️ Error connecting to backend. Make sure FastAPI is running on port 8000.",
      };

      setMessages((prev) => [...prev, errorMsg]);
    }

    setIsTyping(false);
  };

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
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
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
              AI-powered Study Assistant
            </p>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence>
          {sidebarOpen && <ChatSidebar isOpen={sidebarOpen} />}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0">
          {messages.length === 0 ? (
            <ChatEmptyState />
          ) : (
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto scrollbar-thin p-6"
            >
              <div className="max-w-3xl mx-auto space-y-5">
                {messages.map((msg, index) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    index={index}
                  />
                ))}

                {isTyping && <TypingIndicator />}
              </div>
            </div>
          )}

          <ChatInput
            onSend={handleSend}
            disabled={isTyping}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;