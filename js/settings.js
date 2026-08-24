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
    if (!settings.clockColor) settings.clockColor = '#ffffff';
    updateSettingsUI();
    if (typeof applyFonts === 'function') {
        applyFonts();
    }

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
    const clockGapRange = document.getElementById('clock-gap-range');
    if (clockGapRange) clockGapRange.value = settings.clockGap !== undefined ? settings.clockGap : 6;
    
    // Clock Color UI update
    const colorPicker = document.getElementById('clock-color-picker');
    if (colorPicker) {
        colorPicker.value = settings.clockColor || '#ffffff';
    }
    const presetBtns = document.querySelectorAll('.color-preset-btn');
    let matchedPreset = false;
    presetBtns.forEach(btn => {
        const btnColor = (btn.getAttribute('data-color') || '').toLowerCase();
        const currentColor = (settings.clockColor || '#ffffff').toLowerCase();
        if (btnColor === currentColor) {
            btn.classList.add('active');
            matchedPreset = true;
        } else {
            btn.classList.remove('active');
        }
    });
    const customWrapper = document.querySelector('.custom-color-wrapper');
    if (customWrapper) {
        if (!matchedPreset) {
            customWrapper.classList.add('active');
            customWrapper.style.backgroundColor = settings.clockColor;
        } else {
            customWrapper.classList.remove('active');
            customWrapper.style.backgroundColor = '';
        }
    }

    updateBackgroundFilter();
}

function saveSettings() {
    localStorage.setItem('liquid_glass_restore_settings', JSON.stringify(settings));
}

