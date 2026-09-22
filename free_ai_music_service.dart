import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

class FreeAIMusicService {
  final String geminiApiKey = "AQ.Ab8RN6Ihh49iIUP1jbkFTZPf6oCDCc8q7gCR...";
  final String pexelsApiKey = "YOOR5VOhX9KCcpNf3MORgOTzle1pdaBaOwOmrcD2ibY431uBcam1UCRH";

  // 1. Gemini से 100% ओरिजिनल हिंदी लिरिक्स जनरेट करना
  Future<Map<String, String>?> generateFreeLyrics(String userIdea) async {
    final url = Uri.parse(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$geminiApiKey'
    );

    final prompt = '''
    Act as a professional Hindi songwriter. 
    Transform this idea: "$userIdea" into a 100% original rhyming Hindi song.
    
    Return strict JSON with NO markdown formatting:
    {
      "lyrics": "Short rhyming 4-line Hindi lyrics",
      "music_prompt": "Short English prompt for background music track, e.g., acoustic lo-fi guitar beat 90 bpm",
      "video_keyword": "single English keyword for stock video background"
    }
    ''';

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "contents": [{"parts": [{"text": prompt}]}]
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        String rawText = data['candidates'][0]['content']['parts'][0]['text'];
        rawText = rawText.replaceAll('```json', '').replaceAll('```', '').trim();
        Map<String, dynamic> jsonMap = jsonDecode(rawText);

        return {
          "lyrics": jsonMap["lyrics"] ?? "",
          "music_prompt": jsonMap["music_prompt"] ?? "lo-fi beat",
          "video_keyword": jsonMap["video_keyword"] ?? "nature"
        };
      }
    } catch (e) {
      print("Gemini Error: $e");
    }
    return null;
  }

  // 2. Meta MusicGen (HuggingFace Free API) से मुफ़्त ट्यून जनरेट करना
  Future<String?> generateFreeMusicTrack(String musicPrompt) async {
    final url = Uri.parse('https://api-inference.huggingface.co/models/facebook/musicgen-small');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({"inputs": musicPrompt}),
      );

      if (response.statusCode == 200) {
        final dir = await getTemporaryDirectory();
        final file = File('${dir.path}/music.wav');
        await file.writeAsBytes(response.bodyBytes);
        return file.path; // जनरेट की गई ऑडियो फ़ाइल का लोकल पाथ
      }
    } catch (e) {
      print("MusicGen Error: $e");
    }
    return null;
  }

  // 3. Pexels से फ्री HD बैकग्राउंड वीडियो लाना
  Future<String?> getFreeVideo(String keyword) async {
    final url = Uri.parse('https://api.pexels.com/videos/search?query=$keyword&per_page=1');
    try {
      final res = await http.get(url, headers: {'Authorization': pexelsApiKey});
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['videos'][0]['video_files'][0]['link'];
      }
    } catch (e) {
      print("Video Error: $e");
    }
    return null;
  }

  // 4. मुख्य पाइपलाइन
  Future<Map<String, String>?> processPipeline(String userIdea) async {
    final aiData = await generateFreeLyrics(userIdea);
    if (aiData == null) return null;

    final musicFilePath = await generateFreeMusicTrack(aiData['music_prompt']!);
    final videoUrl = await getFreeVideo(aiData['video_keyword']!);

    return {
      "lyrics": aiData['lyrics']!,
      "music_path": musicFilePath ?? "",
      "video_url": videoUrl ?? ""
    };
  }
}
