/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { StudioView } from "./components/StudioView";
import { PythonScriptView } from "./components/PythonScriptView";
import { Film, Code2, Sparkles, ShieldCheck } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<"studio" | "script">("studio");

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-900 tracking-tight">
                AI Video Automation Studio
              </h1>
              <p className="text-xs text-stone-500">Gemini 1.5 Pro • Edge-TTS • Pexels • FFmpeg • Gradio</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTab("studio")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentTab === "studio"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Live Studio
            </button>
            <button
              onClick={() => setCurrentTab("script")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentTab === "script"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Python Script
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === "studio" ? <StudioView /> : <PythonScriptView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AI Video Automation Studio. Built with Google AI Studio.</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure Server-Side Gemini API Integration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

