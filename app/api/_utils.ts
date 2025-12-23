import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_BASE = "https://api.evolink.ai";

function getApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_EVOLINK_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not configured");
  }
  return apiKey;
}

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_EVOLINK_API_BASE_URL || DEFAULT_API_BASE;
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: { message } }, { status });
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function forwardRequest(
  path: string,
  init: RequestInit
): Promise<NextResponse> {
  try {
    const apiKey = getApiKey();
    const apiBase = getApiBaseUrl();
    const url = `${apiBase}${path}`;

    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    const data = await parseJsonSafe(response);

    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    console.error("Proxy request failed:", err);
    return errorResponse(err?.message || "Internal server error", 500);
  }
}

export async function forwardJson(
  path: string,
  body: unknown,
  init: RequestInit = {}
): Promise<NextResponse> {
  return forwardRequest(path, {
    method: init.method || "POST",
    body: JSON.stringify(body),
    ...init,
  });
}
