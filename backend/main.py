from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os

from services.stt import transcribe, clean_transcription
from services.llm import get_response
from services.tts import text_to_speech

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

chat_history = []

@app.post("/api/chat")
async def chat(audio: UploadFile = File(...)):
    temp_input = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
    temp_input.write(await audio.read())
    temp_input.close()

    raw_text = transcribe(temp_input.name)
    user_text = clean_transcription(raw_text)
    os.unlink(temp_input.name)

    ai_text = get_response(user_text, chat_history)

    chat_history.append({"role": "user", "content": user_text})
    chat_history.append({"role": "assistant", "content": ai_text})

    temp_output = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    temp_output.close()
    await text_to_speech(ai_text, temp_output.name)
    
    return {
        "user_text": user_text,
        "ai_text": ai_text,
        "audio_url": f"/api/audio/{os.path.basename(temp_output.name)}"
    }

@app.get("/api/audio/{filename}")
async def get_audio(filename: str):
    filepath = os.path.join(tempfile.gettempdir(), filename)
    return FileResponse(filepath, media_type="audio/mpeg")
