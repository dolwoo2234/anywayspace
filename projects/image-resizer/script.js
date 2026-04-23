const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('upload');
const preview = document.getElementById('preview');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const selectAll = document.getElementById('select-all');
const downloadSelected = document.getElementById('download-selected');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent)'; });
dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = 'var(--border)'; });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

selectAll.addEventListener('change', (e) => {
    document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = e.target.checked);
});

downloadSelected.addEventListener('click', async () => {
    const checked = document.querySelectorAll('.item-checkbox:checked');
    if (checked.length === 0) return alert('선택된 이미지가 없습니다.');
    
    const zip = new JSZip();
    checked.forEach(cb => {
        const item = cb.closest('.preview-item');
        const img = item.querySelector('img');
        const dataUrl = img.src;
        const base64 = dataUrl.split(',')[1];
        zip.file(cb.dataset.filename, base64, {base64: true});
    });
    
    const content = await zip.generateAsync({type: 'blob'});
    saveAs(content, 'resized_images.zip');
});

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => processImage(img, file.name);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function processImage(img, fileName) {
    const isLandscape = img.width >= img.height;
    const targetW = isLandscape ? 1024 : 576;
    const targetH = isLandscape ? 576 : 1024;

    canvas.width = targetW;
    canvas.height = targetH;

    const scale = Math.max(targetW / img.width, targetH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (targetW - w) / 2;
    const y = (targetH - h) / 2;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, x, y, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg');
    
    const container = document.createElement('div');
    container.className = 'preview-item';
    container.innerHTML = `
        <input type="checkbox" class="item-checkbox" data-filename="resized_${fileName}">
        <img src="${dataUrl}">
        <p style="font-size:12px; margin: 8px 0;">${targetW}x${targetH}</p>
        <a href="${dataUrl}" download="resized_${fileName}" class="download-btn">Download</a>
    `;
    preview.appendChild(container);
}
