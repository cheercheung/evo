"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef } from "react";
import { MODELS, SIZES, QUALITIES } from "@/types/evolink";
import type { Model, Size, Quality } from "@/types/evolink";

interface SimpleImageGenerationFormProps {
  apiKey: string;
  onSubmit: (data: {
    model: Model;
    prompt: string;
    size: Size;
    quality: Quality;
    imageFiles: File[];
  }) => void;
  loading: boolean;
  error: string | null;
  taskId: string;
}

export default function SimpleImageGenerationForm({
  apiKey,
  onSubmit,
  loading,
  error,
  taskId,
}: SimpleImageGenerationFormProps) {
  const [model, setModel] = useState<Model>("nano-banana-2-lite");
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<Size>("auto");
  const [quality, setQuality] = useState<Quality>("2K");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ model, prompt, size, quality, imageFiles });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (files.length > 0) {
      setImageFiles((prev) => [...prev, ...files].slice(0, 10));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles((prev) => [...prev, ...files].slice(0, 10));
    }
  };

  const removeFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Model Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black/80">模型</label>
        <div className="flex gap-2">
          {MODELS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModel(m)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                model === m
                  ? "bg-black text-white border-black shadow-[0_10px_20px_rgba(0,0,0,0.12)]"
                  : "bg-white text-black border-black/20 hover:border-black"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black/80">尺寸</label>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`px-3 py-2 text-xs rounded-full border transition-colors ${
                size === s
                  ? "bg-black text-white border-black shadow-[0_10px_20px_rgba(0,0,0,0.12)]"
                  : "bg-white text-black border-black/20 hover:border-black"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black/80">质量</label>
        <div className="flex gap-2">
          {QUALITIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuality(q)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                quality === q
                  ? "bg-black text-white border-black shadow-[0_10px_20px_rgba(0,0,0,0.12)]"
                  : "bg-white text-black border-black/20 hover:border-black"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black/80">提示词</label>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想生成的图片..."
          required
          className="px-4 py-3 rounded-lg bg-white text-black border border-black/20 focus:border-black focus:outline-none resize-none shadow-[0_6px_16px_rgba(0,0,0,0.05)]"
        />
      </div>

      {/* Image Upload Area */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black/80">参考图片（可选）</label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed p-8 cursor-pointer transition-colors rounded-2xl ${
            dragActive
              ? "border-black bg-black/5"
              : "border-black/20 hover:border-black"
          } bg-white shadow-[0_10px_25px_rgba(0,0,0,0.05)]`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="text-4xl">📁</div>
            <div className="text-sm text-black">
              拖拽图片到这里或点击上传
            </div>
            <div className="text-xs text-black/60">
              支持多张图片，最多 10 张
            </div>
          </div>
        </div>

        {/* Uploaded Files Preview */}
        {imageFiles.length > 0 && (
          <div className="grid grid-cols-5 gap-2 mt-2">
            {imageFiles.map((file, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-20 object-cover rounded border border-black/10 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-0 right-0 bg-black text-white w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="px-6 py-3 rounded-full bg-black text-white font-medium shadow-[0_14px_28px_rgba(0,0,0,0.14)] hover:bg-black/80 disabled:bg-black/30 disabled:text-white/50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "生成中..." : "生成图片"}
      </button>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
    </form>
  );
}
