"use client";

import React from "react";

interface TaskCardProps {
  id: string;
  createdAt: number;
  title?: string;
  subtitle?: string;
  onRemove?: (id: string) => void;
  children: React.ReactNode;
}

export function TaskCard({
  id,
  createdAt,
  title,
  subtitle,
  onRemove,
  children,
}: TaskCardProps) {
  return (
    <div className="border border-gray-800 p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 flex flex-col gap-1">
          <div className="text-xs text-gray-500">
            {new Date(createdAt).toLocaleString("zh-CN")}
          </div>
          {title && <div className="text-sm text-gray-300 break-words">{title}</div>}
          {subtitle && (
            <div className="text-xs text-gray-500 break-words">{subtitle}</div>
          )}
          <div className="text-xs text-gray-600 font-mono break-all">ID: {id}</div>
        </div>
        {onRemove && (
          <button
            onClick={() => onRemove(id)}
            className="text-xs px-3 py-1 border border-gray-700 hover:border-red-500 hover:text-red-500 transition-colors"
          >
            移除
          </button>
        )}
      </div>

      {children}
    </div>
  );
}
