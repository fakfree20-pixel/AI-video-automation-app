"""
AI Video Automation Studio - Complete Modular Python Script
Author: AI Studio Assistant
Description: Automates end-to-end AI video creation using Google Gemini API, edge-tts, Pexels API, FFmpeg, and Gradio.
"""

import os
import sys
import time
import asyncio
import tempfile
from typing import List, Dict, Any, Tuple

# Third-party imports check & graceful handling
try:
    import google.generativeai as genai
except ImportError:
    print("Error: google-generativeai package not found. Run: pip install google-generativeai")
    sys.exit(1)

try:
    import edge_tts
except ImportError:
    print("Error: edge-tts package not found. Run: pip install edge-tts")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("Error: requests package not found. Run: pip install requests")
    sys.exit(1)

try:
    import gradio as gr
except ImportError:
    print("Error: gradio package not found. Run: pip install gradio")
    sys.exit(1)


# ==========================================
# STEP 1: CONFIGURATION & CLIENT SETUP
# ==========================================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")

if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY environment variable is not set. Please configure it.")

# Configure Gemini (using Gemini 1.5 Pro / Flash as required)
genai.configure(api_key=GEMINI_API_KEY)


# ==========================================
# STEP 2: SCRIPT REWRITING & B-ROLL KEYWORDS
# ==========================================

def rewrite_script_and_get_broll(input_text: str) -> Tuple[str, List[Dict[str, str]]]:
    """
    Uses Gemini 1.5 Pro to rewrite the input prompt/script into a 100% original,
    copyright-free engaging script and generates scene-by-scene B-Roll keywords.
    """
    print("[Step 2] Rewriting script and generating B-Roll keywords with Gemini...")
    
    prompt = f"""
    You are an expert viral video producer and scriptwriter.
    Take the following input (video idea, song name, transcript, or draft):
    
    \"\"\"
    {input_text}
    \"\"\"
    
    Task:
    1. Rewrite this into a 100% original, engaging, copyright-free video script (Hinglish/Hindi/English as appropriate).
    2. Break down the script into logical scenes. For each scene, provide precise B-Roll search keywords for Pexels stock video.
    
    Output strictly in the following JSON format:
    {{
      "rewritten_script": "Full rewritten script text here...",
      "scenes": [
        {{"scene_number": 1, "narration": "Line for scene 1", "broll_keyword": "cinematic sunset drone shot"}},
        {{"scene_number": 2, "narration": "Line for scene 2", "broll_keyword": "busy tech office workflow"}}
      ]
    }}
    """
    
    try:
        model = genai.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        import json
        data = json.loads(response.text)
        rewritten_script = data.get("rewritten_script", input_text)
        scenes = data.get("scenes", [])
        return rewritten_script, scenes
        
    except Exception as e:
        print(f"Error in Gemini script rewriting: {e}")
        # Fallback default script
        fallback_scenes = [
            {"scene_number": 1, "narration": input_text, "broll_keyword": "cinematic abstract background"}
        ]
        return input_text, fallback_scenes


# ==========================================
# STEP 3: VOICE GENERATION (edge-tts)
# ==========================================

async def generate_voice_async(text: str, output_audio_path: str, voice: str = "hi-IN-SwaraNeural") -> str:
    """
    Converts text into high-quality MP3 audio using edge-tts.
    Default voice: hi-IN-SwaraNeural (Hindi female) or en-US-AriaNeural (English).
    """
    print(f"[Step 3] Generating voiceover audio using edge-tts (Voice: {voice})...")
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_audio_path)
    return output_audio_path


def generate_voice(text: str, output_audio_path: str, voice: str = "hi-IN-SwaraNeural") -> str:
    """Synchronous wrapper for edge-tts generation."""
    try:
        asyncio.run(generate_voice_async(text, output_audio_path, voice))
        return output_audio_path
    except Exception as e:
        print(f"Error generating voice with edge-tts: {e}")
        raise e


# ==========================================
# STEP 4: MEDIA FETCHING (Pexels API)
# ==========================================

