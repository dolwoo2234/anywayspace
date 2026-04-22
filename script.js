/* 
    Anyway Space - 인터랙션 스크립트
    프로젝트 전환 및 동적 로딩 관리
*/

document.addEventListener('DOMContentLoaded', () => {
    const projectItems = document.querySelectorAll('.project-item');
    const projectFrame = document.getElementById('project-frame');
    const overlay = document.getElementById('content-overlay');

    // 프로젝트 아이템 클릭 이벤트 핸들러
    projectItems.forEach(item => {
        item.addEventListener('click', () => {
            const url = item.getAttribute('data-url');
            
            // 1. 활성화 상태 업데이트
            projectItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // 2. 화면 전환 애니메이션 (선택 사항)
            overlay.classList.add('loading');

            // 3. iframe URL 변경
            setTimeout(() => {
                projectFrame.src = url;
                
                // 로딩 오버레이 제거 (실제 iframe 로드 완료 시점에 맞추는 것이 좋으나, 여기선 간단히 구현)
                setTimeout(() => {
                    overlay.classList.remove('loading');
                }, 500);
            }, 300);
        });
    });

    // 콘솔 환영 메시지 (시니어 디자이너의 세심함)
    console.log('%c Anyway Space Hub v1.0 ', 'background: #111; color: #fff; padding: 5px; border-radius: 3px; font-weight: bold;');
});
