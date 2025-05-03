const dropZone = document.getElementById('drop-zone');
const videoConfig = document.getElementById('video-config');
const statusDiv = document.getElementById('status');
const processBtn = document.getElementById('process-btn');

let currentFile = null;

// Configuración detallada de eventos de drag and drop
function setupDragDropHandlers() {
    // Prevenir comportamiento por defecto del navegador
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Resaltar zona de drop
    dropZone.addEventListener('dragenter', highlight, false);
    dropZone.addEventListener('dragover', highlight, false);
    dropZone.addEventListener('dragleave', unhighlight, false);
    dropZone.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    dropZone.classList.add('highlight');
}

function unhighlight(e) {
    dropZone.classList.remove('highlight');
}

function handleDrop(e) {
    unhighlight();
    
    const files = e.dataTransfer.files;
    const mp4Files = [...files].filter(f => f.type === 'video/mp4');
    
    if (mp4Files.length > 0) {
        currentFile = mp4Files[0];
        updateDropZone(currentFile);
    } else {
        statusDiv.textContent = 'Por favor, seleccione un archivo MP4';
        dropZone.textContent = 'Arrastra y suelta archivos MP4 aquí';
    }
}

function updateDropZone(file) {
    dropZone.innerHTML = `
        <div class="file-info">
            <p>Archivo seleccionado:</p>
            <strong>${file.name}</strong>
            <p>Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
    `;
    dropZone.classList.add('file-selected');
    videoConfig.style.display = 'block';
    statusDiv.textContent = 'Archivo MP4 listo para procesar';
}

// Añadir soporte para selección de archivo mediante clic
function setupFileInputSupport() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/mp4';
    fileInput.style.display = 'none';
    
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            currentFile = files[0];
            updateDropZone(currentFile);
        }
    });

    document.body.appendChild(fileInput);
}

// Añadir estilos adicionales
function addAdditionalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .drop-zone.highlight {
            background-color: rgba(0, 123, 255, 0.1);
            border-color: #007bff;
        }
        .drop-zone.file-selected {
            background-color: #e9ecef;
            border-style: solid;
        }
        .file-info {
            text-align: center;
        }
        .file-info strong {
            display: block;
            margin: 10px 0;
            word-break: break-all;
        }
    `;
    document.head.appendChild(style);
}

// Inicialización
function initDragDrop() {
    setupDragDropHandlers();
    setupFileInputSupport();
    addAdditionalStyles();
}

// Ejecutar inicialización
initDragDrop();

// Procesamiento de video (mantener código anterior de procesamiento)
processBtn.addEventListener('click', async () => {
    if (!currentFile) {
        statusDiv.textContent = 'Por favor, seleccione un archivo primero';
        return;
    }

    const bitrate = document.getElementById('bitrate').value;
    const fps = document.getElementById('fps').value;
    const keepAudio = document.getElementById('keep-audio').checked;

    try {
        statusDiv.textContent = 'Cargando FFmpeg...';
        await ffmpeg.load();

        statusDiv.textContent = 'Escribiendo archivo...';
        ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(currentFile));

        const ffmpegCommand = [
            '-i', 'input.mp4',
            '-c:v', 'libx264',
            '-profile:v', 'high',
            '-level', '4.0',
            '-b:v', `${bitrate}k`,
            '-r', fps,
            keepAudio ? '' : '-an',
            'output.mp4'
        ].filter(Boolean);

        statusDiv.textContent = 'Procesando video...';
        await ffmpeg.run(...ffmpegCommand);

        statusDiv.textContent = 'Generando archivo...';
        const data = ffmpeg.FS('readFile', 'output.mp4');

        // Crear blob y descargar
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_${currentFile.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        statusDiv.textContent = 'Procesamiento completado';
    } catch (error) {
        console.error('Error de procesamiento:', error);
        statusDiv.textContent = `Error: ${error.message}`;
    }
});

