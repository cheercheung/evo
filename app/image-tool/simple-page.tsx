"use client";

import React, { useState } from "react";
import { useEnvConfig } from "@/lib/hooks/useEnvConfig";
import { useEvolinkClient } from "@/lib/hooks/useEvolinkClient";
import SimpleImageGenerationForm from "@/components/SimpleImageGenerationForm";
import AutoTaskQuery from "@/components/AutoTaskQuery";

export default function SimpleImageToolPage() {
  const { apiKey, uploadAuthToken } = useEnvConfig();
  const effectiveApiKey = apiKey ?? "";
  const effectiveUploadToken = uploadAuthToken;
  const client = useEvolinkClient();
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState("");

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
    setTaskId("");

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
      // Seedream 模型不支持 quality 参数，只使用 size
      const isSeedream = data.model === "doubao-seedream-4.5";
      const response = await client.createImageGeneration({
        model: data.model,
        prompt: data.prompt,
        size: data.size,
        quality: isSeedream ? undefined : data.quality,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      setTaskId(response.id);
    } catch (err: any) {
      setGenError(err.message || "请求失败");
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold">图片生成</h1>
          <p className="text-sm text-gray-500">
            使用 AI 生成高质量图片
          </p>
        </div>

        {/* Generation Form */}
        <SimpleImageGenerationForm
          apiKey={effectiveApiKey}
          onSubmit={handleGenerate}
          loading={genLoading}
          error={genError}
          taskId={taskId}
        />

        {/* Auto Query Results */}
        {taskId && (
          <div className="flex flex-col gap-4 border-t border-gray-800 pt-8">
            <h2 className="text-xl font-bold">生成结果</h2>
            <AutoTaskQuery apiKey={effectiveApiKey} taskId={taskId} />
          </div>
        )}
      </div>
    </main>
  );
}
