"use client";

import React, { useState } from "react";
import { EvolinkClient } from "@/lib/evolink-client";
import type { TaskQueryResponse } from "@/types/evolink";
import ApiKeyInput from "@/components/ApiKeyInput";
import ImageGenerationForm from "@/components/ImageGenerationForm";
import TaskQueryForm from "@/components/TaskQueryForm";

export default function ImageToolPage() {
  const [apiKey, setApiKey] = useState(
    process.env.NEXT_PUBLIC_EVOLINK_API_KEY || ""
  );
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [taskResult, setTaskResult] = useState<TaskQueryResponse | null>(null);

  const handleGenerate = async (data: {
    model: any;
    prompt: string;
    size: any;
    quality: any;
    imageUrls: string[];
    callbackUrl: string;
  }) => {
    if (!apiKey) {
      setGenError("请先输入 API Key");
      return;
    }

    setGenError(null);
    setGenLoading(true);
    setTaskId("");

    try {
      const client = new EvolinkClient(apiKey);
      const response = await client.createImageGeneration({
        model: data.model,
        prompt: data.prompt,
        size: data.size,
        quality: data.quality,
        image_urls: data.imageUrls.filter(Boolean),
        callback_url: data.callbackUrl || undefined,
      });

      setTaskId(response.id);
    } catch (err: any) {
      setGenError(err.message || "请求失败");
    } finally {
      setGenLoading(false);
    }
  };

  const handleQuery = async (queryTaskId: string) => {
    if (!apiKey) {
      setQueryError("请先输入 API Key");
      return;
    }

    setQueryError(null);
    setQueryLoading(true);
    setTaskResult(null);

    try {
      const client = new EvolinkClient(apiKey);
      const response = await client.queryTask(queryTaskId);
      setTaskResult(response);
    } catch (err: any) {
      setQueryError(err.message || "请求失败");
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-slate-950">
      <section className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-100">
            Nano Banana 2 图片生成 & 任务查询
          </h1>
          <p className="text-xs text-gray-400">
            先调用 /v1/images/generations 创建异步任务，再用 /v1/tasks/{"{task_id}"}{" "}
            查询状态与结果。
          </p>
        </div>

        {/* API Key Input */}
        <ApiKeyInput apiKey={apiKey} onChange={setApiKey} />

        {/* Image Generation Form */}
        <ImageGenerationForm
          apiKey={apiKey}
          onSubmit={handleGenerate}
          loading={genLoading}
          error={genError}
          taskId={taskId}
        />

        {/* Task Query Form */}
        <TaskQueryForm
          initialTaskId={taskId}
          onSubmit={handleQuery}
          loading={queryLoading}
          error={queryError}
          result={taskResult}
        />
      </section>
    </main>
  );
}

