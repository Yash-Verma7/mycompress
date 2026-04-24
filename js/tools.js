// Modal State and Logic
let currentToolId = null;
let currentFile = null;
let currentFilesList = []; // For tools needing multiple files (Merge PDF)

const toolConfig = {
    'compress-pdf': { title: 'Compress PDF', icon: 'fa-compress', cat: 'pdf' },
    'pdf-to-word': { title: 'PDF to Word', icon: 'fa-file-word', cat: 'pdf' },
    'pdf-to-jpg': { title: 'PDF to JPG', icon: 'fa-image', cat: 'pdf' },
    'jpg-to-pdf': { title: 'JPG to PDF', icon: 'fa-images', cat: 'pdf' },
    'merge-pdf': { title: 'Merge PDF', icon: 'fa-object-group', cat: 'pdf' },
    'split-pdf': { title: 'Split PDF', icon: 'fa-scissors', cat: 'pdf' },
    'rotate-pdf': { title: 'Rotate PDF', icon: 'fa-rotate-right', cat: 'pdf' },
    'unlock-pdf': { title: 'Unlock PDF', icon: 'fa-lock-open', cat: 'pdf' },
    'pdf-to-png': { title: 'PDF to PNG', icon: 'fa-image', cat: 'pdf' },
    'remove-pages': { title: 'Remove Pages', icon: 'fa-eraser', cat: 'pdf' },
    
    'compress-image': { title: 'Compress Image', icon: 'fa-down-left-and-up-right-to-center', cat: 'image' },
    'resize-image': { title: 'Resize Image', icon: 'fa-expand', cat: 'image' },
    'convert-image': { title: 'Convert Image', icon: 'fa-shuffle', cat: 'image' },
    'crop-image': { title: 'Crop Image', icon: 'fa-crop', cat: 'image' },
    'bulk-image-compress': { title: 'Bulk Compress Images', icon: 'fa-layer-group', cat: 'image' },
    
    'compress-docx': { title: 'Compress DOCX', icon: 'fa-file-zipper', cat: 'doc' },
    'docx-to-pdf': { title: 'DOCX to PDF', icon: 'fa-file-pdf', cat: 'doc' },
    'txt-to-pdf': { title: 'TXT to PDF', icon: 'fa-file-lines', cat: 'doc' },
    'pdf-to-txt': { title: 'PDF to TXT', icon: 'fa-quote-left', cat: 'doc' },
    
    'video-compress': { title: 'Video Compressor', icon: 'fa-film', cat: 'video' },
    'video-to-gif': { title: 'Video to GIF', icon: 'fa-photo-film', cat: 'video' },
    'extract-frame': { title: 'Extract Frame', icon: 'fa-camera', cat: 'video' }
};

// Open Modal
function openToolModal(toolId) {
    currentToolId = toolId;
    const config = toolConfig[toolId];
    if (!config) return;

    // Set Modal Header
    document.getElementById('modal-heading').textContent = config.title;
    document.getElementById('modal-icon').className = `fa-solid ${config.icon} tool-icon`;
    
    // Inject Tool Specific Settings
    injectToolSettings(toolId);

    // Reset steps
    resetToolModal();

    // Show modal
    document.getElementById('tool-modal').classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close Modal
function closeToolModal() {
    document.getElementById('tool-modal').classList.remove('active');
    document.body.style.overflow = '';
}

// Close on ESC or Outside click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('tool-modal');
    if (e.target === modal) {
        closeToolModal();
    }
});
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeToolModal();
    }
});

// Toggle Advanced Settings Accordion
function toggleSettingsAccordion() {
    const accordion = document.getElementById('advanced-settings-accordion');
    const body = document.getElementById('dynamic-settings-content');
    
    accordion.classList.toggle('open');
    if (accordion.classList.contains('open')) {
        body.style.maxHeight = body.scrollHeight + "px";
    } else {
        body.style.maxHeight = "0px";
    }
}

// Reset Tool State
function resetToolModal() {
    currentFile = null;
    currentFilesList = [];
    document.getElementById('file-input').value = "";
    
    // Show step 1, hide others
    document.getElementById('step-upload').style.display = 'flex';
    document.getElementById('step-process').style.display = 'none';
    document.getElementById('step-result').style.display = 'none';
    
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('btn-process').style.display = 'flex';
    document.getElementById('progress-fill').style.width = '0%';
    
    const dropZone = document.getElementById('drop-zone');
    dropZone.classList.remove('dragover');
    
    // Default accordion closed
    const accordion = document.getElementById('advanced-settings-accordion');
    accordion.classList.remove('open');
    document.getElementById('dynamic-settings-content').style.maxHeight = "0px";
}

// Drag & Drop Handling
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    // Click to browse
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleFiles(files);
    }, false);

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
});

function handleFiles(files) {
    if (files.length === 0) return;
    
    // For single file tools
    currentFile = files[0];
    currentFilesList = Array.from(files);
    
    // Proceed to Step 2
    showStep2();
}

