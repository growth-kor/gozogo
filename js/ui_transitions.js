function transitionToWallpaper() {
    dropZone.classList.remove('active');
    clockContainer.style.display = 'flex';
    clockCard.classList.remove('shrinking');
    clockCard.style.opacity = 1;
    clockCard.style.transform = 'scale(1)';
    soulOrb.style.display = 'none';
    
    clockTimeWrapper.style.filter = 'none';
    clockTime.style.letterSpacing = '-3px';
    
    currentState = 'normal';
    mouse.active = true;

    requestWakeLock();
    // Do not autoplay music automatically based on user requirement
    // startWallpaperMusic();
}

function cleanupMedia() {
    bgImage.classList.remove('loaded');
    bgVideo.classList.remove('loaded');
    
    if (currentMediaUrl) {
        URL.revokeObjectURL(currentMediaUrl);
        currentMediaUrl = null;
    }
    
    bgVideo.pause();
    bgVideo.src = '';
    bgImage.src = '';

    if (wakeLockSentinel) {
        wakeLockSentinel.release().then(() => {
            wakeLockSentinel = null;
        });
    }

    stopLoopAudio();
    btnSongSelect.classList.remove('active');
    btnSongSelect.querySelector('.music-play-icon').textContent = '▶';
}

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileSelectBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function showProgressBar() {
    const container = document.getElementById('loading-bar-container');
    const progress = document.getElementById('loading-bar-progress');
    if (!container || !progress) return;
    
    clearInterval(loadingInterval);
    container.classList.add('active');
    progress.style.width = '0%';
    
    let pct = 0;
    loadingInterval = setInterval(() => {
        pct += 0.8;
        if (pct >= 95) {
            pct = 95;
            clearInterval(loadingInterval);
        }
        progress.style.width = `${pct}%`;
    }, 200);
}

function hideProgressBar() {
    const container = document.getElementById('loading-bar-container');
    const progress = document.getElementById('loading-bar-progress');
    clearInterval(loadingInterval);
    
    if (progress) {
        progress.style.width = '100%';
    }
    
    setTimeout(() => {
        if (container) {
            container.classList.remove('active');
        }
        setTimeout(() => {
            if (progress) progress.style.width = '0%';
        }, 300);
    }, 600);
}

clockCard.addEventListener('click', (e) => {
    if (currentState !== 'normal') return;
    e.stopPropagation();

    currentState = 'soul';

    clockTimeWrapper.style.filter = 'url(#liquid-goo)';
    gooeyBlur.setAttribute('stdDeviation', '10');
    clockTime.style.letterSpacing = '-45px'; 

    clockCard.classList.add('shrinking');

    mouse.x = e.clientX;
    mouse.y = e.clientY;
    soulPos.x = e.clientX;
    soulPos.y = e.clientY;
    
    soulOrb.style.left = `${soulPos.x}px`;
    soulOrb.style.top = `${soulPos.y}px`;
    soulOrb.style.display = 'block';
    soulOrb.style.transform = 'translate3d(-50%, -50%, 0) scale(0)';
    
    setTimeout(() => {
        if (currentState !== 'soul') return;
        soulOrb.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
    }, 450);

    setTimeout(() => {
        if (currentState !== 'soul') return;
        clockContainer.style.display = 'none';
    }, 600);
});

