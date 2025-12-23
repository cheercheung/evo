"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useRef, useState } from "react";
import type { TaskQueryResponse } from "@/types/evolink";
import { useTaskPolling } from "@/lib/hooks/useTaskPolling";

interface AutoTaskQueryProps {
  apiKey: string;
  taskId: string;
  onComplete?: () => void;
  onResultsUpdate?: (imageUrls: string[]) => void;
}

export default function AutoTaskQuery({
  apiKey,
  taskId,
  onComplete,
  onResultsUpdate,
}: AutoTaskQueryProps) {
  const [downloading, setDownloading] = useState(false);
  const onResultsUpdateRef = useRef(onResultsUpdate);

  useEffect(() => {
    onResultsUpdateRef.current = onResultsUpdate;
  }, [onResultsUpdate]);

  const { data: taskData, error, loading } = useTaskPolling(apiKey, taskId, {
    intervalMs: 5000,
    onComplete: (res) => {
      if (res.status === "completed") {
        onComplete?.();
      }
    },
  });

  useEffect(() => {
    if (taskData?.results?.length) {
      onResultsUpdateRef.current?.(taskData.results);
    }
  }, [taskData?.results?.join("|")]);

  // 自动下载图片到本地
  const downloadImage = async (url: string, index: number) => {
    try {
      setDownloading(true);
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `generated-image-${taskId}-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("下载失败:", err);
    } finally {
      setDownloading(false);
    }
  };

  // 下载所有图片
  const downloadAllImages = async () => {
    if (!taskData?.results) return;
    
    setDownloading(true);
    for (let i = 0; i < taskData.results.length; i++) {
      await downloadImage(taskData.results[i], i);
      // 延迟一下，避免同时下载太多
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    setDownloading(false);
  };

  if (!taskId) return null;

  if (error) {
    return (
      <div className="px-4 py-3 bg-red-900/20 border border-red-900 text-red-400 text-sm">
        查询错误：{error}
      </div>
    );
  }

  if (!taskData || loading) {
    return (
      <div className="flex items-center gap-2 text-white">
        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
        <span>查询任务状态...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">状态：</span>
          <span
            className={`px-3 py-1 text-sm border ${
              taskData.status === "completed"
                ? "bg-green-900/20 border-green-900 text-green-400"
                : taskData.status === "failed"
                ? "bg-red-900/20 border-red-900 text-red-400"
                : "bg-yellow-900/20 border-yellow-900 text-yellow-400"
            }`}
          >
            {taskData.status} ({taskData.progress}%)
          </span>
        </div>

        {taskData.results && taskData.results.length > 0 && (
          <button
            onClick={downloadAllImages}
            disabled={downloading}
            className="px-4 py-2 bg-white text-black text-sm hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 transition-colors"
          >
            {downloading ? "下载中..." : `下载全部 (${taskData.results.length})`}
          </button>
        )}
      </div>

      {/* Results */}
      {taskData.results && taskData.results.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {taskData.results.map((url, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <img
                src={url}
                alt={`Generated ${idx + 1}`}
                className="w-full border border-gray-700"
              />
              <button
                onClick={() => downloadImage(url, idx)}
                disabled={downloading}
                className="px-3 py-2 bg-black text-white text-sm border border-gray-700 hover:border-white disabled:opacity-50 transition-colors"
              >
                下载图片 {idx + 1}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
