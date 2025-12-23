"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useEnvConfig } from "@/lib/hooks/useEnvConfig";
import { useEvolinkClient } from "@/lib/hooks/useEvolinkClient";
import { useTaskList } from "@/lib/hooks/useTaskList";
import SimpleImageGenerationForm from "@/components/SimpleImageGenerationForm";
import AutoTaskQuery from "@/components/AutoTaskQuery";
import { TaskCard } from "@/components/TaskCard";

interface Task {
  id: string;
  createdAt: number;
  prompt: string;
}

const CORRECT_PASSWORD = "lyj";

export default function ImageToolPage() {
  const { apiKey, uploadAuthToken } = useEnvConfig();
  const effectiveApiKey = apiKey ?? "";
  const effectiveUploadToken = uploadAuthToken;
  const client = useEvolinkClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const { tasks, results, addTask, removeTask, clear, updateResults, totalResultCount } = useTaskList();
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleGenerate = async (data: {
    model: any;
    prompt: string;
    size: any;
    quality: any;
    imageFiles: File[];
  }) => {
    if (!effectiveApiKey) {
      setGenError("请先在 .env.local 中设置 API Key");
      return;
    }

    setGenError(null);
    setGenLoading(true);

    try {
      // 先上传所有图片
      const imageUrls: string[] = [];
      for (const file of data.imageFiles) {
        const uploadResponse = await client.uploadFile(file, {
          uploadPath: "image-generation",
          authToken: effectiveUploadToken,
        });
        imageUrls.push(uploadResponse.data.file_url);
      }

      // 创建生成任务
      const response = await client.createImageGeneration({
        model: data.model,
        prompt: data.prompt,
        size: data.size,
        quality: data.quality,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      // 添加到任务列表（最新的在最前面）
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

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("下载失败:", err);
    }
  };

  const downloadAllImages = async () => {
    setDownloadingAll(true);

    let imageIndex = 1;
    for (const task of tasks) {
      const imageUrls = results[task.id];
      if (imageUrls && imageUrls.length > 0) {
        for (const url of imageUrls) {
          await downloadImage(url, `image-${imageIndex}.png`);
          imageIndex++;
          // 延迟一下，避免同时下载太多
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }

    setDownloadingAll(false);
  };

  const getTotalImageCount = () => {
    return Object.values(results).reduce(
      (total, urls) => total + urls.length,
      0
    );
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

  // 密码验证页面
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-bold">请输入密码</h1>
              <p className="text-sm text-gray-500">输入正确密码后开始使用</p>
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
              className="w-full py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors"
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
            <h1 className="text-3xl font-bold">图片生成</h1>
            <div className="flex gap-2">
              <Link href="/video-tool" className="text-sm px-4 py-2 border border-purple-700 text-purple-400 hover:border-purple-500 transition-colors">🎬 视频</Link>
              <Link href="/nb-cover" className="text-sm px-4 py-2 border border-gray-700 hover:border-white transition-colors">封面生产</Link>
              <Link href="/z-image" className="text-sm px-4 py-2 border border-gray-700 hover:border-white transition-colors">Z-Image</Link>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            使用 AI 生成高质量图片 · 支持多任务并行
          </p>
        </div>

        {/* Generation Form */}
        <SimpleImageGenerationForm
          apiKey={effectiveApiKey}
          onSubmit={handleGenerate}
          loading={genLoading}
          error={genError}
          taskId=""
        />

        {/* All Tasks */}
        {tasks.length > 0 && (
          <div className="flex flex-col gap-6 border-t border-gray-800 pt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                任务列表 ({tasks.length})
              </h2>
              <div className="flex gap-2">
                {totalResultCount > 0 && (
                  <button
                    onClick={downloadAllImages}
                    disabled={downloadingAll}
                    className="text-sm px-4 py-2 bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 transition-colors font-medium"
                  >
                    {downloadingAll
                      ? "下载中..."
                      : `一键下载全部 (${totalResultCount} 张)`}
                  </button>
                )}
                <button
                  onClick={clear}
                  className="text-xs px-3 py-1 border border-gray-700 hover:border-white transition-colors"
                >
                  清空全部
                </button>
              </div>
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
                  <AutoTaskQuery
                    apiKey={effectiveApiKey}
                    taskId={task.id}
                    onResultsUpdate={(imageUrls) =>
                      updateResults(task.id, imageUrls)
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
