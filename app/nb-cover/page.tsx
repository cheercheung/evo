"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useEnvConfig } from "@/lib/hooks/useEnvConfig";
import { useEvolinkClient } from "@/lib/hooks/useEvolinkClient";
import { useTaskList } from "@/lib/hooks/useTaskList";
import type { Model } from "@/types/evolink";
import AutoTaskQuery from "@/components/AutoTaskQuery";
import { TaskCard } from "@/components/TaskCard";

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
  sampleImagePath?: string; // 效果示例图片路径
}

// 提示词模板类型
interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
}

const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  "nb-tutorial": {
    name: "NB 教程封面",
    description: "Nano Banana 教程封面",
    defaultImagePath: "/referrence photo/cheer/nbptutorial.jpeg",
    defaultImageName: "nbptutorial.jpeg",
    needsLogoUpload: false,
    inputs: [
      { key: "text1", label: "封面文字", placeholder: '例如: "AI Tutorial #1"' }
    ],
    sampleImagePath: "/sample_photo/nbptutorial.jpg",
  },
  "product-logo": {
    name: "产品 Logo",
    description: "产品 Logo 展示封面",
    defaultImagePath: "/referrence photo/cheer/product-logo-default.png",
    defaultImageName: "product-logo-default.png",
    needsLogoUpload: true,
    inputs: [
      { key: "text1", label: "主标题 (黄色大字)", placeholder: '例如: "NEW PRODUCT"' },
      { key: "text2", label: "副标题 (白色小字)", placeholder: '例如: "Coming Soon"' }
    ],
    sampleImagePath: "/sample_photo/logo-product-sanmple.png",
  },
};

const CORRECT_PASSWORD = "lyj";

