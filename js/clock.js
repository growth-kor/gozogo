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


function applyFonts() {
    const clockTime = document.getElementById('clock-time');
    const clockDate = document.getElementById('clock-date');
    const serifFonts = ['Zodiak', 'Cinzel', 'Italiana'];
    
    if (clockTime) {
        const isSerif = serifFonts.includes(settings.clockFont);
        clockTime.style.fontFamily = `"${settings.clockFont}", ${isSerif ? 'serif' : 'sans-serif'}`;
        clockTime.style.fontSize = `${settings.clockSize}px`;
    }
    if (clockDate) {
        const isSerif = serifFonts.includes(settings.dateFont);
        clockDate.style.fontFamily = `"${settings.dateFont}", ${isSerif ? 'serif' : 'sans-serif'}`;
        clockDate.style.fontSize = `${settings.dateSize}px`;
        clockDate.style.marginBottom = `${settings.clockGap !== undefined ? settings.clockGap : 6}px`;
    }
}
