const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

const dropZone = document.getElementById('drop-zone');
const videoConfig = document.getElementById('video-config');
const statusDiv = document.getElementById('status');
const processBtn = document.getElementById('process-btn');

let currentFile = null;

// Configurar zona de drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const files = e.dataTransfer.files;
    const mp4Files = [...files].filter(f => f.type === 'video/mp4');
    
    if (mp4Files.length > 0) {
        currentFile = mp4Files[0];
        dropZone.textContent = `Archivo seleccionado: ${currentFile.name}`;
        videoConfig.style.display = 'block';
    }
}

// Procesar video
processBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    const bitrate = document.getElementById('bitrate').value;
    const fps = document.getElementById('fps').value;
    const keepAudio = document.getElementById('keep-audio').checked;

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
});
