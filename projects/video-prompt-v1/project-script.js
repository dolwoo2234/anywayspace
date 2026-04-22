/* 
    Prompt Archive - 마스터 로직 (v12)
    파일명 보존 + 딥 바이너리 메타데이터 스캔
*/

document.addEventListener('DOMContentLoaded', () => {
    const videoGrid = document.getElementById('video-grid');
    const sizeSlider = document.getElementById('size-slider');
    const tagCloud = document.getElementById('tag-cloud');
    const template = document.getElementById('video-item-template');
    const themeToggle = document.getElementById('theme-toggle');
    
    const adminToggle = document.getElementById('admin-toggle');
    const closePanel = document.getElementById('close-panel');
    const addProjectBtn = document.getElementById('add-project');
    const exportBtn = document.getElementById('export-data');
    
    const dropZone = document.getElementById('drop-zone');
    const videoUpload = document.getElementById('video-upload');
    const editPrompt = document.getElementById('edit-prompt');
    const editTags = document.getElementById('edit-tags');
    const editVideoPath = document.getElementById('edit-video-path');

    const LOCAL_STORAGE_KEY = 'anyway_archive_v8'; 

    const OFFICIAL_DATA = [
        {
            "id": 1776833345917,
            "prompt": "A man having sex in the missionary position lifts his hand from the woman’s leg, gathers his strength, and slaps her bottom hard once. The man lifts his hand from her thigh, raising it high to his left, then swings his arm naturally downwards, striking her buttocks with force. The man raises his arm, swings it widely and brings it down, striking the woman on the buttocks. The woman's expression changed instantly from the punch's recoil. The recoil causes her body to flinch and shrink back.",
            "videoSrc": "assets/spanking_action_01.mp4",
            "tags": ["spanking"]
        }
    ];

    let localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    let archiveData = [...localData, ...OFFICIAL_DATA];
    let currentFilter = 'all';

    // 1. 테마 관리
    const updateThemeUI = () => {
        const isLight = document.body.classList.contains('light-theme');
        themeToggle.innerHTML = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
    };
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('anyway_theme_v8', document.body.classList.contains('light-theme') ? 'light-theme' : 'dark-theme');
        updateThemeUI();
    });
    const savedTheme = localStorage.getItem('anyway_theme_v8') || 'dark-theme';
    document.body.className = `archive-mode ${savedTheme}`;
    updateThemeUI();

    function updateUI() {
        renderTagCloud();
        renderGrid();
    }

    function renderTagCloud() {
        const allTags = new Set();
        archiveData.forEach(item => { if (item.tags) item.tags.forEach(t => allTags.add(t.trim())); });
        tagCloud.innerHTML = `<button class="tag-pill ${currentFilter === 'all' ? 'active' : ''}" data-tag="all">Everything</button>`;
        allTags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = `tag-pill ${currentFilter === tag ? 'active' : ''}`;
            btn.textContent = tag;
            btn.addEventListener('click', () => { currentFilter = tag; updateUI(); });
            tagCloud.appendChild(btn);
        });
    }

    function renderGrid() {
        videoGrid.innerHTML = '';
        const filteredData = currentFilter === 'all' ? archiveData : archiveData.filter(item => item.tags && item.tags.includes(currentFilter));
        filteredData.forEach(item => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.archive-card');
            const video = clone.querySelector('.prompt-video');
            const prompt = clone.querySelector('.display-prompt');
            const tagContainer = clone.querySelector('.card-tags');
            const delBtn = clone.querySelector('.delete-action');

            card.style.width = `${sizeSlider.value * 2}px`;
            video.src = encodeURI(item.videoSrc);
            prompt.innerText = item.prompt;

            if (item.tags) {
                item.tags.forEach(t => {
                    const span = document.createElement('span');
                    span.className = 'mini-tag';
                    span.textContent = t;
                    tagContainer.appendChild(span);
                });
            }

            delBtn.addEventListener('click', () => {
                if (localData.find(i => i.id === item.id)) {
                    if(confirm('이 작업을 아카이브에서 삭제할까요?')) {
                        localData = localData.filter(i => i.id !== item.id);
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
                        location.reload();
                    }
                }
            });
            videoGrid.appendChild(clone);
        });
    }

    // 경로 정제 (영문 변환 기능 제거, 입력값만 정리)
    function sanitizeInputPath(path) {
        if (!path) return "";
        let clean = path.trim().replace(/^["'@]+|["']+$/g, '').trim();
        clean = clean.replace(/\\/g, '/');
        // 로컬 경로 패턴 감지 시 자동 변환
        const projectBase = "anyway-space/projects/video-prompt-v1/";
        if (clean.includes(projectBase)) clean = clean.split(projectBase)[1];
        return clean;
    }

    // ==========================================
    // [ComfyUI 메타데이터 딥 바이너리 스캔]
    // ==========================================
    function scanFileForPrompt(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // 이진 데이터를 텍스트로 변환 (UTF-8)
            const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(e.target.result));
            
            // 1. "CLIP Text Encode (Positive Prompt)" 타이틀 직접 검색 (가장 정확)
            const posMarker = '"CLIP Text Encode (Positive Prompt)"';
            const posIdx = text.indexOf(posMarker);
            
            if (posIdx !== -1) {
                // 해당 노드 근처 3000자에서 텍스트 필드 추출
                const slice = text.substring(posIdx, posIdx + 3000);
                const textMatch = slice.match(/"text":\s*"(.*?)(?<!\\)"/s);
                if (textMatch) return applyCleanPrompt(textMatch[1], "Comfy Title Scan");
            }

            // 2. "prompt":{ 으로 시작하는 워크플로우 전체 JSON 검색
            const workflowMatch = text.match(/"prompt":\s*({.*?}),\s*"extra_data"/s);
            if (workflowMatch) {
                try {
                    const promptData = JSON.parse(workflowMatch[1]);
                    for (let key in promptData) {
                        const node = promptData[key];
                        // CLIPTextEncode 노드이면서 Negative가 아닌 노드 탐색
                        if (node.class_type === "CLIPTextEncode" && node.inputs?.text) {
                            const title = node._meta?.title || "";
                            if (!title.toLowerCase().includes("negative") && !node.inputs.text.toLowerCase().includes("bad")) {
                                return applyCleanPrompt(node.inputs.text, "Workflow Analysis");
                            }
                        }
                    }
                } catch(err) {}
            }

            // 3. 범용 CLIPTextEncode 노드 강제 탐색
            const genericMatch = text.match(/"class_type":\s*"CLIPTextEncode".*?"text":\s*"(.*?)(?<!\\)"/s);
            if (genericMatch) return applyCleanPrompt(genericMatch[1], "Generic Node Scan");

            showStatus("ComfyUI 메타데이터를 파일에서 찾을 수 없습니다.", "error");
        };
        reader.readAsArrayBuffer(file);
    }

    function applyCleanPrompt(text, method) {
        // 이스케이프된 문자(\\n 등) 정제
        const clean = text.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\\"/g, '"').replace(/\s\s+/g, ' ').trim();
        editPrompt.value = clean;
        editPrompt.style.borderColor = "var(--accent)";
        setTimeout(() => editPrompt.style.borderColor = "", 2000);
        
        if (!editTags.value) {
            const words = clean.split(' ').filter(w => w.length > 3);
            if (words.length > 0) editTags.value = words[0].replace(/[^a-zA-Z]/g, '');
        }
        showStatus(`성공: 프롬프트 추출 (${method})`, "success");
    }

    function showStatus(msg, type) {
        const statusEl = document.createElement('div');
        statusEl.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); padding:14px 28px; border-radius:16px; background:${type==='success'?'#2ecc71':'#e74c3c'}; color:#fff; z-index:9999; font-weight:800; box-shadow:0 15px 40px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);`;
        statusEl.textContent = msg;
        document.body.appendChild(statusEl);
        setTimeout(() => statusEl.remove(), 3500);
    }

    // 드래그 앤 드롭
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        if (!file.type.includes("video") && !file.name.endsWith('.mp4')) return alert("MP4 영상 파일만 지원합니다.");
        
        const url = URL.createObjectURL(file);
        window.tempVideoURL = url;

        dropZone.innerHTML = `
            <video autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover; border-radius:22px;">
                <source src="${url}" type="video/mp4">
            </video>
            <div style="position:absolute; inset:0; background:rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:0.85rem; letter-spacing:0.1em;">FILE LOADED</div>
        `;

        // 파일명 그대로 사용 (assets/ 접두사만 유지)
        editVideoPath.value = `assets/${file.name}`;
        
        // 메타데이터 정밀 스캔 시작
        scanFileForPrompt(file);
    }

    addProjectBtn.addEventListener('click', () => {
        const finalVideoSrc = sanitizeInputPath(editVideoPath.value) || window.tempVideoURL;
        if (!finalVideoSrc) return alert('영상 파일이나 경로를 지정해주세요.');

        const newItem = {
            id: Date.now(),
            prompt: editPrompt.value || "No description",
            videoSrc: finalVideoSrc,
            tags: editTags.value ? editTags.value.split(',').map(t => t.trim()) : []
        };

        localData.unshift(newItem);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
        location.reload();
    });

    sizeSlider.addEventListener('input', () => {
        document.querySelectorAll('.archive-card').forEach(card => card.style.width = `${sizeSlider.value * 2}px`);
    });

    exportBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(JSON.stringify(archiveData, null, 2)).then(() => alert('데이터가 복사되었습니다.'));
    });

    adminToggle.addEventListener('click', () => document.body.classList.add('panel-open'));
    closePanel.addEventListener('click', () => document.body.classList.remove('panel-open'));

    updateUI();
});
