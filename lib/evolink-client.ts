import type {
  ImageGenerationRequest,
  ImageGenerationResponse,
  TaskQueryResponse,
  ErrorResponse,
  FileUploadResponse,
  ZImageGenerationRequest,
} from "@/types/evolink";

const API_BASE_URL = "https://api.evolink.ai";
const FILES_API_BASE_URL = "https://files-api.evolink.ai";

// 使用代理模式避免 CORS 问题
const USE_PROXY = typeof window !== "undefined"; // 只在浏览器端使用代理

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

    console.log("🌐 API 请求:", {
      url,
      method: options.method || "GET",
      headers: {
        ...headers,
        Authorization: `Bearer ${this.apiKey.substring(0, 10)}...`,
      },
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log("📡 API 响应状态:", response.status, response.statusText);

      let data;
      try {
        data = await response.json();
        console.log("📦 API 响应数据:", data);
      } catch (parseError) {
        console.error("❌ JSON 解析失败:", parseError);
        throw new Error("Invalid JSON response from API");
      }

      if (!response.ok) {
        const error = data as ErrorResponse;
        const errorMessage =
          error.error?.message || `API Error: ${response.status}`;
        console.error("❌ API 错误:", errorMessage, data);
        throw new Error(errorMessage);
      }

      return data as T;
    } catch (error: any) {
      console.error("❌ 请求失败:", error);
      if (error.message === "Failed to fetch") {
        throw new Error(
          "网络请求失败，可能是 CORS 问题或网络连接问题。请检查：\n1. API Key 是否正确\n2. 网络连接是否正常\n3. 浏览器控制台是否有 CORS 错误"
        );
      }
      throw error;
    }
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

    // 使用代理避免 CORS
    if (USE_PROXY) {
      console.log("🔄 使用代理模式");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedRequest),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || `API Error: ${response.status}`
        );
      }

      return data as ImageGenerationResponse;
    }

    return this.request<ImageGenerationResponse>("/v1/images/generations", {
      method: "POST",
      body: JSON.stringify(cleanedRequest),
    });
  }

  /**
   * Create a Z-Image generation task
   * POST /v1/images/generations
   */
  async createZImageGeneration(
    request: ZImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    // Remove undefined fields
    const cleanedRequest = { ...request };
    Object.keys(cleanedRequest).forEach((key) => {
      if (cleanedRequest[key as keyof typeof cleanedRequest] === undefined) {
        delete cleanedRequest[key as keyof typeof cleanedRequest];
      }
    });

    console.log("发送到 Z-Image API 的请求数据:", cleanedRequest);

    // 使用代理避免 CORS
    if (USE_PROXY) {
      console.log("🔄 使用代理模式");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedRequest),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || `API Error: ${response.status}`
        );
      }

      return data as ImageGenerationResponse;
    }

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
    // 使用代理避免 CORS
    if (USE_PROXY) {
      console.log("🔄 使用代理查询任务:", taskId);
      const response = await fetch(`/api/query/${taskId}`, {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || `API Error: ${response.status}`
        );
      }

      return data as TaskQueryResponse;
    }

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

    console.log("📤 上传文件:", {
      url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      console.log("📡 上传响应状态:", response.status, response.statusText);

      const data = await response.json();
      console.log("📦 上传响应数据:", data);

      if (!response.ok || !data.success) {
        const errorMessage = data.msg || `Upload failed: ${response.status}`;
        console.error("❌ 上传失败:", errorMessage);
        throw new Error(errorMessage);
      }

      return data as FileUploadResponse;
    } catch (error: any) {
      console.error("❌ 上传请求失败:", error);
      if (error.message === "Failed to fetch") {
        throw new Error(
          "文件上传失败，可能是网络问题或 CORS 限制"
        );
      }
      throw error;
    }
  }
}

