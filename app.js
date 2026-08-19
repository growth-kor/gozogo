const bgViewport = document.getElementById('bg-viewport');
const bgImage = document.getElementById('bg-image');
const bgVideo = document.getElementById('bg-video');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileSelectBtn = document.querySelector('.file-select-btn');

const clockContainer = document.getElementById('clock-container');
const clockCard = document.getElementById('clock-card');
const clockDate = document.getElementById('clock-date');
const clockTime = document.getElementById('clock-time');
const clockTimeWrapper = document.getElementById('clock-time-wrapper');
const gooeyBlur = document.getElementById('gooey-blur');

const soulOrb = document.getElementById('soul-orb');
const liquidExplosionZone = document.getElementById('liquid-explosion-zone');
const flashOverlay = document.getElementById('flash-overlay');

const fullscreenBtn = document.getElementById('fullscreen-btn');
const settingsTrigger = document.getElementById('settings-trigger');
const settingsPanel = document.getElementById('settings-panel');
const musicTrigger = document.getElementById('music-trigger');
const musicPanel = document.getElementById('music-panel');
const btnSongSelect = document.getElementById('btn-song-select');

const btnFormat24 = document.getElementById('btn-format-24');
const btnFormat12 = document.getElementById('btn-format-12');
const toggleSeconds = document.getElementById('toggle-seconds');

const brightnessRange = document.getElementById('brightness-range');
const blurRange = document.getElementById('blur-range');
const musicVolume = document.getElementById('music-volume');
const musicReverb = document.getElementById('music-reverb');

let settings = {
    use24h: true,
    showSeconds: true,
    brightness: 100, 
    blur: 0,
    lastAppliedUrl: null,
    theme: 'system',
    clockFont: 'Comico',
    clockSize: 108,
    dateFont: 'Zodiak',
    dateSize: 15 
};

let currentMediaUrl = null;
let loadingInterval = null;
let wakeLockSentinel = null;

let audioCtx = null;
let audioBuffer = null;
let audioSource = null;
let dryGain = null;
let wetGain = null;
let convolver = null;
let musicPlaying = false;

const ACTIVE_RADIUS = 350;
const MAGNETIC_STRENGTH = 70;

let currentState = 'normal';

let mouse = { x: 0, y: 0, active: false };
let currentTransform = { x: 0, y: 0, rx: 0, ry: 0 };
let targetTransform = { x: 0, y: 0, rx: 0, ry: 0 };

let soulPos = { x: 0, y: 0 };

window.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
}, false);

window.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
}, false);

const DB_NAME = 'LiquidClockDB';
const DB_VERSION = 1;
const STORE_NAME = 'assets';
const BG_KEY = 'saved_wallpaper';

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveFileToDB(file) {
    try {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(file, BG_KEY);
            
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('IndexedDB 저장 실패:', err);
    }
}

async function loadFileFromDB() {
    try {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(BG_KEY);
            
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('IndexedDB 파일 로드 실패:', err);
        return null;
    }
}

async function deleteFileFromDB() {
    try {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(BG_KEY);
            
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('IndexedDB 삭제 실패:', err);
    }
}

function updateBackgroundFilter() {
    const filterString = `brightness(${settings.brightness}%) blur(${settings.blur}px)`;
    bgImage.style.filter = filterString;
    bgVideo.style.filter = filterString;
}

async function initSettings() {
    const saved = localStorage.getItem('liquid_glass_restore_settings');
    if (saved) {
        try {
            settings = { ...settings, ...JSON.parse(saved) };
        } catch (e) {
            console.error('Failed to parse settings', e);
        }
    }

    if (settings.brightness === undefined || isNaN(settings.brightness)) {
        settings.brightness = 100;
    }
    if (settings.blur === undefined || isNaN(settings.blur)) {
        settings.blur = 0;
    }

    updateSettingsUI();

    const savedFile = await loadFileFromDB();
    if (savedFile) {
        applyMedia(savedFile);
    } else if (settings.lastAppliedUrl) {
        applyDirectUrl(settings.lastAppliedUrl);
    }
}

function updateSettingsUI() {
    if (settings.use24h) {
        btnFormat24.classList.add('active');
        btnFormat12.classList.remove('active');
    } else {
        btnFormat12.classList.add('active');
        btnFormat24.classList.remove('active');
    }

    toggleSeconds.checked = settings.showSeconds;
    brightnessRange.value = settings.brightness;
    blurRange.value = settings.blur;
    
    updateBackgroundFilter();
}

