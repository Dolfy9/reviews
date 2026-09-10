import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { uploadsApi } from "../api/uploads";
import { friendlyErrorMessage } from "../api/client";

interface ReviewImageInputProps {
  images: string[];
  onChange: (images: string[]) => void;
  onError: (message: string) => void;
  max?: number;
}

export function ReviewImageInput({
  images,
  onChange,
  onError,
  max = 5,
}: ReviewImageInputProps) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addImage = (url: string) => {
    if (images.length >= max) {
      onError(`You can attach up to ${max} images.`);
      return;
    }
    if (images.includes(url)) return;
    onChange([...images, url]);
  };

  const removeImage = (url: string) => {
    onChange(images.filter((i) => i !== url));
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError("Only image files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError("Image must be smaller than 5 MB.");
      return;
    }
    try {
      setUploading(true);
      const { uploadUrl, publicUrl } = await uploadsApi.getPresignedUrl(
        file.name,
      );
      await uploadsApi.uploadFile(uploadUrl, file);
      addImage(publicUrl);
    } catch (err) {
      onError(friendlyErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleUrlAdd = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      addImage(trimmed);
      setUrlInput("");
    } catch {
      onError("Please enter a valid image URL.");
    }
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div
              key={url}
              className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <img
                src={url}
                alt="Review attachment"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < max && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                files.forEach((file) => void handleFile(file));
              }}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="btn-secondary inline-flex items-center gap-1.5 text-xs"
            >
              {uploading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <ImagePlus size={14} />
              )}
              {uploading ? "Uploading..." : "Attach picture"}
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {images.length}/{max}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleUrlAdd();
                }
              }}
              placeholder="Or paste an image URL"
              className="input text-sm"
            />
            <button
              type="button"
              onClick={handleUrlAdd}
              className="btn-secondary text-xs"
            >
              Add
            </button>
          </div>
        </>
      )}
    </div>
  );
}
