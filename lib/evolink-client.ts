import { loadPublicConfig } from "@/lib/config";
import { httpRequest, sanitizePayload } from "@/lib/http";
import type {
  FileUploadResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  TaskQueryResponse,
  VideoGenerationRequest,
  VideoGenerationResponse,
  ZImageGenerationRequest,
} from "@/types/evolink";

interface ClientOptions {
  useProxy?: boolean;
}

export class EvolinkClient {
  private apiKey: string;
  private uploadAuthToken?: string;
  private readonly config = loadPublicConfig();
  private readonly useProxy: boolean;

  constructor(apiKey?: string, uploadAuthToken?: string, options?: ClientOptions) {
    this.apiKey = apiKey || this.config.apiKey || "";
    this.uploadAuthToken = uploadAuthToken || this.config.uploadAuthToken;
    this.useProxy = options?.useProxy ?? this.config.useProxy;
  }

  private requireApiKey(): string {
    if (!this.apiKey) {
      throw new Error("缺少 API Key，请在 .env.local 配置 NEXT_PUBLIC_EVOLINK_API_KEY 或传入构造函数");
    }
    return this.apiKey;
  }

  private getJsonHeaders() {
    return { "Content-Type": "application/json" };
  }

  private apiPath(path: string): { baseUrl: string; path: string; apiKey?: string } {
    if (this.useProxy) {
      return { baseUrl: "", path };
    }
    return {
      baseUrl: this.config.apiBaseUrl,
      path,
      apiKey: this.requireApiKey(),
    };
  }

  /**
   * Create an image generation task
   * POST /v1/images/generations
   */
  async createImageGeneration(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const payload = sanitizePayload({
      ...request,
      image_urls: request.image_urls?.filter(Boolean),
    });

    const target = this.apiPath("/v1/images/generations");
    const path = this.useProxy ? "/api/generate" : target.path;

    return httpRequest<ImageGenerationResponse>(path, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: this.getJsonHeaders(),
      baseUrl: target.baseUrl,
      apiKey: target.apiKey,
    });
  }

  /**
   * Create a Z-Image generation task
   * POST /v1/images/generations
   */
  async createZImageGeneration(
    request: ZImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const payload = sanitizePayload(request);
    const target = this.apiPath("/v1/images/generations");
    const path = this.useProxy ? "/api/generate" : target.path;

    return httpRequest<ImageGenerationResponse>(path, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: this.getJsonHeaders(),
      baseUrl: target.baseUrl,
      apiKey: target.apiKey,
    });
  }

  /**
   * Query task status by task ID
   * GET /v1/tasks/{task_id}
   */
  async queryTask(taskId: string): Promise<TaskQueryResponse> {
    const target = this.apiPath(`/v1/tasks/${taskId}`);
    const path = this.useProxy ? `/api/query/${taskId}` : target.path;

    return httpRequest<TaskQueryResponse>(path, {
      method: "GET",
      baseUrl: target.baseUrl,
      apiKey: target.apiKey,
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
      authToken?: string;
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

    const uploadToken = options?.authToken || this.uploadAuthToken;
    if (!uploadToken) {
      throw new Error(
        "缺少上传鉴权 token，请设置 NEXT_PUBLIC_UPLOAD_AUTH_TOKEN 或在调用时传入 authToken"
      );
    }

    return httpRequest<FileUploadResponse>(
      "/api/v1/files/upload/stream",
      {
        method: "POST",
        body: formData,
        baseUrl: this.config.filesApiBaseUrl,
        apiKey: uploadToken,
        json: false,
      }
    );
  }

  /**
   * Create a video generation task (WAN2.6)
   * POST /v1/videos/generations
   */
  async createVideoGeneration(
    request: VideoGenerationRequest
  ): Promise<VideoGenerationResponse> {
    const payload = sanitizePayload(request);
    const target = this.apiPath("/v1/videos/generations");
    const path = this.useProxy ? "/api/video" : target.path;

    return httpRequest<VideoGenerationResponse>(path, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: this.getJsonHeaders(),
      baseUrl: target.baseUrl,
      apiKey: target.apiKey,
    });
  }
}
