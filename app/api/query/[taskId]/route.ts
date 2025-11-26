import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_EVOLINK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "API Key not configured" } },
        { status: 500 }
      );
    }

    const { taskId } = await params;

    console.log("🔄 代理查询任务:", taskId);

    const response = await fetch(
      `https://api.evolink.ai/v1/tasks/${taskId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    console.log("📡 任务查询响应:", {
      status: response.status,
      taskId,
      data,
    });

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ 查询请求失败:", error);
    return NextResponse.json(
      { error: { message: error.message || "Internal server error" } },
      { status: 500 }
    );
  }
}

