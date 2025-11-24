import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [currentVideo, setCurrentVideo] = useState(null);

  // State for Menus
  const [activeMenuFile, setActiveMenuFile] = useState(null);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  // State for View Mode
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("viewMode") || "grid"
  );

  const fetchFiles = (path) => {
    fetch(`/api/files?path=${encodeURIComponent(path)}`)
      .then((res) => res.json())
      .then((data) => setFiles(data))
      .catch((err) => console.error("Error:", err));
  };

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  // Save view mode preference
  const handleViewChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("viewMode", mode);
    setShowLayoutMenu(false);
  };

  const handleNavigate = (folderName) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    setActiveMenuFile(null);
  };

  const handleBack = () => {
    if (!currentPath) return;
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
    setActiveMenuFile(null);
  };

  const handleDownload = (filePath) => {
    window.location.href = `/api/download?path=${encodeURIComponent(filePath)}`;
    setActiveMenuFile(null);
  };

  return (
    <div className="app-container">
      <div
        className={`backdrop ${activeMenuFile ? "active" : ""}`}
        onClick={() => setActiveMenuFile(null)}
      ></div>

      <div className={`bottom-sheet ${activeMenuFile ? "active" : ""}`}>
        {activeMenuFile && (
          <div className="sheet-content">
            <div className="sheet-header">
              <span className="sheet-title">{activeMenuFile.name}</span>
            </div>
            <div
              className="sheet-option"
              onClick={() => handleDownload(activeMenuFile.path)}
            >
              <span className="sheet-icon">⬇</span>
              <span>Download File</span>
            </div>
            <div
              className="sheet-option cancel"
              onClick={() => setActiveMenuFile(null)}
            >
              <span className="sheet-icon">✕</span>
              <span>Cancel</span>
            </div>
          </div>
        )}
      </div>

      {/* --- LAYOUT MENU POPUP --- */}
      {showLayoutMenu && (
        <>
          <div
            className="menu-backdrop-transparent"
            onClick={() => setShowLayoutMenu(false)}
          ></div>
          <div className="layout-popup">
            <div className="popup-header">Layout</div>

            <div
              className={`popup-option ${
                viewMode === "list" ? "selected" : ""
              }`}
              onClick={() => handleViewChange("list")}
            >
              <span className="popup-icon">☰</span>
              <span className="popup-text">List view</span>
              {viewMode === "list" && <span className="checkmark">✓</span>}
            </div>

            <div
              className={`popup-option ${
                viewMode === "grid" ? "selected" : ""
              }`}
              onClick={() => handleViewChange("grid")}
            >
              <span className="popup-icon">⊞</span>
              <span className="popup-text">Grid view</span>
              {viewMode === "grid" && <span className="checkmark">✓</span>}
            </div>
          </div>
        </>
      )}

      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <img
          src="/logo.jpg"
          alt="MY FLIX"
          className="netflix-logo"
          onClick={() => setCurrentPath("")}
        />
        <div className="path-display">
          {currentPath ? `/${currentPath}` : "/Home"}
        </div>
      </nav>

      {currentVideo && (
        <div className="player-overlay">
          <button
            className="player-close-btn"
            onClick={() => setCurrentVideo(null)}
          >
            ✕
          </button>
          <video
            className="video-player"
            controls
            autoPlay
            src={currentVideo}
          />
        </div>
      )}

      <div className="content-area">
        <div className="toolbar">
          <div className="left-tools">
            {currentPath && (
              <button className="btn-secondary" onClick={handleBack}>
                ⬅ Back
              </button>
            )}
          </div>

          {/* Layout Button */}
          <button
            className="btn-icon"
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            title="Change Layout"
          >
            {viewMode === "grid" ? "⊞" : "☰"}
          </button>
        </div>

        {/* --- DYNAMIC GRID/LIST --- */}
        <div
          className={`media-grid ${
            viewMode === "list" ? "list-view" : "grid-view"
          }`}
        >
          {files.map((file, index) => (
            <div
              key={index}
              className="media-item-wrapper"
              onClick={() => {
                if (file.isDirectory) handleNavigate(file.name);
                else if (file.isVideo) setCurrentVideo(`/stream/${file.path}`);
              }}
            >
              <div className="thumbnail-card">
                <div className="card-icon">
                  {file.isDirectory ? "📁" : file.isVideo ? "▶️" : "📄"}
                </div>
              </div>

              <div className="item-details">
                <div className="item-text">
                  <span className="filename">{file.name}</span>
                  <span className="file-meta">
                    {file.isDirectory ? "Folder" : "File"}
                  </span>
                </div>

                {!file.isDirectory && (
                  <button
                    className="mobile-dots-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuFile(file);
                    }}
                  >
                    ⋮
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
