import Chat from "./components/chat";
import Sidebar from "./components/sidebar";
import "./App.css";

function App() {
  return (
    <div className="app-wrapper">
      <header className="top-bar">
        <div className="title-area">
          <img src="/qa-logo.png" alt="QA Study Buddy Logo" className="logo" />
          <h1>QA Study Buddy</h1>
        </div>
      </header>

      <div className="app-container">
        <Sidebar />
        <Chat />
      </div>
    </div>
  );
}

export default App;
