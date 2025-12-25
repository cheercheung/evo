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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-2xl border border-black/10 bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
      {/* Model Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black/80">模型</label>
        <div className="flex gap-2">
          {Z_IMAGE_MODELS.map((m) => (
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
        <label className="text-sm font-medium text-black/80">尺寸比例</label>
        <div className="flex flex-wrap gap-2">
          {Z_IMAGE_SIZES.map((s) => (
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

      {/* Seed Option */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-black/80">随机种子</label>
          <button
            type="button"
            onClick={() => setUseSeed(!useSeed)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              useSeed
                ? "bg-black text-white border-black shadow-[0_10px_20px_rgba(0,0,0,0.12)]"
                : "bg-white text-black border-black/20 hover:border-black"
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
            className="px-4 py-2 rounded-lg bg-white text-black border border-black/20 focus:border-black focus:outline-none w-48 shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
            placeholder="1 - 2147483647"
          />
        )}
        <p className="text-xs text-black/60">
          相同种子 + 相同提示词 = 相似结果
        </p>
      </div>

      {/* NSFW Check */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-black/80">NSFW 检测</label>
        <button
          type="button"
          onClick={() => setNsfwCheck(!nsfwCheck)}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
            nsfwCheck
              ? "bg-black text-white border-black shadow-[0_10px_20px_rgba(0,0,0,0.12)]"
              : "bg-white text-black border-black/20 hover:border-black"
          }`}
        >
          {nsfwCheck ? "严格过滤" : "基础过滤"}
        </button>
      </div>

      {/* Prompt */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black/80">
          提示词 <span className="text-black/50">(最多 2000 字符)</span>
        </label>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
          placeholder="描述你想生成的图片..."
          required
          maxLength={2000}
          className="px-4 py-3 rounded-lg bg-white text-black border border-black/20 focus:border-black focus:outline-none resize-none shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
        />
        <p className="text-xs text-black/60 text-right">
          {prompt.length} / 2000
        </p>
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
