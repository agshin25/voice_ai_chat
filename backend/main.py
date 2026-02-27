from fastapi import FastAPI, UploadFile, File, WebSocket
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import asyncio

from services.stt import transcribe
from services.llm import get_response, get_response_stream_async
from services.tts import text_to_speech, text_to_speech_bytes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

chat_history = []

@app.websocket("/api/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    ws_history = []

    try:
        while True:
            audio_data = await websocket.receive_bytes()

            temp_input = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            temp_input.write(audio_data)
            temp_input.close()

            try:
                await websocket.send_json({"status": "transcribing"})

                user_text = await asyncio.to_thread(transcribe, temp_input.name)
                os.unlink(temp_input.name)

                await websocket.send_json({
                    "status": "thinking",
                    "user_text": user_text
                })

                # Stream LLM sentences → TTS → send each chunk immediately
                full_text = ""
                async for sentence in get_response_stream_async(user_text, ws_history):
                    full_text += (" " if full_text else "") + sentence

                    # Send text chunk so frontend can display incrementally
                    await websocket.send_json({
                        "status": "ai_chunk",
                        "text": sentence
                    })

                    # Generate TTS for this sentence and send audio
                    audio_bytes = await text_to_speech_bytes(sentence)
                    await websocket.send_bytes(audio_bytes)

                ws_history.append({"role": "user", "content": user_text})
                ws_history.append({"role": "assistant", "content": full_text})

                await websocket.send_json({
                    "status": "speaking",
                    "ai_text": full_text
                })

                await websocket.send_json({"status": "idle"})
            except Exception as e:
                print(f"Processing error: {e}")
                try:
                    await websocket.send_json({
                        "status": "error",
                        "message": str(e)
                    })
                    await websocket.send_json({"status": "idle"})
                except:
                    break
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass

@app.post("/api/chat")
async def chat(audio: UploadFile = File(...)):
    temp_input = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
    temp_input.write(await audio.read())
    temp_input.close()

    user_text = transcribe(temp_input.name)
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
