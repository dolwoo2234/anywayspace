import os
import requests
from dotenv import load_dotenv

def generate_final():
    load_dotenv()
    api_key = os.getenv('NOVELAI_API_KEY')
    url = "https://image.novelai.net/ai/generate-image"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

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

    print("Requesting new image from Novel AI...")
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200 or response.status_code == 201:
        # 파일 저장 전 데이터 확인
        if len(response.content) < 1000:
            print(f"Error: Received data is too small ({len(response.content)} bytes). Not a valid image.")
            return

        output_path = "projects/harness-factory/final_test.png"
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"✨ Success! New image saved to: {output_path} ({len(response.content)} bytes)")
    else:
        print(f"API Error {response.status_code}: {response.text}")

if __name__ == "__main__":
    generate_final()
