import { useState } from "react";
import { Bot, User, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: string;
}

interface ChatMessageProps {
  message: Message;
  index: number;
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
        <Bot size={16} className="text-muted-foreground" />
      </div>
      <div className="bg-card border rounded-xl px-4 py-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  // Format **bold** text
  const formatText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      const parts = line.split("**");
      const formatted = parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      );
      return (
        <span key={lineIdx}>
          {formatted}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Answer type badge color
  const getBadgeStyle = (type?: string) => {
    switch (type) {
      case "Short Answer": return "bg-blue-50 text-blue-600 border-blue-200"
      case "Long Answer":  return "bg-purple-50 text-purple-600 border-purple-200"
      case "Explain":      return "bg-amber-50 text-amber-600 border-amber-200"
      default:             return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm border relative group ${
          isUser
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-foreground border-border"
        }`}
      >
        {/* Answer type badge — only on assistant messages */}
        {!isUser && message.type && message.type !== "user" && (
          <span
            className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border mb-2 ${getBadgeStyle(message.type)}`}
          >
            {message.type}
          </span>
        )}

        {/* Message content */}
        <div className="leading-relaxed">
          {formatText(message.content)}
        </div>

        {/* Copy button — only on assistant messages */}
        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-muted"
          >
            {copied
              ? <Check size={12} className="text-green-500" />
              : <Copy size={12} className="text-muted-foreground" />
            }
          </button>
        )}
      </div>
    </motion.div>
  );
}