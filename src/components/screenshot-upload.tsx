"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Loader2 } from "lucide-react";

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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to process image");
      } finally {
        setLoading(false);
      }
    },
    [onPositionsExtracted],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        processImage(file);
      }
    },
    [processImage],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processImage(file);
      }
    },
    [processImage],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
        dragOver
          ? "border-blue-500 bg-blue-500/10"
          : "border-border hover:border-gray-500"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {loading ? (
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Analyzing screenshot...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Camera className="w-8 h-8" />
          <p className="text-sm">Upload screenshot or drag & drop</p>
          <p className="text-xs text-gray-500">
            Schwab options positions screenshot
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
