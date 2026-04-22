/* 
    Video Prompt Archive - 드래그 앤 드롭 및 데이터 로직 개선
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

    // 1. 초기 데이터 로드 (버전 관리로 깔끔한 시작 보장)
    const savedData = localStorage.getItem('anyway_archive_v4');
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

    // 3. 태그 클라우드 생성
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

    // 4. 그리드 렌더링
    function renderGrid() {
        videoGrid.innerHTML = '';
        
        if (archiveData.length === 0) {
            videoGrid.innerHTML = `<div style="padding: 100px; color: #444; font-size: 1.1rem; text-align: center; width: 100%; font-weight: 500;">아카이브가 비어 있습니다.<br><span style="color: #666; font-size: 0.9rem;">상단의 '+ Add New Project'를 눌러 시작하세요.</span></div>`;
            return;
        }

        const cardSize = sizeSlider.value;
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

            card.style.width = `${cardSize}px`;
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

    // 5. 드래그 앤 드롭 로직
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach(type => {
        dropZone.addEventListener(type, () => {
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'video/mp4') {
            handleFile(files[0]);
        } else {
            alert('MP4 파일만 업로드 가능합니다.');
        }
    });

    dropZone.addEventListener('click', () => videoUpload.click());

    videoUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        fileNameDisplay.textContent = `Selected: ${file.name}`;
        currentVideoURL = URL.createObjectURL(file);
    }

    // 6. 새로운 세트 추가
    addProjectBtn.addEventListener('click', () => {
        if (!currentVideoURL && !editPrompt.value) {
            alert('영상 파일과 프롬프트를 입력해주세요.');
            return;
        }

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
        localStorage.setItem('anyway_archive_v4', JSON.stringify(archiveData));
        updateUI();
    }

    function resetForm() {
        editPrompt.value = '';
        editTags.value = '';
        videoUpload.value = '';
        fileNameDisplay.textContent = 'No file chosen';
        currentVideoURL = null;
    }

    // 사이즈 조절
    sizeSlider.addEventListener('input', () => {
        const cards = document.querySelectorAll('.video-item');
        cards.forEach(card => card.style.width = `${sizeSlider.value}px`);
    });

    adminToggle.addEventListener('click', () => document.body.classList.add('panel-open'));
    closePanel.addEventListener('click', () => document.body.classList.remove('panel-open'));
});
