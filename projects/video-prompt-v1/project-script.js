/* 
    Prompt Archive - 데이터 로직 안정화 (v6)
*/

document.addEventListener('DOMContentLoaded', () => {
    const videoGrid = document.getElementById('video-grid');
    const sizeSlider = document.getElementById('size-slider');
    const tagCloud = document.getElementById('tag-cloud');
    const template = document.getElementById('video-item-template');
    
    // 로컬 데이터 키를 확실하게 고정
    const LOCAL_STORAGE_KEY = 'anyway_archive_v6';

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

    function updateUI() {
        renderTagCloud();
        renderGrid();
    }

    function renderTagCloud() {
        const allTags = new Set();
        archiveData.forEach(item => {
            if (item.tags) item.tags.forEach(t => allTags.add(t.trim()));
        });

        tagCloud.innerHTML = `<button class="tag-pill ${currentFilter === 'all' ? 'active' : ''}" data-tag="all">All Works</button>`;
        
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

        tagCloud.querySelector('[data-tag="all"]').addEventListener('click', () => {
            currentFilter = 'all';
            updateUI();
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

            card.style.width = `${sizeSlider.value * 1.8}px`;
            video.src = item.videoSrc;
            prompt.textContent = item.prompt;

            if (item.tags) {
                item.tags.forEach(t => {
                    const span = document.createElement('span');
                    span.className = 'tag-pill'; // 미니태그 대신 필과 동일 디자인 적용
                    span.style.padding = "2px 8px";
                    span.style.fontSize = "0.6rem";
                    span.textContent = t;
                    tagContainer.appendChild(span);
                });
            }

            delBtn.addEventListener('click', () => {
                // 공식 데이터 삭제 방지 및 로컬 데이터 삭제
                if (localData.find(i => i.id === item.id)) {
                    if(confirm('이 작업을 삭제하시겠습니까?')) {
                        localData = localData.filter(i => i.id !== item.id);
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
                        location.reload();
                    }
                } else {
                    alert('공식 데이터는 삭제할 수 없습니다.');
                }
            });
            
            videoGrid.appendChild(clone);
        });
    }

    // 초기 실행
    updateUI();
    // 나머지 이벤트 리스너(admin-toggle 등)는 동일
});
