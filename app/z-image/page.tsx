"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EvolinkClient } from "@/lib/evolink-client";
import ZImageGenerationForm from "@/components/ZImageGenerationForm";
import AutoTaskQuery from "@/components/AutoTaskQuery";
import type { ZImageModel, ZImageSize } from "@/types/evolink";

interface Task {
  id: string;
  createdAt: number;
  prompt: string;
}

const CORRECT_PASSWORD = "lyj";

export default function ZImagePage() {
  const apiKey = process.env.NEXT_PUBLIC_EVOLINK_API_KEY || "";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResults, setTaskResults] = useState<Record<string, string[]>>({});
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleGenerate = async (data: {
    model: ZImageModel;
    prompt: string;
    size: ZImageSize;
    seed?: number;
    nsfw_check: boolean;
  }) => {
    if (!apiKey) {
      setGenError("请先在 .env.local 中设置 API Key");
      return;
    }

    setGenError(null);
    setGenLoading(true);

    try {
      const client = new EvolinkClient(apiKey);
      const response = await client.createZImageGeneration({
        model: data.model,
        prompt: data.prompt,
        size: data.size,
        seed: data.seed,
        nsfw_check: data.nsfw_check,
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

  const updateTaskResults = (taskId: string, imageUrls: string[]) => {
    setTaskResults((prev) => ({ ...prev, [taskId]: imageUrls }));
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
      const imageUrls = taskResults[task.id];
      if (imageUrls && imageUrls.length > 0) {
        for (const url of imageUrls) {
          await downloadImage(url, `z-image-${imageIndex}.png`);
          imageIndex++;
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }
    setDownloadingAll(false);
  };

  const getTotalImageCount = () => {
    return Object.values(taskResults).reduce((total, urls) => total + urls.length, 0);
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
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                placeholder="请输入密码"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-white focus:outline-none"
                autoFocus
              />
              {passwordError && <p className="text-sm text-red-500">密码错误，请重试</p>}
            </div>
            <button type="submit" className="w-full py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors">
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
            <h1 className="text-3xl font-bold">Z-Image 图片生成</h1>
            <div className="flex gap-2">
              <Link href="/video-tool" className="text-sm px-4 py-2 border border-purple-700 text-purple-400 hover:border-purple-500 transition-colors">🎬 视频</Link>
              <Link href="/nb-cover" className="text-sm px-4 py-2 border border-gray-700 hover:border-white transition-colors">NB 封面</Link>
              <Link href="/image-tool" className="text-sm px-4 py-2 border border-gray-700 hover:border-white transition-colors">Nano Banana</Link>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            使用 Z-Image Turbo 模型快速生成图片
          </p>
        </div>

        {/* Generation Form */}
        <ZImageGenerationForm
          apiKey={apiKey}
          onSubmit={handleGenerate}
          loading={genLoading}
          error={genError}
        />

        {/* All Tasks */}
        {tasks.length > 0 && (
          <div className="flex flex-col gap-6 border-t border-gray-800 pt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">任务列表 ({tasks.length})</h2>
              <div className="flex gap-2">
                {getTotalImageCount() > 0 && (
                  <button
                    onClick={downloadAllImages}
                    disabled={downloadingAll}
                    className="text-sm px-4 py-2 bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 transition-colors font-medium"
                  >
                    {downloadingAll ? "下载中..." : `一键下载全部 (${getTotalImageCount()} 张)`}
                  </button>
                )}
                <button
                  onClick={() => { setTasks([]); setTaskResults({}); }}
                  className="text-xs px-3 py-1 border border-gray-700 hover:border-white transition-colors"
                >
                  清空全部
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {tasks.map((task) => (
                <div key={task.id} className="border border-gray-800 p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="text-xs text-gray-500">
                        {new Date(task.createdAt).toLocaleString("zh-CN")}
                      </div>
                      <div className="text-sm text-gray-300">提示词：{task.prompt}</div>
                      <div className="text-xs text-gray-600 font-mono">ID: {task.id}</div>
                    </div>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="text-xs px-3 py-1 border border-gray-700 hover:border-red-500 hover:text-red-500 transition-colors"
                    >
                      移除
                    </button>
                  </div>
                  <AutoTaskQuery
                    apiKey={apiKey}
                    taskId={task.id}
                    onResultsUpdate={(imageUrls) => updateTaskResults(task.id, imageUrls)}
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

