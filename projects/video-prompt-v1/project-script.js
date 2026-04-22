/* 
    Video Prompt Archive - 프롬프트 중심 그리드 로직
*/

document.addEventListener('DOMContentLoaded', () => {
    const videoGrid = document.getElementById('video-grid');
    const sizeSlider = document.getElementById('size-slider');
    const tagCloud = document.getElementById('tag-cloud');
    const template = document.getElementById('video-item-template');
    
    const adminToggle = document.getElementById('admin-toggle');
    const closePanel = document.getElementById('close-panel');
    const addProjectBtn = document.getElementById('add-project');
    
    const dropZone = document.getElementById('drop-zone');
    const videoUpload = document.getElementById('video-upload');
    const editPrompt = document.getElementById('edit-prompt');
    const editTags = document.getElementById('edit-tags');
    const fileNameDisplay = document.getElementById('file-name');

    let archiveData = [];
    let currentVideoURL = null;
    let currentFilter = 'all';

    // 1. 초기 데이터 로드 (v5 버전으로 업데이트하여 새로운 레이아웃 적용)
    const savedData = localStorage.getItem('anyway_archive_v5');
    if (savedData) {
        archiveData = JSON.parse(savedData);
    } else {
        archiveData = [];
    }
    updateUI();

    // 2. 전체 UI 업데이트
    function updateUI() {
        renderTagCloud();
        renderGrid();
    }

    // 3. 태그 클라우드
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

    // 4. 그리드 렌더링 (가로형 1:1 레이아웃 적용)
    function renderGrid() {
        videoGrid.innerHTML = '';
        
        if (archiveData.length === 0) {
            videoGrid.innerHTML = `<div style="padding: 100px; color: #444; font-size: 1.1rem; text-align: center; width: 100%; font-weight: 500;">아카이브가 비어 있습니다.<br><span style="color: #666; font-size: 0.9rem;">상단의 '+ Add New Project'를 눌러 시작하세요.</span></div>`;
            return;
        }

        // 슬라이더 값에 따라 카드의 전체 너비를 조절 (최소 600px 이상 권장)
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

            // 가로형 레이아웃이므로 전체 너비만 조절
            card.style.width = `${baseWidth * 1.8}px`; // 가로로 기니까 비율 조정
            card.style.maxWidth = '100%';
            
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

            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteItem(item.id);
            });
            
            videoGrid.appendChild(clone);
        });
    }

    // 5. 사이즈 조절 (실시간 반응)
    sizeSlider.addEventListener('input', () => {
        const cards = document.querySelectorAll('.video-item');
        cards.forEach(card => {
            card.style.width = `${sizeSlider.value * 1.8}px`;
        });
    });

    // 6. 드래그 앤 드롭 및 파일 처리
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach(type => {
        dropZone.addEventListener(type, () => dropZone.classList.remove('dragover'));
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].type === 'video/mp4') {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    dropZone.addEventListener('click', () => videoUpload.click());
    videoUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        fileNameDisplay.textContent = `Selected: ${file.name}`;
        currentVideoURL = URL.createObjectURL(file);
    }

    // 7. 프로젝트 추가
    addProjectBtn.addEventListener('click', () => {
        if (!currentVideoURL && !editPrompt.value) return;

        const tags = editTags.value ? editTags.value.split(',').map(t => t.trim()).filter(t => t !== "") : [];
        const newItem = {
            id: Date.now(),
            prompt: editPrompt.value || "No prompt",
            videoSrc: currentVideoURL || "",
            tags: tags
        };

        archiveData.unshift(newItem);
        saveAndRefresh();
        resetForm();
        document.body.classList.remove('panel-open');
    });

    function deleteItem(id) {
        if (confirm('삭제하시겠습니까?')) {
            archiveData = archiveData.filter(item => item.id !== id);
            saveAndRefresh();
        }
    }

    function saveAndRefresh() {
        localStorage.setItem('anyway_archive_v5', JSON.stringify(archiveData));
        updateUI();
    }

    function resetForm() {
        editPrompt.value = '';
        editTags.value = '';
        videoUpload.value = '';
        fileNameDisplay.textContent = 'No file chosen';
        currentVideoURL = null;
    }

    adminToggle.addEventListener('click', () => document.body.classList.add('panel-open'));
    closePanel.addEventListener('click', () => document.body.classList.remove('panel-open'));
});
