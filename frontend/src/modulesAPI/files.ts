// src/modulesAPI/files.ts
import api from "../lib/axios";

export interface FileItem {
  id: string;
  name: string;
  size: number;              // bytes
  created_at: string;        // ISO
  latestVersion?: number;
  tag?: string[];  
  role?: "OWNER" | "COLLAB" | "VIEWER";   
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

function pickId(x: any): string {
  return x?.file_id ?? x?.fileId ?? x?.id ?? x?.uuid ?? x?.fileID ?? x?.FileId ?? "";
}
function pickCreatedAt(x: any): string {
  return x?.created_at ?? x?.createdAt ?? x?.uploaded_at ?? x?.uploadedAt ?? new Date().toISOString();
}
function pickLatestVersion(x: any): number | undefined {
  const v = x?.latest_version ?? x?.latestVersion ?? x?.version ?? x?.VersionNo;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function getFilesApi(): Promise<FileItem[]> {
  const listRes = await api.get("/files");
  const rows: any[] = Array.isArray(listRes.data)
    ? listRes.data
    : Array.isArray(listRes.data?.items)
    ? listRes.data.items
    : Array.isArray(listRes.data?.files)
    ? listRes.data.files
    : [];

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const id = pickId(row);
      const base = {
        id,
        name: row?.name ?? row?.filename ?? "untitled",
        size: 0,
        created_at: pickCreatedAt(row),
        latestVersion: pickLatestVersion(row),
        tag: normalizeTags(row?.tag ?? row?.tags ?? null),
        role: row?.role as "OWNER" | "COLLAB" | "VIEWER" | undefined,
      } as FileItem;

      if (!id) return { ...base, id: "" };

      try {
        const metaRes = await api.get(`/files/${id}`);
        const m = metaRes.data || {};
        const size = Number(m.sizeBytes ?? 0);

        return {
          ...base,
          name: m.name ?? base.name,
          size: Number.isFinite(size) ? size : 0,
          created_at: m.createdAt ?? base.created_at,
          latestVersion: pickLatestVersion(m) ?? base.latestVersion,
          tag: normalizeTags(m.tag ?? base.tag),
        } as FileItem;
      } catch {
        return base;
      }
    })
  );

  const filtered = enriched.filter((x) => x.id);
  filtered.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return filtered;
}

export async function uploadFileApi(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/files", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function downloadFileApi(
  fileId: string,
  name?: string,
  version?: number
) {
  const path =
    typeof version === "number"
      ? `/files/${fileId}/versions/${version}/download`
      : `/files/${fileId}/download`;

  const res = await api.get(path, { responseType: "blob" });
  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteFileApi(id: string) {
  const res = await api.delete(`/files/${id}`);
  return res.data;
}


export type ShareRole = "VIEWER" | "COLLAB" | "OWNER";

export interface ShareReq {
  fileId: string;
  targetEmail: string;
  role: ShareRole;
}

export interface ShareRes {
  success: boolean;
  fileId: string;
  sharedWith: string; // email
  role: ShareRole;
  message?: string;
  error?: string;
}

export async function shareFileApi(
  { fileId, targetEmail, role }: ShareReq
): Promise<ShareRes> {
  const { data } = await api.post<ShareRes>(`/files/${fileId}/share`, {
    targetEmail,
    role,
  });
  return data;
}

