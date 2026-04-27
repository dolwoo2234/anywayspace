import os
import requests
import zipfile
import io
from dotenv import load_dotenv

def generate_and_extract():
    load_dotenv()
    api_key = os.getenv('NOVELAI_API_KEY')
    # 최신 공식 엔드포인트
    url = "https://image.novelai.net/ai/generate-image"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    # Novel AI Diffusion V3용 정밀 페이로드
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
            "ucPreset": 0, # 품질 태그 프리셋
            "negative_prompt": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"
        }
    }

    print("Requesting image from Novel AI (expecting ZIP response)...")
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200 or response.status_code == 201:
        try:
            # 1. 받은 데이터를 메모리상의 ZIP 파일로 로드
            with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                # 2. ZIP 내부의 파일 목록 확인 (보통 첫 번째 파일이 이미지)
                file_list = z.namelist()
                print(f"Files found in ZIP: {file_list}")
                
                if file_list:
                    image_filename = file_list[0]
                    output_path = "projects/harness-factory/final_real_image.png"
                    
                    # 3. 이미지 파일만 추출하여 저장
                    with z.open(image_filename) as img_file:
                        with open(output_path, "wb") as f:
                            f.write(img_file.read())
                    
                    print(f"✨ Success! Extracted image saved to: {output_path}")
                else:
                    print("Error: ZIP is empty.")
        except zipfile.BadZipFile:
            print("Error: Response is not a valid ZIP file. Saving as fallback.png")
            with open("projects/harness-factory/fallback.png", "wb") as f:
                f.write(response.content)
    else:
        print(f"API Error {response.status_code}: {response.text}")

if __name__ == "__main__":
    generate_and_extract()
