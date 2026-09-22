export interface Scene {
  scene_number: number;
  narration: string;
  broll_keyword: string;
  video_url?: string;
}

export interface GenerationResult {
  rewritten_script: string;
  scenes: Scene[];
  audio_url?: string;
}
