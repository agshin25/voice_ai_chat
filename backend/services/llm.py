import os
import re
from dotenv import load_dotenv
from openai import OpenAI, AsyncOpenAI
from services.prompts import SYSTEM_PROMPT, CARGO_SYSTEM_PROMPT, EXTRACT_TRACKING_PROMPT, NO_TRACKING_PROMPT, DETECT_LANGUAGE_PROMPT

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
async_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

async def detect_language(text: str) -> str:
    response = await async_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[DETECT_LANGUAGE_PROMPT, {"role": "user", "content": text}],
        max_tokens=10,
    )
    return response.choices[0].message.content.strip()

async def get_cargo_response_stream_async(user_history: list, cargo_data: dict, lang: str):
    conversation = " → ".join(user_history)
    context = (
        f"Conversation so far: {conversation}\n\n"
        f"Cargo details:\n"
        f"- Status: {cargo_data['status']}\n"
        f"- Location: {cargo_data['location']}\n"
        f"- Estimated Delivery: {cargo_data['estimated_delivery']}\n"
        f"- Origin: {cargo_data['origin']}"
    )
    prompt = {"role": "system", "content": CARGO_SYSTEM_PROMPT.format(lang=lang)}
    messages = [prompt, {"role": "user", "content": context}]
    stream = await async_client.chat.completions.create(
        model="gpt-4o",
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
        messages=[EXTRACT_TRACKING_PROMPT, {"role": "user", "content": transcript}],
        max_tokens=20,
    )
    result = response.choices[0].message.content.strip()
    return None if result.lower() == "null" else result

async def get_no_tracking_response(user_history: list, lang: str) -> str:
    conversation = " → ".join(user_history)
    prompt = {"role": "system", "content": NO_TRACKING_PROMPT.format(lang=lang)}
    response = await async_client.chat.completions.create(
        model="gpt-4o",
        messages=[prompt, {"role": "user", "content": conversation}],
        max_tokens=60,
    )
    return response.choices[0].message.content.strip()                                                                                                                             