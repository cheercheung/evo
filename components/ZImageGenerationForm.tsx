"use client";

import React, { useState } from "react";
import { Z_IMAGE_MODELS, Z_IMAGE_SIZES } from "@/types/evolink";
import type { ZImageModel, ZImageSize } from "@/types/evolink";

interface ZImageGenerationFormProps {
  apiKey: string;
  onSubmit: (data: {
    model: ZImageModel;
    prompt: string;
    size: ZImageSize;
    seed?: number;
    nsfw_check: boolean;
  }) => void;
  loading: boolean;
  error: string | null;
}

export default function ZImageGenerationForm({
  apiKey,
  onSubmit,
  loading,
  error,
}: ZImageGenerationFormProps) {
  const [model, setModel] = useState<ZImageModel>("z-image-turbo");
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ZImageSize>("1:1");
  const [useSeed, setUseSeed] = useState(false);
  const [seed, setSeed] = useState<number>(12345);
  const [nsfwCheck, setNsfwCheck] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      model,
      prompt,
      size,
      seed: useSeed ? seed : undefined,
      nsfw_check: nsfwCheck,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Model Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-white">模型</label>
        <div className="flex gap-2">
          {Z_IMAGE_MODELS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModel(m)}
              className={`px-4 py-2 text-sm border transition-colors ${
                model === m
                  ? "bg-white text-black border-white"
                  : "bg-black text-white border-gray-700 hover:border-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-white">尺寸比例</label>
        <div className="flex flex-wrap gap-2">
          {Z_IMAGE_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`px-3 py-2 text-xs border transition-colors ${
                size === s
                  ? "bg-white text-black border-white"
                  : "bg-black text-white border-gray-700 hover:border-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Seed Option */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-white">随机种子</label>
          <button
            type="button"
            onClick={() => setUseSeed(!useSeed)}
            className={`px-3 py-1 text-xs border transition-colors ${
              useSeed
                ? "bg-white text-black border-white"
                : "bg-black text-white border-gray-700 hover:border-white"
            }`}
          >
            {useSeed ? "已启用" : "随机"}
          </button>
        </div>
        {useSeed && (
          <input
            type="number"
            min={1}
            max={2147483647}
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value) || 1)}
            className="px-4 py-2 bg-black text-white border border-gray-700 focus:border-white focus:outline-none w-48"
            placeholder="1 - 2147483647"
          />
        )}
        <p className="text-xs text-gray-500">
          相同种子 + 相同提示词 = 相似结果
        </p>
      </div>

      {/* NSFW Check */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-white">NSFW 检测</label>
        <button
          type="button"
          onClick={() => setNsfwCheck(!nsfwCheck)}
          className={`px-3 py-1 text-xs border transition-colors ${
            nsfwCheck
              ? "bg-white text-black border-white"
              : "bg-black text-white border-gray-700 hover:border-white"
          }`}
        >
          {nsfwCheck ? "严格过滤" : "基础过滤"}
        </button>
      </div>

      {/* Prompt */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-white">
          提示词 <span className="text-gray-500">(最多 2000 字符)</span>
        </label>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
          placeholder="描述你想生成的图片..."
          required
          maxLength={2000}
          className="px-4 py-3 bg-black text-white border border-gray-700 focus:border-white focus:outline-none resize-none"
        />
        <p className="text-xs text-gray-500 text-right">
          {prompt.length} / 2000
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "生成中..." : "生成图片"}
      </button>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 bg-red-900/20 border border-red-900 text-red-400 text-sm">
          {error}
        </div>
      )}
    </form>
  );
}

