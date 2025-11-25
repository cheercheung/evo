import type {
  ImageGenerationRequest,
  ImageGenerationResponse,
  TaskQueryResponse,
  ErrorResponse,
  FileUploadResponse,
} from "@/types/evolink";

const API_BASE_URL = "https://api.evolink.ai";
const FILES_API_BASE_URL = "https://files-api.evolink.ai";

export class EvolinkClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ErrorResponse;
      throw new Error(
        error.error?.message || `API Error: ${response.status}`
      );
    }

    return data as T;
  }

  /**
   * Create an image generation task
   * POST /v1/images/generations
   */
  async createImageGeneration(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    // Filter out empty image URLs
    const cleanedRequest = {
      ...request,
      image_urls: request.image_urls?.filter(Boolean),
    };

    // Remove undefined fields
    Object.keys(cleanedRequest).forEach((key) => {
      if (
        cleanedRequest[key as keyof typeof cleanedRequest] === undefined ||
        (Array.isArray(cleanedRequest[key as keyof typeof cleanedRequest]) &&
          (cleanedRequest[key as keyof typeof cleanedRequest] as any[])
            .length === 0)
      ) {
        delete cleanedRequest[key as keyof typeof cleanedRequest];
      }
    });

    console.log("发送到 API 的请求数据:", cleanedRequest);

    return this.request<ImageGenerationResponse>("/v1/images/generations", {
      method: "POST",
      body: JSON.stringify(cleanedRequest),
    });
  }

  /**
   * Query task status by task ID
   * GET /v1/tasks/{task_id}
   */
  async queryTask(taskId: string): Promise<TaskQueryResponse> {
    return this.request<TaskQueryResponse>(`/v1/tasks/${taskId}`, {
      method: "GET",
    });
  }

  /**
   * Upload a file (image)
   * POST /api/v1/files/upload/stream
   */
  async uploadFile(
    file: File,
    options?: {
      uploadPath?: string;
      fileName?: string;
    }
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    if (options?.uploadPath) {
      formData.append("upload_path", options.uploadPath);
    }

    if (options?.fileName) {
      formData.append("file_name", options.fileName);
    }

    const url = `${FILES_API_BASE_URL}/api/v1/files/upload/stream`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.msg || `Upload failed: ${response.status}`);
    }

    return data as FileUploadResponse;
  }
}

