import base64
import os
from typing import List
import uuid
import modal
import requests
import boto3
from pydantic import BaseModel

from prompts import LYRICS_GENERATOR_PROMPT, PROMPT_GENERATOR_PROMPT


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
    audio_duration: float = 180.0  # in seconds
    seed: int = -1  # -1 for random seed
    guidance_scale: float = 10.0  # guidance scale for generation
    infer_step: int = 60  # number of inference steps 
    instrumental: bool = False  # whether to generate instrumental music

class GenerateFromDescriptionRequest(AudioGenerationBase):
    full_described_song : str  # user-provided music description  

class GenerateWithCustomLyricsRequest(AudioGenerationBase):
    prompt: str  # reformatted audio tags
    lyrics: str  # user-provided custom lyrics

class GenerateWithDescribedLyricsRequest(AudioGenerationBase):
    prompt: str  # reformatted audio tags
    described_lyrics: str  # user-provided music description

class GenerateMusicResponseS3(BaseModel):
    s3_key: str # S3 key where the audio file is stored
    cover_image_s3_key: str  # S3 key for the cover image
    categories: List[str]


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

    def prompt_qwen(self, question:str):
        messages = [
            {"role": "user", "content": question}
        ]
        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        model_inputs = self.tokenizer(
            [text], return_tensors="pt").to(self.llm_model.device)

        generated_ids = self.llm_model.generate(
            model_inputs.input_ids,
            max_new_tokens=512
        )
        generated_ids = [
            output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
        ]

        response = self.tokenizer.batch_decode(
            generated_ids, skip_special_tokens=True)[0]

        return response

    def generate_prompt(self, description: str):
        # Insert des into prompt template and generate reformatted tags
        full_prompt = PROMPT_GENERATOR_PROMPT.format(user_prompt=description)

        # runn llm inference to get reformatted tags
        return self.prompt_qwen(full_prompt)
    
    def generate_lyrics(self, description: str):
        full_prompt = LYRICS_GENERATOR_PROMPT.format(description=description)
        return self.prompt_qwen(full_prompt)
    
    def generate_categories(self, description: str) -> List[str]:
        prompt = f"Based on the following music description, list 3-5 relevant genres or categories as a comma-separated list. For example: Pop, Electronic, Sad, 80s. Description: '{description}'"

        response_text = self.prompt_qwen(prompt)
        categories = [cat.strip()
                      for cat in response_text.split(",") if cat.strip()]
        return categories

    def generate_and_upload_to_s3(self, 
                                  prompt: str, 
                                  lyrics: str, 
                                  instrumental: bool,
                                  audio_duration: float, 
                                  infer_step: int, 
                                  guidance_scale: float,
                                  seed: int,
                                  description_for_categorization: str) -> GenerateMusicResponseS3:
        final_lyrics = ["instrumental"] if instrumental else lyrics
        print(f"Generating music with prompt: {prompt}")
        print(f"Generating music with lyrics: {final_lyrics}")
        s3_client = boto3.client("s3")
        bucket_name = os.environ["S3_BUCKET_NAME"]

        output_dir = "/tmp/outputs"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav")

        self.music_model(
            prompt=prompt,
            lyrics=final_lyrics,
            audio_duration=audio_duration,
            infer_step=infer_step,
            guidance_scale=guidance_scale,
            save_path=output_path,
            manual_seeds=str(seed)
        )
        audio_s3_key = f"{uuid.uuid4()}.wav"
        s3_client.upload_file(output_path, bucket_name, audio_s3_key)
        os.remove(output_path)

        # thumbnail generation with enhanced prompt engineering
        genre_keywords = prompt.split(',')[0:2]  # Extract first 2 tags for genre
        thumbnail_prompt = f"high quality album cover art, {', '.join(genre_keywords)}, professional music artwork, vibrant colors, modern design, artistic, centered composition, studio quality"
        negative_prompt = "blurry, low quality, distorted, ugly, bad art, watermark, text, signature, amateur"
        
        image = self.image_pipe(
            prompt=thumbnail_prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=4,  # Increased from 2 for better quality
            guidance_scale=0.0
        ).images[0]

        image_output_path = os.path.join(output_dir, f"{uuid.uuid4()}.png")
        image.save(image_output_path)

        image_s3_key = f"{uuid.uuid4()}.png"
        s3_client.upload_file(image_output_path, bucket_name, image_s3_key)
        os.remove(image_output_path)

        # category extraction
        categories = self.generate_categories(description_for_categorization)

        return GenerateMusicResponseS3(
            s3_key=audio_s3_key,
            cover_image_s3_key=image_s3_key,
            categories=categories
        )
    
    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
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
    
    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
    def generate_from_description(self, request: GenerateFromDescriptionRequest) -> GenerateMusicResponseS3:
        # Generating a prompt
        prompt = self.generate_prompt(request.full_described_song)

        # Generating lyrics
        lyrics = ""
        if not request.instrumental:
            lyrics = self.generate_lyrics(request.full_described_song)
        return self.generate_and_upload_to_s3(prompt=prompt, lyrics=lyrics,
                                              description_for_categorization=request.full_described_song, **request.model_dump(exclude={"full_described_song"}))

    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
    def generate_with_lyrics(self, request: GenerateWithCustomLyricsRequest) -> GenerateMusicResponseS3:
        return self.generate_and_upload_to_s3(prompt=request.prompt, lyrics=request.lyrics,
                                              description_for_categorization=request.prompt, **request.model_dump(exclude={"prompt", "lyrics"}))

    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
    def generate_with_described_lyrics(self, request: GenerateWithDescribedLyricsRequest) -> GenerateMusicResponseS3:
        # Generating lyrics
        lyrics = ""
        if not request.instrumental:
            lyrics = self.generate_lyrics(request.described_lyrics)
        return self.generate_and_upload_to_s3(prompt=request.prompt, lyrics=lyrics,
                                              description_for_categorization=request.prompt, **request.model_dump(exclude={"described_lyrics", "prompt"}))


@app.function(image=image, secrets=[music_gen_secret])
def fuction_test():
    print("This is a test function.")
    print(os.environ["test"])

@app.local_entrypoint()
def main():
    server = MusicGenServer()
    endpoint_url = server.generate_with_described_lyrics.get_web_url()

    request_data = GenerateWithDescribedLyricsRequest(
        prompt="funk, pop, soul, melodic",
        described_lyrics="""lyrics about playing minecraft splitting screen with girlfriend
        and she is being annoying and overly paranoid when the night come and she forced
         me to do the bed early cuz she is scrared of zombie but still cute
""",
        guidance_scale=15
    )

    # token id wk-a71fop3Lb2ZADg0N4NAsmb
    # token sec ws-s2qNsx3scyiTrnAsrVeCyW

    headers = {
        "Modal-Key": "wk-a71fop3Lb2ZADg0N4NAsmb",
        "Modal-Secret": "ws-s2qNsx3scyiTrnAsrVeCyW"
    }
    payload = request_data.model_dump()

    response = requests.post(endpoint_url, json=payload, headers=headers)
    response.raise_for_status()
    result = GenerateMusicResponseS3(**response.json())

    print("Successfully generated music!")
    print(f"S3 Key: {result.s3_key}")
    print(f"Cover Image S3 Key: {result.cover_image_s3_key}")
    print(f"Categories: {result.categories}")