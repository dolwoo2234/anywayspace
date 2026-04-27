import os
import requests
import json
import base64
from dotenv import load_dotenv

def generate_direct_nai():
    load_dotenv()
    api_key = os.getenv('NOVELAI_API_KEY')
    
    if not api_key:
        print("Error: NOVELAI_API_KEY not found in .env")
        return

    url = "https://image.novelai.net/ai/generate-image"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    # [Harness: Tag Master] 제안 프롬프트
    payload = {
        "input": "masterpiece, best quality, highres, 1man, muscular male, barbarian, warrior, messy hair, battle worn, standing, cinematic lighting, tavern, wooden interior, dim lighting, detailed background, anime style",
        "model": "nai-diffusion-3",
        "action": "generate",
        "parameters": {
            "width": 832,
            "height": 1216,
            "scale": 5,
            "sampler": "k_euler_ancestral",
            "steps": 28,
            "n_samples": 1,
            "negative_prompt": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"
        }
    }

    print("Sending direct request to Novel AI API...")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 201 or response.status_code == 200:
            output_path = "projects/harness-factory/output/barbarian_direct.png"
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"✨ Success! Image saved directly to: {output_path}")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_direct_nai()
