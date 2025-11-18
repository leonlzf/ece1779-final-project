import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { downloadFileApi, shareFileApi } from "../modulesAPI/files";
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  packComment,
  type CommentItem,
  type TextAnchor,
} from "../modulesAPI/comments";
import api from "../lib/axios";
import PdfLikeViewer from "../components/PdfLikeViewer";
import { renderAsync } from "docx-preview";

type VersionInfo = {
  versionNo: number;
  name: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
}

type ViewState =
  | { kind: "loading" }
  | { kind: "ready"; url?: string; mime?: string }
  | { kind: "error"; message: string };
  

function extOf(name?: string) {
  if (!name) return "";
  const m = /\.[^.]+$/.exec(name.toLowerCase());
  return m ? m[0] : "";
}

function isTextExt(ext: string) {
  return ext === ".txt" || ext === ".md" || ext === ".json";
}

// escape text → safe HTML
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// build highlighted HTML for text files
function renderHighlightedText(draft: string, comments: CommentItem[]) {
  const anchors: Array<{ start: number; end: number }> = [];

  for (const c of comments) {
    const a = c.anchor;
    if (!a || a.kind !== "text") continue;
    const start = Math.max(0, a.start ?? 0);
    const end = Math.min(draft.length, a.end ?? 0);
    if (end <= start) continue;
    anchors.push({ start, end });
  }

  if (!anchors.length) {
    return escapeHtml(draft).replace(/\n/g, "<br/>");
  }

  anchors.sort((a, b) => a.start - b.start);

  // merge overlaps
  const merged: Array<{ start: number; end: number }> = [];
  for (const a of anchors) {
    const last = merged[merged.length - 1];
    if (last && a.start <= last.end) {
      last.end = Math.max(last.end, a.end);
    } else {
      merged.push({ ...a });
    }
  }

  let html = "";
  let cursor = 0;

  for (const { start, end } of merged) {
    if (start > cursor) {
      html += escapeHtml(draft.slice(cursor, start));
    }
    html += `<mark class="comment-highlight">${escapeHtml(
      draft.slice(start, end)
    )}</mark>`;
    cursor = end;
  }

  if (cursor < draft.length) {
    html += escapeHtml(draft.slice(cursor));
  }

  return html.replace(/\n/g, "<br/>");
}

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const location = useLocation();

  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const name = qs.get("name") || undefined;
  const vRaw = qs.get("version");
  const version = vRaw ? Number(vRaw) || 1 : 1;
  const ext = extOf(name);

  const [state, setState] = useState<ViewState>({ kind: "loading" });

  // text editor
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // docx preview
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docxRef = useRef<HTMLDivElement | null>(null);

  // pdf container (for selection)
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  // share modal
  const [showShare, setShowShare] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [role, setRole] = useState<"VIEWER" | "COLLAB">("VIEWER");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // comments
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [selectedAnchor, setSelectedAnchor] = useState<TextAnchor | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // hooks for versioning
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [versionsLoad, setVersionsLoad] = useState(false);
  const [versionsErr, setVersionsErr] = useState<string | null>(null);

  // ---------- load file ----------
  useEffect(() => {
    let revoke: string | null = null;

    const run = async () => {
      if (!id) {
        setState({ kind: "error", message: "Missing file id." });
        return;
      }
      setState({ kind: "loading" });

      try {
        if (isTextExt(ext)) {
          const { data } = await api.get(`/files/${id}/versions/${version}/edit`);
          setDraft(String(data?.content ?? ""));
          setDirty(false);
          setIsEditing(false); // 默认先显示只读高亮模式
          setState({ kind: "ready" });
          return;
        }

        if (ext === ".docx") {
          const path =
            typeof version === "number"
              ? `/files/${id}/versions/${version}/download`
              : `/files/${id}/download`;
          const res = await api.get(path, { responseType: "blob" });
          const ab = await res.data.arrayBuffer();
          if (docxRef.current) {
            docxRef.current.innerHTML = "";
            await renderAsync(ab, docxRef.current, undefined, {
              className: "docx-view",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
            });
          }
          setState({ kind: "ready" });
          return;
        }

        const path =
          typeof version === "number"
            ? `/files/${id}/versions/${version}/download`
            : `/files/${id}/download`;
        const res = await api.get(path, { responseType: "blob" });
        const mime = res.headers?.["content-type"] || "application/octet-stream";
        const url = URL.createObjectURL(res.data);
        revoke = url;
        setState({ kind: "ready", url, mime });
      } catch (e: any) {
        setState({
          kind: "error",
          message: e?.response?.data?.message || "Failed to load file.",
        });
      }
    };

    run();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [id, version, ext]);

  // ---------- load comments ----------
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const list = await listComments(id, version);
        setComments(list || []);
      } catch (err) {
        console.error("Failed to load comments:", err);
      }
    };
    load();
  }, [id, version]);

  // load versions
  useEffect(() => {
    if (!id){
      return;
    } 

    const run = async () => {
      setVersionsLoad(true);
      setVersionsErr(null);
      try {
        const response = await api.get("/files/"+id+"/versions");

        let list: VersionInfo[] = [];

        if (response && response.data && response.data.versions) {
          list = response.data.versions;
        }

        setVersions(list);
      } catch (e: any) {
        console.error("Failed to load versions:", e);
        let msg = "Failed to load versions";

        if (
          e &&
          e.response &&
          e.response.data &&
          e.response.data.message
        ) {
          msg = e.response.data.message;
        }

        setVersionsErr(msg);
      } finally {


        setVersionsLoad(false);
      }
    };

    run();
  }, [id]);

  // ---------- share ----------
  async function handleShareSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setShareLoading(true);
    setShareMsg(null);
    try {
      await shareFileApi({ fileId: id, targetEmail, role });
      setShowShare(false);
      setTargetEmail("");
      setRole("VIEWER");
      setShareMsg({ type: "success", text: "Shared successfully." });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to share file.";
      setShareMsg({ type: "error", text: msg });
    } finally {
      setShareLoading(false);
    }
  }

  // ---------- save / replace ----------
  async function saveText() {
    // if (!id) return;
    // await api.put(`/files/${id}/versions/${version}/save`, { content: draft });
    // setDirty(false);
    if (!id) {
      return;
    }

    try {
      const response = await api.post("/files/" + id + "/versions/auto", {
        content: draft,
      });

      let newVer = version;
      if (
        response &&
        response.data &&
        typeof response.data.versionNo === "number"
      ) {
        newVer = response.data.versionNo;
      }
      await reloadVersions();

      const params = new URLSearchParams(location.search);
      if (name) {
        params.set("name", name);
      }
      params.set("version", String(newVer));

      nav("/files/" + id + "?"+ params.toString());

      setDirty(false);
    } catch (e: any) {
      let msg ="Failed to save new version";

      if (
        e &&
        e.response &&
        e.response.data &&
        e.response.data.message
      ) {
        msg = e.response.data.message;
      }
      console.error("saveText error:", e);
      alert(msg);
    }
  }

  async function replaceDocx(file: File) {
    if (!id) return;
    const buf = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    await api.post(`/files/${id}/versions/${version}/save`, { content: base64 });
    alert("Replaced and saved.");
  }

  // ---------- selection -> TextAnchor (for textarea) ----------
  const handleTextSelection = () => {
    if (!isTextExt(ext)) return;
    const el = textAreaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (end <= start) {
      setSelectedAnchor(null);
      return;
    }

    const exact = draft.slice(start, end);
    const prefix = draft.slice(Math.max(0, start - 40), start);
    const suffix = draft.slice(end, end + 40);

    const anchor: TextAnchor = {
      kind: "text",
      start,
      end,
      exact,
      prefix,
      suffix,
    };
    setSelectedAnchor(anchor);
  };

  // basic PDF selection: use window.getSelection() and store text only
  const handlePdfSelection = () => {
    if (state.kind !== "ready" || !state.mime?.startsWith("application/pdf")) {
      return;
    }
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) {
      setSelectedAnchor(null);
      return;
    }
    const anchor: TextAnchor = {
      kind: "text",
      start: 0,
      end: 0,
      exact: text,
      prefix: "",
      suffix: "",
    };
    setSelectedAnchor(anchor);
  };

  // ---------- comment and versioning helpers ----------
  async function reloadComments() {
    if (!id) return;
    const list = await listComments(id, version);
    setComments(list || []);
  }

  async function reloadVersions() {

    if (!id){
      return;
    }

    try{
      const response = await api.get("/files" + id + "/versions");

      let list: VersionInfo[]=[];

      if (response && response.data && response.data.versions) {
        list = response.data.versions;
      }
      setVersions(list);
    
    } catch (e){
      console.error("FAILED TO RELOAD VERSIONS: ", e);
    }

  }

  async function handleAddComment() {
    if (!id || !selectedAnchor) return;
    const msg = newCommentText.trim();
    if (!msg) return;

    const content = packComment(msg, selectedAnchor);
    // await createComment(id, version, content);
    await createComment(id, version, content, null, selectedAnchor);

    setNewCommentText("");
    setSelectedAnchor(null);
    await reloadComments();
  }

  async function handleUpdateComment(comment: CommentItem) {
    const msg = editingText.trim();
    if (!msg) return;
    const content = packComment(msg, comment.anchor);
    await updateComment(comment.id, content);
    setEditingId(null);
    setEditingText("");
    await reloadComments();
  }

  async function handleDeleteComment(comment: CommentItem) {
    if (!id) return;
    if (!confirm("Delete this comment?")) return;
    await deleteComment(comment.id);
    await reloadComments();
  }
  
 // rollback version function
