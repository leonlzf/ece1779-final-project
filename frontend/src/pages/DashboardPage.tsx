import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  getFilesApi,
  uploadFileApi,
  deleteFileApi,
  downloadFileApi,
  type FileItem,
} from "../modulesAPI/files";

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(2)} ${units[i]}`;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFiles = async () => {
    try {
      const list = await getFilesApi();
      setFiles(list);
    } catch (err) {
      console.error("Failed to load files:", err);
      setFiles([]);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget; 
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      await uploadFileApi(file);
      await loadFiles();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("File upload failed.");
    } finally {
      setUploading(false);
      // e.currentTarget.value = "";
      if (inputEl) inputEl.value = ""; 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      setDeletingId(id);
      await deleteFileApi(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <div>
          <span className="user-email">{user?.email}</span>
          <button className="btn btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-card">
        <h3>Upload File</h3>
        <p>Choose a file from your computer to upload.</p>
        <label htmlFor="file-upload" className="btn btn-primary">
          {uploading ? "Uploading..." : "Select File"}
        </label>
        <input id="file-upload" type="file" style={{ display: "none" }} onChange={handleUpload} />
      </div>

      {/* File List */}
      <div className="file-list">
        {files.length === 0 ? (
          <p className="no-files">No files uploaded yet.</p>
        ) : (
          files.map((f) => (
            <div className="file-card" key={f.id}>
              <div className="file-icon">📄</div>
              <div className="file-info">
                <div className="file-name">{f.name}</div>
                <div className="file-meta">
                  <span>{formatSize(f.size)}</span>
                  <span>•</span>
                  <span>{new Date(f.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="file-actions">
                <a className="btn btn-outline" onClick={() => downloadFileApi(f.id, f.name, f.latestVersion)}>
                  Download
                </a>
                <button
                  className="btn btn-outline btn-danger"
                  onClick={() => handleDelete(f.id)}
                  disabled={deletingId === f.id}
                >
                  {deletingId === f.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
