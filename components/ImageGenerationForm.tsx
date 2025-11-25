"use client";

import React, { useState } from "react";
import { MODELS, SIZES, QUALITIES, type Model, type Size, type Quality } from "@/types/evolink";

interface ImageGenerationFormProps {
  onSubmit: (data: {
    model: Model;
    prompt: string;
    size: Size;
    quality: Quality;
    imageUrls: string[];
    callbackUrl: string;
  }) => void;
  loading: boolean;
  error: string | null;
  taskId: string;
}

export default function ImageGenerationForm({
  onSubmit,
  loading,
  error,
  taskId,
}: ImageGenerationFormProps) {
  const [model, setModel] = useState<Model>("nano-banana-2-lite");
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<Size>("auto");
  const [quality, setQuality] = useState<Quality>("2K");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [callbackUrl, setCallbackUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ model, prompt, size, quality, imageUrls, callbackUrl });
  };

  const addImageUrlField = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-700 rounded-lg p-4 flex flex-col gap-3 bg-slate-900/50"
    >
      <h2 className="text-lg font-semibold text-gray-100">
        1. 创建图片生成任务
        <span className="ml-2 text-xs font-normal text-gray-400">
          POST /v1/images/generations
        </span>
      </h2>

      {/* Model, Size, Quality Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">模型 model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as Model)}
            className="px-2 py-1.5 rounded border border-gray-700 bg-slate-900 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">尺寸 size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as Size)}
            className="px-2 py-1.5 rounded border border-gray-700 bg-slate-900 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">质量 quality</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as Quality)}
            className="px-2 py-1.5 rounded border border-gray-700 bg-slate-900 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {QUALITIES.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prompt */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">提示词 prompt *</label>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A cat playing in the grass"
          required
          className="px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Image URLs */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-gray-400">
            参考图片 URL 列表 image_urls（可选，最多 10 张）
          </label>
          <button
            type="button"
            onClick={addImageUrlField}
            disabled={imageUrls.length >= 10}
            className="text-[10px] px-2 py-1 rounded border border-gray-600 bg-transparent text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + 添加一行
          </button>
        </div>
        {imageUrls.map((url, idx) => (
          <input
            key={idx}
            value={url}
            onChange={(e) => updateImageUrl(idx, e.target.value)}
            placeholder="https://example.com/image.png"
            className="px-2 py-1.5 rounded border border-gray-700 bg-slate-900 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ))}
      </div>

      {/* Callback URL */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">
          回调地址 callback_url（可选，仅支持 HTTPS）
        </label>
        <input
          type="url"
          value={callbackUrl}
          onChange={(e) => setCallbackUrl(e.target.value)}
          placeholder="https://your-domain.com/webhooks/image-task-completed"
          className="px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !prompt}
        className="px-4 py-2 rounded-md border-none bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "创建中..." : "创建生成任务"}
      </button>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-800 rounded px-3 py-2">
          错误：{error}
        </div>
      )}

      {/* Task ID */}
      {taskId && (
        <div className="text-xs text-green-400 bg-green-950/30 border border-green-800 rounded px-3 py-2 break-all">
          <span className="font-semibold">任务 ID：</span>
          {taskId}
        </div>
      )}
    </form>
  );
}

