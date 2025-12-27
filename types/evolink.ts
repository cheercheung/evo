// Evolink API Types based on doc.md and query.md

export const MODELS = ["nano-banana-2-lite", "gemini-3-pro-image-preview", "doubao-seedream-4.5"] as const;
export const SIZES = ["auto", "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"] as const;
export const QUALITIES = ["1K", "2K", "4K"] as const;
export const TASK_STATUSES = ["pending", "processing", "completed", "failed"] as const;

// Seedream 4.5 specific sizes (pixel format)
export const SEEDREAM_SIZES = [
  "2K",           // Simplified format
  "4K",           // Simplified format
  "2048x2048",    // 1:1 Square
  "2560x1440",    // 16:9 Landscape
  "1440x2560",    // 9:16 Portrait
  "2048x3072",    // 2:3 Portrait
  "3072x2048",    // 3:2 Landscape
  "2048x2730",    // 3:4 Portrait
  "2730x2048",    // 4:3 Landscape
  "4096x4096",    // 1:1 Square (4K)
  "4096x2304",    // 16:9 Landscape (4K)
  "2304x4096",    // 9:16 Portrait (4K)
] as const;

// Z-Image specific constants
export const Z_IMAGE_MODELS = ["z-image-turbo"] as const;
export const Z_IMAGE_SIZES = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "1:2", "2:1"] as const;

// Video Generation constants
export const VIDEO_MODELS = ["wan2.6-text-to-video", "wan2.6-image-to-video", "kling-o1-image-to-video"] as const;
export const VIDEO_ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;
export const VIDEO_QUALITIES = ["720p", "1080p"] as const;
export const VIDEO_DURATIONS = [5, 10, 15] as const;
export const VIDEO_SHOT_TYPES = ["single", "multi"] as const;

export type Model = typeof MODELS[number];
export type Size = typeof SIZES[number];
export type Quality = typeof QUALITIES[number];
export type TaskStatus = typeof TASK_STATUSES[number];
export type ZImageModel = typeof Z_IMAGE_MODELS[number];
export type ZImageSize = typeof Z_IMAGE_SIZES[number];
export type SeedreamSize = typeof SEEDREAM_SIZES[number];

// WAN2.6 Video Types
export type VideoModel = typeof VIDEO_MODELS[number];
export type VideoAspectRatio = typeof VIDEO_ASPECT_RATIOS[number];
export type VideoQuality = typeof VIDEO_QUALITIES[number];
export type VideoDuration = typeof VIDEO_DURATIONS[number];
export type VideoShotType = typeof VIDEO_SHOT_TYPES[number];

// Image Generation Request (POST /v1/images/generations)
export interface ImageGenerationRequest {
  model: Model;
  prompt: string;
  size?: Size;
  quality?: Quality;
  image_urls?: string[];
  callback_url?: string;
}

// Z-Image Generation Request (POST /v1/images/generations)
export interface ZImageGenerationRequest {
  model: ZImageModel;
  prompt: string;
  size?: ZImageSize;
  seed?: number;
  nsfw_check?: boolean;
  callback_url?: string;
}

// WAN2.6 Video Generation Request (POST /v1/videos/generations)
export interface VideoGenerationRequest {
  model: VideoModel;
  prompt: string;
  aspect_ratio?: VideoAspectRatio; // 仅 text-to-video 支持
  quality?: VideoQuality;
  duration?: VideoDuration;
  prompt_extend?: boolean;
  model_params?: {
    shot_type?: VideoShotType;
  };
  image_urls?: string[]; // 仅 image-to-video 需要，最多1张
  callback_url?: string;
}

// Video Generation Response
export interface VideoGenerationResponse {
  created: number;
  id: string;
  model: string;
  object: "video.generation.task";
  progress: number;
  status: TaskStatus;
  task_info: VideoTaskInfo;
  type: "video";
  usage: Usage;
}

// Video Task Info
export interface VideoTaskInfo {
  can_cancel: boolean;
  estimated_time?: number;
}

// Task Info
export interface TaskInfo {
  can_cancel: boolean;
  estimated_time?: number;
}

// Usage Info
export interface Usage {
  billing_rule: "per_call" | "per_token" | "per_second";
  credits_reserved: number;
  user_group: "default" | "vip";
}

// Image Generation Response
export interface ImageGenerationResponse {
  created: number;
  id: string;
  model: string;
  object: "image.generation.task";
  progress: number;
  status: TaskStatus;
  task_info: TaskInfo;
  type: "text" | "image" | "audio" | "video";
  usage: Usage;
}

// Task Query Response (GET /v1/tasks/{task_id})
export interface TaskQueryResponse {
  created: number;
  id: string;
  model: string;
  object: "image.generation.task" | "video.generation.task" | "audio.generation.task";
  progress: number;
  results?: string[];
  status: TaskStatus;
  task_info: {
    can_cancel: boolean;
  };
  type: "image" | "video" | "audio" | "text";
}

// Error Response
export interface ErrorResponse {
  error: {
    code: number;
    message: string;
    type: string;
    param?: string;
    fallback_suggestion?: string;
  };
}

// File Upload Types
export interface FileUploadResponse {
  success: boolean;
  code: number;
  msg: string;
  data: FileData;
}

export interface FileData {
  file_id: string;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  upload_path: string;
  file_url: string;
  download_url: string;
  upload_time: string;
  expires_at: string;
}

