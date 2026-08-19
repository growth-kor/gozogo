function compressImageFile(file) {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/webp') {
            resolve(file);
            return;
        }

        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 3840;
            const MAX_HEIGHT = 2160;

            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                        type: 'image/webp'
                    });
                    resolve(optimizedFile);
                } else {
                    resolve(file);
                }
            }, 'image/webp', 0.88);
        };
        
        img.onerror = () => resolve(file);
        img.src = url;
    });
}

async function handleFile(file) {
    if (!file) return;

    showProgressBar();

    const optimizedFile = file.type.startsWith('image/') ? await compressImageFile(file) : file;

    cleanupMedia();
    
    settings.lastAppliedUrl = null;
    saveSettings();

    await saveFileToDB(optimizedFile);
    applyMedia(optimizedFile);
}

function applyMedia(file) {
    if (!file || !file.type || typeof file.type !== 'string') {
        console.warn("비정상적인 미디어 파일 감지, 안전하게 드롭존으로 리셋");
        cleanupMedia();
        if (dropZone) dropZone.classList.add('active');
        return;
    }

    currentMediaUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
        bgImage.style.display = 'none';
        bgVideo.src = currentMediaUrl;
        bgVideo.style.display = 'block';
        
        bgVideo.onloadeddata = () => {
            bgVideo.classList.add('loaded');
            updateBackgroundFilter(); 
            transitionToWallpaper();
            hideProgressBar();
        };
    } else {
        bgVideo.style.display = 'none';
        bgVideo.src = '';
        bgImage.src = currentMediaUrl;
        bgImage.style.display = 'block';
        
        bgImage.onload = () => {
            bgImage.classList.add('loaded');
            updateBackgroundFilter(); 
            transitionToWallpaper();
            hideProgressBar();
        };
    }
}

function applyDirectUrl(url) {
    cleanupMedia();

    settings.lastAppliedUrl = url;
    saveSettings();

    const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');

    if (isVideo) {
        bgImage.style.display = 'none';
        bgVideo.src = url;
        bgVideo.style.display = 'block';
        
        bgVideo.onloadeddata = () => {
            bgVideo.classList.add('loaded');
            updateBackgroundFilter();
            transitionToWallpaper();
            hideProgressBar();
        };
        
        bgVideo.onerror = () => {
            console.error('Direct video load failed for:', url);
            settings.lastAppliedUrl = null;
            saveSettings();
            hideProgressBar();
        };
    } else {
        bgVideo.style.display = 'none';
        bgImage.src = url;
        bgImage.style.display = 'block';
        
        bgImage.onload = () => {
            bgImage.classList.add('loaded');
            updateBackgroundFilter();
            transitionToWallpaper();
            hideProgressBar();
        };
        
        bgImage.onerror = () => {
            console.error('Direct image load failed for:', url);
            settings.lastAppliedUrl = null;
            saveSettings();
            hideProgressBar();
        };
    }
}

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLockSentinel = await navigator.wakeLock.request('screen');
            wakeLockSentinel.addEventListener('release', () => {
                wakeLockSentinel = null;
            });
        }
    } catch (err) {
        console.warn(err);
    }
}

