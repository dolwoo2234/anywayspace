/* 
    Prompt Archive - 통합 로직 및 인터랙티브 제어 (v7)
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

    const LOCAL_STORAGE_KEY = 'anyway_archive_v7';

    // 공식 데이터 (유실되지 않도록 확실하게 고정)
    const OFFICIAL_DATA = [
        {
            "id": 1776833345917,
            "prompt": "A man having sex in the missionary position lifts his hand from the woman’s leg, gathers his strength, and slaps her bottom hard once.\nThe man lifts his hand from her thigh, raising it high to his left, then swings his arm naturally downwards, striking her buttocks with force.\n\nThe man raises his arm, swings it widely and brings it down, striking the woman on the buttocks.",
            "videoSrc": "assets/spanking_action_01.mp4",
            "tags": ["spanking"]
        }
    ];

    let localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    let archiveData = [...localData, ...OFFICIAL_DATA];
    let currentFilter = 'all';

    function updateUI() {
        renderTagCloud();
        renderGrid();
    }

    function renderTagCloud() {
        const allTags = new Set();
        archiveData.forEach(item => {
            if (item.tags) item.tags.forEach(t => allTags.add(t.trim()));
        });

        tagCloud.innerHTML = `<button class="tag-pill ${currentFilter === 'all' ? 'active' : ''}" data-tag="all">Everything</button>`;
        
        allTags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = `tag-pill ${currentFilter === tag ? 'active' : ''}`;
            btn.textContent = tag;
            btn.addEventListener('click', () => {
                currentFilter = tag;
                updateUI();
            });
            tagCloud.appendChild(btn);
        });
    }

    function renderGrid() {
        videoGrid.innerHTML = '';
        const filteredData = currentFilter === 'all' 
            ? archiveData 
            : archiveData.filter(item => item.tags && item.tags.includes(currentFilter));

        filteredData.forEach(item => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.archive-card');
            const video = clone.querySelector('.prompt-video');
            const prompt = clone.querySelector('.display-prompt');
            const tagContainer = clone.querySelector('.card-tags');
            const delBtn = clone.querySelector('.delete-action');

            // 인터랙티브 사이즈 조절 핵심 로직
            card.style.width = `${sizeSlider.value * 2}px`;
            
            video.src = item.videoSrc;
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
                    if(confirm('삭제하시겠습니까?')) {
                        localData = localData.filter(i => i.id !== item.id);
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
                        location.reload();
                    }
                }
            });
            
            videoGrid.appendChild(clone);
        });
    }

    // 사이즈 슬라이더 실시간 반응
    sizeSlider.addEventListener('input', () => {
        document.querySelectorAll('.archive-card').forEach(card => {
            card.style.width = `${sizeSlider.value * 2}px`;
        });
    });

    // 경로 정제
    function sanitizePath(path) {
        return path ? path.trim().replace(/^["'@]+|["']+$/g, '').trim() : "";
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
        const url = URL.createObjectURL(file);
        const fileName = file.name;
        alert(`미리보기 로드됨: ${fileName}`);
        window.tempVideoURL = url;
    }

    addProjectBtn.addEventListener('click', () => {
        const cleanPath = sanitizePath(editVideoPath.value);
        const finalVideoSrc = cleanPath || window.tempVideoURL;
        if (!finalVideoSrc) return alert('영상 또는 경로가 필요합니다.');

        const newItem = {
            id: Date.now(),
            prompt: editPrompt.value || "No prompt",
            videoSrc: finalVideoSrc,
            tags: editTags.value ? editTags.value.split(',').map(t => t.trim()) : []
        };

        localData.unshift(newItem);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
        location.reload();
    });

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme');
    });

    exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(archiveData, null, 2);
        navigator.clipboard.writeText(dataStr).then(() => alert('Sync Code Copied!'));
    });

    adminToggle.addEventListener('click', () => document.body.classList.add('panel-open'));
    closePanel.addEventListener('click', () => document.body.classList.remove('panel-open'));

    updateUI();
});
