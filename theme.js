/* Global Theme Management */
document.addEventListener('DOMContentLoaded', () => {
    const themeKey = 'anyway_theme_v8';
    
    // Check if theme toggle exists
    const themeToggle = document.getElementById('theme-toggle');
    
    const applyTheme = (theme) => {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(theme);
        localStorage.setItem(themeKey, theme);
        if (themeToggle) {
            themeToggle.innerHTML = (theme === 'light-theme') ? '🌙 Dark Mode' : '☀️ Light Mode';
        }
    };

    // Initialize theme from storage or default to dark
    const savedTheme = localStorage.getItem(themeKey) || 'dark-theme';
    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('light-theme') ? 'dark-theme' : 'light-theme';
            applyTheme(newTheme);
        });
    }
});
