import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  getFileTags,
  upsertFileTag,
  renameFileTag,
  removeFileTag,
} from "../modulesAPI/tags";
import {
  getFilesApi,
  uploadFileApi,
  deleteFileApi,
  downloadFileApi,
  type FileItem,
} from "../modulesAPI/files";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

// function toTagArray(v: string[] | string | undefined | null): string[] {
//   return Array.isArray(v) ? v : v ? [String(v)] : [];
// }

/** =====================  Tag chip with color  ===================== */
const CHIP_COLORS = [
  "#5b8cff", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#a78bfa", // violet
  "#14b8a6", // teal
  "#64748b", // slate
];

function getSavedColorIndex(fileId: string) {
  const raw = localStorage.getItem(`tagColor:${fileId}`);
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n < CHIP_COLORS.length ? n : 0;
}

function TagChip({
  fileId,
  label,
  onClick,
}: {
  fileId: string;
  label?: string | null;
  onClick?: () => void; 
}) {
  const [idx, setIdx] = useState<number>(() => getSavedColorIndex(fileId));

  const cycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = (idx + 1) % CHIP_COLORS.length;
    setIdx(next);
    localStorage.setItem(`tagColor:${fileId}`, String(next));
    onClick?.();
  };

  const color = CHIP_COLORS[idx];
  const style: React.CSSProperties = label
    ? {
        background: `${color}26`,
        color,
        border: `1px solid ${color}59`,
      }
    : {
        background: "transparent",
        color: "#9AA4B2",
        border: "1px dashed #3b3f46",
      };

  return (
    <span
      className="tag-chip-inline"
      onClick={cycle}
      title="Click to change color"
      style={style}
    >
      {label || ""}
      {!label && <span style={{ width: 8, display: "inline-block" }} />}
    </span>
  );
}

