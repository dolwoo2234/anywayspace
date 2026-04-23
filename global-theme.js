/* Global Theme Controller */
const themeKey = 'anyway_global_theme';

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

// 초기 로드 시 적용
const savedTheme = localStorage.getItem(themeKey) || 'dark';
applyTheme(savedTheme);

// 다른 탭/페이지에서 테마 변경 시 동기화
window.addEventListener('storage', (e) => {
    if (e.key === themeKey) applyTheme(e.newValue);
});

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-theme');
            const newTheme = isLight ? 'light' : 'dark';
            localStorage.setItem(themeKey, newTheme);
            
            // 현재 페이지 외에 이벤트 전파
            window.dispatchEvent(new StorageEvent('storage', {
                key: themeKey,
                newValue: newTheme
            }));
        });
    }
});
