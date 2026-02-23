import edge_tts

VOICES = {
    "az": "az-AZ-BanuNeural",
    "tr": "tr-TR-EmelNeural",
    "en": "en-US-JennyNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "de": "de-DE-KatjaNeural",
    "fr": "fr-FR-DeniseNeural",
}

def detect_language(text: str) -> str:
    az_words = ["salam", "necə", "yaxşı", "təşəkkür", "xoş", "edirəm", "ə", "ı", "ö", "ü", "ç", "ş", "ğ"]
    tr_words = ["merhaba", "nasıl", "teşekkür", "evet", "hayır", "güzel", "değil"]
    
    text_lower = text.lower()
    
    if any(c in text_lower for c in ["ə", "ğ"]):
        return "az"
    
    az_score = sum(1 for w in az_words if w in text_lower)
    tr_score = sum(1 for w in tr_words if w in text_lower)
    
    if az_score > tr_score:
        return "az"
    if tr_score > az_score:
        return "tr"
    
    ascii_ratio = sum(1 for c in text if c.isascii()) / max(len(text), 1)
    if ascii_ratio > 0.9:
        return "en"
    
    return "az"

async def text_to_speech(text: str, output_path: str, voice: str = None):
    if voice is None:
        lang = detect_language(text)
        voice = VOICES.get(lang, "en-US-JennyNeural")
    
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)