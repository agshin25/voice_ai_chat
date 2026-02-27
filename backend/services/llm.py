import os
import re
from dotenv import load_dotenv
from openai import OpenAI, AsyncOpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
async_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = {
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

_SENTENCE_END = re.compile(r'(?<=[.!?])\s+')


def _build_messages(user_message: str, history: list):
    messages = [SYSTEM_PROMPT]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    return messages


def get_response(user_message: str, history: list = []) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=_build_messages(user_message, history),
        max_tokens=150,
    )
    return response.choices[0].message.content


def get_response_stream(user_message: str, history: list = []):
    """Yield complete sentences as they form from the streaming LLM response."""
    stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=_build_messages(user_message, history),
        max_tokens=150,
        stream=True,
    )

    buffer = ""
    for chunk in stream:
        delta = chunk.choices[0].delta
        if not delta.content:
            continue
        buffer += delta.content

        # Split on sentence boundaries
        parts = _SENTENCE_END.split(buffer)
        if len(parts) > 1:
            # All parts except the last are complete sentences
            for sentence in parts[:-1]:
                sentence = sentence.strip()
                if sentence:
                    yield sentence
            buffer = parts[-1]

    # Yield whatever remains
    buffer = buffer.strip()
    if buffer:
        yield buffer


async def get_response_stream_async(user_message: str, history: list = []):
    """Async version — yields complete sentences without blocking the event loop."""
    stream = await async_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=_build_messages(user_message, history),
        max_tokens=150,
        stream=True,
    )

    buffer = ""
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if not delta.content:
            continue
        buffer += delta.content

        parts = _SENTENCE_END.split(buffer)
        if len(parts) > 1:
            for sentence in parts[:-1]:
                sentence = sentence.strip()
                if sentence:
                    yield sentence
            buffer = parts[-1]

    buffer = buffer.strip()
    if buffer:
        yield buffer