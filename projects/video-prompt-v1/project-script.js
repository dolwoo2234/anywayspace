/* 
    Prompt Archive - 마스터 로직 (v14)
    [결정판] 바이너리 스트링 스캔 방식의 ComfyUI 메타데이터 추출
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

    function updateUI() { renderTagCloud(); renderGrid(); }

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

    // ==========================================
    // [ComfyUI MP4 메타데이터 강제 스캔 로직]
    // ==========================================
    function scanFileForPrompt(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            // 2MB 단위로 파일 끝에서 스캔 (성능 최적화)
            const scanSize = Math.min(arrayBuffer.byteLength, 2 * 1024 * 1024);
            const footer = arrayBuffer.slice(arrayBuffer.byteLength - scanSize);
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(footer);

            // ComfyUI Workflow JSON 패턴 찾기
            const jsonMatch = text.match(/\{"prompt":[\s\S]*?\}/);
            
            if (jsonMatch) {
                try {
                    const workflow = JSON.parse(jsonMatch[0]);
                    // 추출한 JSON에서 CLIPTextEncode 노드들의 text 값 조합
                    let promptText = "";
                    for (const key in workflow.prompt) {
                        const node = workflow.prompt[key];
                        if (node.class_type === "CLIPTextEncode" && node.inputs && node.inputs.text) {
                            promptText += node.inputs.text + " ";
                        }
                    }
                    if (promptText) {
                        updateDropZoneStatus(true);
                        return applyCleanPrompt(promptText);
                    }
                } catch (e) {
                    console.error("JSON 파싱 오류:", e);
                }
            }

            updateDropZoneStatus(false);
            showStatus("메타데이터를 읽을 수 없습니다. (수동 입력)", "error");
        };
        reader.readAsArrayBuffer(file);
    }

    function applyCleanPrompt(text) {
        // 백슬래시 이스케이프 제거 및 깔끔하게 다듬기
        const clean = text.replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\s\s+/g, ' ').trim();
        editPrompt.value = clean;
        editPrompt.style.borderColor = "var(--accent)";
        setTimeout(() => editPrompt.style.borderColor = "", 2000);
        
        if (!editTags.value) {
            const firstWord = clean.split(' ')[0].replace(/[^a-zA-Z]/g, '');
            if (firstWord && firstWord.length > 2) editTags.value = firstWord;
        }
        showStatus("✨ 메타데이터 추출 성공!", "success");
    }

    function showStatus(msg, type) {
        const statusEl = document.createElement('div');
        statusEl.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); padding:14px 28px; border-radius:16px; background:${type==='success'?'#2ecc71':'#e74c3c'}; color:#fff; z-index:9999; font-weight:800; box-shadow:0 15px 40px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);`;
        statusEl.textContent = msg;
        document.body.appendChild(statusEl);
        setTimeout(() => statusEl.remove(), 3000);
    }

    function sanitizeInputPath(path) {
        if (!path) return "";
        let clean = path.trim().replace(/^["'@]+|["']+$/g, '').trim();
        clean = clean.replace(/\\/g, '/');
        const projectBase = "anyway-space/projects/video-prompt-v1/";
        if (clean.includes(projectBase)) clean = clean.split(projectBase)[1];
        return clean;
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
        if (!file.type.includes("video") && !file.name.endsWith('.mp4')) return alert("MP4 파일만 가능합니다.");
        const url = URL.createObjectURL(file);
        window.tempVideoURL = url;
        
        // 초기 UI 상태 설정 (분석 중 표시)
        dropZone.innerHTML = `
            <video autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover; border-radius:22px;">
                <source src="${url}" type="video/mp4">
            </video>
            <div id="drop-status" style="position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:1rem; transition: all 0.5s ease; border-radius:22px; pointer-events:none;">
                <div class="loader-spinner" style="width:30px; height:30px; border:4px solid #fff; border-top-color:transparent; border-radius:50%; animation: spin 1s linear infinite; margin-bottom:10px;"></div>
                <span>ANALYZING METADATA...</span>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`;
        
        editVideoPath.value = `assets/${file.name}`;
        
        // 메타데이터 스캔 시작
        scanFileForPrompt(file);
    }

    // 스캔 결과에 따라 UI 업데이트 후 자동 소멸
    function updateDropZoneStatus(success) {
        const statusEl = document.getElementById('drop-status');
        if (!statusEl) return;
        
        if (success) {
            statusEl.innerHTML = '<span style="font-size:2rem;">✅</span><span style="margin-top:10px;">PROMPT EXTRACTED</span>';
            statusEl.style.background = 'rgba(46, 204, 113, 0.6)';
        } else {
            statusEl.innerHTML = '<span style="font-size:2rem;">⚠️</span><span style="margin-top:10px;">NO METADATA</span>';
            statusEl.style.background = 'rgba(231, 76, 60, 0.6)';
        }

        // 2초 뒤 오버레이 서서히 제거 (수동 입력을 위해)
        setTimeout(() => {
            statusEl.style.opacity = '0';
            setTimeout(() => {
                if(statusEl.parentNode === dropZone) statusEl.remove();
            }, 500);
        }, 1500);
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
