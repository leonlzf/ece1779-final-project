import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { downloadFileApi, shareFileApi } from "../modulesAPI/files";
import api from "../lib/axios";

type ViewState =
  | { kind: "loading" }
  | { kind: "ready"; url: string; mime: string; textContent?: string }
  | { kind: "error"; message: string };

function guessMimeByName(name?: string): string {
  if (!name) return "";
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".txt") || n.endsWith(".log")) return "text/plain; charset=utf-8";
  if (n.endsWith(".md")) return "text/markdown; charset=utf-8";
  return "";
}

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [name, setName] = useState<string>();
  const [state, setState] = useState<ViewState>({ kind: "loading" });

  // Share modal state
  const [showShare, setShowShare] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [role, setRole] = useState<"VIEWER" | "COLLAB">("VIEWER");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const qsName = query.get("name") || undefined;
  const version = query.get("version") ? Number(query.get("version")) : undefined;

  useEffect(() => {
    let urlToRevoke: string | null = null;

    async function load() {
      if (!id) {
        setState({ kind: "error", message: "Missing file id." });
        return;
      }
      try {
        setState({ kind: "loading" });
        const path = typeof version === "number"
          ? `/files/${id}/versions/${version}/download`
          : `/files/${id}/download`;

        const res = await api.get(path, { responseType: "blob" });
        const mime = res.headers?.["content-type"] || guessMimeByName(qsName) || "application/octet-stream";
        const blob: Blob = res.data;
        const url = URL.createObjectURL(blob);
        urlToRevoke = url;

        if (mime.startsWith("text/")) {
          const text = await blob.text();
          setState({ kind: "ready", url, mime, textContent: text });
        } else {
          setState({ kind: "ready", url, mime });
        }
        setName(qsName);
      } catch (e: any) {
        setState({ kind: "error", message: e?.response?.data?.message || "Failed to load file." });
      }
    }

    load();
    return () => { if (urlToRevoke) URL.revokeObjectURL(urlToRevoke); };
  }, [id, qsName, version]);

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
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to share file.";
      setShareMsg({ type: "error", text: msg });
    } finally {
      setShareLoading(false);
    }
  }

  return (
    <div className="viewer">
      <div className="viewer__topbar">
        <div className="viewer__left">
          <button className="btn btn-outline" onClick={() => nav(-1)}>← Back</button>
          <h2 className="viewer__title">Viewer</h2>
        </div>
        <div className="viewer__actions">
          <button className="btn" onClick={() => setShowShare(true)} disabled={!id}>Share</button>
          <button className="btn btn-primary" onClick={() => id && downloadFileApi(id, name, version)}>Download</button>
          <Link className="btn btn-outline" to="/dashboard">Dashboard</Link>
        </div>
      </div>

      {shareMsg && (
        <div className={`alert ${shareMsg.type === "success" ? "alert-success" : "alert-danger"}`}>
          {shareMsg.text}
        </div>
      )}

      {showShare && (
        <div className="modal__overlay" onClick={() => !shareLoading && setShowShare(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Share this file</h3>
              <button className="btn btn-icon" onClick={() => !shareLoading && setShowShare(false)}>✕</button>
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
                onChange={(e) => setRole(e.target.value as "VIEWER" | "COLLAB")}
              >
                <option value="VIEWER">Viewer (read only)</option>
                <option value="COLLAB">Collaborator (read + write)</option>
              </select>

              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowShare(false)} disabled={shareLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={shareLoading || !targetEmail}>
                  {shareLoading ? "Sharing…" : "Share"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {state.kind === "loading" && <p>Loading…</p>}
      {state.kind === "error" && <div className="alert alert-danger">{state.message}</div>}

      {state.kind === "ready" && (
        <>
          <div className="viewer__meta">
            <span className="viewer__name">{name || id}</span>
            <span className="viewer__mime">{state.mime}</span>
          </div>

          {state.mime.startsWith("application/pdf") && (
            <iframe className="viewer__frame" src={state.url} title="pdf" />
          )}

          {state.mime.startsWith("image/") && (
            <img className="viewer__image" src={state.url} alt={name || "image"} />
          )}

          {state.mime.startsWith("text/") && (
            <pre className="viewer__pre">{state.textContent}</pre>
          )}

          {!state.mime.startsWith("application/pdf") &&
            !state.mime.startsWith("image/") &&
            !state.mime.startsWith("text/") && (
              <div className="alert">Preview not supported for this file type. Please use the Download button.</div>
            )}
        </>
      )}
    </div>
  );
}
