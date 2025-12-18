"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EvolinkClient } from "@/lib/evolink-client";
import VideoGenerationForm from "@/components/VideoGenerationForm";
import type {
  VideoModel,
  VideoAspectRatio,
  VideoQuality,
  VideoDuration,
  VideoShotType,
} from "@/types/evolink";
import AutoVideoTaskQuery from "@/components/AutoVideoTaskQuery";

interface Task {
  id: string;
  createdAt: number;
  prompt: string;
}

const CORRECT_PASSWORD = "lyj";

export default function VideoToolPage() {
  const apiKey = process.env.NEXT_PUBLIC_EVOLINK_API_KEY || "";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResults, setTaskResults] = useState<Record<string, string[]>>({});

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
    if (!apiKey) {
      setGenError("请先在 .env.local 中设置 API Key");
      return;
    }

    setGenError(null);
    setGenLoading(true);

    try {
      const client = new EvolinkClient(apiKey);
      const isImageToVideo = data.model === "wan2.6-image-to-video";

      // 如果是图生视频模式，先上传图片
      let imageUrls: string[] | undefined;
      if (isImageToVideo && data.imageFile) {
        const uploadResponse = await client.uploadFile(data.imageFile, {
          uploadPath: "video-generation",
        });
        imageUrls = [uploadResponse.data.file_url];
      }

      const response = await client.createVideoGeneration({
        model: data.model,
        prompt: data.prompt,
        aspect_ratio: isImageToVideo ? undefined : data.aspect_ratio, // 图生视频不需要宽高比
        quality: data.quality,
        duration: data.duration,
        prompt_extend: data.prompt_extend,
        model_params: {
          shot_type: data.shot_type,
        },
        image_urls: imageUrls,
        callback_url: data.callbackUrl || undefined,
      });

      setTasks((prev) => [
        {
          id: response.id,
          createdAt: Date.now(),
          prompt: data.prompt,
        },
        ...prev,
      ]);
    } catch (err: any) {
      setGenError(err.message || "请求失败");
    } finally {
      setGenLoading(false);
    }
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setTaskResults((prev) => {
      const newResults = { ...prev };
      delete newResults[taskId];
      return newResults;
    });
  };

  const updateTaskResults = (taskId: string, videoUrls: string[]) => {
    setTaskResults((prev) => ({
      ...prev,
      [taskId]: videoUrls,
    }));
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
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-bold">🎬 视频生成</h1>
              <p className="text-sm text-gray-500">输入密码后开始使用</p>
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
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-white focus:outline-none"
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-red-500">密码错误，请重试</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
            >
              确认
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-gray-800 pb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">🎬 视频生成</h1>
            <div className="flex gap-2">
              <Link
                href="/image-tool"
                className="text-sm px-4 py-2 border border-gray-700 hover:border-white transition-colors"
              >
                Nano Banana
              </Link>
              <Link
                href="/nb-cover"
                className="text-sm px-4 py-2 border border-gray-700 hover:border-white transition-colors"
              >
                NB 封面
              </Link>
              <Link
                href="/z-image"
                className="text-sm px-4 py-2 border border-gray-700 hover:border-white transition-colors"
              >
                Z-Image
              </Link>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            使用 WAN2.6 模型生成高质量 AI 视频 · 支持多任务并行
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
          <div className="flex flex-col gap-6 border-t border-gray-800 pt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">任务列表 ({tasks.length})</h2>
              <button
                onClick={() => {
                  setTasks([]);
                  setTaskResults({});
                }}
                className="text-xs px-3 py-1 border border-gray-700 hover:border-white transition-colors"
              >
                清空全部
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-800 p-6 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="text-xs text-gray-500">
                        {new Date(task.createdAt).toLocaleString("zh-CN")}
                      </div>
                      <div className="text-sm text-gray-300">
                        提示词：{task.prompt}
                      </div>
                      <div className="text-xs text-gray-600 font-mono">
                        ID: {task.id}
                      </div>
                    </div>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="text-xs px-3 py-1 border border-gray-700 hover:border-red-500 hover:text-red-500 transition-colors"
                    >
                      移除
                    </button>
                  </div>

                  <AutoVideoTaskQuery
                    apiKey={apiKey}
                    taskId={task.id}
                    onResultsUpdate={(videoUrls) =>
                      updateTaskResults(task.id, videoUrls)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

