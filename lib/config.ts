export interface PublicConfig {
  apiBaseUrl: string;
  filesApiBaseUrl: string;
  apiKey?: string;
  uploadAuthToken?: string;
  useProxy: boolean;
}

/**
 * Load public-facing configuration from environment variables with sane defaults.
 * This stays in one place so client components don't reach for process.env scattered everywhere.
 */
export function loadPublicConfig(): PublicConfig {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_EVOLINK_API_BASE_URL ||
    "https://api.evolink.ai";
  const filesApiBaseUrl =
    process.env.NEXT_PUBLIC_EVOLINK_FILES_API_BASE_URL ||
    "https://files-api.evolink.ai";

  return {
    apiBaseUrl,
    filesApiBaseUrl,
    apiKey: process.env.NEXT_PUBLIC_EVOLINK_API_KEY,
    uploadAuthToken: process.env.NEXT_PUBLIC_UPLOAD_AUTH_TOKEN,
    // Browser端默认走本地代理以规避 CORS；可通过 env 显式关闭
    useProxy:
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_USE_PROXY !== "false",
  };
}
