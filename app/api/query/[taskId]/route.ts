import type { NextRequest } from "next/server";
import { forwardRequest } from "../../_utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  return forwardRequest(`/v1/tasks/${taskId}`, { method: "GET" });
}
