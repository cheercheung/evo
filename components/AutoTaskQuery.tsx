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
  const [downloadError, setDownloadError] = useState<string | null>(null);
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

  const fetchWithRetry = async (url: string, attempts = 5, baseDelay = 500) => {
    let lastError: any;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
      } catch (err) {
        lastError = err;
        if (i < attempts - 1) {
          const backoff = baseDelay * Math.pow(2, i) + Math.random() * 100;
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }
    throw lastError;
  };

  // 自动下载图片到本地
  const downloadImage = async (url: string, index: number, manageState = true) => {
    try {
      setDownloadError(null);
      if (manageState) setDownloading(true);
      const response = await fetchWithRetry(url);
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
      setDownloadError("下载失败，请稍后重试或直接打开图片链接。");
      // 作为兜底，尝试直接打开链接
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      if (manageState) setDownloading(false);
    }
  };

  // 下载所有图片
  const downloadAllImages = async () => {
    if (!taskData?.results) return;
    
    setDownloading(true);
    for (let i = 0; i < taskData.results.length; i++) {
      try {
        await downloadImage(taskData.results[i], i, false);
      } catch (err) {
        console.error("批量下载单张失败:", err);
        setDownloadError("部分图片下载失败，已尝试重试。可点击单张按钮或直接打开链接。");
      }
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
            className={`px-3 py-1 text-sm rounded-full border ${
              taskData.status === "completed"
                ? "bg-green-50 border-green-200 text-green-700"
                : taskData.status === "failed"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-yellow-50 border-yellow-200 text-yellow-700"
            }`}
          >
            {taskData.status} ({taskData.progress}%)
          </span>
        </div>

        {taskData.results && taskData.results.length > 0 && (
          <button
            onClick={downloadAllImages}
            disabled={downloading}
            className="px-4 py-2 text-sm rounded-full border border-black/10 bg-white text-black shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:border-black disabled:border-black/10 disabled:text-black/30 disabled:shadow-none transition-colors"
          >
            {downloading ? "下载中..." : `下载全部 (${taskData.results.length})`}
          </button>
        )}
      </div>

      {downloadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {downloadError}
        </div>
      )}

      {/* Results */}
      {taskData.results && taskData.results.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {taskData.results.map((url, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <img
                src={url}
                alt={`Generated ${idx + 1}`}
                className="w-full rounded-lg border border-black/10 shadow-sm"
              />
              <button
                onClick={() => downloadImage(url, idx)}
                disabled={downloading}
                className="px-3 py-2 text-sm rounded-full border border-black/10 bg-white text-black shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:border-black disabled:border-black/10 disabled:text-black/40 disabled:shadow-none transition-colors"
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
