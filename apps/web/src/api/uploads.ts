import { api } from "./client";
import type { PresignedUrlRequest } from "@product-reviews/shared";

interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  objectName: string;
}

export const uploadsApi = {
  getPresignedUrl: (filename: string): Promise<PresignedUrlResponse> =>
    api
      .post<PresignedUrlResponse>("/uploads/presigned-url", {
        filename,
      } as PresignedUrlRequest)
      .then((res) => res.data),

  uploadFile: (uploadUrl: string, file: File): Promise<void> =>
    fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    }).then((res) => {
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    }),
};
