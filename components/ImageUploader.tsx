"use client";

import React, { useState, useRef } from "react";
import { EvolinkClient } from "@/lib/evolink-client";
import type { FileData } from "@/types/evolink";

interface ImageUploaderProps {
  apiKey: string;
  onUploadSuccess: (fileUrl: string) => void;
}

export default function ImageUploader({
  apiKey,
  onUploadSuccess,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("只支持 JPEG, PNG, GIF, WebP 格式的图片");
      return;
    }

    if (!apiKey) {
      setError("请先设置 API Key");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const client = new EvolinkClient(apiKey);
      console.log("开始上传文件:", file.name);

      const response = await client.uploadFile(file, {
        uploadPath: "image-generation",
        authToken: process.env.NEXT_PUBLIC_UPLOAD_AUTH_TOKEN,
      });

      console.log("文件上传成功:", response.data);

      setUploadedFiles((prev) => [...prev, response.data]);
      onUploadSuccess(response.data.file_url);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("文件上传失败:", err);
      setError(err.message || "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (fileId: string, fileUrl: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file_id !== fileId));
    // Note: We don't actually delete from server, just remove from UI
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="image-upload-input"
        />
        <label
          htmlFor="image-upload-input"
          className={`px-3 py-2 text-xs rounded-md border cursor-pointer transition-colors ${
            uploading
              ? "border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed"
              : "border-blue-600 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20"
          }`}
        >
          {uploading ? "上传中..." : "📁 选择图片上传"}
        </label>
        <span className="text-[10px] text-gray-500">
          支持 JPEG, PNG, GIF, WebP（72小时有效期）
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-800 rounded px-3 py-2">
          错误：{error}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-400">已上传的图片：</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.file_id}
                className="flex items-start gap-2 p-2 bg-slate-900/50 border border-gray-700 rounded"
              >
                <img
                  src={file.file_url}
                  alt={file.original_name}
                  className="w-16 h-16 object-cover rounded border border-gray-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 truncate">
                    {file.original_name}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {(file.file_size / 1024).toFixed(1)} KB
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {file.file_url}
                  </div>
                  <div className="text-[10px] text-yellow-400">
                    过期时间：{new Date(file.expires_at).toLocaleString("zh-CN")}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(file.file_id, file.file_url)}
                  className="text-xs text-red-400 hover:text-red-300"
                  title="从列表移除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
