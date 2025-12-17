"use client";

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
  const [model] = useState<VideoModel>("wan2.6-text-to-video");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [quality, setQuality] = useState<VideoQuality>("720p");
  const [duration, setDuration] = useState<VideoDuration>(5);
  const [promptExtend, setPromptExtend] = useState(true);
  const [shotType, setShotType] = useState<VideoShotType>("single");
  const [callbackUrl, setCallbackUrl] = useState("");

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
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-700 rounded-lg p-4 flex flex-col gap-3 bg-slate-900/50"
    >
      <h2 className="text-lg font-semibold text-gray-100">
        1. 创建视频生成任务
        <span className="ml-2 text-xs font-normal text-gray-400">
          POST /v1/videos/generations
        </span>
      </h2>

      {/* Model */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">模型 model</label>
        <select
          value={model}
          disabled
          className="px-2 py-1.5 rounded border border-gray-700 bg-slate-900 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {VIDEO_MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">提示词 prompt * (最多1500字符)</label>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 1500))}
          placeholder="A cat playing piano"
          required
          maxLength={1500}
          className="px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <span className="text-[10px] text-gray-500 text-right">{prompt.length}/1500</span>
      </div>

      {/* Quality, Aspect Ratio, Duration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">质量 quality</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as VideoQuality)}
            className="px-2 py-1.5 rounded border border-gray-700 bg-slate-900 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VIDEO_QUALITIES.map((q) => (
              <option key={q} value={q}>
                {q} {q === "720p" ? "(标准)" : "(高清)"}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">宽高比 aspect_ratio</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
            className="px-2 py-1.5 rounded border border-gray-700 bg-slate-900 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VIDEO_ASPECT_RATIOS.map((ar) => (
              <option key={ar} value={ar}>
                {ar}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">时长 duration (秒)</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) as VideoDuration)}
            className="px-2 py-1.5 rounded border border-gray-700 bg-slate-900 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="text-xs text-gray-400">镜头类型 shot_type</label>
          <select
            value={shotType}
            onChange={(e) => setShotType(e.target.value as VideoShotType)}
            className="px-2 py-1.5 rounded border border-gray-700 bg-slate-900 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VIDEO_SHOT_TYPES.map((st) => (
              <option key={st} value={st}>
                {st === "single" ? "单镜头" : "多镜头"}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-gray-500">仅在启用智能提示词优化时生效</span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">智能提示词优化 prompt_extend</label>
          <label className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={promptExtend}
              onChange={(e) => setPromptExtend(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-slate-900 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">启用（推荐）</span>
          </label>
          <span className="text-[10px] text-gray-500">启用后大模型会优化提示词，对简单描述效果更佳</span>
        </div>
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
          placeholder="https://your-domain.com/webhooks/video-task-completed"
          className="px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !prompt}
        className="px-4 py-2 rounded-md border-none bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "创建中..." : "🎬 创建视频生成任务"}
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

