import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

interface ReviewImageGalleryProps {
  images: string[];
  altPrefix?: string;
}

export function ReviewImageGallery({
  images,
  altPrefix = "Review image",
}: ReviewImageGalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  const openAt = useCallback((i: number) => {
    setIndex(i);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const goPrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setIndex((i) => Math.min(images.length - 1, i + 1));
    },
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, close, goPrev, goNext]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (images.length === 0) return null;

  const currentSrc = images[index];

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {images.map((img, i) => (
          <button
            key={`${img}-${i}`}
            type="button"
            onClick={() => openAt(i)}
            className="h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition hover:ring-2 hover:ring-sky-300 dark:border-slate-700 dark:bg-slate-800/50"
            aria-label={`Open ${altPrefix} ${i + 1}`}
          >
            {imgErrors.has(i) ? (
              <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                <ImageOff size={20} />
              </div>
            ) : (
              <img
                src={img}
                alt={`${altPrefix} ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
                onError={() => setImgErrors((prev) => new Set([...prev, i]))}
              />
            )}
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Review image gallery"
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close gallery"
          >
            <X size={24} />
          </button>

          {index > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Previous image"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {index < images.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Next image"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {currentSrc && !imgErrors.has(index) ? (
            <img
              src={currentSrc}
              alt={`${altPrefix} ${index + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
              <ImageOff size={48} />
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white">
            {index + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
