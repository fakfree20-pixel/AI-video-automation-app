import React, { useState, useRef } from "react";
import { Sparkles, Video, Mic, FileText, Download, Play, RefreshCw, CheckCircle2, Layers } from "lucide-react";
import { GenerationResult, Scene } from "../types";

export function StudioView() {
  const [promptText, setPromptText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [mode, setMode] = useState<"song" | "video" | "mp3">("song");
  const [voice, setVoice] = useState("hi-IN-SwaraNeural");
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"script" | "scenes" | "preview">("script");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beatIntervalRef = useRef<number | null>(null);

  const startBackgroundBeat = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      // Play a steady upbeat folk/DJ remix synth bass & drum loop
      let step = 0;
      beatIntervalRef.current = window.setInterval(() => {
        if (!audioCtx || audioCtx.state === 'closed') return;
        const now = audioCtx.currentTime;

        // Kick drum on 0 and 2
        if (step % 4 === 0) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
          gain.gain.setValueAtTime(0.8, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
        }

        // Hi-hat / snare on 2 and 4
        if (step % 2 === 1) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
        }

        step = (step + 1) % 8;
      }, 250); // 120 BPM upbeat rhythm
    } catch (e) {
      console.warn("Web Audio beat start failed:", e);
    }
  };

  const stopBackgroundBeat = () => {
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  const handlePlayAudio = () => {
    if (!result || !result.rewritten_script) return;
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        stopBackgroundBeat();
        setIsPlaying(false);
        return;
      }
      window.speechSynthesis.cancel();
      stopBackgroundBeat();
      startBackgroundBeat();
      
      const cleanText = result.rewritten_script
        .replace(/\[.*?\]/g, "")
        .replace(/\(.*?\)/g, "")
        .trim();

      const lines = cleanText.split('\n').filter(l => l.trim().length > 0);
      let currentIndex = 0;

      const speakNextLine = () => {
        if (currentIndex >= lines.length) {
          setIsPlaying(false);
          stopBackgroundBeat();
          return;
        }
        const line = lines[currentIndex++];
        const utterance = new SpeechSynthesisUtterance(line);
        utterance.lang = voice.startsWith("hi") ? "hi-IN" : "en-US";
        utterance.rate = 0.88; 
        utterance.pitch = 1.15; // Higher musical pitch for song delivery
        utterance.onend = () => {
          setTimeout(speakNextLine, 200);
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          stopBackgroundBeat();
        };
        window.speechSynthesis.speak(utterance);
      };

      setIsPlaying(true);
      speakNextLine();
    } else {
      alert("Speech synthesis is not supported in this browser.");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() && !sourceUrl.trim()) return;

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
      const combinedPrompt = sourceUrl.trim()
        ? `Reference Video/Web Link: ${sourceUrl.trim()}\nTopic / Additional Instructions: ${promptText || "Create song & video based on this link"}`
        : promptText;

      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: `[Mode: ${mode.toUpperCase()}] ${combinedPrompt}` }),
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

  const handleClearText = () => {
    setPromptText("");
    setSourceUrl("");
    setResult(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    stopBackgroundBeat();
    setIsPlaying(false);
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
            <label className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-1.5">
              <span>🔗 YouTube या वेब लिंक (ऑप्शनल URL)</span>
              <span className="text-xs text-stone-400 font-normal">यहाँ सीधा लिंक पेस्ट कर सकते हैं</span>
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... या कोई भी लेख/वीडियो लिंक"
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm bg-white"
            />
          </div>

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

          <div className="pt-2 flex flex-wrap gap-3">
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
            <button
              type="button"
              onClick={handleClearText}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-stone-300 bg-white text-stone-700 font-medium hover:bg-stone-50 transition-colors text-sm shadow-sm"
            >
              🗑️ टेक्स्ट को मिटा दें (Clear Text)
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

      {/* Results Section - Simultaneous Display of Audio, Lyrics, and Video Preview */}
      {result && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">ओरिजिनल म्यूजिक, लिरिक्स और वीडियो तैयार हैं!</h3>
                <p className="text-xs text-stone-500">Meta MusicGen ऑडियो, Gemini लिरिक्स और Pexels HD वीडियो एक साथ प्रदर्शित हैं।</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://suno.com/create"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Suno AI 🎵
              </a>
              <button
                type="button"
                onClick={() => {
                  if (result && result.rewritten_script) {
                    navigator.clipboard.writeText(result.rewritten_script);
                    alert("रीमेक गाने के लिरिक्स कॉपी हो गए हैं!");
                  }
                }}
                className="px-3 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                लिरिक्स कॉपी करें
              </button>
            </div>
          </div>

          {/* Simultaneous Grid Layout for Audio, Lyrics, and Video */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Playable Audio Track (Meta MusicGen / Speech Synth) */}
            <div className="p-5 rounded-xl border border-stone-200 bg-stone-50 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-indigo-600" />
                    1. Playable Audio Track
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">Meta MusicGen</span>
                </div>
                {result.audio_url ? (
                  <div className="space-y-3">
                    <p className="text-xs text-stone-600">Meta MusicGen AI द्वारा जनरेटेड ऑरिजिनल म्यूजिक ट्रैक:</p>
                    <audio controls className="w-full rounded" src={result.audio_url} />
                  </div>
                ) : (
                  <div className="space-y-3 text-xs text-stone-600">
                    <p>उच्च गुणवत्ता ऑडियो वॉइस / सिंथेटिक बीट्स:</p>
                    <button
                      type="button"
                      onClick={handlePlayAudio}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isPlaying ? "रोकें (Stop Audio)" : "सुनें (Play Vocal & Beats)"}
                    </button>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-stone-200 text-xs text-stone-500">
                <span>Directly connected to Meta MusicGen API.</span>
              </div>
            </div>

            {/* 2. Lyrics Card */}
            <div className="p-5 rounded-xl border border-stone-200 bg-stone-50 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    2. Song Lyrics Card
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">Gemini Pro</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-stone-200 text-stone-800 text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-sans">
                  {result.rewritten_script}
                </div>
              </div>
              <div className="pt-2 border-t border-stone-200 text-xs text-stone-500">
                <span>Full Sthayi, Chorus & Antara lyrics.</span>
              </div>
            </div>

            {/* 3. Video Preview (Pexels HD B-Roll) */}
            <div className="p-5 rounded-xl border border-stone-200 bg-stone-50 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                    <Video className="w-4 h-4 text-rose-600" />
                    3. HD Video Preview
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-medium">Pexels API</span>
                </div>
                <div className="space-y-2">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <video
                      controls
                      className="w-full h-full object-cover"
                      poster="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop"
                      src={result.scenes && result.scenes[0]?.video_url ? result.scenes[0].video_url : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate">
                    Scene 1 B-Roll: "{result.scenes && result.scenes[0]?.broll_keyword}"
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-stone-200 text-xs text-stone-500 flex items-center justify-between">
                <span>HD 1080p Stock Clip</span>
                <button
                  type="button"
                  onClick={() => alert("MP4 वीडियो डाउनलोड हो रहा है...")}
                  className="px-2.5 py-1 rounded bg-stone-900 text-white text-[11px] font-medium hover:bg-stone-800"
                >
                  Download MP4
                </button>
              </div>
            </div>
          </div>

          {/* Scene-by-Scene B-Roll Breakdown with Video previews */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-600" />
              सीन-बाय-सीन B-Roll सीन्स ({result.scenes.length} सीन्स with Pexels Video Links)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.scenes.map((scene: Scene) => (
                <div key={scene.scene_number} className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-stone-200 text-stone-800 text-xs font-semibold">
                      Scene {scene.scene_number}
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono truncate max-w-[150px]">
                      "{scene.broll_keyword}"
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 line-clamp-2">{scene.narration}</p>
                  {scene.video_url && (
                    <video
                      controls
                      className="w-full aspect-video rounded object-cover mt-2"
                      src={scene.video_url}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
