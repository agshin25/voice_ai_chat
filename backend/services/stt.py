import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def transcribe(audio_path: str) -> str:
    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=("audio.wav", audio_file),
            model="whisper-large-v3",
            prompt="Salam, necəsən? Mənə Azərbaycan haqqında məlumat ver. Yaxşıyam, sağ ol.",
        )
    return transcription.text.strip()
