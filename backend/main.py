import base64
import os
from typing import List
import uuid
import modal
import requests
from pydantic import BaseModel


app = modal.App("dukem-music")

image = (
    modal.Image.debian_slim()
    .apt_install("git", "ffmpeg")
    .pip_install_from_requirements("requirements.txt")
    .run_commands(["git clone https://github.com/ace-step/ACE-Step.git /tmp/ACE-Step", "cd /tmp/ACE-Step && pip install ."])
    .env({"HF_HOME": "/.cache/huggingface"})
    .add_local_python_source("prompts")
)
model_volume = modal.Volume.from_name(
    "ace-step-models", create_if_missing=True)
hf_volume = modal.Volume.from_name("qwen-hf-cache", create_if_missing=True)

music_gen_secret = modal.Secret.from_name("dukem-music-aws-secret")

class AudioGenerationBase(BaseModel):
    audio_duration: float = 15.0  # in seconds
    seed: int = -1  # -1 for random seed
    guidance_scale: float = 10.0  # guidance scale for generation
    infer_step: int = 60  # number of inference steps 
    instrumental: bool = False  # whether to generate instrumental music

class GenerateFromDescriptionRequest(AudioGenerationBase):
    full_describe_song : str  # user-provided music description  

class GenerateWithCustomLyricsRequest(AudioGenerationBase):
    prompt: str  # reformatted audio tags
    lyrics: str  # user-provided custom lyrics

class GenerateWithDescribedLyricsRequest(AudioGenerationBase):
    prompt: str  # reformatted audio tags
    described_lyrics: str  # user-provided music description

class GenerateMusicResponseS3(BaseModel):
    s3_key: str # S3 key where the audio file is stored
    cover_image_s3_key: str  # S3 key for the cover image
    category: List[str]


class GenerateMusicResponse(BaseModel):
    audio_data: str  # Base64 encoded audio data

@app.cls(image=image, gpu="L40S", 
         volumes={"/models": model_volume,
                   "/.cache/huggingface": hf_volume},
         secrets=[music_gen_secret],
         scaledown_window=15
         )
class MusicGenServer:
    @modal.enter()
    def load_model(self):
        from acestep.pipeline_ace_step import ACEStepPipeline
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from diffusers import AutoPipelineForText2Image
        import torch

        # load music generation model
        self.music_model = ACEStepPipeline(
            checkpoint_dir = "/models",
            dtype="bfloat16",
            torch_compile=False,
            cpu_offload=False,
            overlapped_decode=False
        )

        # large language model for prompt reformatting and lyrics generation
        model_id = "Qwen/Qwen2-7B-Instruct"
        self.tokenizer = AutoTokenizer.from_pretrained(
            model_id, use_fast=True, trust_remote_code=True)
        self.llm_model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype="auto",
            device_map="auto",
            cache_dir = "/.cache/huggingface",
        )

        # stable diffusion model for thumbnail generation
        self.image_pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo", torch_dtype=torch.float16, variant="fp16", cache_dir="/.cache/huggingface")
        self.image_pipe.to("cuda")
    @modal.fastapi_endpoint(method="POST")
    def generate(self) -> GenerateMusicResponse:
        output_dir = "/tmp/outputs"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav")
        self.music_model(
            prompt="country rock, folk rock, southern rock, bluegrass, country pop",
            lyrics="[verse]\nWoke up to the sunrise glow\nTook my heart and hit the road\nWheels hummin' the only tune I know\nStraight to where the wildflowers grow\n\n[verse]\nGot that old map all wrinkled and torn\nDestination unknown but I'm reborn\nWith a smile that the wind has worn\nChasin' dreams that can't be sworn\n\n[chorus]\nRidin' on a highway to sunshine\nGot my shades and my radio on fine\nLeave the shadows in the rearview rhyme\nHeart's racing as we chase the time\n\n[verse]\nMet a girl with a heart of gold\nTold stories that never get old\nHer laugh like a tale that's been told\nA melody so bold yet uncontrolled\n\n[bridge]\nClouds roll by like silent ghosts\nAs we drive along the coast\nWe toast to the days we love the most\nFreedom's song is what we post\n\n[chorus]\nRidin' on a highway to sunshine\nGot my shades and my radio on fine\nLeave the shadows in the rearview rhyme\nHeart's racing as we chase the time",
            audio_duration=180,
            infer_step=60,
            guidance_scale=15,
            save_path=output_path
        )
        with open(output_path, "rb") as f:
            audio_bytes = f.read()
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        os.remove(output_path)
        return GenerateMusicResponse(audio_data=audio_b64)
    
    @modal.fastapi_endpoint(method="POST")
    def generate_from_description(self) -> GenerateMusicResponse:
        pass  # To be implemented: generate music from user description

    @modal.fastapi_endpoint(method="POST")
    def generate_with_lyrics(self) -> GenerateMusicResponse:
        pass  # To be implemented: generate music with custom lyrics

    @modal.fastapi_endpoint(method="POST")
    def generate_with_described_lyrics(self) -> GenerateMusicResponse:
        pass  # To be implemented: generate music with lyrics from description

@app.function(image=image, secrets=[music_gen_secret])
def fuction_test():
    print("This is a test function.")
    print(os.environ["test"])

@app.local_entrypoint()
def main():
    server = MusicGenServer()
    endpointUrl = server.generate.get_web_url()

    response = requests.post(endpointUrl)
    response.raise_for_status()
    result = GenerateMusicResponse(**response.json())

    audio_bytes = base64.b64decode(result.audio_data)
    output_filename = "generated_music.wav"
    with open(output_filename, "wb") as f:
        f.write(audio_bytes)