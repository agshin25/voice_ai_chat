import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_response(user_message: str, history: list = []) -> str:
    system_prompt = """You are a friendly, natural-sounding voice assistant.

Rules:
- Always respond in the same language the user speaks
- Keep responses short and conversational — this is a voice chat, not text
- Be warm and natural, like talking to a friend
- Don't ask a question in every response
- If user speaks Azerbaijani, respond in clean Azerbaijani (not Turkish)
- Max 2-3 sentences per response"""

    contents = [{"role": "user", "parts": [{"text": system_prompt + "\n\nConversation starts now."}]},
                {"role": "model", "parts": [{"text": "Understood. I'll respond naturally in whatever language is used."}]}]
    
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})
    
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=contents
    )
    return response.text