/* Global Theme Controller */
document.addEventListener('DOMContentLoaded', () => {
    const themeKey = 'anyway_global_theme';
    const savedTheme = localStorage.getItem(themeKey) || 'dark-theme';
    document.body.classList.add(savedTheme);

    window.toggleGlobalTheme = () => {
        const isLight = document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme', !isLight);
        localStorage.setItem(themeKey, isLight ? 'light-theme' : 'dark-theme');
    };
});
