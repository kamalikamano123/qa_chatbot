import { BookOpen, FileText, Youtube, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export function ChatEmptyState() {
  const suggestions = [
    { icon: FileText, text: "Upload a PDF and ask questions about it" },
    { icon: Youtube, text: "Add a YouTube lecture and get a summary" },
    { icon: MessageCircle, text: "Ask me to explain any concept" },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <BookOpen className="w-10 h-10 text-primary" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xl font-bold text-foreground mb-2"
        >
          Ready to study?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-muted-foreground mb-8"
        >
          Upload your study materials or ask me anything. I'm here to help you learn!
        </motion.p>

        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
              className="flex items-center gap-3 text-left p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{s.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