function showStep2() {
    document.getElementById('step-upload').style.display = 'none';
    document.getElementById('step-process').style.display = 'flex';
    
    // Populate File Info
    document.getElementById('file-name').textContent = currentFile.name;
    const sizeStr = formatBytes(currentFile.size);
    const ext = currentFile.name.split('.').pop().toUpperCase();
    document.getElementById('file-meta').textContent = `${ext} • ${sizeStr}`;
    
    // Generate Preview
    generatePreview(currentFile);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function generatePreview(file) {
    const thumbContainer = document.getElementById('preview-thumb');
    thumbContainer.innerHTML = ''; // Clear
    
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        thumbContainer.appendChild(img);
    } else if (file.type === 'application/pdf') {
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-file-pdf';
        thumbContainer.appendChild(icon);
    } else if (file.type.startsWith('video/')) {
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-file-video';
        thumbContainer.appendChild(icon);
    } else {
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-file';
        thumbContainer.appendChild(icon);
    }
}

// Inject Settings HTML dynamically
function injectToolSettings(toolId) {
    const settingsContainer = document.getElementById('dynamic-settings-content');
    let html = '';

    if (toolId === 'compress-pdf') {
        html = `
            <div class="accordion-body-inner">
                <div class="setting-group">
                    <label>Compression Level</label>
                    <select id="pdf-quality">
                        <option value="low">Low (Smaller Size)</option>
                        <option value="medium" selected>Medium (Good Balance)</option>
                        <option value="high">High (High Quality)</option>
                        <option value="maximum">Maximum Compression</option>
                    </select>
                </div>
                <div class="setting-row">
                    <div class="setting-group">
                        <label>Color Mode</label>
                        <select id="pdf-color">
                            <option value="color">Color</option>
                            <option value="grayscale">Grayscale</option>
                        </select>
                    </div>
                </div>
                <div class="setting-group">
                    <label class="toggle-switch">
                        <input type="checkbox" id="pdf-metadata" checked>
                        <span class="slider"></span>
                        Remove Metadata (Author, Title, etc.)
                    </label>
                </div>
            </div>
        `;
    } else if (toolId === 'compress-image') {
        html = `
            <div class="accordion-body-inner">
                <div class="setting-group">
                    <label>Compression Quality: <span id="img-q-val">80%</span></label>
                    <input type="range" id="img-quality" min="1" max="100" value="80" oninput="document.getElementById('img-q-val').textContent = this.value + '%'">
                </div>
                <div class="setting-row">
                    <div class="setting-group">
                        <label>Output Format</label>
                        <select id="img-format">
                            <option value="image/jpeg">JPG</option>
                            <option value="image/png">PNG</option>
                            <option value="image/webp" selected>WEBP</option>
                        </select>
                    </div>
                </div>
                <div class="setting-group">
                    <label class="toggle-switch">
                        <input type="checkbox" id="img-exif" checked>
                        <span class="slider"></span>
                        Strip EXIF Data
                    </label>
                </div>
            </div>
        `;
    } else if (toolId === 'video-compress') {
        html = `
            <div class="accordion-body-inner">
                <div class="setting-row">
                    <div class="setting-group">
                        <label>Resolution</label>
                        <select id="video-res">
                            <option value="original">Original</option>
                            <option value="1080p">1080p</option>
                            <option value="720p" selected>720p</option>
                            <option value="480p">480p</option>
                        </select>
                    </div>
                    <div class="setting-group">
                        <label>Format</label>
                        <select id="video-format">
                            <option value="mp4">MP4</option>
                            <option value="webm">WebM</option>
                        </select>
                    </div>
                </div>
                <div class="setting-group">
                    <label class="toggle-switch">
                        <input type="checkbox" id="video-audio">
                        <span class="slider"></span>
                        Remove Audio
                    </label>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="accordion-body-inner">
                <p style="color: var(--text-secondary); text-align: center; font-size: 0.9rem;">
                    No advanced settings requested for this tool yet.
                </p>
            </div>
        `;
    }

    settingsContainer.innerHTML = html;
}

// Processing Logic Router
window.startProcessing = async function() {
    if (!currentFile) return;

    // UI Updates
    document.getElementById('btn-process').style.display = 'none';
    const progContainer = document.getElementById('progress-container');
    progContainer.style.display = 'flex';
    const progFill = document.getElementById('progress-fill');
    
    // Simulate initial progress to let user know it's working
    progFill.style.width = '10%';

    try {
        if (currentToolId === 'compress-image') {
            await window.processImageCompress(currentFile);
        } else if (currentToolId === 'compress-pdf') {
            await window.processPdfCompress(currentFile);
        } else if (currentToolId === 'video-compress') {
            await window.processVideoCompress(currentFile);
        } else {
            // Mock Processing for unspecified tools
            await mockProcessing();
        }
    } catch (e) {
        alert("An error occurred during processing: " + e.message);
        resetToolModal();
    }
}

async function mockProcessing() {
    const progFill = document.getElementById('progress-fill');
    for (let i = 2; i <= 10; i++) {
        await new Promise(r => setTimeout(r, 200));
        progFill.style.width = (i * 10) + '%';
    }
    
    // Create dummy result blob
    const blob = new Blob(["mock"], {type: "text/plain"});
    window.showResult(blob, currentFile.size, blob.size, "processed_" + currentFile.name);
}

// Global method to trigger Result Step
window.showResult = function(blob, origSize, newSize, newFileName) {
    document.getElementById('step-process').style.display = 'none';
    document.getElementById('step-result').style.display = 'block';

    document.getElementById('orig-size').textContent = formatBytes(origSize);
    document.getElementById('new-size').textContent = formatBytes(newSize);

    const downloadBtn = document.getElementById('btn-download');
    
    // Remove old listeners by cloning
    const newDownloadBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
    
    newDownloadBtn.addEventListener('click', () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Do not revoke here immediately, user might click again
    });
}
