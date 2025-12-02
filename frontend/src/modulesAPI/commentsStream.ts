// frontend/src/modulesAPI/commentsStream.ts
import { listComments, type CommentItem } from "./comments";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

type CommentStreamHandlers = {
  onComments?: (comments: CommentItem[]) => void;
  onError?: (err: any) => void;
};

export function openCommentsStream(
  fileId: string,
  version: number,
  handlers: CommentStreamHandlers = {}
): () => void {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No JWT token found; not opening comments stream.");
    return () => {};
  }

  // Build base URL similar to axios baseURL
  const base = API_BASE.startsWith("http")
    ? API_BASE
    : `${window.location.origin}${API_BASE}`;

  const url = new URL(
    `${base.replace(/\/$/, "")}/files/${fileId}/versions/${version}/comments/stream`
  );
  url.searchParams.set("token", token);

  const es = new EventSource(url.toString());

  const refresh = async () => {
    try {
      const comments = await listComments(fileId, version);
      handlers.onComments?.(comments || []);
    } catch (err) {
      console.error("Failed to refresh comments after SSE event:", err);
      handlers.onError?.(err);
    }
  };

  es.addEventListener("connected", () => {
    // load comments once when stream connects
    refresh();
  });

  es.addEventListener("comment:created", refresh);
  es.addEventListener("comment:updated", refresh);
  es.addEventListener("comment:deleted", refresh);

  es.onerror = (err) => {
    console.error("Comments SSE error:", err);
    handlers.onError?.(err);
    // you *can* choose to es.close() here, but not required
  };

  // return cleanup function
  return () => {
    es.close();
  };
}