def fetch_pexels_videos(scenes: List[Dict[str, str]], output_dir: str) -> List[str]:
    """
    Automatically fetches free HD video clips from Pexels based on B-Roll keywords.
    """
    print("[Step 4] Fetching HD video clips from Pexels API...")
    downloaded_clips = []
    headers = {"Authorization": PEXELS_API_KEY} if PEXELS_API_KEY else {}
    
    os.makedirs(output_dir, exist_ok=True)
    
    for i, scene in enumerate(scenes):
        keyword = scene.get("broll_keyword", "cinematic nature")
        print(f"Searching Pexels for keyword: '{keyword}'...")
        
        url = f"https://api.pexels.com/videos/search?query={requests.utils.quote(keyword)}&per_page=1&orientation=landscape"
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                videos = data.get("videos", [])
                if videos:
                    # Get HD video file link
                    video_files = videos[0].get("video_files", [])
                    # Sort by quality/width to get HD
                    hd_files = [vf for vf in video_files if vf.get("width", 0) >= 1280]
                    target_file = hd_files[0] if hd_files else (video_files[0] if video_files else None)
                    
                    if target_file and target_file.get("link"):
                        video_url = target_file["link"]
                        clip_path = os.path.join(output_dir, f"clip_{i+1}.mp4")
                        
                        v_res = requests.get(video_url, stream=True, timeout=15)
                        if v_res.status_code == 200:
                            with open(clip_path, "wb") as f:
                                for chunk in v_res.iter_content(chunk_size=8192):
                                    f.write(chunk)
                            downloaded_clips.append(clip_path)
                            print(f"Downloaded clip {i+1} successfully.")
                            continue
            
            # Fallback placeholder if Pexels fails or no key
            print(f"Pexels fetch skipped or failed for '{keyword}'. Creating fallback clip marker.")
            fallback_path = os.path.join(output_dir, f"clip_{i+1}.mp4")
            # Create a simple color clip using ffmpeg if possible, or mark missing
            downloaded_clips.append(fallback_path)
            
        except Exception as e:
            print(f"Error fetching Pexels video for '{keyword}': {e}")
            fallback_path = os.path.join(output_dir, f"clip_{i+1}.mp4")
            downloaded_clips.append(fallback_path)
            
    return downloaded_clips


# ==========================================
# STEP 5: VIDEO MERGING (FFmpeg)
# ==========================================

