import requests
import json
import base64
import os

def generate_test_image():
    # 서버 엔드포인트
    url = "http://localhost:3000/api/generate-image"
    
    # [Harness: Tag Master] 제안 프롬프트
    payload = {
        "prompt": "masterpiece, best quality, highres, 1man, muscular male, barbarian, warrior, messy hair, battle worn, standing, cinematic lighting, tavern, wooden interior, dim lighting, detailed background, anime style",
        "negPrompt": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
        "width": 832,
        "height": 1216
    }

    print(f"Sending request to Harness Proxy for Barbarian image...")
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        if "image" in result:
            # base64 데이터 추출 (data:image/png;base64, 부분 제거)
            image_data = result["image"].split(",")[1]
            
            output_path = "projects/harness-factory/output/barbarian_test.png"
            with open(output_path, "wb") as f:
                f.write(base64.b64decode(image_data))
            
            print(f"✨ Success! Image saved to: {output_path}")
        else:
            print("Error: No image data in response")

    except Exception as e:
        print(f"Error connecting to server: {e}")

if __name__ == "__main__":
    generate_test_image()
