interface RequestOptions extends RequestInit {
  baseUrl?: string;
  apiKey?: string;
  json?: boolean;
  log?: boolean;
}

/**
 * Remove undefined fields and empty arrays from payloads.
 */
export function sanitizePayload<T extends Record<string, any>>(payload: T): Partial<T> {
  const cleaned: Record<string, any> = Array.isArray(payload) ? [...payload] : { ...payload };

  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key];
    const isEmptyArray = Array.isArray(value) && value.length === 0;
    if (value === undefined || isEmptyArray) {
      delete cleaned[key];
    }
  });

  return cleaned as Partial<T>;
}

/**
 * Lightweight fetch wrapper with consistent error handling and optional logging.
 */
export async function httpRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    baseUrl = "",
    apiKey,
    json = true,
    log = false,
    headers,
    ...rest
  } = options;

  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const mergedHeaders = new Headers(headers || {});

  if (apiKey) {
    mergedHeaders.set("Authorization", `Bearer ${apiKey}`);
  }

  if (json && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  const requestInit: RequestInit = {
    ...rest,
    headers: mergedHeaders,
  };

  if (log) {
    console.info("🌐 Request", {
      url,
      method: requestInit.method || "GET",
      headers: {
        ...Object.fromEntries(mergedHeaders),
        ...(apiKey ? { Authorization: `Bearer ${apiKey.slice(0, 6)}...` } : {}),
      },
    });
  }

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch (err: any) {
    throw new Error(err?.message || "Network request failed");
  }

  let data: any = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // non-JSON response
      data = text;
    }
  }

  if (log) {
    console.info("📡 Response", {
      url,
      status: response.status,
      statusText: response.statusText,
      data,
    });
  }

  if (!response.ok) {
    const message =
      (data && (data.error?.message || data.message)) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).body = data;
    throw error;
  }

  return data as T;
}
