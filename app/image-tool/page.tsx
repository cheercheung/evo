"use client";

import React, { useState } from "react";
import { EvolinkClient } from "@/lib/evolink-client";
import SimpleImageGenerationForm from "@/components/SimpleImageGenerationForm";
import AutoTaskQuery from "@/components/AutoTaskQuery";

interface Task {
  id: string;
  createdAt: number;
  prompt: string;
}

export default function ImageToolPage() {
  const apiKey = process.env.NEXT_PUBLIC_EVOLINK_API_KEY || "";
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleGenerate = async (data: {
    model: any;
    prompt: string;
    size: any;
    quality: any;
    imageFiles: File[];
  }) => {
    if (!apiKey) {
      setGenError("请先在 .env.local 中设置 API Key");
      return;
    }

    setGenError(null);
    setGenLoading(true);

    try {
      const client = new EvolinkClient(apiKey);

      // 先上传所有图片
      const imageUrls: string[] = [];
      for (const file of data.imageFiles) {
        const uploadResponse = await client.uploadFile(file, {
          uploadPath: "image-generation",
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
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold">图片生成</h1>
          <p className="text-sm text-gray-500">
            使用 AI 生成高质量图片 · 支持多任务并行
          </p>
        </div>

        {/* Generation Form */}
        <SimpleImageGenerationForm
          apiKey={apiKey}
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
              <button
                onClick={() => setTasks([])}
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

                  <AutoTaskQuery apiKey={apiKey} taskId={task.id} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

