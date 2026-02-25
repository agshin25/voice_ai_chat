from faster_whisper import WhisperModel

model = WhisperModel("large-v3", device="cpu", compute_type="int8")

def transcribe(audio_path: str) -> str:
    segments, info = model.transcribe(
        audio_path,
        beam_size=5,
        best_of=5,
        temperature=0.0,
        initial_prompt="Salam, necəsən? Mənə Azərbaycan haqqında məlumat ver. Yaxşıyam, sağ ol.",
        vad_filter=True,
    )
    text = " ".join([segment.text for segment in segments])
    return text.strip()