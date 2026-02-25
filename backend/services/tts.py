import os
import asyncio
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def _generate_speech(text: str, output_path: str, voice: str):
    response = client.audio.speech.create(
        model="tts-1-hd",
        voice=voice,
        input=text,
    )
    response.stream_to_file(output_path)

async def text_to_speech(text: str, output_path: str, voice: str = "onyx"):
    await asyncio.to_thread(_generate_speech, text, output_path, voice)
