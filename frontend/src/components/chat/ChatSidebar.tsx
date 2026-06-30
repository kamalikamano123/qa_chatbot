import { useState, useRef } from "react";
import { FileUp, Youtube, X, Loader2, FileText, Plus, FlaskConical, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { uploadPDFs, uploadYouTube } from "../../lib/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import {  GitBranch } from "lucide-react"

interface ChatSidebarProps {
  isOpen: boolean;
}

export function ChatSidebar({ isOpen }: ChatSidebarProps) {
  const { uploadedFiles: files, setUploadedFiles: setFiles,
          youtubeUrls, setYoutubeUrls, setMaterialsReady } = useAppContext();

  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingPdfs, setIsProcessingPdfs] = useState(false);
  const [isProcessingVideos, setIsProcessingVideos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf"
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addUrl = () => {
    if (urlInput.trim() && (urlInput.includes("youtube") || urlInput.includes("youtu.be"))) {
      setYoutubeUrls((prev) => [...prev, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const removeUrl = (index: number) => {
    setYoutubeUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessPdfs = async () => {
    if (!files || files.length === 0) { alert("Please upload a PDF first"); return; }
    setIsProcessingPdfs(true);
    try {
      const res = await uploadPDFs(files);
      console.log("✅ Upload response:", res);
      setMaterialsReady(true);
      alert("PDF processed successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Upload failed");
    }
    setIsProcessingPdfs(false);
  };

  const handleProcessVideos = async () => {
    if (!youtubeUrls.length) { alert("Add YouTube URL first"); return; }
    setIsProcessingVideos(true);
    try {
      const res = await uploadYouTube(youtubeUrls);
      if (res.error) { alert(res.error); }
      else {
        setMaterialsReady(true);
        alert("Videos processed successfully!");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      alert("Backend connection failed");
    }
    setIsProcessingVideos(false);
  };

  if (!isOpen) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 300, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="h-full border-r border-border bg-card overflow-hidden flex flex-col"
    >
      <div className="p-4 flex-1 overflow-y-auto scrollbar-thin space-y-6">

        {/* PDF Upload */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileUp className="w-4 h-4 text-primary" />
            Upload Documents
          </h3>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
              isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">Drag & drop PDFs here</p>
            <p className="text-xs text-muted-foreground/60 mt-1">or click to browse</p>
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2">
                {files.map((file, i) => (
                  <motion.div key={`${file.name}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-xs group">
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate flex-1 text-foreground">{file.name}</span>
                    <button onClick={() => removeFile(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </motion.div>
                ))}
                <Button onClick={handleProcessPdfs} disabled={isProcessingPdfs} className="w-full rounded-xl text-xs h-9" size="sm">
                  {isProcessingPdfs && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  Process PDFs
                  <Badge variant="secondary" className="ml-2 bg-primary-foreground/20 text-primary-foreground text-[10px] px-1.5">{files.length}</Badge>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* YouTube */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Youtube className="w-4 h-4 text-destructive" />
            YouTube Videos
          </h3>
          <div className="flex gap-2">
            <Input placeholder="Paste YouTube URL..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUrl()} className="text-xs rounded-xl h-9 bg-muted/30" />
            <Button onClick={addUrl} size="icon" variant="outline" className="h-9 w-9 shrink-0 rounded-xl">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <AnimatePresence>
            {youtubeUrls.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2">
                {youtubeUrls.map((url, i) => (
                  <motion.div key={`${url}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-xs group">
                    <Youtube className="w-3.5 h-3.5 text-destructive shrink-0" />
                    <span className="truncate flex-1 text-foreground">{url}</span>
                    <button onClick={() => removeUrl(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </motion.div>
                ))}
                <Button onClick={handleProcessVideos} disabled={isProcessingVideos} variant="outline" className="w-full rounded-xl text-xs h-9" size="sm">
                  {isProcessingVideos && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  Process Videos
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">{youtubeUrls.length}</Badge>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ✅ Study Tools — both buttons here */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Study Tools
          </h3>

          {/* Quiz */}
          <button
            onClick={() => navigate(location.pathname === "/quiz" ? "/" : "/quiz")}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors ${
              location.pathname === "/quiz" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            {location.pathname === "/quiz" ? "← Back to Chat" : "Quiz"}
          </button>

          {/* Flashcards ← added here inside the div */}
          <button
            onClick={() => navigate(location.pathname === "/flashcards" ? "/" : "/flashcards")}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors ${
              location.pathname === "/flashcards" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Layers className="w-4 h-4" />
            {location.pathname === "/flashcards" ? "← Back to Chat" : "Flashcards"}
          </button>
             <button
  onClick={() => navigate(location.pathname === "/mindmap" ? "/" : "/mindmap")}
  className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors ${
    location.pathname === "/mindmap"
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:bg-muted"
  }`}
>
  <GitBranch className="w-4 h-4" />
  {location.pathname === "/mindmap" ? "← Back to Chat" : "Mind Map"}
</button>
        </div>

        {/* <button
  onClick={() => navigate(location.pathname === "/mindmap" ? "/" : "/mindmap")}
  className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors ${
    location.pathname === "/mindmap"
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:bg-muted"
  }`}
>
  <GitBranch className="w-4 h-4" />
  {location.pathname === "/mindmap" ? "← Back to Chat" : "Mind Map"}
</button> */}

      </div>

      <div className="p-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">Upload study materials to get started</p>
      </div>
    </motion.aside>
  );
}