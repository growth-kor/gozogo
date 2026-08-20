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
    
    let ampmHtml = '';
    if (!settings.use24h) {
        const ampmText = hours >= 12 ? 'PM' : 'AM';
        ampmHtml = `<span class="clock-ampm">${ampmText}</span>`;
        hours = hours % 12;
        hours = hours ? hours : 12;
    }
    
    const formattedHours = String(hours).padStart(2, '0');
    let parts = [
        `<span class="time-digit">${formattedHours[0]}</span><span class="time-digit">${formattedHours[1]}</span>`,
        `<span class="time-digit">${minutes[0]}</span><span class="time-digit">${minutes[1]}</span>`
    ];
    
    if (settings.showSeconds) {
        parts.push(`<span class="time-digit">${seconds[0]}</span><span class="time-digit">${seconds[1]}</span>`);
    }
    
    const timeHtml = parts.join('<span class="time-colon">:</span>');
    clockTime.innerHTML = ampmHtml ? `${ampmHtml}${timeHtml}` : timeHtml;
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
