import type {
  ImageGenerationRequest,
  ImageGenerationResponse,
  TaskQueryResponse,
  ErrorResponse,
} from "@/types/evolink";

const API_BASE_URL = "https://api.evolink.ai";

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
}

