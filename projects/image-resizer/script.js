document.getElementById('upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');

            let width = img.width;
            let height = img.height;
            let ratio = width / height;

            // Resize: Largest side to 1024
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

            // Crop: Center
            const scale = Math.max(1024 / newWidth, 576 / newHeight);
            const scaledWidth = newWidth * scale;
            const scaledHeight = newHeight * scale;
            const x = (1024 - scaledWidth) / 2;
            const y = (576 - scaledHeight) / 2;

            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

            const result = document.createElement('img');
            result.src = canvas.toDataURL('image/jpeg');
            document.getElementById('preview').innerHTML = '';
            document.getElementById('preview').appendChild(result);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});
