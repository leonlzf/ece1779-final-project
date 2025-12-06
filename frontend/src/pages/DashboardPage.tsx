import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

import { useAuth } from "../auth/AuthContext";

import {
  getFilesApi,
  uploadFileApi,
  deleteFileApi,
  downloadFileApi,
  type FileItem,
} from "../modulesAPI/files";

import {
  getFileTags,
  upsertFileTag,
  renameFileTag,
  removeFileTag,
} from "../modulesAPI/tags";

import { AppShell } from "../components/layout/AppShell";
import { UploadDropzone } from "../components/dashboard/UploadDropzone";
import {
  DashboardToolbar,
  type SearchMode,
  type SortMode,
} from "../components/dashboard/DashboardToolbar";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useToast } from "../components/ui/ToastProvider";
import { useDebounce } from "../hooks/useDebounce";

/* ===================== Tag chip with color ===================== */

const CHIP_COLORS = [
  "#5b8cff",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a78bfa",
  "#14b8a6",
  "#64748b",
];

function getSavedColorIndex(fileId: string) {
  const raw = localStorage.getItem(`tagColor:${fileId}`);
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n < CHIP_COLORS.length ? n : 0;
}

function TagChip({
  fileId,
  label,
}: {
  fileId: string;
  label?: string | null;
}) {
  const [idx, setIdx] = useState<number>(() => getSavedColorIndex(fileId));

  const cycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = (idx + 1) % CHIP_COLORS.length;
    setIdx(next);
    localStorage.setItem(`tagColor:${fileId}`, String(next));
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
        color: "var(--muted)",
        border: "1px dashed var(--border)",
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

/* ===================== Tag menu ===================== */

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
      const t = await getFileTags(fileId);
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
      <Button
        ref={btnRef}
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
      >
        Tags ▾
      </Button>

      {open &&
        createPortal(
          <>
            <div
              className="tag-menu-overlay"
              onClick={() => setOpen(false)}
            />
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
                <button
                  className="tag-action"
                  onClick={onRename}
                  disabled={!tag}
                >
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

/* ===================== Helpers ===================== */

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

function RoleBadge({ role }: { role?: "OWNER" | "COLLAB" | "VIEWER" }) {
  if (!role) return null;

  const label =
    role === "OWNER" ? "owner" : role === "COLLAB" ? "collaborator" : "viewer";

  return <span className={`role-badge role-${label}`}>{label}</span>;
}

/* ===================== Page ===================== */

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [tagsMap, setTagsMap] = useState<Record<string, string | null>>({});

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("name");
  const [sort, setSort] = useState<SortMode>("created_desc");
  const [view, setView] = useState<"list" | "grid">("list");

  const debouncedQuery = useDebounce(query, 180);

  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    const q = debouncedQuery.trim().toLowerCase();

    let base = !q
      ? allFiles
      : mode === "name"
      ? allFiles.filter((f) => (f.name || "").toLowerCase().includes(q))
      : allFiles.filter((f) => (tagsMap[f.id] || "").toLowerCase().includes(q));

    base = [...base];

    base.sort((a, b) => {
      if (sort === "created_desc") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (sort === "created_asc") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      if (sort === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sort === "name_desc") return (b.name || "").localeCompare(a.name || "");
      if (sort === "size_desc") return (b.size || 0) - (a.size || 0);
      return 0;
    });

    return base;
  }, [allFiles, debouncedQuery, mode, tagsMap, sort]);

  const handleUploadFile = async (file: File) => {
    try {
      setUploading(true);
      await uploadFileApi(file);
      await loadFiles();
      toast.push({
        type: "success",
        title: "Upload complete",
        message: "Your file is now in the workspace.",
      });
    } catch (err) {
      console.error("Upload failed:", err);
      toast.push({
        type: "error",
        title: "Upload failed",
        message: "Please try again.",
      });
    } finally {
      setUploading(false);
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

      toast.push({
        type: "success",
        title: "File deleted",
        message: "The file was removed successfully.",
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast.push({
        type: "error",
        title: "Delete failed",
        message: "Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openViewer = (file: {
    id: string;
    name: string;
    latestVersion?: number;
  }) => {
    const url = `/files/${file.id}?name=${encodeURIComponent(file.name)}${
      file.latestVersion != null ? `&version=${file.latestVersion}` : ""
    }`;
    navigate(url);
  };

  return (
    <AppShell>
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="dashboard-header__left">
            <h2 className="dashboard-title">Dashboard</h2>
            <span className="dashboard-sub">
              Upload, tag, and manage file versions.
            </span>
          </div>

          <div className="dashboard-header__right">
            {user?.email && <span className="user-email-pill">{user.email}</span>}
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        <DashboardToolbar
          query={query}
          setQuery={setQuery}
          mode={mode}
          setMode={setMode}
          sort={sort}
          setSort={setSort}
          view={view}
          setView={setView}
        />

        <UploadDropzone onUpload={handleUploadFile} uploading={uploading} />

        <div className={view === "grid" ? "file-grid" : "file-list"}>
          {visibleFiles.length === 0 ? (
            <Card className="no-files-card">
              <div className="no-files">
                No files yet. Upload your first file to get started.
              </div>
            </Card>
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
                >
                  <div className="file-icon">📄</div>

                  <div className="file-info">
                    <div className="file-row">
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

                  <div className="file-actions">
                    <TagMenu
                      fileId={f.id}
                      onChanged={(newTag) =>
                        setTagsMap((m) => ({ ...m, [f.id]: newTag }))
                      }
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFileApi(f.id, f.name, f.latestVersion);
                      }}
                    >
                      Download
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      loading={deletingId === f.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(f.id);
                      }}
                    >
                      {deletingId === f.id ? "Deleting" : "Delete"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