export default function NBCoverPage() {
  const { apiKey, uploadAuthToken } = useEnvConfig();
  const effectiveApiKey = apiKey ?? "";
  const effectiveUploadToken = uploadAuthToken;
  const client = useEvolinkClient();
  const { tasks, results, addTask, removeTask, clear, updateResults, totalResultCount } = useTaskList();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // 分类选择
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("nb-tutorial");

  // 输入状态
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // 图片上传状态
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [referencePreviewSrc, setReferencePreviewSrc] = useState<string | null>(null);
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const historySectionRef = useRef<HTMLDivElement | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>("nano-banana-2-lite");

  // 预设 Logo 列表
  const [presetLogos, setPresetLogos] = useState<{ name: string; path: string }[]>([]);
  const [loadingPresetLogos, setLoadingPresetLogos] = useState(false);

  // 预设参考图列表
  const [presetReferencePhotos, setPresetReferencePhotos] = useState<string[]>([]);
  const [loadingPresetPhotos, setLoadingPresetPhotos] = useState(false);

  // 提示词模板
  const [promptTemplates, setPromptTemplates] = useState<Record<string, PromptTemplate[]>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // 生成状态
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const currentCategory = CATEGORIES[selectedCategory];

  // 获取当前分类的模板列表和选中的模板
  const currentTemplates = promptTemplates[selectedCategory] || [];
  const currentTemplate = currentTemplates.find(t => t.id === selectedTemplateId) || currentTemplates[0];

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

  // 加载预设参考图列表
  useEffect(() => {
    const loadPresetPhotos = async () => {
      setLoadingPresetPhotos(true);
      try {
        const response = await fetch("/api/reference-photos");
        const data = await response.json();
        console.log("预设参考图列表:", data.photos);
        setPresetReferencePhotos(data.photos || []);
      } catch (err) {
        console.error("加载预设参考图失败:", err);
        setPresetReferencePhotos([]);
      } finally {
        setLoadingPresetPhotos(false);
      }
    };
    loadPresetPhotos();
  }, []);

  // 加载提示词模板
  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await fetch("/api/prompt-templates");
        const data = await response.json();
        console.log("提示词模板:", data.templates);
        setPromptTemplates(data.templates || {});
      } catch (err) {
        console.error("加载提示词模板失败:", err);
        setPromptTemplates({});
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, []);

  // 切换分类时重置状态
  useEffect(() => {
    setInputValues({});
    setLogoImageUrl(null);
    setLogoPreviewUrl(null);
    setReferenceImageUrl(null);
    setReferencePreviewSrc(currentCategory.defaultImagePath);
    setSelectedTemplateId("default"); // 重置模板选择
    setGenError(null);
  }, [selectedCategory]);

  // 上传默认参考图片获取URL
  useEffect(() => {
    const uploadReferenceImage = async () => {
      if (!effectiveApiKey) return;
      const uploadToken = effectiveUploadToken;
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
        const uploadResponse = await client.uploadFile(file, { uploadPath: "nb-cover", authToken: uploadToken });
        setReferenceImageUrl(uploadResponse.data.file_url);
        setReferencePreviewSrc(currentCategory.defaultImagePath);
        console.log("参考图片上传成功:", uploadResponse.data.file_url);
      } catch (err) {
        console.error("参考图片上传失败:", err);
      }
    };
    if (isAuthenticated) {
      uploadReferenceImage();
    }
  }, [client, currentCategory.defaultImageName, currentCategory.defaultImagePath, effectiveApiKey, effectiveUploadToken, isAuthenticated, selectedCategory]);

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
      const uploadToken = effectiveUploadToken;
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

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setGenError("参考图仅支持 JPEG/PNG/GIF/WebP");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setReferencePreviewSrc(previewUrl);
    setReferenceUploading(true);
    setGenError(null);

    try {
      const uploadToken = effectiveUploadToken;
      const uploadResponse = await client.uploadFile(file, { uploadPath: "nb-cover", authToken: uploadToken });
      setReferenceImageUrl(uploadResponse.data.file_url);
      console.log("参考图上传成功:", uploadResponse.data.file_url);
    } catch (err: any) {
      console.error("参考图上传失败:", err);
      setGenError("参考图上传失败: " + (err.message || "未知错误"));
      setReferencePreviewSrc(currentCategory.defaultImagePath);
    } finally {
      setReferenceUploading(false);
    }
  };

  // 选择预设参考图
  const handleSelectPresetPhoto = async (photoPath: string) => {
    setReferencePreviewSrc(photoPath);
    setReferenceUploading(true);
    setGenError(null);

    try {
      // 获取预设参考图并上传
      const response = await fetch(photoPath);
      if (!response.ok) throw new Error("无法加载预设参考图");
      const blob = await response.blob();
      const fileName = photoPath.split("/").pop() || "preset-reference.jpg";
      const file = new File([blob], fileName, { type: blob.type });

      const uploadToken = effectiveUploadToken;
      const uploadResponse = await client.uploadFile(file, { uploadPath: "nb-cover", authToken: uploadToken });
      setReferenceImageUrl(uploadResponse.data.file_url);
      console.log("预设参考图上传成功:", uploadResponse.data.file_url);
    } catch (err: any) {
      console.error("预设参考图上传失败:", err);
      setGenError("预设参考图上传失败: " + (err.message || "未知错误"));
      setReferencePreviewSrc(currentCategory.defaultImagePath);
    } finally {
      setReferenceUploading(false);
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

      const uploadToken = effectiveUploadToken;
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
    if (!effectiveApiKey) {
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
      // 构建提示词 - 使用选中的模板
      if (!currentTemplate) {
        setGenError("请选择一个提示词模板");
        setGenLoading(false);
        return;
      }
      let prompt = currentTemplate.template;
      for (const input of currentCategory.inputs) {
        prompt = prompt.replace(new RegExp(`\\{${input.key}\\}`, 'g'), inputValues[input.key]?.trim() || "");
      }

      // 构建图片 URL 列表
      const imageUrls = [referenceImageUrl];
      if (currentCategory.needsLogoUpload && logoImageUrl) {
        imageUrls.push(logoImageUrl);
      }

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

      addTask({
        id: response.id,
        createdAt: Date.now(),
        prompt: displayText,
        meta: { category: selectedCategory },
      });
      setInputValues({});
    } catch (err: any) {
      setGenError(err.message || "请求失败");
    } finally {
      setGenLoading(false);
    }
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
      const urls = results[task.id];
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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) { setIsAuthenticated(true); setPasswordError(false); }
    else { setPasswordError(true); }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f7f7f7] text-black flex items-center justify-center p-8">
        <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-bold">请输入密码</h1>
              <p className="text-sm text-black/60">输入正确密码后开始使用</p>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                placeholder="请输入密码"
                className="w-full rounded-lg border border-black/20 bg-white px-4 py-3 text-black placeholder-black/40 focus:border-black focus:outline-none"
                autoFocus
              />
              {passwordError && <p className="text-sm text-red-500">密码错误，请重试</p>}
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-black py-3 text-white font-medium shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-colors hover:bg-black/80"
            >
              确认
            </button>
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
  const latestPreviewImage = latestTask ? results[latestTask.id]?.[0] : null;
  const previewImage = latestPreviewImage || currentCategory.sampleImagePath || currentCategory.defaultImagePath;
  const previewLabel = latestPreviewImage ? "最新生成预览" : currentCategory.sampleImagePath ? "效果示例" : "默认参考图片";

  const handleScrollToHistory = () => {
    setShowHistory(true);
    requestAnimationFrame(() => {
      historySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-black">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-black/5 bg-white p-5 text-black shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 text-2xl shadow-[0_10px_25px_rgba(0,0,0,0.06)]">🍌</div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-black/60">NB</p>
                <h1 className="text-3xl font-bold">NB 封面制作</h1>
                <p className="text-xs text-black/60">Nano Banana Cover Studio</p>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[10px] uppercase tracking-[0.4em] text-black/60">菜单</span>
              <Link href="/video-tool" className="rounded-full border border-black/10 bg-white px-4 py-2 text-black shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-colors hover:border-black">
                🎬 视频
              </Link>
              <Link href="/image-tool" className="rounded-full border border-black/10 bg-white px-4 py-2 text-black shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-colors hover:border-black">
                Nano Banana
              </Link>
              <Link href="/z-image" className="rounded-full border border-black/10 bg-white px-4 py-2 text-black shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-colors hover:border-black">
                Z-Image
              </Link>
            </nav>
          </div>
          <p className="text-sm text-black/60">{currentCategory.description} · 模型: nano-banana-2-lite · 尺寸: 3:4 · 质量: 2K</p>
        </header>

        <div className="flex flex-col gap-10">
          <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            <div className="flex flex-col gap-6">
              <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[13px] font-medium text-black">1． 类型选择</div>
                    <p className="text-sm text-black/60">不同类型对应不同素材要求与提示词模板。</p>
                  </div>
                  <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs text-black/60 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                    {referenceImageUrl ? "参考图已上传" : "参考图上传中..."}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`rounded-full px-5 py-3 text-sm transition-all ${
                        selectedCategory === key
                          ? "bg-black text-white shadow-[0_18px_36px_rgba(0,0,0,0.18)]"
                          : "border border-black/10 bg-white text-black shadow-[0_10px_25px_rgba(0,0,0,0.06)] hover:border-black/40"
                      }`}
                    >
                      {CATEGORIES[key].name}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex items-start gap-5 rounded-[18px] border border-black/10 bg-black/[0.03] p-5">
                  <div className="relative h-40 w-24 overflow-hidden rounded-2xl border border-black/10 bg-black">
                    <img
                      src={currentCategory.defaultImagePath}
                      alt="参考图示例"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='192' viewBox='0 0 120 192'%3E%3Crect width='120' height='192' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23666'%3E暂无图片%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">9:16</div>
                  </div>
                  <div className="flex-1 space-y-2 text-sm text-black/70">
                    <p className="font-medium">{currentCategory.name}</p>
                    <p>默认参考图自动上传，可直接生成或在步骤 2 替换素材。</p>
                  </div>
                </div>
              </div>

              {/* 步骤 1.5: 提示词模板选择 */}
              <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                <div className="text-[13px] font-medium text-black">1.5 风格选择</div>
                <p className="mt-2 text-xs text-black/60">选择不同的风格模板来生成不同效果的封面。</p>
                <div className="mt-4">
                  {loadingTemplates ? (
                    <div className="text-xs text-black/60">加载模板中...</div>
                  ) : currentTemplates.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currentTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplateId(template.id)}
                          className={`rounded-xl p-4 text-left transition-all ${
                            selectedTemplateId === template.id
                              ? "bg-black text-white shadow-[0_10px_25px_rgba(0,0,0,0.2)]"
                              : "border border-black/10 bg-white text-black hover:border-black/30 shadow-[0_6px_16px_rgba(0,0,0,0.05)]"
                          }`}
                        >
                          <div className="text-sm font-medium">{template.name}</div>
                          <div className={`mt-1 text-xs ${selectedTemplateId === template.id ? "text-white/70" : "text-black/50"}`}>
                            {template.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-black/60">暂无可用模板</div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                <div className="text-[13px] font-medium text-black">2． 素材上传</div>
                <div className="mt-4 space-y-4">
                  {/* 预设参考图选择器 */}
                  <div className="rounded-[16px] border border-black/10 bg-black/[0.03] p-4">
                    <div className="flex items-center justify-between text-sm text-black">
                      <span>预设参考图</span>
                      {referenceUploading && <span className="text-[11px] text-black/60">上传中...</span>}
                    </div>
                    <div className="mt-3 min-h-[80px]">
                      {loadingPresetPhotos ? (
                        <div className="text-xs text-black/60">加载中...</div>
                      ) : presetReferencePhotos.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {presetReferencePhotos.map((photo) => (
                            <button
                              key={photo}
                              type="button"
                              onClick={() => handleSelectPresetPhoto(photo)}
                              disabled={referenceUploading}
                              className={`relative aspect-[9/16] overflow-hidden rounded-lg border-2 transition-all ${
                                referencePreviewSrc === photo
                                  ? "border-black ring-2 ring-black/20"
                                  : "border-transparent hover:border-black/30"
                              } ${referenceUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <img
                                src={photo}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                              {referencePreviewSrc === photo && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <span className="text-white text-lg">✓</span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-black/60">暂无预设参考图</div>
                      )}
                    </div>
                  </div>

                  {/* 上传自定义参考图 */}
                  <div className="rounded-[16px] border border-black/10 bg-black/[0.03] p-4">
                    <div className="flex items-center justify-between text-sm text-black">
                      <span>上传自定义参考图</span>
                      {referenceUploading && <span className="text-[11px] text-black/60">上传中...</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="relative h-24 w-16 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                        <img
                          src={referencePreviewSrc || currentCategory.defaultImagePath}
                          alt="参考图预览"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">当前</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleReferenceUpload}
                          disabled={referenceUploading}
                          className="hidden"
                          id="reference-upload-input"
                        />
                        <label
                          htmlFor="reference-upload-input"
                          className={`w-max rounded-full px-4 py-2 text-xs transition-colors ${
                            referenceUploading
                              ? "cursor-not-allowed border border-black/20 text-black/40"
                              : "border border-black text-black hover:bg-black hover:text-white"
                          }`}
                        >
                          {referenceUploading ? "上传中..." : "📁 上传自定义图片"}
                        </label>
                        <span className="text-[10px] text-black/60">支持 JPEG/PNG/GIF/WebP</span>
                      </div>
                    </div>
                  </div>

                  {currentCategory.needsLogoUpload ? (
                    <>
                      <div className="rounded-[16px] border border-black/10 bg-black/[0.03] p-4">
                        <div className="flex items-center justify-between text-sm text-black">
                          <span>预设 Logo</span>
                          {uploadingLogo && <span className="text-[11px] text-black/60">上传中...</span>}
                        </div>
                        <div className="mt-3 min-h-[120px]">
                          {loadingPresetLogos ? (
                            <div className="text-xs text-black/60">加载中...</div>
                          ) : presetLogos.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {presetLogos.map((logo) => (
                                <button
                                  key={logo.path}
                                  onClick={() => handleSelectPresetLogo(logo.path)}
                                  disabled={uploadingLogo}
                                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 transition-colors ${
                                    logoPreviewUrl === logo.path
                                      ? "border-black bg-black text-white"
                                      : "border-black/20 text-black hover:border-black"
                                  } ${uploadingLogo ? "opacity-50" : ""}`}
                                >
                                  <img src={logo.path} alt={logo.name} className="h-12 w-12 object-contain" />
                                  <span className="text-[10px] text-black/60" title={logo.name}>
                                    {logo.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-black/60">暂无预设 Logo</div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-[16px] border border-black/10 bg-black/[0.03] p-4">
                        <div className="text-sm text-black">Logo 上传</div>
                        <div className="mt-3 flex items-center gap-4">
                          {logoPreviewUrl ? (
                            <img src={logoPreviewUrl} alt="Logo 预览" className="h-16 w-16 rounded border border-black/10 object-contain" />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-black/20 text-[10px] text-black/60">
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
                                  ? "cursor-not-allowed border border-black/20 text-black/40"
                                  : "border border-black text-black hover:bg-black hover:text-white"
                              }`}
                            >
                              {uploadingLogo ? "上传中..." : "📁 上传 Logo"}
                            </label>
                            <span className="text-[10px] text-black/60">支持 JPEG/PNG/GIF/WebP</span>
                            {logoImageUrl && <span className="text-xs text-black">✅ 已上传 Evolink</span>}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-[16px] border border-black/10 bg-black/[0.03] p-4 text-xs text-black/60">
                      本类型无需额外素材，只需默认参考图即可生成。
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                <div className="text-xs uppercase tracking-[0.4em] text-black/60">统计</div>
                <div className="mt-3 space-y-2 text-sm text-black/70">
                  <p>任务数：{tasks.length}</p>
                  <p>图片总数：{totalResultCount}</p>
                  <p>当前模型：{selectedModel}</p>
                  {currentCategory.needsLogoUpload ? (
                    <p>Logo 状态：{logoImageUrl ? "✅ 就绪" : uploadingLogo ? "⏳ 上传中" : "⚠️ 待上传"}</p>
                  ) : (
                    <p>素材要求：无需 Logo，仅参考图</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-black/10 bg-white p-6 text-black shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.4em] text-black/60">预览区</div>
                    <h2 className="mt-1 text-2xl font-semibold">{previewLabel}</h2>
                    <p className="text-sm text-black/60">实时查看默认参考或最新生成画面 · 比例 9:16</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <button
                      onClick={downloadAllImages}
                      disabled={downloadingAll || totalResultCount === 0}
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-black shadow-[0_10px_25px_rgba(0,0,0,0.06)] transition-colors hover:border-black disabled:cursor-not-allowed disabled:border-black/10 disabled:text-black/30"
                    >
                      {downloadingAll ? "下载中..." : "下载"}
                    </button>
                    <button
                      type="button"
                      disabled
                      className="rounded-full border border-black/10 px-4 py-2 text-black/40"
                    >
                      分享
                    </button>
                    <button
                      type="button"
                      onClick={handleScrollToHistory}
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-black shadow-[0_10px_25px_rgba(0,0,0,0.06)] transition-colors hover:border-black"
                    >
                      历史
                    </button>
                  </div>
                </div>
                <div className="mt-6 w-full overflow-hidden rounded-2xl border border-black/10 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.04),_transparent_60%)]">
                  <div className="relative mx-auto h-[160px] w-[90px] max-w-full overflow-hidden rounded-2xl bg-black/60 shadow-[0_0_40px_rgba(0,0,0,0.45)] md:h-[200px] md:w-[112px] lg:h-[240px] lg:w-[135px]">
                    {previewImage ? (
                      <img src={previewImage} alt={previewLabel} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-black/40">暂无预览</div>
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-white p-6 text-black shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                <div className="text-[11px] uppercase tracking-[0.45em] text-black/60">3. 文本设置</div>
                <div className="mt-4 flex flex-col gap-4">
                  {currentCategory.inputs.map((input) => (
                    <div key={input.key} className="flex flex-col gap-2">
                      <label className="text-sm text-black/80">{input.label}</label>
                      <input
                        type="text"
                        value={inputValues[input.key] || ""}
                        onChange={(e) => setInputValues((prev) => ({ ...prev, [input.key]: e.target.value }))}
                        placeholder={input.placeholder}
                        className="rounded-lg border border-black/20 bg-white px-4 py-3 text-black placeholder-black/40 focus:border-black focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="text-[11px] uppercase tracking-[0.4em] text-black/60">模型选择</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { value: "nano-banana-2-lite", label: "Nano Banana 2 Lite", desc: "快" },
                      { value: "gemini-3-pro-image-preview", label: "Gemini 3 Pro", desc: "高质" },
                    ].map((model) => (
                      <button
                        key={model.value}
                        onClick={() => setSelectedModel(model.value as Model)}
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                          selectedModel === model.value
                            ? "border-black bg-black text-white"
                            : "border-black/20 text-black hover:border-black"
                        }`}
                      >
                        <span>{model.label}</span>
                        <span className="text-[11px] text-black/50">{model.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled()}
                    className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,0,0,0.14)] transition-all hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/30 disabled:text-white/50"
                  >
                    {genLoading ? "生成中..." : "🚀 生成封面"}
                  </button>
                  <span className="text-[11px] text-black/60">9:16 · 2K · {selectedModel}</span>
                </div>

                {genError && <div className="mt-4 rounded border border-black/20 bg-black/5 p-3 text-sm text-black">{genError}</div>}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_18px_45px_rgba(0,0,0,0.06)]" ref={historySectionRef}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.4em] text-black/60">历史</div>
                <h3 className="text-lg font-semibold text-black">任务记录</h3>
                <p className="text-xs text-black/60">共 {tasks.length} 条 · {totalResultCount} 张图片</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setShowHistory((prev) => !prev)}
                  className="rounded-full border border-black/20 px-3 py-1 text-black transition-colors hover:border-black hover:text-black"
                >
                  {showHistory ? "收起" : "展开"}
                </button>
                <button
                  onClick={clear}
                  className="rounded-full border border-black/20 px-3 py-1 text-black/70 transition-colors hover:border-black hover:text-black"
                >
                  清空
                </button>
              </div>
            </div>

            {!showHistory ? (
              <div className="mt-4 rounded-xl border border-dashed border-black/20 bg-black/[0.03] p-6 text-center text-xs text-black/60">
                历史记录已折叠，需要时点击“展开”查看 AutoTask 进度。
              </div>
            ) : tasks.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-black/60">
                暂无生成记录。配置上方参数后点击“生成封面”即可在此查看。
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    id={task.id}
                    createdAt={task.createdAt}
                    title={task.prompt}
                    subtitle={CATEGORIES[task.meta?.category as CategoryKey]?.name || task.meta?.category}
                    onRemove={() => removeTask(task.id)}
                  >
                    <div className="mt-3 rounded-xl border border-black/10 bg-black/5 p-3">
                      <AutoTaskQuery
                        apiKey={effectiveApiKey}
                        taskId={task.id}
                        onResultsUpdate={(urls) => updateResults(task.id, urls)}
                      />
                    </div>
                  </TaskCard>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
