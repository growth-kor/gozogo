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

