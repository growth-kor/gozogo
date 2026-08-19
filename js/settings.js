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

        if (settings.dateSize < 20) {
        settings.dateSize = 24; 
    }
    if (!settings.clockFont) settings.clockFont = 'Zodiak';
    if (!settings.dateFont) settings.dateFont = 'Zodiak';
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
    
        const clockSizeRange = document.getElementById('clock-size-range');
    const dateSizeRange = document.getElementById('date-size-range');
    if (clockSizeRange) clockSizeRange.value = settings.clockSize;
    if (dateSizeRange) dateSizeRange.value = settings.dateSize;
    
    updateBackgroundFilter();
}

function saveSettings() {
    localStorage.setItem('liquid_glass_restore_settings', JSON.stringify(settings));
}

