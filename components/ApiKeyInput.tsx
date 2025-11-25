"use client";

import React from "react";

interface ApiKeyInputProps {
  apiKey: string;
  onChange: (value: string) => void;
}

export default function ApiKeyInput({ apiKey, onChange }: ApiKeyInputProps) {
  const hasEnvKey = !!process.env.NEXT_PUBLIC_EVOLINK_API_KEY;

  // 如果已经从环境变量加载了，就只显示一个提示，不显示输入框
  if (hasEnvKey) {
    return (
      <div className="text-xs text-green-400 bg-green-950/30 border border-green-800 rounded px-3 py-2">
        ✓ API Key 已从 <code className="bg-green-900/50 px-1 rounded">.env.local</code> 加载
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">
        API Key（Bearer Token）
        <span className="ml-2 text-[10px] text-gray-500">
          从{" "}
          <a
            href="https://evolink.ai/dashboard/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            API Key 管理页面
          </a>{" "}
          获取
        </span>
      </label>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => onChange(e.target.value)}
        placeholder="sk-..."
        className="px-3 py-2 rounded-md border border-gray-700 bg-slate-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-[10px] text-yellow-400 bg-yellow-950/30 border border-yellow-800/50 rounded px-2 py-1">
        💡 提示：你可以在项目根目录的 <code className="bg-gray-800 px-1 rounded">.env.local</code> 文件中设置{" "}
        <code className="bg-gray-800 px-1 rounded">NEXT_PUBLIC_EVOLINK_API_KEY</code>，这样就不用每次手动输入了
      </p>
    </div>
  );
}