def merge_video_with_ffmpeg(audio_path: str, clip_paths: List[str], output_video_path: str) -> str:
    """
    Uses FFmpeg to combine audio, video clips, and generate final MP4 video.
    """
    print("[Step 5] Merging media and audio using FFmpeg...")
    
    # If ffmpeg is not installed or clips are placeholders, simulate/build with ffmpeg
    import subprocess
    
    # Create a temporary file list for ffmpeg concat if multiple clips exist
    concat_list_path = os.path.join(tempfile.gettempdir(), "concat_list.txt")
    
    valid_clips = [c for c in clip_paths if os.path.exists(c) and os.path.getsize(c) > 0]
    
    if not valid_clips:
        # Create a blank dummy video if no clips downloaded
        print("No valid video clips found. Generating color background video via FFmpeg...")
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", "color=c=blue:s=1280x720:d=10",
            "-i", audio_path,
            "-c:v", "libx264", "-c:a", "aac", "-shortest",
            output_video_path
        ]
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return output_video_path
        except Exception as e:
            print(f"FFmpeg generation error: {e}")
            raise e

    # Concat clips
    with open(concat_list_path, "w") as f:
        for clip in valid_clips:
            f.write(f"file '{os.path.abspath(clip)}'\\n")
            
    concat_video = os.path.join(tempfile.gettempdir(), "concatenated.mp4")
    concat_cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list_path, "-c", "copy", concat_video
    ]
    
    try:
        subprocess.run(concat_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except Exception:
        # If concat demuxer fails, just take the first clip
        concat_video = valid_clips[0]

    # Combine video and audio
    final_cmd = [
        "ffmpeg", "-y",
        "-i", concat_video,
        "-i", audio_path,
        "-c:v", "libx264", "-c:a", "aac",
        "-map", "0:v:0", "-map", "1:a:0",
        "-shortest",
        output_video_path
    ]
    
    try:
        subprocess.run(final_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"Final video successfully generated at: {output_video_path}")
        return output_video_path
    except Exception as e:
        print(f"Error running FFmpeg merge: {e}")
        raise e


# ==========================================
# MASTER PIPELINE ORCHESTRATOR
# ==========================================

def run_pipeline(input_text: str, uploaded_file=None, progress=gr.Progress()) -> Tuple[str, str, str]:
    """
    Orchestrates the full end-to-end video automation pipeline.
    """
    progress(0.1, desc="Step 1: Processing input...")
    time.sleep(0.5)
    
    if not input_text and uploaded_file:
        input_text = f"Custom uploaded media processed script from {uploaded_file.name}"
    elif not input_text:
        input_text = "The beauty of artificial intelligence and automated content creation."

    # Step 2: Gemini Script Rewriting & B-Roll keywords
    progress(0.3, desc="Step 2: Rewriting script with Gemini 1.5 Pro & generating B-Roll...")
    rewritten_script, scenes = rewrite_script_and_get_broll(input_text)
    
    # Step 3: Voice Generation
    progress(0.5, desc="Step 3: Generating voiceover audio with edge-tts...")
    temp_dir = tempfile.mkdtemp()
    audio_path = os.path.join(temp_dir, "voiceover.mp3")
    generate_voice(rewritten_script, audio_path, voice="hi-IN-SwaraNeural")
    
    # Step 4: Pexels Media Fetching
    progress(0.7, desc="Step 4: Fetching stock video clips from Pexels API...")
    clip_paths = fetch_pexels_videos(scenes, temp_dir)
    
    # Step 5: FFmpeg Video Merging
    progress(0.9, desc="Step 5: Merging audio and video with FFmpeg...")
    output_video_path = os.path.join(temp_dir, "final_output.mp4")
    merge_video_with_ffmpeg(audio_path, clip_paths, output_video_path)
    
    progress(1.0, desc="Done! Ready for download.")
    return rewritten_script, audio_path, output_video_path


# ==========================================
# STEP 6: GRADIO WEB INTERFACE
# ==========================================

def create_gradio_ui():
    with gr.Blocks(theme=gr.themes.Soft(), title="AI Video Automation Studio") as demo:
        gr.Markdown("# 🎬 AI Video Automation Studio")
        gr.Markdown("Automated script rewriting (Gemini 1.5 Pro), voiceover (`edge-tts`), Pexels B-Roll fetching, and FFmpeg video assembly.")
        
        with gr.Row():
            with gr.Column():
                input_box = gr.Textbox(
                    label="Video Idea / Script / Song Name / Transcript",
                    placeholder="e.g., Explain quantum computing in 60 seconds with engaging examples...",
                    lines=4
                )
                file_upload = gr.File(
                    label="Optional Reference File (.mp3 / .mp4 / .txt)",
                    file_types=[".mp3", ".mp4", ".txt"]
                )
                submit_btn = gr.Button("🚀 Generate AI Video & Audio", variant="primary")
                
            with gr.Column():
                output_script = gr.Textbox(label="Rewritten Copyright-Free Script", lines=6)
                with gr.Row():
                    output_audio = gr.Audio(label="Generated Voiceover (MP3)", type="filepath")
                    output_video = gr.Video(label="Final Merged Video (MP4)")
                    
        submit_btn.click(
            fn=run_pipeline,
            inputs=[input_box, file_upload],
            outputs=[output_script, output_audio, output_video]
        )
        
    return demo


if __name__ == "__main__":
    if os.environ.get("CI") or os.environ.get("GITHUB_ACTIONS"):
        print("Running in CI / GitHub Actions mode...")
        prompt = os.environ.get("PROMPT_TEXT", "The beauty of artificial intelligence and automated content creation.")
        try:
            run_pipeline(prompt)
            print("Pipeline execution successfully completed in CI.")
        except Exception as e:
            print(f"Pipeline execution failed: {e}")
            sys.exit(1)
    else:
        print("Starting Gradio Web Interface for AI Video Automation Studio...")
        demo = create_gradio_ui()
        demo.launch(server_name="0.0.0.0", server_port=7860, share=False)