function saveSettings() {
    localStorage.setItem('liquid_glass_restore_settings', JSON.stringify(settings));
}

function updateClock() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const day = dayNames[now.getDay()];
    clockDate.textContent = `${year}. ${month}. ${date} (${day})`;

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    let ampm = '';
    if (!settings.use24h) {
        ampm = hours >= 12 ? 'PM ' : 'AM ';
        hours = hours % 12;
        hours = hours ? hours : 12;
    }
    
    const formattedHours = String(hours).padStart(2, '0');
    let timeString = `${formattedHours}:${minutes}`;
    if (settings.showSeconds) {
        timeString += `:${seconds}`;
    }
    
    clockTime.innerHTML = ampm ? `<span style="font-size: 0.45em; font-weight: 500; vertical-align: middle; margin-right: 8px;">${ampm}</span>${timeString}` : timeString;
}

setInterval(updateClock, 1000);
updateClock();

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

function createReverbBuffer(ctx, duration, decay) {
    const len = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(2, len, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    for (let i = 0; i < len; i++) {
        const percent = i / len;
        const val = (Math.random() * 2 - 1) * Math.pow(1 - percent, decay);
        left[i] = val;
        right[i] = val;
    }
    return buffer;
}

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        dryGain = audioCtx.createGain();
        wetGain = audioCtx.createGain();
        convolver = audioCtx.createConvolver();
        
        convolver.buffer = createReverbBuffer(audioCtx, 3.0, 2.5);
        
        dryGain.connect(audioCtx.destination);
        wetGain.connect(audioCtx.destination);
        
        updateAudioNodes();
    } catch (e) {
        console.warn(e);
    }
}

async function preloadAudio() {
    try {
        const response = await fetch('song/Reflect.wav?t=' + Date.now());
        const arrayBuffer = await response.arrayBuffer();
        if (audioCtx) {
            audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        }
    } catch (e) {
        console.warn(e);
    }
}

function playLoopAudio() {
    if (!audioCtx || !audioBuffer) return;
    stopLoopAudio();
    try {
        audioSource = audioCtx.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.loop = true;
        audioSource.loopStart = 0;
        audioSource.loopEnd = audioBuffer.duration;
        
        audioSource.connect(dryGain);
        audioSource.connect(convolver);
        convolver.connect(wetGain);
        
        audioSource.start(0);
        musicPlaying = true;
    } catch (e) {
        console.warn(e);
    }
}

function stopLoopAudio() {
    if (audioSource) {
        try {
            audioSource.stop();
        } catch (e) {}
        audioSource.disconnect();
        audioSource = null;
    }
    musicPlaying = false;
}

function updateAudioNodes() {
    if (!audioCtx) return;
    const vol = parseInt(musicVolume.value) / 100;
    const rev = parseInt(musicReverb.value) / 100;
    
    dryGain.gain.setValueAtTime(vol * (1 - rev * 0.5), audioCtx.currentTime);
    wetGain.gain.setValueAtTime(vol * rev * 1.5, audioCtx.currentTime);
}

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

document.addEventListener('click', async (e) => {
    if (currentState !== 'soul') return;

    if (settingsPanel.contains(e.target) || e.target === settingsTrigger || settingsTrigger.contains(e.target) ||
        musicPanel.contains(e.target) || e.target === musicTrigger || musicTrigger.contains(e.target)) {
        return;
    }

    currentState = 'exploding';
    mouse.active = false;

    const startX = e.clientX;
    const startY = e.clientY;

    soulOrb.style.display = 'none';
    flashOverlay.style.display = 'block';
    flashOverlay.classList.add('active');

    spawnLiquidSplash(startX, startY);

    await deleteFileFromDB();
    settings.lastAppliedUrl = null;
    saveSettings();
    
    bgImage.classList.remove('loaded');
    bgVideo.classList.remove('loaded');

    setTimeout(() => {
        cleanupMedia();
        
        flashOverlay.style.display = 'none';
        flashOverlay.classList.remove('active');
        
        liquidExplosionZone.style.display = 'none';
        liquidExplosionZone.innerHTML = '';
        
        dropZone.classList.add('active');
        fileInput.value = '';
        currentState = 'normal';
    }, 1800);
});

