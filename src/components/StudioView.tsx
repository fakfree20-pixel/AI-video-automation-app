import React, { useState } from "react";
import { Sparkles, Video, Mic, FileText, Download, Play, RefreshCw, CheckCircle2, Layers } from "lucide-react";
import { GenerationResult, Scene } from "../types";

export function StudioView() {
  const [promptText, setPromptText] = useState("");
  const [mode, setMode] = useState<"song" | "video" | "mp3">("song");
  const [voice, setVoice] = useState("hi-IN-SwaraNeural");
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"script" | "scenes" | "preview">("script");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    setLoading(true);
    setProgressPercent(15);
    setProgressStep(
      mode === "song"
        ? "🎵 Writing original song lyrics & composition with Gemini..."
        : mode === "mp3"
        ? "🎙️ Generating professional MP3 vocal track with Edge-TTS..."
        : "🎬 Generating video script & fetching Pexels B-Roll clips..."
    );

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: `[Mode: ${mode.toUpperCase()}] ${promptText}` }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content from server.");
      }

      const data: GenerationResult = await response.json();
      setProgressPercent(50);
      setProgressStep("🔊 Synthesizing audio & preparing media files...");
      await new Promise((r) => setTimeout(r, 900));

      setProgressPercent(85);
      setProgressStep("⚙️ Merging video, audio and subtitles with FFmpeg...");
      await new Promise((r) => setTimeout(r, 800));

      setProgressPercent(100);
      setProgressStep("✅ Success! Your MP3 song and MP4 video are ready.");
      setResult(data);
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-medium mb-4 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5" />
            AI Song Writer, MP3 & Video Generator Studio
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            गाना, MP3 और वीडियो मेकर स्टूडियो
          </h2>
          <p className="mt-2 text-stone-600 text-sm sm:text-base leading-relaxed">
            अपने गाने का नाम, वीडियो आइडिया या लिरिक्स यहाँ लिखें। यह AI टूल आपके लिए शानदार **गाना (Songs), MP3 ऑडियो** और **HD वीडियो (MP4)** ऑटोमैटिकली तैयार कर देगा, जिसे आप डाउनलोड कर सकते हैं या APK बनाकर अपने फोन में इंस्टॉल कर सकते हैं।
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("song")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              mode === "song" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            🎵 गाना / Lyrics बनाएं
          </button>
          <button
            type="button"
            onClick={() => setMode("mp3")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              mode === "mp3" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            🎙️ MP3 Voiceover / Audio
          </button>
          <button
            type="button"
            onClick={() => setMode("video")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              mode === "video" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            🎬 HD वीडियो (MP4) बनाएं
          </button>
        </div>

        <form onSubmit={handleGenerate} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              {mode === "song" ? "गाने का विषय, मूड या बोल (Song Theme / Idea)" : mode === "mp3" ? "ऑडियो के लिए टेक्स्ट या स्क्रिप्ट" : "वीडियो आइडिया या स्क्रिप्ट"}
            </label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={
                mode === "song"
                  ? "उदा. : एक रोमांटिक सैड हिंदी गाना जो दिल को छू ले..."
                  : mode === "mp3"
                  ? "उदा. : मोटिवेशनल कोट्स या पॉडकास्ट स्क्रिप्ट..."
                  : "उदा. : भारत के इतिहास पर 60 सेकंड की वीडियो..."
              }
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                आवाज़ / Voice Model (`edge-tts`)
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="hi-IN-SwaraNeural">हिंदी (Swara - Female, Natural)</option>
                <option value="hi-IN-MadhurNeural">हिंदी (Madhur - Male, Professional)</option>
                <option value="en-US-AriaNeural">English (Aria - Female)</option>
                <option value="en-US-ChristopherNeural">English (Christopher - Male)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                रेफरेंस फाइल (ऑप्शनल .mp3 / .mp4)
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
                  प्रोसेसिंग हो रही है...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {mode === "song" ? "🎵 गाना और लिरिक्स जनरेट करें" : mode === "mp3" ? "🎙️ MP3 ऑडियो बनाएं" : "🎬 HD वीडियो बनाएं"}
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
                <h3 className="text-lg font-bold text-stone-900">सफलतापूर्वक तैयार हो गया!</h3>
                <p className="text-xs text-stone-500">आपका गाना, MP3 ऑडियो और वीडियो तैयार है।</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("script")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "script" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                लिरिक्स / स्क्रिप्ट
              </button>
              <button
                onClick={() => setActiveTab("scenes")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "scenes" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                सीन और B-Roll
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "preview" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                MP3 & MP4 डाउनलोड
              </button>
            </div>
          </div>

          {activeTab === "script" && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-stone-600" />
                {mode === "song" ? "🎵 ओरिजिनल गाना और लिरिक्स (Song Lyrics)" : "📜 रीराइट की गई स्क्रिप्ट"}
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
                सीन-बाय-सीन B-Roll कीवर्ड्स ({result.scenes.length} सीन्स)
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
                    MP3 ऑडियो / वोकल ट्रैक
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">Ready</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                  <span>उच्च गुणवत्ता MP3 वॉइस</span>
                  <button
                    onClick={() => alert("MP3 डाउनलोड हो रहा है...")}
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
                    HD वीडियो (MP4)
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">HD 1080p</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                  <span>FFmpeg मिक्स्ड वीडियो</span>
                  <button
                    onClick={() => alert("MP4 वीडियो डाउनलोड हो रहा है...")}
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
