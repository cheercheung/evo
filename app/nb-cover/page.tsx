"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { EvolinkClient } from "@/lib/evolink-client";
import AutoTaskQuery from "@/components/AutoTaskQuery";

interface Task {
  id: string;
  createdAt: number;
  inputText: string;
  category: string;
}

// 分类配置
type CategoryKey = "nb-tutorial" | "product-logo";

interface CategoryConfig {
  name: string;
  description: string;
  defaultImagePath: string;
  defaultImageName: string;
  needsLogoUpload: boolean;
  inputs: { key: string; label: string; placeholder: string }[];
  promptTemplate: string;
  sampleImagePath?: string; // 效果示例图片路径
}

const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  "nb-tutorial": {
    name: "NB 教程封面",
    description: "Nano Banana 教程封面",
    defaultImagePath: "/referrence photo/nbptutorial.jpeg",
    defaultImageName: "nbptutorial.jpeg",
    needsLogoUpload: false,
    inputs: [
      { key: "text1", label: "封面文字", placeholder: '例如: "AI Tutorial #1"' }
    ],
    promptTemplate: `Create a thumbnail showing a surprised woman standing in a softly lit, dramatically dramatic environment with shimmering light in the background. She holds a bright yellow banana in both hands, seemingly captivated by it. The image uses cool-toned, cinematic lighting. The girl's mouth is agape, her face filled with amazement. On the right side of the image, prominent yellow text reads {text1} with a smaller white line above it reading "Nano banana tutorial" A white dotted arrow points to the glowing banana.`,
  },
  "product-logo": {
    name: "产品 Logo",
    description: "产品 Logo 展示封面",
    defaultImagePath: "/referrence photo/product-logo-default.png",
    defaultImageName: "product-logo-default.png",
    needsLogoUpload: true,
    inputs: [
      { key: "text1", label: "主标题 (黄色大字)", placeholder: '例如: "NEW PRODUCT"' },
      { key: "text2", label: "副标题 (白色小字)", placeholder: '例如: "Coming Soon"' }
    ],
    promptTemplate: `Create a thumbnail showing a surprised woman standing in a softly lit, dramatic environment with shimmering light in the background.

She holds a bright logo(reference logo photo) in both hands, seemingly captivated by it.

The image uses cool-toned, cinematic lighting.

The girl's mouth is agape, her face filled with amazement.

On the right side of the image, prominent yellow text reads "{text1}" with a smaller white line above it reading "{text2}" A white dotted arrow points to the glowing logo.`,
    sampleImagePath: "/sample_photo/logo-product-sanmple.png",
  },
};

const CORRECT_PASSWORD = "lyj";

