// Evolink API Types based on doc.md and query.md

export const MODELS = ["nano-banana-2-lite", "gemini-3-pro-image-preview"] as const;
export const SIZES = ["auto", "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"] as const;
export const QUALITIES = ["1K", "2K", "4K"] as const;
export const TASK_STATUSES = ["pending", "processing", "completed", "failed"] as const;

// Z-Image specific constants
export const Z_IMAGE_MODELS = ["z-image-turbo"] as const;
export const Z_IMAGE_SIZES = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "1:2", "2:1"] as const;

export type Model = typeof MODELS[number];
export type Size = typeof SIZES[number];
export type Quality = typeof QUALITIES[number];
export type TaskStatus = typeof TASK_STATUSES[number];
export type ZImageModel = typeof Z_IMAGE_MODELS[number];
export type ZImageSize = typeof Z_IMAGE_SIZES[number];

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

