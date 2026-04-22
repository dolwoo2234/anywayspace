/* 
    Video Prompt Archive - 배포 및 영구 저장 로직
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
    const fileNameDisplay = document.createElement('span'); // 동적 생성

    // [중요] 기본 데이터: 당신이 나중에 줄 JSON 코드가 여기에 들어갑니다.
    // 다른 사람들이 접속했을 때 이 목록이 기본으로 보입니다.
    const DEFAULT_DATA = [
        {
            id: 1,
            prompt: "Anyway Space에 오신 것을 환영합니다. 당신의 첫 프롬프트를 등록해보세요.",
            videoSrc: "assets/video.mp4",
            tags: ["Welcome", "Guide"]
        }
    ];

    let archiveData = [];
    let currentVideoURL = null;
    let currentFilter = 'all';

    // 1. 데이터 로드: LocalStorage(내 작업) + DEFAULT_DATA(서버 작업)
    const savedData = localStorage.getItem('anyway_archive_shared_v1');
    if (savedData) {
        archiveData = JSON.parse(savedData);
    } else {
        archiveData = DEFAULT_DATA;
    }
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
            videoGrid.innerHTML = `<div style="padding: 100px; color: #444; font-size: 1.1rem; text-align: center; width: 100%;">데이터가 없습니다.</div>`;
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
                if(confirm('삭제하시겠습니까? (로컬 저장소에서만 삭제됩니다)')) {
                    archiveData = archiveData.filter(i => i.id !== item.id);
                    saveAndRefresh();
                }
            });
            
            videoGrid.appendChild(clone);
        });
    }

    // 파일 처리
    function handleFile(file) {
        currentVideoURL = URL.createObjectURL(file);
        // 미리보기를 위해 첫 번째 카드에 즉시 반영하는 로직 대신 알림
        alert(`Preview loaded: ${file.name}\n정식 배포를 위해 Step 2에 경로를 입력하는 것을 권장합니다.`);
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

    // 추가 버튼
    addProjectBtn.addEventListener('click', () => {
        const finalVideoSrc = editVideoPath.value || currentVideoURL;
        if (!finalVideoSrc) {
            alert('영상 파일 또는 경로를 입력해주세요!');
            return;
        }

        const newItem = {
            id: Date.now(),
            prompt: editPrompt.value || "No prompt",
            videoSrc: finalVideoSrc,
            tags: editTags.value ? editTags.value.split(',').map(t => t.trim()) : []
        };

        archiveData.unshift(newItem);
        saveAndRefresh();
        resetForm();
        document.body.classList.remove('panel-open');
    });

    // 데이터 내보내기 (Export)
    exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(archiveData, null, 2);
        navigator.clipboard.writeText(dataStr).then(() => {
            alert('아카이브 데이터가 복사되었습니다!\n이 내용을 저(Gemini)에게 전달해주시면 모두가 볼 수 있게 사이트에 고정해 드립니다.');
        });
    });

    function saveAndRefresh() {
        localStorage.setItem('anyway_archive_shared_v1', JSON.stringify(archiveData));
        updateUI();
    }

    function resetForm() {
        editPrompt.value = '';
        editTags.value = '';
        editVideoPath.value = '';
        currentVideoURL = null;
    }

    sizeSlider.addEventListener('input', () => {
        document.querySelectorAll('.video-item').forEach(card => {
            card.style.width = `${sizeSlider.value * 1.8}px`;
        });
    });

    adminToggle.addEventListener('click', () => document.body.classList.add('panel-open'));
    closePanel.addEventListener('click', () => document.body.classList.remove('panel-open'));
});
