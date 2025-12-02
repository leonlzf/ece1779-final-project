// frontend/src/modulesAPI/commentsStream.ts
import { listComments, type CommentItem } from "./comments";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

type CommentStreamHandlers = {
  onComments?: (comments: CommentItem[]) => void;
  onError?: (err: any) => void;
};

/**
 * Open an SSE stream for a given file + version.
 * Returns a cleanup function that closes the stream.
 */
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

  // Build base URL (same logic as axios baseURL)
  const base =
    API_BASE.startsWith("http")
      ? API_BASE
      : `${window.location.origin}${API_BASE}`;

  const url = new URL(
    `${base.replace(/\/$/, "")}/files/${fileId}/versions/${version}/comments/stream`
  );
  url.searchParams.set("token", token);

  const es = new EventSource(url.toString());

  // When a comment is created/updated/deleted, just re-fetch the list
  const refresh = async () => {
    try {
      const comments = await listComments(fileId, version);
      handlers.onComments?.(comments);
    } catch (err) {
      console.error("Failed to refresh comments after SSE event:", err);
      handlers.onError?.(err);
    }
  };

  es.addEventListener("connected", () => {
    // Optionally load comments immediately on connect
    refresh();
  });

  es.addEventListener("comment:created", refresh);
  es.addEventListener("comment:updated", refresh);
  es.addEventListener("comment:deleted", refresh);

  es.onerror = (err) => {
    console.error("Comments SSE error:", err);
    handlers.onError?.(err);
    // You can decide whether to close or keep trying:
    // es.close();
  };

  // Return cleanup
  return () => {
    es.close();
  };
}
