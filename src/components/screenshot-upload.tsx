"use client";

import { useState, useCallback, useEffect } from "react";
import { Clipboard, Loader2, Lock } from "lucide-react";

const PIN_STORAGE_KEY = "mp-ocr-pin";

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
  const [pin, setPin] = useState("");
  const [pinSaved, setPinSaved] = useState(false);

  // Load saved PIN from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PIN_STORAGE_KEY);
    if (saved) {
      setPin(saved);
      setPinSaved(true);
    }
  }, []);

  const savePin = useCallback((value: string) => {
    setPin(value);
    localStorage.setItem(PIN_STORAGE_KEY, value);
    setPinSaved(true);
  }, []);

  const processImage = useCallback(
    async (file: File) => {
      if (!pin) {
        setError("Please enter your PIN first.");
        return;
      }

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
          body: JSON.stringify({ image: base64, pin }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.code === "INVALID_PIN") {
            localStorage.removeItem(PIN_STORAGE_KEY);
            setPinSaved(false);
            setPin("");
            throw new Error("Invalid PIN. Please try again.");
          }
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
    [onPositionsExtracted, pin],
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

  // PIN input view
  if (!pinSaved) {
    return (
      <div className="border-2 border-dashed rounded-xl p-6 text-center transition-all border-border">
        <div className="flex flex-col items-center gap-3">
          <Lock className="w-8 h-8 text-gray-500" />
          <p className="text-sm text-gray-400">Enter PIN to enable OCR</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pin.trim()) savePin(pin.trim());
            }}
            className="flex gap-2"
          >
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="w-32 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white text-center placeholder-gray-600 focus:outline-none focus:border-gray-500"
              aria-label="OCR access PIN"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-colors"
            >
              Save
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed rounded-xl p-6 text-center transition-all border-border hover:border-gray-500">
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
            Screenshot then{" "}
            <kbd className="px-1.5 py-0.5 bg-surface rounded border border-border text-xs font-mono">
              Cmd+V
            </kbd>{" "}
            to paste
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