/** =====================  Tag menu   ===================== */
function TagMenu({
  fileId,
  onChanged,
}: {
  fileId: string;
  onChanged?: (newTag: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tag, setTag] = useState<string | null | undefined>(undefined);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const t = await getFileTags(fileId); // string | null | undefined
      const v = t ?? null;
      setTag(v);
      onChanged?.(v);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: Math.round(r.bottom + 8), left: Math.round(r.left) });
      refresh();
    }
  }, [open]);

  const onAdd = async () => {
    const name = prompt("Add tag");
    if (!name) return;
    await upsertFileTag(fileId, name.trim());
    await refresh();
  };

  const onRename = async () => {
    const newName = prompt("Rename tag to");
    if (!newName) return;
    await renameFileTag(fileId, newName.trim());
    await refresh();
  };

  const onRemove = async () => {
    if (!confirm("Remove tag?")) return;
    await removeFileTag(fileId);
    await refresh();
  };

  return (
    <div className="tag-menu-wrap" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        className="btn btn-outline"
        onClick={() => setOpen((v) => !v)}
      >
        Tags ▾
      </button>

      {open &&
        createPortal(
          <>
            <div className="tag-menu-overlay" onClick={() => setOpen(false)} />
            <div
              className="tag-menu-dropdown"
              style={{
                position: "fixed",
                top: pos?.top ?? 100,
                left: pos?.left ?? 100,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tag-menu-section">
                <div className="tag-menu-title">Tags</div>
                <div className="tag-menu-tags">
                  {loading ? (
                    <span className="tag-chip">Loading…</span>
                  ) : tag ? (
                    <span className="tag-chip">{tag}</span>
                  ) : (
                    <span className="tag-empty">No tags</span>
                  )}
                </div>
              </div>

              <div className="tag-menu-actions">
                <button className="tag-action" onClick={onAdd}>
                  Add
                </button>
                <button className="tag-action" onClick={onRename} disabled={!tag}>
                  Rename
                </button>
                <button
                  className="tag-action danger"
                  onClick={onRemove}
                  disabled={!tag}
                >
                  Remove
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

/** =====================  File list utils  ===================== */
function formatSize(bytes: number | undefined) {
  if (!Number.isFinite(Number(bytes)) || (bytes ?? 0) <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = Number(bytes);
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(2)} ${units[i]}`;
}

/** =====================  Role badge  ===================== */
function RoleBadge({ role }: { role?: "OWNER" | "COLLAB" | "VIEWER" }) {
  if (!role) return null;
  const label =
    role === "OWNER" ? "owner" : role === "COLLAB" ? "collaborator" : "viewer";
  return <span className={`role-badge role-${label}`}>{label}</span>;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [tagsMap, setTagsMap] = useState<Record<string, string | null>>({}); // fileId -> tag
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"name" | "tag">("name");

  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadFiles = async () => {
    try {
      const list = await getFilesApi();
      setAllFiles(list);

      const pairs = await Promise.all(
        list.map(async (f) => {
          try {
            const t = await getFileTags(f.id);
            return [f.id, (t ?? null) as string | null] as const;
          } catch {
            return [f.id, null] as const;
          }
        })
      );
      const map: Record<string, string | null> = {};
      for (const [id, t] of pairs) map[id] = t;
      setTagsMap(map);
    } catch (err) {
      console.error("Failed to load files:", err);
      setAllFiles([]);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const visibleFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allFiles;

    if (mode === "name") {
      return allFiles.filter((f) => (f.name || "").toLowerCase().includes(q));
    }

    return allFiles.filter((f) => {
      const t = tagsMap[f.id];
      return (t || "").toLowerCase().includes(q);
    });
  }, [allFiles, query, mode, tagsMap]);

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
      if (inputEl) inputEl.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      setDeletingId(id);
      await deleteFileApi(id);
      setAllFiles((prev) => prev.filter((f) => f.id !== id));
      setTagsMap((m) => {
        const n = { ...m };
        delete n[id];
        return n;
      });
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  function openViewer(file: { id: string; name: string; latestVersion?: number }) {
    const url = `/files/${file.id}?name=${encodeURIComponent(file.name)}${
      file.latestVersion != null ? `&version=${file.latestVersion}` : ""
    }`;
    navigate(url);
  }

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

      {/* search bar */}
      <div className="search-bar">
        <input
          className="input search-input"
          placeholder={mode === "name" ? "Search by filename..." : "Search by tag..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input search-select"
          value={mode}
          onChange={(e) => setMode(e.target.value as "name" | "tag")}
          title="Search mode"
        >
          <option value="name">Filename</option>
          <option value="tag">Tag</option>
        </select>
        <button className="btn btn-search" onClick={() => setQuery((q) => q.trim())} title="Apply">
          Search
        </button>
        {query && (
          <button className="btn btn-ghost" onClick={() => setQuery("")}>
            Clear
          </button>
        )}
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
        {visibleFiles.length === 0 ? (
          <p className="no-files">No files uploaded yet.</p>
        ) : (
          visibleFiles.map((f) => {
            const tag = tagsMap[f.id] ?? null;

            return (
              <div
                key={f.id}
                className="file-card"
                role="button"
                tabIndex={0}
                onClick={() => openViewer(f)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openViewer(f);
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="file-icon">📄</div>

                <div className="file-info">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <TagChip fileId={f.id} label={tag} />
                    <RoleBadge role={f.role} />
                    <div className="file-name">{f.name}</div>
                  </div>

                  <div className="file-meta">
                    <span>{formatSize(f.size)}</span>
                    <span>•</span>
                    <span>{new Date(f.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="file-actions" style={{ display: "flex", gap: 8 }}>
                  <TagMenu
                    fileId={f.id}
                    onChanged={(newTag) =>
                      setTagsMap((m) => ({
                        ...m,
                        [f.id]: newTag,
                      }))
                    }
                  />

                  <button
                    className="btn btn-outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFileApi(f.id, f.name, f.latestVersion);
                    }}
                  >
                    Download
                  </button>

                  <button
                    className="btn btn-outline btn-danger"
                    disabled={deletingId === f.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(f.id);
                    }}
                  >
                    {deletingId === f.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
