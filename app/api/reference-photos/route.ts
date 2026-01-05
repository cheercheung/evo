import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // 只从 cheer 文件夹读取参考图片
    const cheerDir = path.join(process.cwd(), "public", "referrence photo", "cheer");

    if (!fs.existsSync(cheerDir)) {
      return NextResponse.json({ photos: [] });
    }

    const files = fs.readdirSync(cheerDir);

    const photos = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
      })
      .map((file) => `/referrence photo/cheer/${file}`);

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Error reading reference photos:", error);
    return NextResponse.json({ photos: [] });
  }
}

