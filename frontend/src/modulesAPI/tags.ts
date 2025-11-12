// src/modulesAPI/tags.ts
import api from "../lib/axios";

// GET /files/:id/tags  -> { fileId, tag }
export async function getFileTags(fileId: string): Promise<string | null | undefined> {
  const { data } = await api.get(`/files/${fileId}/tags`);
  return data?.tag as string | null | undefined;
}

export async function upsertFileTag(fileId: string, tag: string) {
  await api.put(`/files/${fileId}/tags`, { tag }); // { tag: string }
}

export async function renameFileTag(fileId: string, to: string) {
  await api.put(`/files/${fileId}/tags`, { tag: to });
}


export async function removeFileTag(fileId: string) {
  await api.patch(`/files/${fileId}/tags`, { tag: null }); // { tag: null }
}
