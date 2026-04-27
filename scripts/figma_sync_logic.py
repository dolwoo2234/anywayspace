import os
import requests
import json
import re
from dotenv import load_dotenv

def sync_figma_v4():
    load_dotenv()
    token = os.getenv('FIGMA_ACCESS_TOKEN')
    file_key = os.getenv('FIGMA_FILE_KEY')

    url = f"https://api.figma.com/v1/files/{file_key}"
    headers = {"X-Figma-Token": token}

    try:
        print("👑 [Harness] 사용자 맞춤형 정밀 파싱 가동...")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        scenes = []

        def find_scenes(node):
            # 피그마의 모든 텍스트 노드를 훑어서 #숫자 패턴을 찾음
            if node.get("type") == "TEXT":
                text = node.get("characters", "").strip()
                if text.startswith("#") and any(char.isdigit() for char in text):
                    # 새로운 장면의 시작으로 간주
                    scene_no = text.split()[0]
                    # 주변의 '장면묘사', '구도' 텍스트를 찾기 위해 부모 노드의 자식들을 분석
                    # (실제 구조에 따라 부모 노드 전체를 분석하는 것이 더 정확함)
                    return # 여기서는 전체 탐색 후 그룹화하는 방식 사용

            for child in node.get("children", []):
                find_scenes(child)

        # [특수 로직] 사용자의 raw_text 구조를 기반으로 데이터 재구성
        # 이전 파싱 결과를 바탕으로, 텍스트 뭉치에서 실제 정보를 추출합니다.
        # 실제 피그마 API에서 다시 긁어올 때 #3, #4 등을 그룹화합니다.
        
        all_text_nodes = []
        def collect_all_texts(n):
            if n.get("type") == "TEXT":
                all_text_nodes.append({
                    "text": n.get("characters", ""),
                    "id": n.get("id"),
                    "y": n.get("absoluteBoundingBox", {}).get("y", 0) # 위치 기반 그룹화
                })
            for c in n.get("children", []): collect_all_texts(c)
        
        collect_all_texts(data.get("document", {}))
        all_text_nodes.sort(key=lambda x: x["y"]) # 위에서 아래로 정렬

        current_scene = None
        for node in all_text_nodes:
            t = node["text"].strip()
            # 씬 넘버 발견 (#3, #4 등)
            if re.match(r'^#\d+', t):
                if current_scene: scenes.append(current_scene)
                current_scene = {"scene_no": t, "description": "", "composition": ""}
            elif "장면묘사" in t and current_scene:
                current_scene["description"] = t.replace("장면묘사", "").strip(": \n")
            elif ("구도" in t or "래퍼런스" in t) and current_scene:
                current_scene["composition"] = t.replace("구도", "").replace("래퍼런스", "").strip(": \n")
            elif current_scene and len(t) > 5:
                # 키워드는 없지만 긴 텍스트가 장면묘사 뒤에 오면 설명으로 간주
                if not current_scene["description"]: current_scene["description"] = t
                elif not current_scene["composition"]: current_scene["composition"] = t

        if current_scene: scenes.append(current_scene)

        # 저장
        output_path = "projects/figma-to-image-ai/scenes.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(scenes, f, ensure_ascii=False, indent=4)
        
        print(f"✨ [Harness] 동기화 완료: {len(scenes)}개 장면 (씬 넘버 기반)")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    sync_figma_v4()
