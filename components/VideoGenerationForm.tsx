"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import {
  VIDEO_MODELS,
  VIDEO_ASPECT_RATIOS,
  VIDEO_QUALITIES,
  VIDEO_DURATIONS,
  VIDEO_SHOT_TYPES,
  type VideoModel,
  type VideoAspectRatio,
  type VideoQuality,
  type VideoDuration,
  type VideoShotType,
} from "@/types/evolink";

interface VideoGenerationFormProps {
  onSubmit: (data: {
    model: VideoModel;
    prompt: string;
    aspect_ratio: VideoAspectRatio;
    quality: VideoQuality;
    duration: VideoDuration;
    prompt_extend: boolean;
    shot_type: VideoShotType;
    callbackUrl: string;
    imageFile: File | null;
  }) => void;
  loading: boolean;
  error: string | null;
  taskId: string;
}

export default function VideoGenerationForm({
  onSubmit,
  loading,
  error,
  taskId,
}: VideoGenerationFormProps) {
  const [model, setModel] = useState<VideoModel>("wan2.6-text-to-video");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [quality, setQuality] = useState<VideoQuality>("720p");
  const [duration, setDuration] = useState<VideoDuration>(5);
  const [promptExtend, setPromptExtend] = useState(true);
  const [shotType, setShotType] = useState<VideoShotType>("single");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isImageToVideo = model === "wan2.6-image-to-video";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      model,
      prompt,
      aspect_ratio: aspectRatio,
      quality,
      duration,
      prompt_extend: promptExtend,
      shot_type: shotType,
      callbackUrl,
      imageFile,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
    >
      <h2 className="text-lg font-semibold text-black">
        1. 创建视频生成任务
        <span className="ml-2 text-xs font-normal text-black/60">
          POST /v1/videos/generations
        </span>
      </h2>

      {/* Model */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-black/60">模型 model</label>
        <select
          value={model}
          onChange={(e) => {
            setModel(e.target.value as VideoModel);
            if (e.target.value === "wan2.6-text-to-video") {
              removeImage();
            }
          }}
          className="px-2 py-1.5 rounded border border-black/20 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          {VIDEO_MODELS.map((m) => (
            <option key={m} value={m}>
              {m === "wan2.6-text-to-video" ? "文生视频 (text-to-video)" : "图生视频 (image-to-video)"}
            </option>
          ))}
        </select>
      </div>

      {/* Image Upload - 仅图生视频模式 */}
      {isImageToVideo && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-black/60">
            首帧图片 image_urls * (最大10MB, 支持 jpg/png/bmp/webp)
          </label>
          {imagePreview ? (
            <div className="relative inline-block w-fit">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 rounded border border-black/10 shadow"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full text-sm shadow hover:bg-black/80"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-black/20 rounded-xl cursor-pointer hover:border-black transition-colors bg-white shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col items-center gap-2 text-black/60">
                <span className="text-2xl">🖼️</span>
                <span className="text-sm">点击上传首帧图片</span>
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.bmp,.webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
          <span className="text-[10px] text-black/50">
            图片分辨率: 宽高范围 360-2000 像素
          </span>
        </div>
      )}

      {/* Prompt */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-black/60">提示词 prompt * (最多1500字符)</label>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 1500))}
          placeholder="A cat playing piano"
          required
          maxLength={1500}
          className="px-3 py-2 rounded-md border border-black/20 bg-white text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black resize-none shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
        />
        <span className="text-[10px] text-black/50 text-right">{prompt.length}/1500</span>
      </div>

      {/* Quality, Aspect Ratio (仅文生视频), Duration Grid */}
      <div className={`grid grid-cols-1 gap-3 ${isImageToVideo ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60">质量 quality</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as VideoQuality)}
            className="px-2 py-1.5 rounded border border-black/20 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {VIDEO_QUALITIES.map((q) => (
              <option key={q} value={q}>
                {q} {q === "720p" ? "(标准)" : "(高清)"}
              </option>
            ))}
          </select>
        </div>

        {/* 宽高比 - 仅文生视频模式 */}
        {!isImageToVideo && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/60">宽高比 aspect_ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
              className="px-2 py-1.5 rounded border border-black/20 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              {VIDEO_ASPECT_RATIOS.map((ar) => (
                <option key={ar} value={ar}>
                  {ar}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60">时长 duration (秒)</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) as VideoDuration)}
            className="px-2 py-1.5 rounded border border-black/20 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {VIDEO_DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d}秒
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shot Type and Prompt Extend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60">镜头类型 shot_type</label>
          <select
            value={shotType}
            onChange={(e) => setShotType(e.target.value as VideoShotType)}
            className="px-2 py-1.5 rounded border border-black/20 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {VIDEO_SHOT_TYPES.map((st) => (
              <option key={st} value={st}>
                {st === "single" ? "单镜头" : "多镜头"}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-black/50">仅在启用智能提示词优化时生效</span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-black/60">智能提示词优化 prompt_extend</label>
          <label className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={promptExtend}
              onChange={(e) => setPromptExtend(e.target.checked)}
              className="w-4 h-4 rounded border-black/30 text-black focus:ring-black"
            />
            <span className="text-sm text-black/70">启用（推荐）</span>
          </label>
          <span className="text-[10px] text-black/50">启用后大模型会优化提示词，对简单描述效果更佳</span>
        </div>
      </div>

      {/* Callback URL */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-black/60">
          回调地址 callback_url（可选，仅支持 HTTPS）
        </label>
        <input
          type="url"
          value={callbackUrl}
          onChange={(e) => setCallbackUrl(e.target.value)}
          placeholder="https://your-domain.com/webhooks/video-task-completed"
          className="px-3 py-2 rounded-md border border-black/20 bg-white text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !prompt || (isImageToVideo && !imageFile)}
        className="px-4 py-2 rounded-full border-none bg-black text-white font-medium shadow-[0_14px_28px_rgba(0,0,0,0.14)] hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "创建中..." : isImageToVideo ? "🎬 创建图生视频任务" : "🎬 创建文生视频任务"}
      </button>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          错误：{error}
        </div>
      )}

      {/* Task ID */}
      {taskId && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 break-all">
          <span className="font-semibold">任务 ID：</span>
          {taskId}
        </div>
      )}
    </form>
  );
}
