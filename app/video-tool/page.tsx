"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useEnvConfig } from "@/lib/hooks/useEnvConfig";
import { useEvolinkClient } from "@/lib/hooks/useEvolinkClient";
import { useTaskList } from "@/lib/hooks/useTaskList";
import VideoGenerationForm from "@/components/VideoGenerationForm";
import type {
  VideoModel,
  VideoAspectRatio,
  VideoQuality,
  VideoDuration,
  VideoShotType,
} from "@/types/evolink";
import AutoVideoTaskQuery from "@/components/AutoVideoTaskQuery";
import { TaskCard } from "@/components/TaskCard";

interface Task {
  id: string;
  createdAt: number;
  prompt: string;
}

const CORRECT_PASSWORD = "lyj";

export default function VideoToolPage() {
  const { apiKey, uploadAuthToken } = useEnvConfig();
  const effectiveApiKey = apiKey ?? "";
  const effectiveUploadToken = uploadAuthToken;
  const client = useEvolinkClient();
  const { tasks, results, addTask, removeTask, clear, updateResults } = useTaskList();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerate = async (data: {
    model: VideoModel;
    prompt: string;
    aspect_ratio: VideoAspectRatio;
    quality: VideoQuality;
    duration: VideoDuration;
    prompt_extend: boolean;
    shot_type: VideoShotType;
    callbackUrl: string;
    imageFile: File | null;
  }) => {
    if (!effectiveApiKey) {
      setGenError("请先在 .env.local 中设置 API Key");
      return;
    }

    setGenError(null);
    setGenLoading(true);

    try {
      const isImageToVideo = data.model === "wan2.6-image-to-video" || data.model === "kling-o1-image-to-video";
      const isKling = data.model === "kling-o1-image-to-video";

      // 如果是图生视频模式，先上传图片
      let imageUrls: string[] | undefined;
      if (isImageToVideo && data.imageFile) {
        const uploadResponse = await client.uploadFile(data.imageFile, {
          uploadPath: "video-generation",
          authToken: effectiveUploadToken,
        });
        imageUrls = [uploadResponse.data.file_url];
      }

      const response = await client.createVideoGeneration({
        model: data.model,
        prompt: data.prompt,
        aspect_ratio: isImageToVideo ? (isKling ? data.aspect_ratio : undefined) : data.aspect_ratio, // Kling 支持宽高比，WAN2.6 图生视频不支持
        quality: isKling ? undefined : data.quality, // Kling 不支持 quality 参数
        duration: data.duration,
        prompt_extend: isKling ? undefined : data.prompt_extend, // Kling 不支持 prompt_extend
        model_params: isKling ? undefined : {
          shot_type: data.shot_type,
        }, // Kling 不支持 model_params
        image_urls: imageUrls,
        callback_url: data.callbackUrl || undefined,
      });

      addTask({
        id: response.id,
        createdAt: Date.now(),
        prompt: data.prompt,
      });
    } catch (err: any) {
      setGenError(err.message || "请求失败");
    } finally {
      setGenLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f7f7f7] text-black flex items-center justify-center p-8">
        <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-bold">🎬 视频生成</h1>
              <p className="text-sm text-black/60">输入密码后开始使用</p>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                placeholder="请输入密码"
                className="w-full rounded-lg border border-black/20 bg-white px-4 py-3 text-black placeholder-black/40 focus:border-black focus:outline-none"
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-red-500">密码错误，请重试</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-black py-3 text-white font-medium shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-colors hover:bg-black/80"
            >
              确认
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-black p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">🎬 视频生成</h1>
            <div className="flex gap-2">
              <Link
                href="/image-tool"
                className="text-sm px-4 py-2 rounded-full border border-black/10 bg-white text-black shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-colors hover:border-black"
              >
                Nano Banana
              </Link>
              <Link
                href="/nb-cover"
                className="text-sm px-4 py-2 rounded-full border border-black/10 bg-white text-black shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-colors hover:border-black"
              >
                NB 封面
              </Link>
              <Link
                href="/z-image"
                className="text-sm px-4 py-2 rounded-full border border-black/10 bg-white text-black shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-colors hover:border-black"
              >
                Z-Image
              </Link>
            </div>
          </div>
          <p className="text-sm text-black/60">
            使用 WAN2.6 / Kling-O1 模型生成高质量 AI 视频 · 支持多任务并行
          </p>
        </div>

        {/* Generation Form */}
        <VideoGenerationForm
          onSubmit={handleGenerate}
          loading={genLoading}
          error={genError}
          taskId=""
        />

        {/* All Tasks */}
        {tasks.length > 0 && (
          <div className="flex flex-col gap-6 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">任务列表 ({tasks.length})</h2>
              <button
                onClick={clear}
                className="text-xs px-3 py-1 rounded-full border border-black/20 hover:border-black transition-colors"
              >
                清空全部
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  createdAt={task.createdAt}
                  title={`提示词：${task.prompt}`}
                  onRemove={() => removeTask(task.id)}
                >
                  <AutoVideoTaskQuery
                    apiKey={effectiveApiKey}
                    taskId={task.id}
                    onResultsUpdate={(videoUrls) =>
                      updateResults(task.id, videoUrls)
                    }
                  />
                </TaskCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
