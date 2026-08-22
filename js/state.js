const bgViewport = document.getElementById('bg-viewport');
const bgImage = document.getElementById('bg-image');
const bgVideo = document.getElementById('bg-video');
const noSleepVideo = document.getElementById('nosleep-video');
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
    clockGap: 6,
    brightness: 100, 
    blur: 0,
    lastAppliedUrl: null,
    theme: 'system',
    clockFont: 'Zodiak',
    clockSize: 110,
    dateFont: 'Zodiak',
    dateSize: 24 
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

