import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def transcribe(audio_path: str) -> str:
    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=("audio.webm", audio_file, "audio/webm"),
            prompt="Salam, necəsən? Mənə Azərbaycan haqqında məlumat ver. Yaxşıyam, sağ ol. Hello, how are you? Merhaba, nasılsın?",
        )
    return transcription.text

def clean_transcription(raw_text: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Fix any grammar or transcription errors in this speech-to-text output. Keep the same language and meaning. Only return the corrected text, nothing else."
            },
            {"role": "user", "content": raw_text}
        ],
        max_tokens=200,
    )
    return response.choices[0].message.content