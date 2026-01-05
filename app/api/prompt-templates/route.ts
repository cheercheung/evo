import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), "public", "config", "prompt-templates.json");
    
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ templates: {} });
    }

    const content = fs.readFileSync(configPath, "utf-8");
    const templates = JSON.parse(content);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error reading prompt templates:", error);
    return NextResponse.json({ templates: {} });
  }
}

