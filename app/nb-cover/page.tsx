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
  const historySectionRef = useRef<HTMLDivElement | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState("nano-banana-2-lite");

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
      if (!currentCategory.needsLogoUpload) {
        setPresetLogos([]);
        return;
      }
      setLoadingPresetLogos(true);
      try {
        const response = await fetch("/api/logo-list");
        const data = await response.json();
        console.log("预设 Logo 列表:", data.logos);
        setPresetLogos(data.logos || []);
      } catch (err) {
        console.error("加载预设 Logo 失败:", err);
        setPresetLogos([]);
      } finally {
        setLoadingPresetLogos(false);
      }
    };
    loadPresetLogos();
  }, [selectedCategory, currentCategory.needsLogoUpload]);

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
      const uploadToken = process.env.NEXT_PUBLIC_UPLOAD_AUTH_TOKEN;
      if (!uploadToken) {
        console.warn("缺少上传鉴权 token，无法上传默认参考图片");
        return;
      }
      try {
        const response = await fetch(currentCategory.defaultImagePath);
        if (!response.ok) {
          console.warn("默认参考图片不存在:", currentCategory.defaultImagePath);
          return;
        }
        const blob = await response.blob();
        const file = new File([blob], currentCategory.defaultImageName, { type: "image/jpeg" });
        const client = new EvolinkClient(apiKey, uploadToken);
        const uploadResponse = await client.uploadFile(file, { uploadPath: "nb-cover", authToken: uploadToken });
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
      const uploadToken = process.env.NEXT_PUBLIC_UPLOAD_AUTH_TOKEN;
      const client = new EvolinkClient(apiKey, uploadToken);
      const uploadResponse = await client.uploadFile(file, { uploadPath: "nb-cover-logo", authToken: uploadToken });
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

      const uploadToken = process.env.NEXT_PUBLIC_UPLOAD_AUTH_TOKEN;
      const client = new EvolinkClient(apiKey, uploadToken);
      const uploadResponse = await client.uploadFile(file, { uploadPath: "nb-cover-logo", authToken: uploadToken });
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
        model: selectedModel,
        prompt: prompt,
        size: "9:16",
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

  const latestTask = tasks[0];
  const latestPreviewImage = latestTask ? taskResults[latestTask.id]?.[0] : null;
  const previewImage = latestPreviewImage || currentCategory.sampleImagePath || currentCategory.defaultImagePath;
  const previewLabel = latestPreviewImage ? "最新生成预览" : currentCategory.sampleImagePath ? "效果示例" : "默认参考图片";

  const handleScrollToHistory = () => {
    setShowHistory(true);
    requestAnimationFrame(() => {
      historySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
        <header className="flex flex-col gap-4 border-b border-gray-900 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/10 text-2xl">🍌</div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-gray-500">NB</p>
                <h1 className="text-3xl font-bold">NB 封面制作</h1>
                <p className="text-xs text-gray-500">Nano Banana Cover Studio</p>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[10px] uppercase tracking-[0.4em] text-gray-500">菜单</span>
              <Link href="/video-tool" className="rounded-full border border-purple-700/60 px-4 py-2 text-purple-300 transition-colors hover:border-purple-400">
                🎬 视频
              </Link>
              <Link href="/image-tool" className="rounded-full border border-gray-800 px-4 py-2 text-gray-300 transition-colors hover:border-white">
                Nano Banana
              </Link>
              <Link href="/z-image" className="rounded-full border border-gray-800 px-4 py-2 text-gray-300 transition-colors hover:border-white">
                Z-Image
              </Link>
            </nav>
          </div>
          <p className="text-sm text-gray-500">{currentCategory.description} · 模型: nano-banana-2-lite · 尺寸: 3:4 · 质量: 2K</p>
        </header>

        <div className="flex flex-col gap-10">
          {/* Row 1: Steps */}
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-900 bg-gray-950/60 p-5 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <div className="text-[11px] uppercase tracking-[0.45em] text-gray-500">1. 类型选择</div>
              <div className="mt-4 flex flex-wrap gap-3">
                {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`rounded-full px-4 py-2 text-sm transition-all ${
                      selectedCategory === key
                        ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.35)]"
                        : "border border-gray-700 text-gray-300 hover:border-white"
                    }`}
                  >
                    {CATEGORIES[key].name}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-500">不同类型对应不同素材要求与提示词模板。</p>
            </div>

            <div className="rounded-2xl border border-gray-900 bg-gray-950/50 p-5">
              <div className="text-[11px] uppercase tracking-[0.45em] text-gray-500">2. 素材上传</div>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-dashed border-gray-800 bg-black/20 p-4">
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>默认参考图</span>
                    <span className="text-xs text-gray-500">{referenceImageUrl ? "✅ 已上传" : "⏳ 上传中"}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">系统自动上传，生成时会作为基础参考图。</p>
                </div>

                {currentCategory.needsLogoUpload ? (
                  <>
                    <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                      <div className="flex items-center justify-between text-sm text-gray-300">
                        <span>预设 Logo</span>
                        {uploadingLogo && <span className="text-[11px] text-gray-500">上传中...</span>}
                      </div>
                      <div className="mt-3 min-h-[120px]">
                        {loadingPresetLogos ? (
                          <div className="text-xs text-gray-500">加载中...</div>
                        ) : presetLogos.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {presetLogos.map((logo) => (
                              <button
                                key={logo.path}
                                onClick={() => handleSelectPresetLogo(logo.path)}
                                disabled={uploadingLogo}
                                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 transition-colors ${
                                  logoPreviewUrl === logo.path
                                    ? "border-green-500 bg-green-500/10"
                                    : "border-gray-800 hover:border-white"
                                } ${uploadingLogo ? "opacity-50" : ""}`}
                              >
                                <img src={logo.path} alt={logo.name} className="h-12 w-12 object-contain" />
                                <span className="text-[10px] text-gray-400" title={logo.name}>
                                  {logo.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">暂无预设 Logo</div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                      <div className="text-sm text-gray-300">Logo 上传</div>
                      <div className="mt-3 flex items-center gap-4">
                        {logoPreviewUrl ? (
                          <img src={logoPreviewUrl} alt="Logo 预览" className="h-16 w-16 rounded border border-gray-800 object-contain" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-gray-700 text-[10px] text-gray-600">
                            待上传
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
                            className={`w-max rounded-full px-4 py-2 text-xs transition-colors ${
                              uploadingLogo
                                ? "cursor-not-allowed border border-gray-700 text-gray-500"
                                : "border border-blue-500 text-blue-300 hover:bg-blue-500/10"
                            }`}
                          >
                            {uploadingLogo ? "上传中..." : "📁 上传 Logo"}
                          </label>
                          <span className="text-[10px] text-gray-500">支持 JPEG/PNG/GIF/WebP</span>
                          {logoImageUrl && <span className="text-xs text-green-400">✅ 已上传 Evolink</span>}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-xs text-gray-400">
                    本类型无需额外素材，只需默认参考图即可生成。
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-900 bg-gray-950/60 p-5">
              <div className="text-[11px] uppercase tracking-[0.45em] text-gray-500">3. 文本设置</div>
              <div className="mt-4 flex flex-col gap-4">
                {currentCategory.inputs.map((input) => (
                  <div key={input.key} className="flex flex-col gap-2">
                    <label className="text-sm text-gray-300">{input.label}</label>
                    <input
                      type="text"
                      value={inputValues[input.key] || ""}
                      onChange={(e) => setInputValues((prev) => ({ ...prev, [input.key]: e.target.value }))}
                      placeholder={input.placeholder}
                      className="rounded-lg border border-gray-800 bg-black/60 px-4 py-3 text-white placeholder-gray-600 focus:border-white focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Row 2: Preview + Actions */}
          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-3xl border border-gray-900 bg-gradient-to-b from-gray-950 to-black p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.4em] text-gray-500">预览区</div>
                  <h2 className="mt-1 text-2xl font-semibold">{previewLabel}</h2>
                  <p className="text-sm text-gray-500">实时查看默认参考或最新生成画面 · 比例 9:16</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <button
                    onClick={downloadAllImages}
                    disabled={downloadingAll || getTotalImageCount() === 0}
                    className="rounded-full border border-gray-700 px-4 py-2 text-gray-200 transition-colors hover:border-white disabled:cursor-not-allowed disabled:border-gray-800 disabled:text-gray-500"
                  >
                    {downloadingAll ? "下载中..." : "下载"}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-full border border-gray-800 px-4 py-2 text-gray-600"
                  >
                    分享
                  </button>
                  <button
                    type="button"
                    onClick={handleScrollToHistory}
                    className="rounded-full border border-gray-700 px-4 py-2 text-gray-200 transition-colors hover:border-white"
                  >
                    历史
                  </button>
                </div>
              </div>
              <div className="mt-6 w-full overflow-hidden rounded-2xl border border-gray-900 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_60%)]">
                <div className="relative mx-auto h-[480px] w-[270px] max-w-full overflow-hidden rounded-2xl bg-black/60 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
                  {previewImage ? (
                    <img src={previewImage} alt={previewLabel} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-600">暂无预览</div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-gray-900 bg-gray-950/40 p-5">
                <div className="text-xs uppercase tracking-[0.4em] text-gray-500">模型选择</div>
                <div className="mt-4 grid gap-3 text-sm text-gray-300">
                  {[
                    { value: "nano-banana-2-lite", label: "Nano Banana 2 Lite", desc: "默认模型，速度快，适合大部分场景" },
                    { value: "gemini-3-pro-image-preview", label: "Gemini 3 Pro", desc: "Google 模型，更高质量" },
                  ].map((model) => (
                    <label
                      key={model.value}
                      className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
                        selectedModel === model.value
                          ? "border-white bg-white/5 text-white"
                          : "border-gray-800 hover:border-white/70"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-medium">{model.label}</span>
                        <input
                          type="radio"
                          name="model"
                          value={model.value}
                          checked={selectedModel === model.value}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="h-4 w-4 accent-white"
                        />
                      </span>
                      <span className="mt-2 text-xs text-gray-400">{model.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent p-5 shadow-[0_0_25px_rgba(253,230,138,0.2)]">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.45em] text-yellow-200">
                  <span>生成封面</span>
                  <span>{previewLabel}</span>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerateDisabled()}
                  className="mt-4 w-full rounded-xl bg-white py-3 text-base font-semibold text-black shadow-lg transition-all hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500"
                >
                  {genLoading ? "生成中..." : "🚀 一键生成 NB 封面"}
                </button>
                <p className="mt-3 text-[11px] text-gray-400">
                  模型 {selectedModel} · 9:16 · 2K 质量。支持参考图 + Logo 联合控制。
                </p>
                {genError && <div className="mt-4 rounded border border-red-900/60 bg-red-900/20 p-3 text-sm text-red-300">{genError}</div>}
              </div>

              <div className="rounded-2xl border border-gray-900 bg-black/30 p-5">
                <div className="text-xs uppercase tracking-[0.4em] text-gray-500">统计</div>
                <div className="mt-3 space-y-2 text-sm text-gray-400">
                  <p>任务数：{tasks.length}</p>
                  <p>图片总数：{getTotalImageCount()}</p>
                  <p>当前模型：{selectedModel}</p>
                  {currentCategory.needsLogoUpload ? (
                    <p>Logo 状态：{logoImageUrl ? "✅ 就绪" : uploadingLogo ? "⏳ 上传中" : "⚠️ 待上传"}</p>
                  ) : (
                    <p>素材要求：无需 Logo，仅参考图</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Row 3: Secondary info */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-900 bg-gray-950/40 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.4em] text-gray-500">参考图</div>
                  <h3 className="text-lg font-semibold text-white">默认素材</h3>
                </div>
                <span className="text-xs text-gray-500">{referenceImageUrl ? "✅ 已上传" : "⏳ 上传中"}</span>
              </div>
              <div className="mt-4 flex items-start gap-4">
                <div className="relative h-44 w-24 overflow-hidden rounded-xl border border-gray-900 bg-black">
                  <img
                    src={currentCategory.defaultImagePath}
                    alt="参考图示例"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='144' height='256' viewBox='0 0 144 256'%3E%3Crect width='144' height='256' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%23666'%3E暂无图片%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] text-gray-200">9:16</div>
                </div>
                <p className="flex-1 text-xs text-gray-500">
                  默认参考图以 9:16 小图展示，仅作为风格提醒。真实生成可通过步骤 2 上传其它素材，或保留系统默认图。
                </p>
              </div>
            </div>

            <div ref={historySectionRef} className="rounded-2xl border border-gray-900 bg-gray-950/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.4em] text-gray-500">历史</div>
                  <h3 className="text-lg font-semibold text-white">任务记录</h3>
                  <p className="text-xs text-gray-500">共 {tasks.length} 条 · {getTotalImageCount()} 张图片</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setShowHistory((prev) => !prev)}
                    className="rounded-full border border-gray-800 px-3 py-1 text-gray-300 transition-colors hover:border-white hover:text-white"
                  >
                    {showHistory ? "收起" : "展开"}
                  </button>
                  <button
                    onClick={() => {
                      setTasks([]);
                      setTaskResults({});
                    }}
                    className="rounded-full border border-gray-800 px-3 py-1 text-gray-400 transition-colors hover:border-white hover:text-white"
                  >
                    清空
                  </button>
                </div>
              </div>

              {!showHistory ? (
                <div className="mt-4 rounded-xl border border-dashed border-gray-800 bg-black/30 p-6 text-center text-xs text-gray-500">
                  历史记录已折叠，需要时点击“展开”查看 AutoTask 进度。
                </div>
              ) : tasks.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-gray-800 p-6 text-center text-sm text-gray-500">
                  暂无生成记录。配置上方参数后点击“生成封面”即可在此查看。
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-gray-900 bg-black/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-[11px] text-gray-500">{new Date(task.createdAt).toLocaleString("zh-CN")}</div>
                          <div className="text-xs text-blue-400">
                            [{CATEGORIES[task.category as CategoryKey]?.name || task.category}]
                          </div>
                          <div className="text-sm text-gray-200">{task.inputText}</div>
                          <div className="text-[11px] text-gray-600">ID: {task.id}</div>
                        </div>
                        <button
                          onClick={() => removeTask(task.id)}
                          className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-300 transition-colors hover:border-red-500 hover:text-red-400"
                        >
                          移除
                        </button>
                      </div>
                      <div className="mt-3 rounded-xl border border-gray-900 bg-black/60 p-3">
                        <AutoTaskQuery apiKey={apiKey} taskId={task.id} onResultsUpdate={(urls) => updateTaskResults(task.id, urls)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