async function handleRollbackVersion(ver: number) {
  if (!id) {
    return;
  }

  try {
    const response = await api.post("/files/" + id + "/rollback/" + ver);

    let newVer = ver;

    if (
      response &&
      response.data &&
      typeof response.data.newVersion === "number"
    ) {
      newVer = response.data.newVersion;
    }



    const params = new URLSearchParams(location.search);
    if (name) {
      params.set("name", name);
    }
    params.set("version", String(newVer));
    nav(`/files/${id}?${params.toString()}`);
  } catch (err: any) {
    
    
    let message = "FAILED TO ROLL BACK VERSION";

    if (
      err &&
      err.response &&
      err.response.data &&
      err.response.data.message
    ) {
      message = err.response.data.message;
    }

    console.error("FAILED TO ROLLBACK VERSION ERROR:", err);



    alert(message);
  }
}



  // ---------- toolbar ----------
  const Tools = (
    <div className="viewer__actions">
      {isTextExt(ext) && (
        <>
          {!isEditing && (
            <button className="btn" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}
          {isEditing && (
            <>
              <button
                className="btn btn-primary"
                disabled={!dirty}
                onClick={saveText}
              >
                {dirty ? "Save" : "Saved"}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setIsEditing(false);
                  setDirty(false);
                }}
              >
                Cancel
              </button>
            </>
          )}
        </>
      )}

      {ext === ".docx" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            style={{ display: "none" }}
            onChange={async (e) => {
              const f = e.currentTarget.files?.[0];
              if (f) {
                await replaceDocx(f);
                e.currentTarget.value = "";
              }
            }}
          />
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            Replace .docx
          </button>
        </>
      )}

      {id && (
        <button
          className="btn"
          onClick={() => downloadFileApi(id, name || "file", version)}
        >
          Download
        </button>
      )}
      <button
        className="btn"
        onClick={() => setShowShare(true)}
        disabled={!id}
      >
        Share
      </button>
      <Link className="btn btn-outline" to="/dashboard">
        Dashboard
      </Link>
    </div>
  );

  const renderSnippet = (c: CommentItem) => {
    const a = c.anchor;
    if (!a) return null;
    if (a.kind === "text") return a.exact;
    if (a.kind === "docx") return a.quote?.exact;
    if (a.kind === "pdf") return a.page != null ? `Page ${a.page}` : null;
    return null;
  };

  return (
    <div className="viewer">
      <div className="viewer__topbar">
        <div className="viewer__left">
          <button className="btn btn-outline" onClick={() => nav(-1)}>
            ← Back
          </button>
          <h2 className="viewer__title">Viewer</h2>
        </div>
        {Tools}
      </div>

      {shareMsg && (
        <div
          className={`alert ${
            shareMsg.type === "success" ? "alert-success" : "alert-danger"
          }`}
        >
          {shareMsg.text}
        </div>
      )}

      {showShare && (
        <div
          className="modal__overlay"
          onClick={() => !shareLoading && setShowShare(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Share this file</h3>
              <button
                className="btn btn-icon"
                onClick={() => !shareLoading && setShowShare(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleShareSubmit} className="modal__body">
              <label className="form__label">Invitee Email</label>
              <input
                className="form__input"
                type="email"
                required
                placeholder="name@example.com"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
              />
              <label className="form__label">Role</label>
              <select
                className="form__select"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "VIEWER" | "COLLAB")
                }
              >
                <option value="VIEWER">Viewer (read only)</option>
                <option value="COLLAB">Collaborator (read + write)</option>
              </select>
              <div className="modal__footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowShare(false)}
                  disabled={shareLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={shareLoading || !targetEmail}
                >
                  {shareLoading ? "Sharing…" : "Share"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {state.kind === "loading" && <p>Loading…</p>}
      {state.kind === "error" && (
        <div className="alert alert-danger">{state.message}</div>
      )}

      {state.kind === "ready" && (
        <div className="viewer__body">
          {/* main content */}
          <div className="viewer__content">
            <div className="viewer__meta">
              <span className="viewer__name">{name || id}</span>

              {state.mime && <span className="viewer__mime">{state.mime}</span>}

              <span>Version: {version}</span>

              {versionsLoad && <span>Loading file versions…</span>}

              {versionsErr && (
                <span>{versionsErr}</span>
              )}

              {versions.length > 0 && (
                <>
                  <select
                    value={version}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 1;
                      const params = new URLSearchParams();

                      if (name) {
                        params.set("name", name);
                      }

                      params.set("version", String(v));
                      nav(`/files/${id}?${params.toString()}`);
                    }}
                  >
                    {versions.map((v) => (
                      <option key={v.versionNo} value={v.versionNo}>
                        v{v.versionNo} – {v.uploadedBy}
                      </option>
                    ))}
                  </select>

                  <button
                    className="btn btn-outline"
                    onClick={() => handleRollbackVersion(version)}
                  >
                    Rollback to this version
                  </button>
                </>
              )}
            </div>

            {/* text editor / read-only with highlights */}
            {isTextExt(ext) && isEditing && (
              <div className="editor">
                <textarea
                  ref={textAreaRef}
                  className="editor__textarea"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setDirty(true);
                  }}
                  onMouseUp={handleTextSelection}
                  onKeyUp={handleTextSelection}
                  placeholder="Edit content here…"
                />
                <div className="editor__footer">
                  <span className="editor__hint">
                    {dirty ? "Unsaved changes" : "All changes saved"}
                  </span>
                  <div className="editor__buttons">
                    <button
                      className="btn btn-primary"
                      disabled={!dirty}
                      onClick={saveText}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Close editor
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isTextExt(ext) && !isEditing && (
              <div className="editor editor--readonly">
                <div
                  className="editor__display"
                  // highlight existing comment ranges
                  dangerouslySetInnerHTML={{
                    __html: renderHighlightedText(draft, comments),
                  }}
                />
                <div className="editor__footer">
                  <span className="editor__hint">
                    Read-only with highlighted comments
                  </span>
                </div>
              </div>
            )}

            {/* docx view-only */}
            {ext === ".docx" && (
              <>
                <div ref={docxRef} className="docx-container" />
                <div className="hint">
                  View-only preview. To modify, edit locally and use{" "}
                  <strong>Replace .docx</strong>.
                </div>
              </>
            )}

            {/* pdf view (with selection) */}
            {state.url && state.mime?.startsWith("application/pdf") && (
              <div
                ref={pdfContainerRef}
                className="viewer__pdfWrap"
                onMouseUp={handlePdfSelection}
              >
                <PdfLikeViewer
                  fileUrl={state.url}
                  filename={name || "document.pdf"}
                  theme="dark"
                />
              </div>
            )}

            {/* image view */}
            {state.url && state.mime?.startsWith("image/") && (
              <img
                className="viewer__image"
                src={state.url}
                alt={name || "image"}
              />
            )}

            {/* unsupported */}
            {!isTextExt(ext) &&
              ext !== ".docx" &&
              !state.mime?.startsWith("application/pdf") &&
              !state.mime?.startsWith("image/") && (
                <div className="alert">
                  Preview not supported for this file type. Please use the
                  Download button.
                </div>
              )}
          </div>

          {/* comments panel */}
          <aside className="viewer__comments">
            <div className="comments__header">
              <h3>Comments</h3>
            </div>

            {/* new comment for current selection */}
            {selectedAnchor && (
              <div className="comments__new">
                <div className="comments__selection">
                  <div className="comments__label">Selected text</div>
                  <div className="comments__snippet">
                    {selectedAnchor.exact}
                  </div>
                </div>
                <textarea
                  className="comments__input"
                  rows={3}
                  placeholder="Add a comment…"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                />
                <div className="comments__actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleAddComment}
                    disabled={!newCommentText.trim()}
                  >
                    Add comment
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setSelectedAnchor(null);
                      setNewCommentText("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* existing comments */}
            <div className="comments__list">
              {comments.length === 0 && (
                <div className="comments__empty">No comments yet.</div>
              )}

              {comments.map((c) => (
                <div key={c.id} className="comment-card">
                  <div className="comment-card__meta">
                    <span className="comment-card__author">
                      {c.userEmail || "Unknown"}
                    </span>
                    {c.createdAt && (
                      <span className="comment-card__time">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {renderSnippet(c) && (
                    <div className="comment-card__snippet">
                      {renderSnippet(c)}
                    </div>
                  )}

                  {editingId === c.id ? (
                    <>
                      <textarea
                        className="comment-card__edit"
                        rows={3}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                      />
                      <div className="comment-card__actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdateComment(c)}
                          disabled={!editingText.trim()}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditingText("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="comment-card__text">{c.message}</div>
                      <div className="comment-card__actions">
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditingText(c.message || "");
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost danger"
                          onClick={() => handleDeleteComment(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
