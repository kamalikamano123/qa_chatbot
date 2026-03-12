import { useState } from "react";
import axios from "axios";

function Sidebar() {
  const [files, setFiles] = useState([]);
  const [youtubeUrls, setYoutubeUrls] = useState([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingYt, setLoadingYt] = useState(false);

  // Allow selecting multiple files
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPDFs = async () => {
    if (files.length === 0) return;
    setLoadingPdf(true);

    const formData = new FormData();
    // Connect to FastAPI's "files: List[UploadFile]"
    files.forEach((file) => {
      formData.append("files", file);
    });

    // DEBUG LOGS
    console.log("Files being sent:", files);
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      const resp = await axios.post("http://127.0.0.1:8000/upload-pdf", formData, {
        "Content-Type": "multipart/form-data"
      });
      alert(`PDFs uploaded successfully! ${resp.data.total_chunks_added} chunks added.`);
      setFiles([]); // Clear after success
    } catch (err) {
      alert("Failed to upload PDFs. Is the Python backend running?");
      console.error(err);
    } finally {
      setLoadingPdf(false);
    }
  };

  const addYoutubeUrl = () => {
    if (currentUrl && !youtubeUrls.includes(currentUrl)) {
      setYoutubeUrls((prev) => [...prev, currentUrl]);
      setCurrentUrl("");
    }
  };

  const removeUrl = (index) => {
    setYoutubeUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadYoutube = async () => {
    if (youtubeUrls.length === 0) return;
    setLoadingYt(true);

    try {
      // Backend expects urls: List[str]
      const resp = await axios.post("http://127.0.0.1:8000/upload-youtube", {
        urls: youtubeUrls,
      });
      alert(`YouTube videos loaded successfully! ${resp.data.chunks_added} chunks added.`);
      setYoutubeUrls([]); // clear after success
    } catch (err) {
      alert("Failed to process YouTube videos. Is the Python backend running?");
      console.error(err);
    } finally {
      setLoadingYt(false);
    }
  };

  return (
    <div className="sidebar">

      <h3>Upload Documents</h3>

      <input
        type="file"
        id="pdfUpload"
        accept=".pdf"
        multiple
        onChange={handleFileChange}
        hidden
      />

      <label htmlFor="pdfUpload" className="custom-upload-btn">
        📄 Select PDF files
      </label>

      {/* List of selected PDFs */}
      {files.length > 0 && (
        <div className="selected-items">
          {files.map((f, i) => (
            <div key={i} className="file-name">
              <span>✔ {f.name}</span>
              <button className="remove-btn" title="Remove" onClick={() => removeFile(i)}>✖</button>
            </div>
          ))}
        </div>
      )}

      <button className="primary-btn" onClick={uploadPDFs} disabled={loadingPdf || files.length === 0}>
        {loadingPdf ? "Processing..." : `Process ${files.length} PDF(s)`}
      </button>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(13, 148, 136, 0.1)', margin: '5px 0' }} />

      <h3>YouTube Video URLs</h3>

      <div className="url-input-group">
        <input
          type="text"
          placeholder="https://youtube.com/watch?v=..."
          value={currentUrl}
          onChange={(e) => setCurrentUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addYoutubeUrl()}
        />
        <button className="add-url-btn" onClick={addYoutubeUrl}>Add</button>
      </div>

      {/* List of selected URLs */}
      {youtubeUrls.length > 0 && (
        <div className="selected-items">
          {youtubeUrls.map((url, i) => (
            <div key={i} className="file-name">
              <span className="truncate" title={url}>▶ {url}</span>
              <button className="remove-btn" title="Remove" onClick={() => removeUrl(i)}>✖</button>
            </div>
          ))}
        </div>
      )}

      <button className="primary-btn" onClick={uploadYoutube} disabled={loadingYt || youtubeUrls.length === 0}>
        {loadingYt ? "Processing..." : `Process ${youtubeUrls.length} Video(s)`}
      </button>

    </div>
  );
}

export default Sidebar;
