/* 
    Video Prompt Archive - 수동 관리형 아카이브 로직 (Curator Edition)
*/

document.addEventListener('DOMContentLoaded', () => {
    const videoGrid = document.getElementById('video-grid');
    const sizeSlider = document.getElementById('size-slider');
    const tagCloud = document.getElementById('tag-cloud');
    const template = document.getElementById('video-item-template');
    
    const adminToggle = document.getElementById('admin-toggle');
    const closePanel = document.getElementById('close-panel');
    const addProjectBtn = document.getElementById('add-project');
    const exportBtn = document.getElementById('export-data');
    
    const dropZone = document.getElementById('drop-zone');
    const videoUpload = document.getElementById('video-upload');
    const editPrompt = document.getElementById('edit-prompt');
    const editTags = document.getElementById('edit-tags');
    const editVideoPath = document.getElementById('edit-video-path');
    const fileNameDisplay = document.getElementById('file-name');

    // ==========================================
    // [OFFICIAL ARCHIVE DATA]
    // Gemini가 업데이트하는 공식 데이터 배열입니다.
    // 누구나 접속했을 때 기본으로 보이는 데이터입니다.
    // ==========================================
    const OFFICIAL_DATA = [
        {
            id: 1,
            prompt: "Anyway Space 아카이브에 오신 것을 환영합니다. 이 메시지는 공식 데이터로 등록되어 누구나 볼 수 있습니다.",
            videoSrc: "assets/video.mp4",
            tags: ["Welcome", "Official"]
        }
    ];

    let archiveData = [];
    let currentVideoURL = null;
    let currentFilter = 'all';

    // 1. 데이터 로드 로직
    // OFFICIAL_DATA를 기본으로 하고, LocalStorage에 추가된 작업 데이터를 합칩니다.
    const savedLocalData = localStorage.getItem('anyway_local_archive_v1');
    const localData = savedLocalData ? JSON.parse(savedLocalData) : [];
    
    // 중복 방지를 위해 공식 데이터와 로컬 데이터를 합침
    archiveData = [...localData, ...OFFICIAL_DATA];
    
    updateUI();

    function updateUI() {
        renderTagCloud();
        renderGrid();
    }

    function renderTagCloud() {
        const allTags = new Set();
        archiveData.forEach(item => {
            if (item.tags) item.tags.forEach(t => allTags.add(t.trim()));
        });

        const activeTag = currentFilter;
        tagCloud.innerHTML = `<button class="tag-chip ${activeTag === 'all' ? 'active' : ''}" data-tag="all">All Works</button>`;
        
        allTags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = `tag-chip ${activeTag === tag ? 'active' : ''}`;
            btn.textContent = tag;
            btn.dataset.tag = tag;
            btn.addEventListener('click', () => {
                currentFilter = tag;
                updateUI();
            });
            tagCloud.appendChild(btn);
        });

        tagCloud.querySelector('[data-tag="all"]').addEventListener('click', () => {
            currentFilter = 'all';
            updateUI();
        });
    }

    function renderGrid() {
        videoGrid.innerHTML = '';
        if (archiveData.length === 0) {
            videoGrid.innerHTML = `<div style="padding: 100px; color: #444; font-size: 1.1rem; text-align: center; width: 100%;">아카이브가 비어 있습니다.</div>`;
            return;
        }

        const baseWidth = sizeSlider.value;
        const filteredData = currentFilter === 'all' 
            ? archiveData 
            : archiveData.filter(item => item.tags && item.tags.includes(currentFilter));

        filteredData.forEach(item => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.video-item');
            const video = clone.querySelector('.prompt-video');
            const prompt = clone.querySelector('.display-prompt');
            const tagContainer = clone.querySelector('.item-tags');
            const delBtn = clone.querySelector('.btn-delete');

            card.style.width = `${baseWidth * 1.8}px`;
            video.src = item.videoSrc;
            prompt.textContent = item.prompt;

            if (item.tags) {
                item.tags.forEach(t => {
                    const span = document.createElement('span');
                    span.className = 'mini-tag';
                    span.textContent = t;
                    tagContainer.appendChild(span);
                });
            }

            delBtn.addEventListener('click', () => {
                if(confirm('로컬 아카이브에서 삭제하시겠습니까? (공식 데이터는 삭제되지 않습니다)')) {
                    const newLocalData = localData.filter(i => i.id !== item.id);
                    localStorage.setItem('anyway_local_archive_v1', JSON.stringify(newLocalData));
                    location.reload(); // 단순화를 위해 리로드
                }
            });
            
            videoGrid.appendChild(clone);
        });
    }

    // 파일 핸들링 (미리보기용)
    function handleFile(file) {
        fileNameDisplay.textContent = `Preview: ${file.name}`;
        currentVideoURL = URL.createObjectURL(file);
    }

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files[0].type === 'video/mp4') handleFile(e.dataTransfer.files[0]);
    });
    dropZone.addEventListener('click', () => videoUpload.click());
    videoUpload.addEventListener('change', (e) => { if(e.target.files[0]) handleFile(e.target.files[0]); });

    // 추가 버튼 (로컬에 임시 저장)
    addProjectBtn.addEventListener('click', () => {
        const finalVideoSrc = editVideoPath.value || currentVideoURL;
        if (!finalVideoSrc) {
            alert('영상 파일 또는 GitHub 경로를 입력해주세요!');
            return;
        }

        const newItem = {
            id: Date.now(),
            prompt: editPrompt.value || "No prompt",
            videoSrc: finalVideoSrc,
            tags: editTags.value ? editTags.value.split(',').map(t => t.trim()) : []
        };

        const newLocalData = [newItem, ...localData];
        localStorage.setItem('anyway_local_archive_v1', JSON.stringify(newLocalData));
        location.reload();
    });

    // 데이터 내보내기 (Gemini 전달용)
    exportBtn.addEventListener('click', () => {
        const dataToExport = archiveData; // 전체 데이터를 내보냄
        const dataStr = JSON.stringify(dataToExport, null, 2);
        navigator.clipboard.writeText(dataStr).then(() => {
            alert('데이터가 클립보드에 복사되었습니다!\n이 내용을 Gemini에게 전달하여 "공식 데이터로 등록해줘"라고 말씀하세요.');
        });
    });

    sizeSlider.addEventListener('input', () => {
        document.querySelectorAll('.video-item').forEach(card => {
            card.style.width = `${sizeSlider.value * 1.8}px`;
        });
    });

    adminToggle.addEventListener('click', () => document.body.classList.add('panel-open'));
    closePanel.addEventListener('click', () => document.body.classList.remove('panel-open'));
});
