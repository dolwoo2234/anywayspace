import os
import requests
from dotenv import load_dotenv

def find_content_sections():
    load_dotenv()
    token = os.getenv('FIGMA_ACCESS_TOKEN')
    file_key = os.getenv('FIGMA_FILE_KEY')

    url = f"https://api.figma.com/v1/files/{file_key}"
    headers = {"X-Figma-Token": token}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        sections_with_text = []

        def walk(node):
            # 텍스트가 있는 노드 수집
            if node.get("type") == "TEXT" and node.get("characters"):
                return [node]
            
            all_texts = []
            for child in node.get("children", []):
                all_texts.extend(walk(child))
            
            # 섹션이나 프레임 단위로 텍스트가 많은 곳을 후보로 선정
            if node.get("type") in ["SECTION", "FRAME", "CANVAS"] and len(all_texts) > 2:
                sections_with_text.append({
                    "id": node.get("id"),
                    "name": node.get("name"),
                    "type": node.get("type"),
                    "text_count": len(all_texts),
                    "sample": all_texts[0].get("characters")[:30] if all_texts else ""
                })
            
            return all_texts

        walk(data.get("document", {}))
        
        print("\n--- Potential Content Sections Found ---")
        # 텍스트가 많은 순으로 정렬
        sections_with_text.sort(key=lambda x: x["text_count"], reverse=True)
        for s in sections_with_text[:10]:
            print(f"ID: {s['id']} | Name: {s['name']} | Type: {s['type']} | Texts: {s['text_count']}")
            print(f"   Sample: {s['sample']}...")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_content_sections()
