"use client";

import { useState } from "react";

export default function TestAPIPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult("测试中...\n");

    const apiKey = process.env.NEXT_PUBLIC_EVOLINK_API_KEY || "";
    
    if (!apiKey) {
      setResult("❌ 未找到 API Key，请检查 .env.local 文件");
      setLoading(false);
      return;
    }

    setResult((prev) => prev + `✅ API Key: ${apiKey.substring(0, 10)}...\n\n`);

    // 测试 1: 简单的 fetch 请求
    setResult((prev) => prev + "📡 测试 1: 直接 fetch 请求\n");
    try {
      const response = await fetch("https://api.evolink.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "nano-banana-2-lite",
          prompt: "a cute cat",
          size: "1:1",
          quality: "1K",
        }),
      });

      setResult((prev) => prev + `状态码: ${response.status} ${response.statusText}\n`);
      
      const data = await response.json();
      setResult((prev) => prev + `响应: ${JSON.stringify(data, null, 2)}\n\n`);
      
      if (response.ok) {
        setResult((prev) => prev + "✅ 测试成功！API 可以正常访问\n");
      } else {
        setResult((prev) => prev + `❌ API 返回错误: ${data.error?.message || '未知错误'}\n`);
      }
    } catch (error: any) {
      setResult((prev) => prev + `❌ 请求失败: ${error.message}\n`);
      
      if (error.message === "Failed to fetch") {
        setResult((prev) => prev + `
可能的原因：
1. CORS 问题 - 浏览器阻止了跨域请求
2. 网络问题 - 无法连接到 API 服务器
3. API Key 无效

请检查浏览器控制台的 Network 标签查看详细错误
`);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">API 连接测试</h1>
        
        <button
          onClick={testAPI}
          disabled={loading}
          className="px-6 py-3 bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 font-medium mb-4"
        >
          {loading ? "测试中..." : "开始测试"}
        </button>

        <pre className="bg-gray-900 p-4 rounded border border-gray-800 whitespace-pre-wrap font-mono text-sm">
          {result || "点击按钮开始测试..."}
        </pre>

        <div className="mt-8 border-t border-gray-800 pt-8">
          <h2 className="text-xl font-bold mb-4">调试步骤</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>打开浏览器开发者工具（F12）</li>
            <li>切换到 Console 标签，查看日志</li>
            <li>切换到 Network 标签，查看网络请求</li>
            <li>点击"开始测试"按钮</li>
            <li>查看 Network 标签中的请求详情</li>
            <li>如果看到红色的请求，点击查看错误信息</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

