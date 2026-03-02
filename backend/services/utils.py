import tempfile

def save_audio(audio_bytes: bytes, suffix: str = ".wav") -> str:                                                                                                                                              tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)                                                                                                                                      
    tmp.write(audio_bytes)
    tmp.close()
    return tmp.name