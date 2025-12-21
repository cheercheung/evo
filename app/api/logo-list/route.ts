import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const logoDir = path.join(process.cwd(), "public", "referrence photo", "logo");
    
    // 检查目录是否存在
    if (!fs.existsSync(logoDir)) {
      return NextResponse.json({ logos: [] });
    }
    
    // 读取目录内容
    const files = fs.readdirSync(logoDir);
    
    // 过滤出图片文件
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const logos = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map((file) => ({
        name: file,
        path: `/referrence photo/logo/${file}`,
      }));
    
    return NextResponse.json({ logos });
  } catch (error) {
    console.error("读取 logo 目录失败:", error);
    return NextResponse.json({ logos: [], error: "读取失败" }, { status: 500 });
  }
}

