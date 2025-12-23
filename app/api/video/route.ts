import type { NextRequest } from "next/server";
import { forwardJson } from "../_utils";

export async function POST(request: NextRequest) {
  const body = await request.json();
  return forwardJson("/v1/videos/generations", body);
}
