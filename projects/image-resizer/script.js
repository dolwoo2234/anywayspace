const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('upload');
const preview = document.getElementById('preview');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#333';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#ccc';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#ccc';
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => processImage(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function processImage(img) {
    let width = img.width;
    let height = img.height;
    let ratio = width / height;

    let newWidth, newHeight;
    if (width > height) {
        newWidth = 1024;
        newHeight = 1024 / ratio;
    } else {
        newHeight = 1024;
        newWidth = 1024 * ratio;
    }

    canvas.width = 1024;
    canvas.height = 576;

    const scale = Math.max(1024 / newWidth, 576 / newHeight);
    const scaledWidth = newWidth * scale;
    const scaledHeight = newHeight * scale;
    const x = (1024 - scaledWidth) / 2;
    const y = (576 - scaledHeight) / 2;

    ctx.clearRect(0, 0, 1024, 576);
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    const result = document.createElement('img');
    result.src = canvas.toDataURL('image/jpeg');
    
    const container = document.createElement('div');
    container.className = 'preview-item';
    container.appendChild(result);
    preview.appendChild(container);
}
