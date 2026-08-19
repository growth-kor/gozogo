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
        // fullscreenBtn remains dimmed unless hovered
    } else {
        fullscreenBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
        `;
        //
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
    const clockSize = document.getElementById('clock-size-range');
    const dateSize = document.getElementById('date-size-range');
    
    // Custom Font Select Logic
    function setupCustomSelect(selectId, settingKey) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const trigger = select.querySelector('.custom-select-trigger');
        const options = select.querySelectorAll('.custom-option');
        
        trigger.textContent = settings[settingKey] || 'Zodiak';
        options.forEach(opt => {
            if (opt.getAttribute('data-value') === settings[settingKey]) {
                opt.classList.add('selected');
            }
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== select) s.classList.remove('open');
            });
            select.classList.toggle('open');
        });

        options.forEach(option => {
            option.addEventListener('mouseenter', () => {
                const previewVal = option.getAttribute('data-value');
                const targetEl = settingKey === 'clockFont' ? document.getElementById('clock-time') : document.getElementById('clock-date');
                const serifFonts = ['Zodiak', 'Cinzel', 'Italiana'];
                const isSerif = serifFonts.includes(previewVal);
                if (targetEl) {
                    targetEl.style.fontFamily = `"${previewVal}", ${isSerif ? 'serif' : 'sans-serif'}`;
                }
            });

            option.addEventListener('mouseleave', () => {
                applyFonts(); 
            });

            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const val = option.getAttribute('data-value');
                settings[settingKey] = val;
                
                trigger.textContent = val;
                options.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                
                select.classList.remove('open');
                saveSettings();
                applyFonts();
            });
        });
    }

    setupCustomSelect('select-clock-font-custom', 'clockFont');
    setupCustomSelect('select-date-font-custom', 'dateFont');

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
    });

    if (clockSize) clockSize.addEventListener('input', (e) => { settings.clockSize = parseInt(e.target.value); saveSettings(); applyFonts(); });
    if (dateSize) dateSize.addEventListener('input', (e) => { settings.dateSize = parseInt(e.target.value); saveSettings(); applyFonts(); });
    const clockGap = document.getElementById('clock-gap-range');
    if (clockGap) clockGap.addEventListener('input', (e) => { settings.clockGap = parseInt(e.target.value); saveSettings(); applyFonts(); });

});