function spawnLiquidSplash(x, y) {
    liquidExplosionZone.innerHTML = '';
    liquidExplosionZone.style.display = 'block';

    const dropCount = 35;
    const drops = [];

    for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement('div');
        drop.className = 'liquid-drop';
        
        const size = Math.random() * 60 + 20; 
        drop.style.width = `${size}px`;
        drop.style.height = `${size}px`;
        
        liquidExplosionZone.appendChild(drop);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 45 + 20; 

        drops.push({
            element: drop,
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size,
            opacity: 1
        });
    }

    let frame = 0;
    const maxFrames = 120;

    function updateDrops() {
        if (frame >= maxFrames) return;
        frame++;

        const gravity = 0.08; 
        const friction = 0.985; 

        drops.forEach(d => {
            d.vx *= friction;
            d.vy *= friction;
            d.vy += gravity;

            d.x += d.vx;
            d.y += d.vy;

            d.opacity = 1 - (frame / maxFrames);

            d.element.style.left = `${d.x}px`;
            d.element.style.top = `${d.y}px`;
            d.element.style.opacity = d.opacity;
            d.element.style.transform = `translate3d(-50%, -50%, 0) scale(${d.opacity * 1.3})`;
        });

        requestAnimationFrame(updateDrops);
    }

    updateDrops();
}

document.addEventListener('mousemove', (e) => {
    if (!mouse.active) return;
    
    if (settingsPanel.classList.contains('active') || musicPanel.classList.contains('active')) {
        return;
    }
    
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function physicsLoop() {
    if (mouse.active) {
        if (currentState === 'normal') {
            const cardX = window.innerWidth / 2;
            const cardY = window.innerHeight / 2;

            const dx = mouse.x - cardX;
            const dy = mouse.y - cardY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ACTIVE_RADIUS) {
                const rawRatio = (ACTIVE_RADIUS - distance) / ACTIVE_RADIUS;
                const power = Math.pow(rawRatio, 2.5);

                const time = Date.now() * 0.005;
                const swayX = Math.sin(time) * 35 * power;
                const swayY = Math.cos(time * 0.75) * 32 * power;

                targetTransform.x = Math.round(dx * 0.20 * power + swayX);
                targetTransform.y = Math.round(dy * 0.20 * power + swayY);
                
                targetTransform.rx = (dy / ACTIVE_RADIUS) * 15;
                targetTransform.ry = -(dx / ACTIVE_RADIUS) * 15;

            } else {
                resetTargets();
            }

            const ease = 0.08;
            currentTransform.x += (targetTransform.x - currentTransform.x) * ease;
            currentTransform.y += (targetTransform.y - currentTransform.y) * ease;
            currentTransform.rx += (targetTransform.rx - currentTransform.rx) * ease;
            currentTransform.ry += (targetTransform.ry - currentTransform.ry) * ease;

            const rx = Math.round(currentTransform.x);
            const ry = Math.round(currentTransform.y);

            clockCard.style.transform = `
                translate3d(${rx}px, ${ry}px, 0px)
                scale(1)
                rotateX(${currentTransform.rx}deg)
                rotateY(${currentTransform.ry}deg)
            `;

        } else if (currentState === 'soul') {
            const delay = (100 - MAGNETIC_STRENGTH) * 0.0015;
            
            soulPos.x += (mouse.x - soulPos.x) * delay;
            soulPos.y += (mouse.y - soulPos.y) * delay;

            soulOrb.style.left = `${soulPos.x}px`;
            soulOrb.style.top = `${soulPos.y}px`;
        }
    }

    requestAnimationFrame(physicsLoop);
}

function resetTargets() {
    targetTransform.x = 0;
    targetTransform.y = 0;
    targetTransform.rx = 0;
    targetTransform.ry = 0;
}

physicsLoop();

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

fullscreenBtn.addEventListener('click', toggleFullscreen);

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        fullscreenBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"/>
            </svg>
        `;
        fullscreenBtn.classList.add('active');
    } else {
        fullscreenBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
        `;
        fullscreenBtn.classList.remove('active');
    }
});

settingsTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.classList.toggle('active');
    settingsTrigger.classList.toggle('active');
    musicPanel.classList.remove('active');
    musicTrigger.classList.remove('active');
});

musicTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    musicPanel.classList.toggle('active');
    musicTrigger.classList.toggle('active');
    settingsPanel.classList.remove('active');
    settingsTrigger.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsTrigger &&
        !musicPanel.contains(e.target) && e.target !== musicTrigger) {
        settingsPanel.classList.remove('active');
        settingsTrigger.classList.remove('active');
        musicPanel.classList.remove('active');
        musicTrigger.classList.remove('active');
    }
});

btnFormat24.addEventListener('click', () => {
    settings.use24h = true;
    btnFormat24.classList.add('active');
    btnFormat12.classList.remove('active');
    saveSettings();
    updateClock();
});

btnFormat12.addEventListener('click', () => {
    settings.use24h = false;
    btnFormat12.classList.add('active');
    btnFormat24.classList.remove('active');
    saveSettings();
    updateClock();
});

toggleSeconds.addEventListener('change', (e) => {
    settings.showSeconds = e.target.checked;
    saveSettings();
    updateClock();
});

brightnessRange.addEventListener('input', (e) => {
    settings.brightness = parseInt(e.target.value);
    saveSettings();
    updateBackgroundFilter();
});

blurRange.addEventListener('input', (e) => {
    settings.blur = parseInt(e.target.value);
    saveSettings();
    updateBackgroundFilter();
});

musicVolume.addEventListener('input', updateAudioNodes);
musicReverb.addEventListener('input', updateAudioNodes);

btnSongSelect.addEventListener('click', async () => {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    if (!audioBuffer) {
        btnSongSelect.querySelector('.music-play-icon').textContent = '⏳';
        await preloadAudio();
    }
    
    if (!musicPlaying) {
        playLoopAudio();
        btnSongSelect.classList.add('active');
        btnSongSelect.querySelector('.music-play-icon').textContent = '⏸';
    } else {
        stopLoopAudio();
        btnSongSelect.classList.remove('active');
        btnSongSelect.querySelector('.music-play-icon').textContent = '▶';
    }
});

document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && currentState !== 'normal') {
        await requestWakeLock();
    }
});

initSettings();

document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
        const url = card.dataset.url;
        showProgressBar();
        applyDirectUrl(url);
    });
});

window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
    }
});

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (settings.theme === 'system') {
        applyTheme('system');
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const btnLight = document.getElementById('btn-theme-light');
    const btnDark = document.getElementById('btn-theme-dark');
    const btnSystem = document.getElementById('btn-theme-system');
    const clockFont = document.getElementById('select-clock-font');
    const clockSize = document.getElementById('clock-size-range');
    const dateFont = document.getElementById('select-date-font');
    const dateSize = document.getElementById('date-size-range');
    
    if (btnLight) btnLight.addEventListener('click', () => { settings.theme = 'light'; saveSettings(); updateSettingsUI(); });
    if (btnDark) btnDark.addEventListener('click', () => { settings.theme = 'dark'; saveSettings(); updateSettingsUI(); });
    if (btnSystem) btnSystem.addEventListener('click', () => { settings.theme = 'system'; saveSettings(); updateSettingsUI(); });

    if (clockFont) clockFont.addEventListener('change', (e) => { settings.clockFont = e.target.value; saveSettings(); applyFonts(); });
    if (clockSize) clockSize.addEventListener('input', (e) => { settings.clockSize = parseInt(e.target.value); saveSettings(); applyFonts(); });
    if (dateFont) dateFont.addEventListener('change', (e) => { settings.dateFont = e.target.value; saveSettings(); applyFonts(); });
    if (dateSize) dateSize.addEventListener('input', (e) => { settings.dateSize = parseInt(e.target.value); saveSettings(); applyFonts(); });
});

function applyFonts() {
    const clockTime = document.getElementById('clock-time');
    const clockDate = document.getElementById('clock-date');
    if (clockTime) {
        clockTime.style.fontFamily = `"${settings.clockFont}", sans-serif`;
        clockTime.style.fontSize = `${settings.clockSize}px`;
    }
    if (clockDate) {
        clockDate.style.fontFamily = `"${settings.dateFont}", serif`;
        clockDate.style.fontSize = `${settings.dateSize}px`;
    }
}
