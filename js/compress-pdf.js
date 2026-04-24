// compress-pdf.js
window.processPdfCompress = async function(file) {
    return new Promise(async (resolve, reject) => {
        try {
            const progFill = document.getElementById('progress-fill');
            const progText = document.getElementById('progress-text');

            const metaCheck = document.getElementById('pdf-metadata');
            const stripMetadata = metaCheck ? metaCheck.checked : true;

            progFill.style.width = '30%';
            progText.textContent = 'Uploading PDF...';

            const formData = new FormData();
            formData.append('file', file);
            formData.append('stripMetadata', stripMetadata);

            const response = await fetch('/api/compress-pdf', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Server returned ' + response.statusText);
            }

            progFill.style.width = '80%';
            progText.textContent = 'Receiving processed PDF...';

            const blob = await response.blob();

            progFill.style.width = '100%';
            progText.textContent = 'Done!';

            const origSize = file.size;
            let newSize = blob.size;

            if (newSize >= origSize) {
                console.warn("Backend compression did not reduce file size significantly.");
            }

            const newName = file.name.replace(/\.[^/.]+$/, "") + "-compressed.pdf";
            
            setTimeout(() => {
                window.showResult(blob, origSize, newSize, newName);
                resolve();
            }, 500);

        } catch (e) {
            console.error(e);
            reject(new Error("Failed to process PDF: " + e.message));
        }
    });
};
