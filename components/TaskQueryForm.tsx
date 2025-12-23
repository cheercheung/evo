"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from "react";
import type { TaskQueryResponse } from "@/types/evolink";

interface TaskQueryFormProps {
  initialTaskId?: string;
  onSubmit: (taskId: string) => void;
  loading: boolean;
  error: string | null;
  result: TaskQueryResponse | null;
}

export default function TaskQueryForm({
  initialTaskId = "",
  onSubmit,
  loading,
  error,
  result,
}: TaskQueryFormProps) {
  const [taskId, setTaskId] = useState(initialTaskId);

  // Update taskId when initialTaskId changes
  useEffect(() => {
    if (initialTaskId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTaskId(initialTaskId);
    }
  }, [initialTaskId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskId.trim()) {
      onSubmit(taskId.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-700 rounded-lg p-4 flex flex-col gap-3 bg-slate-900/50"
    >
      <h2 className="text-lg font-semibold text-gray-100">
        2. 查询任务状态
        <span className="ml-2 text-xs font-normal text-gray-400">
          GET /v1/tasks/{"{task_id}"}
        </span>
      </h2>

      {/* Task ID Input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">任务 ID *</label>
        <input
          type="text"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          placeholder="task-unified-..."
          required
          className="px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !taskId.trim()}
        className="px-4 py-2 rounded-md border-none bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "查询中..." : "查询任务"}
      </button>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-800 rounded px-3 py-2">
          错误：{error}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-gray-300">查询结果：</div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">状态：</span>
            <span
              className={`text-xs px-2 py-1 rounded ${
                result.status === "completed"
                  ? "bg-green-900/50 text-green-300 border border-green-700"
                  : result.status === "failed"
                  ? "bg-red-900/50 text-red-300 border border-red-700"
                  : result.status === "processing"
                  ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                  : "bg-gray-800 text-gray-300 border border-gray-600"
              }`}
            >
              {result.status} ({result.progress}%)
            </span>
          </div>

          {/* Results Images */}
          {result.results && result.results.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-xs text-gray-400">生成的图片：</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.results.map((url, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline break-all"
                    >
                      图片 {idx + 1}
                    </a>
                    <img
                      src={url}
                      alt={`Generated ${idx + 1}`}
                      className="w-full rounded border border-gray-700"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full JSON Response */}
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-400 hover:text-gray-300 mb-2">
              查看完整 JSON 响应
            </summary>
            <pre className="max-h-80 overflow-auto bg-slate-950 border border-gray-800 rounded p-3 text-[10px] text-gray-300">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </form>
  );
}
