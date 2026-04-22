/* 
    Prompt Archive - 마스터 로직 (v8)
    테마 복구 + 경로 정제 강화 + 한글 대응
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

    // 공식 데이터
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

    // 1. 테마 로직 복구 및 확장
    const updateThemeUI = () => {
        const isLight = document.body.classList.contains('light-theme');
        themeToggle.innerHTML = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
    };

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme');
        const currentTheme = document.body.classList.contains('light-theme') ? 'light-theme' : 'dark-theme';
        localStorage.setItem('anyway_theme_v8', currentTheme);
        updateThemeUI();
    });

    // 저장된 테마 불러오기
    const savedTheme = localStorage.getItem('anyway_theme_v8') || 'dark-theme';
    document.body.className = `archive-mode ${savedTheme}`;
    updateThemeUI();

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
            
            // 한글 및 특수문자 경로 안전하게 처리
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
                } else {
                    alert('공식 데이터는 관리자만 삭제할 수 있습니다.');
                }
            });
            videoGrid.appendChild(clone);
        });
    }

    // 경로 정제 함수 강화 (한글/공백/특수문자 대응)
    function sanitizePath(path) {
        if (!path) return "";
        // 1. 앞뒤 따옴표, @, 공백 제거
        let clean = path.trim().replace(/^["'@]+|["']+$/g, '').trim();
        // 2. 역슬래시를 슬래시로 변환
        clean = clean.replace(/\\/g, '/');
        // 3. 로컬 프로젝트 경로가 포함된 경우 상대 경로로 변환 시도
        if (clean.includes('anyway-space/projects/video-prompt-v1/')) {
            clean = clean.split('anyway-space/projects/video-prompt-v1/')[1];
        }
        return clean;
    }

    // 사이즈 조절 연동
    sizeSlider.addEventListener('input', () => {
        document.querySelectorAll('.archive-card').forEach(card => {
            card.style.width = `${sizeSlider.value * 2}px`;
        });
    });

    // 드래그 앤 드롭
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    
    function handleFile(file) {
        window.tempVideoURL = URL.createObjectURL(file);
        alert(`미리보기가 준비되었습니다: ${file.name}`);
    }

    addProjectBtn.addEventListener('click', () => {
        const cleanPath = sanitizePath(editVideoPath.value);
        const finalVideoSrc = cleanPath || window.tempVideoURL;
        if (!finalVideoSrc) return alert('영상 파일이나 유효한 경로를 입력해주세요.');

        const newItem = {
            id: Date.now(),
            prompt: editPrompt.value || "No prompt description",
            videoSrc: finalVideoSrc,
            tags: editTags.value ? editTags.value.split(',').map(t => t.trim()) : []
        };

        localData.unshift(newItem);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
        alert('아카이브에 성공적으로 추가되었습니다!');
        location.reload();
    });

    exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(archiveData, null, 2);
        navigator.clipboard.writeText(dataStr).then(() => alert('공유용 데이터 코드가 클립보드에 복사되었습니다!'));
    });

    adminToggle.addEventListener('click', () => document.body.classList.add('panel-open'));
    closePanel.addEventListener('click', () => document.body.classList.remove('panel-open'));

    updateUI();
});