export default function NBCoverPage() {
  const apiKey = process.env.NEXT_PUBLIC_EVOLINK_API_KEY || "";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // 分类选择
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("nb-tutorial");

  // 输入状态
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // 图片上传状态
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 预设 Logo 列表
  const [presetLogos, setPresetLogos] = useState<{ name: string; path: string }[]>([]);
  const [loadingPresetLogos, setLoadingPresetLogos] = useState(false);

  // 生成状态
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResults, setTaskResults] = useState<Record<string, string[]>>({});
  const [downloadingAll, setDownloadingAll] = useState(false);

  const currentCategory = CATEGORIES[selectedCategory];

  // 加载预设 Logo 列表
  useEffect(() => {
    const loadPresetLogos = async () => {
      if (!currentCategory.needsLogoUpload) return;
      setLoadingPresetLogos(true);
      try {
        const response = await fetch("/api/logo-list");
        const data = await response.json();
        setPresetLogos(data.logos || []);
      } catch (err) {
        console.error("加载预设 Logo 失败:", err);
      } finally {
        setLoadingPresetLogos(false);
      }
    };
    loadPresetLogos();
  }, [selectedCategory]);

  // 切换分类时重置状态
  useEffect(() => {
    setInputValues({});
    setLogoImageUrl(null);
    setLogoPreviewUrl(null);
    setReferenceImageUrl(null);
    setGenError(null);
  }, [selectedCategory]);

  // 上传默认参考图片获取URL
  useEffect(() => {
    const uploadReferenceImage = async () => {
      if (!apiKey) return;
      try {
        const response = await fetch(currentCategory.defaultImagePath);
        if (!response.ok) {
          console.warn("默认参考图片不存在:", currentCategory.defaultImagePath);
          return;
        }
        const blob = await response.blob();
        const file = new File([blob], currentCategory.defaultImageName, { type: "image/jpeg" });
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
  }, [apiKey, isAuthenticated, selectedCategory]);

  // 处理 Logo 图片上传
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setGenError("只支持 JPEG, PNG, GIF, WebP 格式的图片");
      return;
    }

    // 显示本地预览
    const previewUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(previewUrl);

    setUploadingLogo(true);
    setGenError(null);

    try {
      const client = new EvolinkClient(apiKey);
      const uploadResponse = await client.uploadFile(file, { uploadPath: "nb-cover-logo" });
      setLogoImageUrl(uploadResponse.data.file_url);
      console.log("Logo 图片上传成功:", uploadResponse.data.file_url);
    } catch (err: any) {
      console.error("Logo 图片上传失败:", err);
      setGenError("Logo 图片上传失败: " + (err.message || "未知错误"));
      setLogoPreviewUrl(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  // 选择预设 Logo
  const handleSelectPresetLogo = async (logoPath: string) => {
    setLogoPreviewUrl(logoPath);
    setUploadingLogo(true);
    setGenError(null);

    try {
      // 获取预设 Logo 并上传
      const response = await fetch(logoPath);
      if (!response.ok) throw new Error("无法加载预设 Logo");
      const blob = await response.blob();
      const fileName = logoPath.split("/").pop() || "preset-logo.png";
      const file = new File([blob], fileName, { type: blob.type });

      const client = new EvolinkClient(apiKey);
      const uploadResponse = await client.uploadFile(file, { uploadPath: "nb-cover-logo" });
      setLogoImageUrl(uploadResponse.data.file_url);
      console.log("预设 Logo 上传成功:", uploadResponse.data.file_url);
    } catch (err: any) {
      console.error("预设 Logo 上传失败:", err);
      setGenError("预设 Logo 上传失败: " + (err.message || "未知错误"));
      setLogoPreviewUrl(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setGenError("请先在 .env.local 中设置 API Key");
      return;
    }

    // 验证所有必填输入
    for (const input of currentCategory.inputs) {
      if (!inputValues[input.key]?.trim()) {
        setGenError(`请输入${input.label}`);
        return;
      }
    }

    if (!referenceImageUrl) {
      setGenError("参考图片正在上传中，请稍候...");
      return;
    }

    if (currentCategory.needsLogoUpload && !logoImageUrl) {
      setGenError("请上传 Logo 图片");
      return;
    }

    setGenError(null);
    setGenLoading(true);

    try {
      // 构建提示词
      let prompt = currentCategory.promptTemplate;
      for (const input of currentCategory.inputs) {
        prompt = prompt.replace(`{${input.key}}`, inputValues[input.key]?.trim() || "");
      }

      // 构建图片 URL 列表
      const imageUrls = [referenceImageUrl];
      if (currentCategory.needsLogoUpload && logoImageUrl) {
        imageUrls.push(logoImageUrl);
      }

      const client = new EvolinkClient(apiKey);
      const response = await client.createImageGeneration({
        model: "nano-banana-2-lite",
        prompt: prompt,
        size: "3:4",
        quality: "2K",
        image_urls: imageUrls,
      });

      // 构建显示文本
      const displayText = currentCategory.inputs.map(input =>
        `${input.label}: ${inputValues[input.key]?.trim()}`
      ).join(" | ");

      setTasks((prev) => [
        { id: response.id, createdAt: Date.now(), inputText: displayText, category: selectedCategory },
        ...prev,
      ]);
      setInputValues({});
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

  // 检查生成按钮是否可用
  const isGenerateDisabled = () => {
    if (genLoading) return true;
    if (!referenceImageUrl) return true;
    if (currentCategory.needsLogoUpload && !logoImageUrl) return true;
    for (const input of currentCategory.inputs) {
      if (!inputValues[input.key]?.trim()) return true;
    }
    return false;
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-gray-800 pb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">🍌 NB 封面制作</h1>
            <div className="flex gap-2">
              <Link href="/video-tool" className="text-sm px-4 py-2 border border-purple-700 text-purple-400 hover:border-purple-500 transition-colors">🎬 视频</Link>
              <Link href="/image-tool" className="text-sm px-4 py-2 border border-gray-700 hover:border-white transition-colors">Nano Banana</Link>
              <Link href="/z-image" className="text-sm px-4 py-2 border border-gray-700 hover:border-white transition-colors">Z-Image</Link>
            </div>
          </div>
          <p className="text-sm text-gray-500">{currentCategory.description} · 模型: nano-banana-2-lite · 尺寸: 3:4 · 质量: 2K</p>
        </div>

        {/* Category Selector */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-white">选择封面类型</label>
          <div className="flex gap-3">
            {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 text-sm border transition-colors ${
                  selectedCategory === key
                    ? "border-white bg-white text-black"
                    : "border-gray-700 hover:border-white text-gray-300"
                }`}
              >
                {CATEGORIES[key].name}
              </button>
            ))}
          </div>
        </div>

        {/* Sample Image Preview - 效果示例 */}
        {currentCategory.sampleImagePath && (
          <div className="flex flex-col gap-3 p-4 border border-dashed border-gray-700 bg-gray-900/30 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">📷 效果示例</span>
              <span className="text-xs text-gray-500">生成的图片效果大致如下</span>
            </div>
            <img
              src={currentCategory.sampleImagePath}
              alt="效果示例"
              className="max-w-md h-auto border border-gray-700 rounded"
            />
          </div>
        )}

        {/* Reference Image Preview */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-white">默认参考图片</label>
          <div className="flex items-center gap-4">
            <img
              src={currentCategory.defaultImagePath}
              alt="参考图片"
              className="w-32 h-auto border border-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect fill='%23333' width='128' height='128'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='12'%3E暂无图片%3C/text%3E%3C/svg%3E";
              }}
            />
            <div className="text-xs text-gray-500">
              {referenceImageUrl ? "✅ 已上传" : "⏳ 上传中..."}
            </div>
          </div>
        </div>

        {/* Logo Upload (for product-logo category) */}
        {currentCategory.needsLogoUpload && (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-white">Logo 图片 (必须选择或上传)</label>

            {/* 预设 Logo 选择 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-400">选择预设 Logo：</span>
              {loadingPresetLogos ? (
                <div className="text-xs text-gray-500">加载中...</div>
              ) : presetLogos.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {presetLogos.map((logo) => (
                    <button
                      key={logo.path}
                      onClick={() => handleSelectPresetLogo(logo.path)}
                      disabled={uploadingLogo}
                      className={`relative group flex flex-col items-center gap-1 p-2 border transition-colors ${
                        logoPreviewUrl === logo.path
                          ? "border-green-500 bg-green-500/10"
                          : "border-gray-700 hover:border-white"
                      } ${uploadingLogo ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <img
                        src={logo.path}
                        alt={logo.name}
                        className="w-16 h-16 object-contain"
                      />
                      <span className="text-[10px] text-gray-400 truncate max-w-[70px]" title={logo.name}>
                        {logo.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500">暂无预设 Logo</div>
              )}
            </div>

            {/* 自定义上传 */}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-800">
              <span className="text-xs text-gray-400">或上传自定义 Logo：</span>
              <div className="flex items-center gap-4">
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl}
                    alt="Logo 预览"
                    className="w-20 h-20 object-contain border border-gray-700"
                  />
                ) : (
                  <div className="w-20 h-20 border border-dashed border-gray-700 flex items-center justify-center text-gray-500 text-xs">
                    待选择
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <label
                    htmlFor="logo-upload-input"
                    className={`px-3 py-2 text-xs border cursor-pointer transition-colors ${
                      uploadingLogo
                        ? "border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "border-blue-600 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20"
                    }`}
                  >
                    {uploadingLogo ? "上传中..." : "📁 上传自定义 Logo"}
                  </label>
                  <span className="text-[10px] text-gray-500">
                    支持 JPEG, PNG, GIF, WebP
                  </span>
                  {logoImageUrl && (
                    <span className="text-xs text-green-400">✅ 已就绪</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Input Fields */}
        {currentCategory.inputs.map((input) => (
          <div key={input.key} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white">{input.label}</label>
            <input
              type="text"
              value={inputValues[input.key] || ""}
              onChange={(e) => setInputValues(prev => ({ ...prev, [input.key]: e.target.value }))}
              placeholder={input.placeholder}
              className="px-4 py-3 bg-black text-white border border-gray-700 focus:border-white focus:outline-none"
            />
          </div>
        ))}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerateDisabled()}
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
                      <div className="text-xs text-blue-400">[{CATEGORIES[task.category as CategoryKey]?.name || task.category}]</div>
                      <div className="text-sm text-gray-300">{task.inputText}</div>
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
