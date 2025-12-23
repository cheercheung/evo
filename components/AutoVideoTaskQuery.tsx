"use client";

import React, { useEffect, useRef, useState } from "react";
import type { TaskQueryResponse } from "@/types/evolink";
import { useTaskPolling } from "@/lib/hooks/useTaskPolling";

interface AutoVideoTaskQueryProps {
  apiKey: string;
  taskId: string;
  onComplete?: () => void;
  onResultsUpdate?: (videoUrls: string[]) => void;
}

export default function AutoVideoTaskQuery({
  apiKey,
  taskId,
  onComplete,
  onResultsUpdate,
}: AutoVideoTaskQueryProps) {
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

  const downloadVideo = async (url: string, index: number) => {
    try {
      setDownloading(true);
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `generated-video-${taskId}-${index + 1}.mp4`;
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
        <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
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
                : "bg-purple-900/20 border-purple-900 text-purple-400"
            }`}
          >
            {taskData.status === "pending" && "等待中"}
            {taskData.status === "processing" && "生成中"}
            {taskData.status === "completed" && "已完成"}
            {taskData.status === "failed" && "失败"}
            {" "}({taskData.progress}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {(taskData.status === "pending" || taskData.status === "processing") && (
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${taskData.progress}%` }}
          ></div>
        </div>
      )}

      {/* Results */}
      {taskData.results && taskData.results.length > 0 && (
        <div className="flex flex-col gap-4">
          {taskData.results.map((url, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <video
                src={url}
                controls
                className="w-full max-w-2xl border border-gray-700 rounded"
              />
              <button
                onClick={() => downloadVideo(url, idx)}
                disabled={downloading}
                className="px-4 py-2 bg-purple-600 text-white text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors rounded w-fit"
              >
                {downloading ? "下载中..." : `下载视频 ${idx + 1}`}
              </button>
              <p className="text-xs text-gray-500">
                ⚠️ 视频链接 24 小时内有效，请及时保存
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
