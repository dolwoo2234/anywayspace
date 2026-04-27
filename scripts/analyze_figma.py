import os
import requests
import json
from dotenv import load_dotenv

def analyze_figma():
    load_dotenv()
    token = os.getenv('FIGMA_ACCESS_TOKEN')
    file_key = os.getenv('FIGMA_FILE_KEY')

    if not token or not file_key:
        print("Error: FIGMA_ACCESS_TOKEN or FIGMA_FILE_KEY not found in .env")
        return

    print(f"Connecting to Figma File: {file_key}")
    url = f"https://api.figma.com/v1/files/{file_key}"
    headers = {"X-Figma-Token": token}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        print(f"Project Name: {data.get('name')}")
        
        # 21:1192 노드 탐색
        def find_node(node, target_id):
            if node.get("id") == target_id:
                return node
            for child in node.get("children", []):
                res = find_node(child, target_id)
                if res: return res
            return None

        target = find_node(data.get("document", {}), "21:1192")
        
        if target:
            print(f"\n--- Found Target Section: {target.get('name')} ---")
            children = target.get("children", [])
            print(f"Total elements in this section: {len(children)}")
            
            # 섹션 내의 텍스트와 이미지/도형 분석
            for i, child in enumerate(children):
                node_type = child.get("type")
                name = child.get("name")
                
                print(f"[{i+1}] {name} ({node_type})")
                
                if node_type == "TEXT":
                    content = child.get("characters", "")
                    print(f"    > Content: {content[:100]}...")
                elif node_type in ["RECTANGLE", "ELLIPSE", "INSTANCE", "FRAME"]:
                    # 도형이나 프레임인 경우, 안에 텍스트가 있는지 확인
                    sub_texts = [n.get("characters", "") for n in child.get("children", []) if n.get("type") == "TEXT"]
                    if sub_texts:
                        print(f"    > Nested Texts: {sub_texts}")
        else:
            print("\nNode 21:1192 not found. Printing top-level children for debug:")
            for child in data.get("document", {}).get("children", []):
                print(f"- {child.get('name')} (ID: {child.get('id')})")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_figma()
