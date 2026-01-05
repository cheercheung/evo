"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from "react";

interface ReferencePhotoSelectorProps {
  selectedPhotos: string[];
  onSelectionChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export default function ReferencePhotoSelector({
  selectedPhotos,
  onSelectionChange,
  maxPhotos = 10,
}: ReferencePhotoSelectorProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true); // 默认展开

  useEffect(() => {
    fetch("/api/reference-photos")
      .then((res) => res.json())
      .then((data) => {
        setPhotos(data.photos || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const togglePhoto = (photo: string) => {
    if (selectedPhotos.includes(photo)) {
      onSelectionChange(selectedPhotos.filter((p) => p !== photo));
    } else if (selectedPhotos.length < maxPhotos) {
      onSelectionChange([...selectedPhotos, photo]);
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  if (loading) {
    return (
      <div className="text-sm text-black/50 py-2">加载预设图片中...</div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-sm text-black/50 py-2">
        暂无预设图片（请将图片放入 public/referrence photo/cheer 文件夹）
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-black/70 hover:text-black"
        >
          <span>{isExpanded ? "▼" : "▶"}</span>
          <span>预设参考图片 ({photos.length} 张可用)</span>
        </button>
        {selectedPhotos.length > 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="text-red-500 hover:text-red-600 text-xs"
          >
            清除选择 ({selectedPhotos.length})
          </button>
        )}
      </div>

      {/* Photo Grid */}
      {isExpanded && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-black/10">
          {photos.map((photo) => {
            const isSelected = selectedPhotos.includes(photo);
            const isDisabled = !isSelected && selectedPhotos.length >= maxPhotos;

            return (
              <button
                key={photo}
                type="button"
                onClick={() => !isDisabled && togglePhoto(photo)}
                disabled={isDisabled}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected
                    ? "border-black ring-2 ring-black/20"
                    : isDisabled
                    ? "border-transparent opacity-40 cursor-not-allowed"
                    : "border-transparent hover:border-black/30"
                }`}
              >
                <img
                  src={photo}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-lg">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Photos Preview */}
      {selectedPhotos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-black/50 self-center">已选：</span>
          {selectedPhotos.map((photo) => (
            <div
              key={photo}
              className="relative w-10 h-10 rounded-lg overflow-hidden border border-black/20"
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => togglePhoto(photo)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

