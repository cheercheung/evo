import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_EVOLINK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "API Key not configured" } },
        { status: 500 }
      );
    }

    const body = await request.json();

    console.log("🔄 代理请求到 Evolink 视频生成 API:", body);

    const response = await fetch(
      "https://api.evolink.ai/v1/videos/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    console.log("📡 Evolink 视频生成 API 响应:", {
      status: response.status,
      data,
    });

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ 视频生成代理请求失败:", error);
    return NextResponse.json(
      { error: { message: error.message || "Internal server error" } },
      { status: 500 }
    );
  }
}

