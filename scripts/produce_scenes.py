import os
import requests
import json
import zipfile
import io
import time
import re
from dotenv import load_dotenv

# [📝 Tag Master] 정밀 단부루 태그 매핑 (확장됨)
TAG_MAP = {
    "정상위": "missionary, from above",
    "측면": "side view",
    "삽입": "penetration, vaginal_penetration",
    "얕게": "shallow_penetration",
    "느리게": "slow_motion",
    "고추": "penis",
    "절반": "half_submerged",
    "밖으로": "exposed",
    "드러나": "exposed",
    "마주보고": "facing_each_other, eye_contact",
    "키스 안하고": "no_kissing",
    "남자": "1man",
    "여자": "1girl",
    "침대": "bed",
    "근육": "muscular",
    "전사": "warrior"
}

def translate_to_danbooru(text):
    tags = []
    # 매핑 테이블 확인
    for kor, eng in TAG_MAP.items():
        if kor in text:
            tags.append(eng)
    
    # 텍스트에 이미 영어가 있다면 포함
    eng_words = re.findall(r'[a-zA-Z_]+', text)
    tags.extend(eng_words)
    
    return ", ".join(list(set(tags)))

def produce_scenes_v2():
    load_dotenv()
    api_key = os.getenv('NOVELAI_API_KEY')
    url = "https://image.novelai.net/ai/generate-image"
    
    scenes_path = "projects/figma-to-image-ai/scenes.json"
    output_dir = "projects/figma-to-image-ai/output"
    os.makedirs(output_dir, exist_ok=True)

    with open(scenes_path, "r", encoding="utf-8") as f:
        scenes = json.load(f)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    # 테스트를 위해 전체 중 첫 번째 시퀀스만 실행 (필요시 [:1] 제거하여 전체 실행)
    for scene in scenes[:1]:
        # 파일명 정규화 (예: #3 -> Scene_03)
        raw_no = scene['scene_no']
        num_only = re.findall(r'\d+', raw_no)
        scene_id = f"Scene_{num_only[0].zfill(2)}" if num_only else raw_no
        
        output_file = os.path.join(output_dir, f"{scene_id}.png")

        # 태그 가공
        desc_tags = translate_to_danbooru(scene['description'])
        comp_tags = translate_to_danbooru(scene['composition'])
        final_prompt = f"{desc_tags}, {comp_tags}".strip(", ")
        
        print(f"🚀 Producing [{scene_id}]")
        print(f"📝 Prompt: {final_prompt}")

        payload = {
            "input": final_prompt,
            "model": "nai-diffusion-3",
            "action": "generate",
            "parameters": {
                "width": 832, "height": 1216, "scale": 5,
                "sampler": "k_euler_ancestral", "steps": 28, "n_samples": 1,
                "negative_prompt": "lowres, text, error, worst quality, bad anatomy, bad hands"
            }
        }

        try:
            res = requests.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                with zipfile.ZipFile(io.BytesIO(res.content)) as z:
                    with z.open(z.namelist()[0]) as img:
                        with open(output_file, "wb") as f:
                            f.write(img.read())
                print(f"✅ Saved to {output_file}")
            else:
                print(f"❌ API Error: {res.status_code}")
        except Exception as e:
            print(f"⚠️ Error: {e}")

if __name__ == "__main__":
    produce_scenes_v2()
