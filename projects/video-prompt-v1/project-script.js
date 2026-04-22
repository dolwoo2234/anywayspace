/* 
    Video Prompt Archive - 태그 필터링 로직
*/

document.addEventListener('DOMContentLoaded', () => {
    const videoGrid = document.getElementById('video-grid');
    const sizeSlider = document.getElementById('size-slider');
    const tagCloud = document.getElementById('tag-cloud');
    const template = document.getElementById('video-item-template');
    
    const adminToggle = document.getElementById('admin-toggle');
    const closePanel = document.getElementById('close-panel');
    const addProjectBtn = document.getElementById('add-project');
    
    const videoUpload = document.getElementById('video-upload');
    const editPrompt = document.getElementById('edit-prompt');
    const editTags = document.getElementById('edit-tags');
    const fileNameDisplay = document.getElementById('file-name');

    let archiveData = [];
    let currentVideoURL = null;
    let currentFilter = 'all';

    // 1. 초기 데이터 로드
    const savedData = localStorage.getItem('anyway_archive_v2');
    if (savedData) {
        archiveData = JSON.parse(savedData);
    } else {
        archiveData = [
            { id: 1, prompt: "Cyberpunk rain walk in neon city", videoSrc: "assets/video.mp4", tags: ["Cyberpunk", "Neon", "Rain"] }
        ];
    }
    updateUI();

    // 2. 전체 UI 업데이트 (그리드 + 태그 클라우드)
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

        // "All Works" 버튼 클릭 이벤트 재설정
        tagCloud.querySelector('[data-tag="all"]').addEventListener('click', () => {
            currentFilter = 'all';
            updateUI();
        });
    }

    // 4. 그리드 렌더링 (필터링 적용)
    function renderGrid() {
        videoGrid.innerHTML = '';
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

    // 5. 사이즈 조절
    sizeSlider.addEventListener('input', () => {
        const cards = document.querySelectorAll('.video-item');
        cards.forEach(card => card.style.width = `${sizeSlider.value}px`);
    });

    // 6. 새로운 세트 추가
    addProjectBtn.addEventListener('click', () => {
        const tags = editTags.value ? editTags.value.split(',').map(t => t.trim()) : [];
        const newItem = {
            id: Date.now(),
            prompt: editPrompt.value || "No prompt",
            videoSrc: currentVideoURL || "assets/video.mp4",
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
        localStorage.setItem('anyway_archive_v2', JSON.stringify(archiveData));
        updateUI();
    }

    function resetForm() {
        editPrompt.value = '';
        editTags.value = '';
        videoUpload.value = '';
        fileNameDisplay.textContent = 'No file chosen';
        currentVideoURL = null;
    }

    // 공통 이벤트
    videoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            currentVideoURL = URL.createObjectURL(file);
        }
    });

    adminToggle.addEventListener('click', () => document.body.classList.add('panel-open'));
    closePanel.addEventListener('click', () => document.body.classList.remove('panel-open'));
});
