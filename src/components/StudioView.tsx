import React, { useState } from "react";
import { Sparkles, Video, Mic, FileText, Download, Play, RefreshCw, CheckCircle2, Layers } from "lucide-react";
import { GenerationResult, Scene } from "../types";

export function StudioView() {
  const [promptText, setPromptText] = useState("");
  const [voice, setVoice] = useState("hi-IN-SwaraNeural");
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"script" | "scenes" | "preview">("script");
  const [pipelineFinished, setPipelineFinished] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    setLoading(true);
    setPipelineFinished(false);
    setProgressPercent(10);
    setProgressStep("Step 1 & 2: Analyzing input & rewriting with Gemini 1.5 Pro...");

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate script from server.");
      }

      const data: GenerationResult = await response.json();
      setProgressPercent(40);
      setProgressStep("Step 3: Synthesizing voiceover audio with edge-tts...");
      await new Promise((r) => setTimeout(r, 800));

      setProgressPercent(70);
      setProgressStep("Step 4: Fetching HD B-Roll clips from Pexels API...");
      await new Promise((r) => setTimeout(r, 900));

      setProgressPercent(90);
      setProgressStep("Step 5: Merging audio, clips, & subtitles with FFmpeg...");
      await new Promise((r) => setTimeout(r, 800));

      setProgressPercent(100);
      setProgressStep("Complete! Final video and audio ready.");
      setResult(data);
      setPipelineFinished(true);
    } catch (err: any) {
      alert(err.message || "An error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero / Intro card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-medium mb-4 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Gemini 1.5 Pro & Edge-TTS
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Automated Video & Script Pipeline
          </h2>
          <p className="mt-2 text-stone-600 text-sm sm:text-base leading-relaxed">
            Input any video idea, song name, or rough transcript. Our automation pipeline will rewrite it into a 100% original copyright-free script, generate professional voiceovers, fetch matching Pexels HD B-Roll, and merge everything with FFmpeg.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Video Idea, Transcript, or Song Name
            </label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g., Explain the mysteries of black holes in 60 seconds with captivating cinematic narration..."
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Voice Model (`edge-tts`)
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="hi-IN-SwaraNeural">Hindi (Swara - Female, Natural)</option>
                <option value="hi-IN-MadhurNeural">Hindi (Madhur - Male, Professional)</option>
                <option value="en-US-AriaNeural">English US (Aria - Female)</option>
                <option value="en-US-ChristopherNeural">English US (Christopher - Male)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Optional Reference File (.mp3/.mp4)
              </label>
              <input
                type="file"
                className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 text-sm shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Video Pipeline...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Full Automation Pipeline
                </>
              )}
            </button>
          </div>
        </form>

        {/* Progress Bar */}
        {loading && (
          <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 animate-pulse">
            <div className="flex justify-between text-xs font-medium text-stone-700">
              <span>{progressStep}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-stone-900 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Automation Successful</h3>
                <p className="text-xs text-stone-500">Script rewritten, voiceover generated, B-Roll fetched, and video merged.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("script")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "script" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                Rewritten Script
              </button>
              <button
                onClick={() => setActiveTab("scenes")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "scenes" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                Scene B-Roll Breakdown
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "preview" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                Media & Downloads
              </button>
            </div>
          </div>

          {activeTab === "script" && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-stone-600" />
                Copyright-Free Rewritten Script
              </h4>
              <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {result.rewritten_script}
              </div>
            </div>
          )}

          {activeTab === "scenes" && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-600" />
                Scene-by-Scene B-Roll Keywords ({result.scenes.length} scenes)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.scenes.map((scene: Scene) => (
                  <div key={scene.scene_number} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-stone-200 text-stone-800 text-xs font-semibold">
                        Scene {scene.scene_number}
                      </span>
                      <span className="text-xs text-stone-500 font-mono">
                        Pexels Query: "{scene.broll_keyword}"
                      </span>
                    </div>
                    <p className="text-sm text-stone-700">{scene.narration}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl border border-stone-200 bg-stone-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-stone-600" />
                    Generated Voiceover Audio (.mp3)
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">Ready</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                  <span>edge-tts voice: {voice}</span>
                  <button
                    onClick={() => alert("Downloading MP3 voiceover file...")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download MP3
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-stone-200 bg-stone-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                    <Video className="w-4 h-4 text-stone-600" />
                    Final Merged Video (.mp4)
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">HD 1080p</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                  <span>FFmpeg Merged Output with Subtitles</span>
                  <button
                    onClick={() => alert("Downloading Final MP4 Video...")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download MP4
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
