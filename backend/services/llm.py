import os
import re
from dotenv import load_dotenv
from openai import OpenAI, AsyncOpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
async_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = {
    "role": "system",
    "content": """You are a voice assistant. The user's message comes from speech-to-text which may have errors or typos.

Rules:
- ALWAYS respond in the same language the user is speaking — if English, reply in English; if Azerbaijani, reply in Azerbaijani
- Keep responses under 2-3 sentences — this is voice, not text
- Be warm and conversational
- Never write lists, bullets, or long paragraphs"""
}

CARGO_SYSTEM_PROMPT = {
    "role": "system",
    "content": """You are a voice assistant for a cargo tracking service.
The user is asking about their shipment. You will be given the cargo details.
Respond naturally in 2-3 spoken sentences based on the data provided.
Always respond in the same language the user is speaking."""
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

async def get_cargo_response_stream_async(user_message: str, cargo_data: dict):
    context = (
        f"User said: {user_message}\n\n"
        f"Cargo details:\n"
        f"- Status: {cargo_data['status']}\n"
        f"- Location: {cargo_data['location']}\n"
        f"- Estimated Delivery: {cargo_data['estimated_delivery']}\n"
        f"- Origin: {cargo_data['origin']}"
    )
    messages = [CARGO_SYSTEM_PROMPT, {"role": "user", "content": context}]
    stream = await async_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
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

async def extract_tracking_number(transcript: str) -> str | None:
    response = await async_client.chat.completions.create(                                                                                                                                              
          model="gpt-4o-mini",
          messages=[
              {
                  "role": "system",
                  "content": "Extract the cargo/tracking number from the user's message. Return ONLY the tracking number, nothing else. If there is no tracking number, return null."
              },
              {"role": "user", "content": transcript}
          ],
          max_tokens=20,
      )
    result = response.choices[0].message.content.strip()
    return None if result.lower() == "null" else result                                                                                                                             