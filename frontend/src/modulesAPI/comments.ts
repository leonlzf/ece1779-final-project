// src/modulesAPI/comments.ts
import api from "../lib/axios";

/** ---------- Anchor types ---------- */
export type TextAnchor = {
  kind: "text";
  start: number;
  end: number;
  exact: string;
  prefix: string;
  suffix: string;
  hash?: string;
};

export type DocxAnchor = {
  kind: "docx";
  css?: string;
  quote?: { exact: string; prefix?: string; suffix?: string };
};

export type PdfAnchor = {
  kind: "pdf";
  page: number;
  rects: Array<{ x: number; y: number; w: number; h: number }>;
};

export type Anchor = TextAnchor | DocxAnchor | PdfAnchor;

/** ---------- Pack/Unpack anchor in content ---------- */
export function packComment(message: string, anchor?: Anchor) {
  if (!anchor) return message;
  return `${message}\n\n<!--ANCHOR:${btoa(JSON.stringify(anchor))}-->`;
}

export function unpackComment(raw: string): { message: string; anchor?: Anchor } {
  const m = raw?.match(/<!--ANCHOR:([A-Za-z0-9+/=]+)-->/);
  if (!m) return { message: raw ?? "" };
  try {
    const anchor = JSON.parse(atob(m[1])) as Anchor;
    return { message: raw.replace(m[0], "").trim(), anchor };
  } catch {
    return { message: raw ?? "" };
  }
}

/** ---------- Comment DTO ---------- */
export interface CommentItem {
  id: string;
  userEmail?: string;
  createdAt: string;
  content: string;
  message: string;
  anchor?: Anchor;
}

/** tolerant field pickers */
function pickId(x: any) {
  return x?.id ?? x?.comment_id ?? x?.uuid ?? "";
}

function pickUserEmail(x: any) {
  return x?.user?.email ?? x?.author?.email ?? x?.email ?? undefined;
}

function pickCreatedAt(x: any) {
  return x?.created_at ?? x?.createdAt ?? new Date().toISOString();
}

function pickContent(x: any) {
  return x?.text ?? x?.content ?? x?.body ?? "";
}

/** ---------- helper: auth header ---------- */
function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** ---------- API ---------- */

// GET /files/:fileId/versions/:version/comments
export async function listComments(fileId: string, version: number) {
  const res = await api.get(
    `/files/${fileId}/versions/${version}/comments`,
    { headers: authHeaders() }
  );

  const rawArr: any[] = Array.isArray(res.data?.items)
    ? res.data.items
    : Array.isArray(res.data?.comments)
    ? res.data.comments
    : Array.isArray(res.data)
    ? res.data
    : [];

  return rawArr.map<CommentItem>((r) => {
    const raw = String(pickContent(r));
    const { message, anchor: packedAnchor } = unpackComment(raw);
    const dbAnchor = (r as any).anchor as Anchor | undefined;

    return {
      id: String(pickId(r)),
      userEmail: pickUserEmail(r),
      createdAt: String(pickCreatedAt(r)),
      content: raw,
      message,
      anchor: packedAnchor || dbAnchor,
    };
  });
}

// POST /files/:fileId/versions/:version/comments
export async function createComment(
  fileId: string,
  version: number,
  content: string,
  parentId?: string | null,
  anchor?: Anchor
) {
  const body: any = {
    text: content,
  };

  if (parentId) body.parentId = parentId;
  if (anchor) body.anchor = anchor;

  const res = await api.post(
    `/files/${fileId}/versions/${version}/comments`,
    body,
    { headers: authHeaders() }
  );

  return res.data;
}

// DELETE /comments/:id
export async function deleteComment(commentId: string) {
  const res = await api.delete(`/comments/${commentId}`, {
    headers: authHeaders(),
  });
  return res.data;
}

// PATCH /comments/:id
export async function updateComment(commentId: string, content: string) {
  const res = await api.patch(
    `/comments/${commentId}`,
    { text: content },
    { headers: authHeaders() }
  );
  return res.data;
}
