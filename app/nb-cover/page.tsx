"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { EvolinkClient } from "@/lib/evolink-client";
import AutoTaskQuery from "@/components/AutoTaskQuery";

interface Task {
  id: string;
  createdAt: number;
  inputText: string;
}

const CORRECT_PASSWORD = "lyj";
const REFERENCE_IMAGE_PATH = "/referrence photo/nbptutorial.jpeg";

const PROMPT_TEMPLATE = `Create a thumbnail showing a surprised woman standing in a softly lit, dramatically dramatic environment with shimmering light in the background. She holds a bright yellow banana in both hands, seemingly captivated by it. The image uses cool-toned, cinematic lighting. The girl's mouth is agape, her face filled with amazement. On the right side of the image, prominent yellow text reads {input text} with a smaller white line above it reading "Nano banana tutorial" A white dotted arrow points to the glowing banana.`;

export default function NBCoverPage() {
  const apiKey = process.env.NEXT_PUBLIC_EVOLINK_API_KEY || "";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [inputText, setInputText] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResults, setTaskResults] = useState<Record<string, string[]>>({});
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);

  // 上传参考图片获取URL
  useEffect(() => {
    const uploadReferenceImage = async () => {
      if (!apiKey) return;
      try {
        const response = await fetch(REFERENCE_IMAGE_PATH);
        const blob = await response.blob();
        const file = new File([blob], "nbptutorial.jpeg", { type: "image/jpeg" });
        const client = new EvolinkClient(apiKey);
        const uploadResponse = await client.uploadFile(file, { uploadPath: "nb-cover" });
        setReferenceImageUrl(uploadResponse.data.file_url);
        console.log("参考图片上传成功:", uploadResponse.data.file_url);
      } catch (err) {
        console.error("参考图片上传失败:", err);
      }
    };
    if (isAuthenticated) {
      uploadReferenceImage();
    }
  }, [apiKey, isAuthenticated]);

  const handleGenerate = async () => {
    if (!apiKey) {
      setGenError("请先在 .env.local 中设置 API Key");
      return;
    }
    if (!inputText.trim()) {
      setGenError("请输入封面文字");
      return;
    }
    if (!referenceImageUrl) {
      setGenError("参考图片正在上传中，请稍候...");
      return;
    }

    setGenError(null);
    setGenLoading(true);

    try {
      const prompt = PROMPT_TEMPLATE.replace("{input text}", inputText.trim());
      const client = new EvolinkClient(apiKey);
      const response = await client.createImageGeneration({
        model: "nano-banana-2-lite",
        prompt: prompt,
        size: "3:4",
        quality: "2K",
        image_urls: [referenceImageUrl],
      });

      setTasks((prev) => [
        { id: response.id, createdAt: Date.now(), inputText: inputText.trim() },
        ...prev,
      ]);
      setInputText("");
    } catch (err: any) {
      setGenError(err.message || "请求失败");
    } finally {
      setGenLoading(false);
    }
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setTaskResults((prev) => { const r = { ...prev }; delete r[taskId]; return r; });
  };

  const updateTaskResults = (taskId: string, imageUrls: string[]) => {
    setTaskResults((prev) => ({ ...prev, [taskId]: imageUrls }));
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) { console.error("下载失败:", err); }
  };

  const downloadAllImages = async () => {
    setDownloadingAll(true);
    let idx = 1;
    for (const task of tasks) {
      const urls = taskResults[task.id];
      if (urls?.length) {
        for (const url of urls) {
          await downloadImage(url, `nb-cover-${idx}.png`);
          idx++;
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }
    setDownloadingAll(false);
  };

  const getTotalImageCount = () => Object.values(taskResults).reduce((t, u) => t + u.length, 0);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) { setIsAuthenticated(true); setPasswordError(false); }
    else { setPasswordError(true); }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-bold">请输入密码</h1>
              <p className="text-sm text-gray-500">输入正确密码后开始使用</p>
            </div>
            <div className="flex flex-col gap-2">
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                placeholder="请输入密码" className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-white focus:outline-none" autoFocus />
              {passwordError && <p className="text-sm text-red-500">密码错误，请重试</p>}
            </div>
            <button type="submit" className="w-full py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors">确认</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-gray-800 pb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">🍌 NB 封面制作</h1>
            <div className="flex gap-2">
              <Link href="/image-tool" className="text-sm px-4 py-2 border border-gray-700 hover:border-white transition-colors">Nano Banana</Link>
              <Link href="/z-image" className="text-sm px-4 py-2 border border-gray-700 hover:border-white transition-colors">Z-Image</Link>
            </div>
          </div>
          <p className="text-sm text-gray-500">快速生成 Nano Banana 教程封面 · 模型: nano-banana-2-lite · 尺寸: 3:4 · 质量: 2K</p>
        </div>

        {/* Reference Image Preview */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-white">参考图片</label>
          <div className="flex items-center gap-4">
            <img src={REFERENCE_IMAGE_PATH} alt="参考图片" className="w-32 h-auto border border-gray-700" />
            <div className="text-xs text-gray-500">
              {referenceImageUrl ? "✅ 已上传" : "⏳ 上传中..."}
            </div>
          </div>
        </div>

        {/* Input Text */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-white">封面文字（替换模板中的 {"{input text}"}）</label>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder='例如: "AI Tutorial #1"'
            className="px-4 py-3 bg-black text-white border border-gray-700 focus:border-white focus:outline-none"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={genLoading || !inputText.trim() || !referenceImageUrl}
          className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {genLoading ? "生成中..." : "生成封面"}
        </button>

        {/* Error */}
        {genError && <div className="px-4 py-3 bg-red-900/20 border border-red-900 text-red-400 text-sm">{genError}</div>}

        {/* Tasks */}
        {tasks.length > 0 && (
          <div className="flex flex-col gap-6 border-t border-gray-800 pt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">任务列表 ({tasks.length})</h2>
              <div className="flex gap-2">
                {getTotalImageCount() > 0 && (
                  <button onClick={downloadAllImages} disabled={downloadingAll}
                    className="text-sm px-4 py-2 bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 transition-colors font-medium">
                    {downloadingAll ? "下载中..." : `一键下载全部 (${getTotalImageCount()} 张)`}
                  </button>
                )}
                <button onClick={() => { setTasks([]); setTaskResults({}); }}
                  className="text-xs px-3 py-1 border border-gray-700 hover:border-white transition-colors">清空全部</button>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {tasks.map((task) => (
                <div key={task.id} className="border border-gray-800 p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="text-xs text-gray-500">{new Date(task.createdAt).toLocaleString("zh-CN")}</div>
                      <div className="text-sm text-gray-300">封面文字：<span className="text-yellow-400">{task.inputText}</span></div>
                      <div className="text-xs text-gray-600 font-mono">ID: {task.id}</div>
                    </div>
                    <button onClick={() => removeTask(task.id)} className="text-xs px-3 py-1 border border-gray-700 hover:border-red-500 hover:text-red-500 transition-colors">移除</button>
                  </div>
                  <AutoTaskQuery apiKey={apiKey} taskId={task.id} onResultsUpdate={(urls) => updateTaskResults(task.id, urls)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
