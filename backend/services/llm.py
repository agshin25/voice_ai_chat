from groq import Groq

client = Groq()

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
            - If user speaks English, respond in English
            - If user speaks Turkish, respond in Turkish
            - Max 2-3 sentences per response"""
        }
    ]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages
    )
    return response.choices[0].message.content