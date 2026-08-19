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
    
    

    spawnLiquidSplash(startX, startY);

    await deleteFileFromDB();
    settings.lastAppliedUrl = null;
    saveSettings();
    
    bgImage.classList.remove('loaded');
    bgVideo.classList.remove('loaded');

    setTimeout(() => {
        cleanupMedia();
        
        
        
        
        liquidExplosionZone.style.display = 'none';
        liquidExplosionZone.innerHTML = '';
        
        dropZone.classList.add('active');
        fileInput.value = '';
        currentState = 'normal';
    }, 2200);
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
        const speed = Math.random() * 35 + 15; 

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
    const maxFrames = 180;

    function updateDrops() {
        if (frame >= maxFrames) return;
        frame++;

        const gravity = 0.04; 
        const friction = 0.992; 

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
            // Gradually decay targetTransform to 0 (spring physics)
            targetTransform.x *= 0.85;
            targetTransform.y *= 0.85;
            targetTransform.rx *= 0.85;
            targetTransform.ry *= 0.85;

            const ease = 0.15;
            currentTransform.x += (targetTransform.x - currentTransform.x) * ease;
            currentTransform.y += (targetTransform.y - currentTransform.y) * ease;
            currentTransform.rx += (targetTransform.rx - currentTransform.rx) * ease;
            currentTransform.ry += (targetTransform.ry - currentTransform.ry) * ease;

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

