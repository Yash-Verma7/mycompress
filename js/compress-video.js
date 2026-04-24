// compress-video.js
window.processVideoCompress = async function(file) {
    return new Promise(async (resolve, reject) => {
        try {
            const resSelect = document.getElementById('video-res');
            const formatSelect = document.getElementById('video-format');
            const audioCheck = document.getElementById('video-audio');
            
            const resTarget = resSelect ? resSelect.value : '720p';
            const formatTarget = formatSelect ? formatSelect.value : 'mp4';
            const removeAudio = audioCheck ? audioCheck.checked : false;
            
            const progFill = document.getElementById('progress-fill');
            const progText = document.getElementById('progress-text');

            progFill.style.width = '30%';
            progText.textContent = 'Uploading and processing video (this may take a while)...';

            const formData = new FormData();
            formData.append('file', file);
            formData.append('resolution', resTarget);
            formData.append('format', formatTarget);
            formData.append('removeAudio', removeAudio);

            const response = await fetch('/api/compress-video', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Server returned ' + response.statusText);
            }

            progFill.style.width = '90%';
            progText.textContent = 'Receiving compressed video...';

            const blob = await response.blob();

            progFill.style.width = '100%';
            progText.textContent = 'Done!';
            
            const origSize = file.size;
            const newSize = blob.size;
            
            const newName = file.name.replace(/\.[^/.]+$/, "") + "-compressed." + formatTarget;
            
            setTimeout(() => {
                window.showResult(blob, origSize, newSize, newName);
                resolve();
            }, 500);

        } catch (e) {
            console.error(e);
            reject(new Error("Failed to process video: " + e.message));
        }
    });
};
