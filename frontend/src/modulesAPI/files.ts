import api from "../lib/axios";

export interface FileItem {
  id: string;
  name: string;
  size: number;            // bytes
  created_at: string;
  url: string;             // direct download url
  latestVersion?: number;
}

function toNumberSafe(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}


export async function getFilesApi(): Promise<FileItem[]> {
  const res = await api.get("/files");
  const raw = Array.isArray(res.data)
    ? res.data
    : res.data?.files ?? res.data?.items ?? res.data?.data ?? [];

  return raw.map((x: any): FileItem => {
    const sizeGuess =
      x.size ??
      x.bytes ??
      x.filesize ??
      x.length ??
      x.meta?.size ??
      x.latest?.size ??
      x.latestVersion?.size ??
      x.currentVersion?.size;

    const id = x.id ?? x.fileId ?? x.uuid;

    const versionsArr = Array.isArray(x.versions) ? x.versions : undefined;
    const latestFromArray = versionsArr
      ? Math.max(
          ...versionsArr
            .map((v: any) => Number(v?.version ?? v))
            .filter((n: number) => Number.isFinite(n))
        )
      : undefined;

    const latestVersion =
      (Number.isFinite(Number(x.latestVersion)) ? Number(x.latestVersion) : undefined) ??
      (Number.isFinite(Number(x.latest_version)) ? Number(x.latest_version) : undefined) ??
      (Number.isFinite(Number(x.version)) ? Number(x.version) : undefined) ??
      latestFromArray;

    return {
      id,
      name: x.name ?? x.filename ?? x.file_name ?? "untitled",
      size: toNumberSafe(sizeGuess, 0),
      created_at:
        x.created_at ?? x.createdAt ?? x.uploaded_at ?? new Date().toISOString(),
      url:
        x.url ??
        x.downloadUrl ??
        (id
          ? latestVersion != null
            ? `/api/files/${id}/versions/${latestVersion}/download`
            : `/api/files/${id}/download`
          : "#"),
      latestVersion,
    };
  });
}

// POST /files  (multer: .single("file"))
export async function uploadFileApi(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/files", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// download file (supports optional version)
export async function downloadFileApi(fileId: string, name?: string, version?: number) {
  const path = version != null
    ? `/files/${fileId}/versions/${version}/download`
    : `/files/${fileId}/download`;

  try {
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
  } catch (err) {
    console.error("Download failed:", err);
    alert("File download failed.");
  }
}

// DELETE /files/:id
export async function deleteFileApi(id: string) {
  const res = await api.delete(`/files/${id}`);
  return res.data;
}


