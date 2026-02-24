"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Clipboard, Loader2 } from "lucide-react";

interface ScreenshotUploadProps {
  onPositionsExtracted: (
    positions: Array<{
      symbol: string;
      optionType: "call" | "put";
      strike: number;
      expiration: string;
      premium: number;
      quantity: number;
      currentPrice: number;
      underlyingPrice: number;
    }>,
  ) => void;
}

export function ScreenshotUpload({
  onPositionsExtracted,
}: ScreenshotUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const processImage = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);

      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setPreview(base64);

        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "OCR failed");
        }

        if (data.positions.length === 0) {
          setError("No options positions found. Try a clearer image.");
          return;
        }

        onPositionsExtracted(data.positions);
        setPreview(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to process image");
      } finally {
        setLoading(false);
      }
    },
    [onPositionsExtracted],
  );

  // Global paste listener
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (loading) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processImage(file);
          }
          return;
        }
      }
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [processImage, loading]);

  return (
    <div
      ref={containerRef}
      className="border-2 border-dashed rounded-xl p-6 text-center transition-all border-border hover:border-gray-500"
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 text-gray-400">
          {preview && (
            <img
              src={preview}
              alt="Uploaded screenshot"
              className="max-h-32 rounded-lg opacity-60"
            />
          )}
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Analyzing screenshot...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Clipboard className="w-8 h-8" />
          <p className="text-sm">
            Screenshot then <kbd className="px-1.5 py-0.5 bg-surface rounded border border-border text-xs font-mono">Cmd+V</kbd> to paste
          </p>
          <p className="text-xs text-gray-500">
            Schwab options positions screenshot
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
