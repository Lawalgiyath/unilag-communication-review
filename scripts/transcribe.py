import soundfile as sf
import speech_recognition as sr
import io
import wave
import numpy as np

file_path = "WhatsApp Ptt 2026-10-24 at 16.39.33.ogg"
print(f"Reading {file_path}...")
data, samplerate = sf.read(file_path)
print(f"Sample rate: {samplerate}, Shape: {data.shape}, Duration: {len(data)/samplerate:.2f} seconds")

# Resample or convert to 16kHz mono WAV if needed for speech_recognition
import scipy.signal

# Convert to mono if stereo
if len(data.shape) > 1:
    data = data.mean(axis=1)

# Resample to 16000 Hz if needed
target_sr = 16000
if samplerate != target_sr:
    num_samples = int(len(data) * target_sr / samplerate)
    data = scipy.signal.resample(data, num_samples)
    samplerate = target_sr

# Normalize and convert to 16-bit PCM
max_val = np.max(np.abs(data))
if max_val > 0:
    data = data / max_val
pcm_data = (data * 32767).astype(np.int16)

wav_io = io.BytesIO()
with wave.open(wav_io, 'wb') as wav_file:
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(samplerate)
    wav_file.writeframes(pcm_data.tobytes())

wav_io.seek(0)
r = sr.Recognizer()
with sr.AudioFile(wav_io) as source:
    audio = r.record(source)

print("Sending to recognition engine...")
try:
    text = r.recognize_google(audio)
    print("\n--- TRANSCRIPTION ---")
    print(text)
    print("---------------------\n")
except Exception as e:
    print(f"Recognition error: {e}")
