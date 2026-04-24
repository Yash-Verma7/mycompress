// compress-image.js
window.processImageCompress = async function(file) {
    return new Promise(async (resolve, reject) => {
        try {
            const qualitySlider = document.getElementById('img-quality');
            const formatSelect = document.getElementById('img-format');
            const exifCheck = document.getElementById('img-exif');
            
            const qualityTarget = qualitySlider ? parseInt(qualitySlider.value) : 80;
            const formatTarget = formatSelect ? formatSelect.value : 'webp';
            const stripExif = exifCheck ? exifCheck.checked : true;
            
            const progFill = document.getElementById('progress-fill');
            const progText = document.getElementById('progress-text');

            progFill.style.width = '30%';
            progText.textContent = 'Uploading image...';

            const formData = new FormData();
            formData.append('file', file);
            formData.append('quality', qualityTarget);
            formData.append('format', formatTarget);
            formData.append('stripExif', stripExif);

            const response = await fetch('/api/compress-image', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Server returned ' + response.statusText);
            }

            progFill.style.width = '80%';
            progText.textContent = 'Receiving compressed file...';

            const blob = await response.blob();

            progFill.style.width = '100%';
            progText.textContent = 'Done!';
            
            const origSize = file.size;
            const newSize = blob.size;
            
            const ext = formatTarget.split('/').pop() === 'jpeg' ? 'jpg' : formatTarget.split('/').pop();
            const newName = file.name.replace(/\.[^/.]+$/, "") + "-compressed." + ext;
            
            setTimeout(() => {
                window.showResult(blob, origSize, newSize, newName);
                resolve();
            }, 500);

        } catch (e) {
            console.error(e);
            reject(new Error("Failed to process image: " + e.message));
        }
    });
};
