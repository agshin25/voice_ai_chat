import edge_tts

VOICES = {
    "az": "az-AZ-BanuNeural",
    "tr": "tr-TR-EmelNeural",
    "en": "en-US-JennyNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "de": "de-DE-KatjaNeural",
    "fr": "fr-FR-DeniseNeural",
    "es": "es-ES-ElviraNeural",
    "ar": "ar-SA-ZariyahNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
}

def detect_language(text: str) -> str:
    text_lower = text.lower()
    
    # Azerbaijani-specific characters
    if "ə" in text_lower or "ğ" in text_lower:
        return "az"
    
    # Turkish-specific patterns
    if any(w in text_lower for w in ["merhaba", "nasılsın", "teşekkür", "değil", "güzel"]):
        return "tr"
    
    # Russian
    if any("\u0400" <= c <= "\u04ff" for c in text):
        return "ru"
    
    # Chinese
    if any("\u4e00" <= c <= "\u9fff" for c in text):
        return "zh"
    
    # Japanese
    if any("\u3040" <= c <= "\u30ff" for c in text):
        return "ja"
    
    # Korean
    if any("\uac00" <= c <= "\ud7af" for c in text):
        return "ko"
    
    # Arabic
    if any("\u0600" <= c <= "\u06ff" for c in text):
        return "ar"
    
    # Check for Turkish without special chars
    if any(c in text_lower for c in ["ı", "ö", "ü", "ç", "ş"]) and "ə" not in text_lower:
        return "tr"
    
    return "en"

async def text_to_speech(text: str, output_path: str, voice: str = None):
    if voice is None:
        lang = detect_language(text)
        voice = VOICES.get(lang, "en-US-JennyNeural")
    
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)