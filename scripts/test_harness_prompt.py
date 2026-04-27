import os
import requests
from dotenv import load_dotenv

def test_scene_to_prompt(section_id):
    load_dotenv()
    token = os.getenv('FIGMA_ACCESS_TOKEN')
    file_key = os.getenv('FIGMA_FILE_KEY')

    url = f"https://api.figma.com/v1/files/{file_key}"
    headers = {"X-Figma-Token": token}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        def find_node(node, target_id):
            if node.get("id") == target_id:
                return node
            for child in node.get("children", []):
                res = find_node(child, target_id)
                if res: return res
            return None

        target = find_node(data.get("document", {}), section_id)
        
        if not target:
            print(f"Error: Section {section_id} not found.")
            return

        print(f"\n--- Analyzing Section: {target.get('name')} ---")
        
        # 섹션 내 모든 텍스트 수집
        all_texts = []
        def collect_text(node):
            if node.get("type") == "TEXT":
                all_texts.append(node.get("characters", ""))
            for child in node.get("children", []):
                collect_text(child)
        
        collect_text(target)
        
        full_description = "\n".join(all_texts)
        print(f"Original Content:\n{full_description}")

        # [에이전트 로직] Novel AI 태그 변환 (간이형)
        # 실제로는 LLM을 통해 더 정교하게 변환할 수 있습니다.
        print("\n--- [Harness: Tag Master] AI Prompt Suggestion ---")
        
        # 예시: 텍스트에 포함된 키워드 기반으로 태그 조합
        tags = ["masterpiece", "best quality", "highres"]
        
        # 키워드 매칭 테스트 (바바리안, 마을, 술집 등)
        if "바바리안" in full_description or "Barbarian" in full_description:
            tags.extend(["1man", "muscular male", "barbarian", "warrior", "leather armor"])
        if "마을" in full_description or "Village" in full_description:
            tags.append("fantasy village")
        if "술집" in full_description or "Pub" in full_description:
            tags.append("tavern, wooden interior, dim lighting")
        
        # 기타 스타일 태그 추가
        tags.extend(["cinematic lighting", "detailed background"])
        
        prompt = ", ".join(tags)
        print(f"Proposed Prompt: {prompt}")
        print("-" * 50)
        print("이 프롬프트를 사용하여 server.js를 통해 Novel AI에 이미지를 요청할 수 있습니다.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # 이전에 찾았던 '장면' 섹션 ID 중 하나를 입력합니다.
    test_scene_to_prompt("63:3079")
