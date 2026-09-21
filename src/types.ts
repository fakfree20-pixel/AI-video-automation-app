export interface Scene {
  scene_number: number;
  narration: string;
  broll_keyword: string;
}

export interface GenerationResult {
  rewritten_script: string;
  scenes: Scene[];
}
