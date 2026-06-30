import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string, markType: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [markType, setMarkType] = useState("short");

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim(), markType);
    setInput("");
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        <Select value={markType} onValueChange={setMarkType}>
          <SelectTrigger className="w-[120px] rounded-xl h-11 text-xs bg-muted/30 border-border shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short">Short Answer</SelectItem>
            <SelectItem value="long">Long Answer</SelectItem>
            <SelectItem value="mcq">MCQ</SelectItem>
            <SelectItem value="explain">Explain</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about your study material..."
            rows={1}
            disabled={disabled}
            className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            style={{ minHeight: 44, maxHeight: 120 }}
          />
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            size="icon"
            className="h-11 w-11 rounded-xl shadow-md"
          >
            <Send className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
