import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_response(user_message: str, history: list = []) -> str:
    messages = [
        {
            "role": "system",
            "content": """You are a friendly, natural-sounding voice assistant.

Rules:
- Always respond in the same language the user speaks
- Keep responses short and conversational — this is a voice chat, not text
- Be warm and natural, like talking to a friend
- Don't ask a question in every response
- If user speaks Azerbaijani, respond in clean Azerbaijani (not Turkish)
- Max 2-3 sentences per response"""
        }
    ]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )
    return response.choices[0].message.content