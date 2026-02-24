import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_response(user_message: str, history: list = []) -> str:
    messages = [
        {
            "role": "system",
            "content": """You are a voice assistant. The user's message comes from speech-to-text which may have errors, typos, or wrong language detection.

IMPORTANT: Understand the user's INTENT even if the transcription is messy or in the wrong language. If it looks like broken Azerbaijani written as Turkish, treat it as Azerbaijani.

Rules:
- Respond in the language the user is TRYING to speak, not what the transcription shows
- Keep responses under 2-3 sentences — this is voice, not text
- Be warm and conversational
- Never write lists, bullets, or long paragraphs
- If Azerbaijani, use clean Azerbaijani (not Turkish)"""
        }
    ]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=150,
    )
    return response.choices[0].message.content