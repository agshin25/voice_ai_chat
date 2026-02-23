from groq import Groq

client = Groq()


def transcribe(audio_path: str) -> str:
    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=audio_file,
        )
    return transcription.text