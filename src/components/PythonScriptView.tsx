import React, { useEffect, useState } from "react";
import { Code2, Copy, Check, Download, Terminal, BookOpen } from "lucide-react";

export function PythonScriptView() {
  const [code, setCode] = useState<string>("Loading Python script...");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/python-script")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load python script.");
        return res.json();
      })
      .then((data) => {
        setCode(data.code);
      })
      .catch((err) => {
        setError(err.message);
        setCode("# Error loading python script file.");
      });
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "python_script.py";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-medium mb-3 border border-blue-200">
              <Code2 className="w-3.5 h-3.5" />
              Complete Python Automation Script
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              `python_script.py` Source Code
            </h2>
            <p className="mt-1 text-stone-600 text-sm">
              Modular Python script featuring Gemini 1.5 Pro, edge-tts, Pexels API, FFmpeg merging, and Gradio UI.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download python_script.py
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              1. Installation Prerequisites
            </h4>
            <pre className="p-3 bg-stone-900 text-stone-100 rounded-lg text-xs font-mono overflow-x-auto">
              pip install google-generativeai edge-tts requests gradio
            </pre>
            <p className="text-xs text-stone-500">Ensure FFmpeg is installed on your system path (`sudo apt install ffmpeg`).</p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              2. Execution Command
            </h4>
            <pre className="p-3 bg-stone-900 text-stone-100 rounded-lg text-xs font-mono overflow-x-auto">
              export GEMINI_API_KEY="your_key"<br />
              export PEXELS_API_KEY="your_key"<br />
              python python_script.py
            </pre>
            <p className="text-xs text-stone-500">Launches Gradio UI locally on http://localhost:7860</p>
          </div>
        </div>
      </div>

      {/* Code Display Box */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 p-6 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 text-stone-400 text-xs font-mono">
          <span>python_script.py</span>
          <span>Python 3.10+</span>
        </div>
        <pre className="mt-4 text-stone-200 text-xs font-mono overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
