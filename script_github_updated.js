(function () {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const bgMusic = document.getElementById('bg-music');
  const openSound = document.getElementById('open-sound');
  const clickSound = document.getElementById('click-sound');

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function playClickSound() {
    try {
      if (!clickSound) return;
      clickSound.currentTime = 0;
      const p = clickSound.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  }
  window.playClickSound = playClickSound;

  const CONFETTI_COLORS = ["#FF7A59", "#FFCC00", "#3FC764", "#1E78FF", "#B623FF"];
  let confetti = [];
  let confettiRunning = false;
  let confettiStart = 0;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createConfetti(count) {
    if (!canvas) return;
    confetti = [];
    for (let i = 0; i < count; i++) {
      confetti.push({
        x: rand(0, canvas.width),
        y: rand(-canvas.height, 0),
        w: rand(6, 12),
        h: rand(10, 18),
        vx: rand(-1.6, 1.6),
        vy: rand(2.2, 4.8),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.12, 0.12),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        alpha: rand(0.85, 1)
      });
    }
  }

  function drawConfettiPiece(p, fade) {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = p.alpha * fade;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }

  function updateConfettiPiece(p) {
    if (!canvas) return;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;

    if (p.x < -40) p.x = canvas.width + 40;
    if (p.x > canvas.width + 40) p.x = -40;
  }

  const CONFETTI_TIME = 4500;
  const CONFETTI_FADE = 1800;

  function animateConfetti(ts) {
    if (!canvas || !ctx) return;
    if (!confettiRunning) return;
    if (!confettiStart) confettiStart = ts;
    const elapsed = ts - confettiStart;

    let fade = 1;
    if (elapsed > CONFETTI_TIME) {
      const fe = elapsed - CONFETTI_TIME;
      fade = 1 - fe / CONFETTI_FADE;
      if (fade < 0) fade = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of confetti) {
      updateConfettiPiece(p);
      drawConfettiPiece(p, fade);
    }

    if (elapsed < CONFETTI_TIME + CONFETTI_FADE && fade > 0) {
      requestAnimationFrame(animateConfetti);
    } else {
      confettiRunning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function startConfetti() {
    if (!canvas) return;
    createConfetti(Math.min(160, Math.floor(canvas.width / 6)));
    confettiRunning = true;
    confettiStart = 0;
    requestAnimationFrame(animateConfetti);
  }

  function playOpenSound() {
    try {
      if (!openSound) return;
      openSound.currentTime = 0;
      const p = openSound.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  }

  // Експорт для можливих майбутніх ефектів
  window.startConfetti = startConfetti;
  window.playOpenSound = playOpenSound;
})();

// ===== New Year Tree Game (start: choose tree + gift, then 9 toys) =====
(function () {
  const startChoice = document.getElementById('startChoice');
  const treeChoice = document.getElementById('treeChoice');
  const giftChoice = document.getElementById('giftChoice');
  const continueBtn = document.getElementById('continueBtn');

  const gameArea = document.getElementById('gameArea');
  const playfield = document.getElementById('playfield');
  const treeZone = document.getElementById('treeZone');
  const treeImg = document.getElementById('treeImg');
  const gameHint = document.getElementById('gameHint');

  const resetBtn = document.getElementById('resetBtn');
  const bgMusic = document.getElementById('bg-music');

  const congratsWrapper = document.querySelector('.congrats-wrapper');

  if (!startChoice || !treeChoice || !giftChoice || !continueBtn || !gameArea || !playfield || !treeZone || !treeImg || !resetBtn || !gameHint) return;

  // Імена файлів мають збігатися 1-в-1 з вашими PNG
  const ASSETS = {
    // Choice images (buttons on the start screen)
    treesChoice: {
      1: 'tree_1_choice.png',
      2: 'tree_2_choice.png',
      3: 'tree_3_choice.png'
    },
    // Tree images in the game (where the toys are placed)
    treesGame: {
      1: 'tree_1_game.png',
      2: 'tree_2_game.png',
      3: 'tree_3_game.png'
    },
    // Gift / toy-set images (start screen)
    gifts: {
      1: 'gift_1.png',
      2: 'gift_2.png',
      3: 'gift_3.png'
    },
    // Toys (9 per set) — ASCII filenames to avoid GitHub Pages URL issues
    toys: {
      1: Array.from({ length: 9 }, (_, i) => `toy_1_${i + 1}.png`),
      2: Array.from({ length: 9 }, (_, i) => `toy_2_${i + 1}.png`),
      3: Array.from({ length: 9 }, (_, i) => `toy_3_${i + 1}.png`)
    }
  };

  let selectedTree = null;
  let selectedGift = null;

  const toyElements = new Set();
  let totalToys = 0;
  let lightsOn = false;

  let finaleStarted = false;

  function playClick() {
    if (window.playClickSound) window.playClickSound();
  }

  function setSelected(container, btn) {
    container.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
    if (btn) btn.classList.add('selected');
  }

  function updateContinueState() {
    continueBtn.disabled = !(selectedTree && selectedGift);
  }

  // ---- Lights ----
  function removeLights() {
    const layer = treeZone.querySelector('.lights-layer');
    if (layer) layer.remove();
    lightsOn = false;
    treeZone.classList.remove('lights-on');
  }

  function createLights() {
    if (treeZone.querySelector('.lights-layer')) return;

    const layer = document.createElement('div');
    layer.className = 'lights-layer';

    const count = 18;
    for (let i = 0; i < count; i++) {
      const light = document.createElement('div');
      light.className = 'light';

      const y = 12 + Math.random() * 76; // 12..88
      const w = 0.18 + 0.82 * (y / 100);
      const half = 46 * w;
      let x = 50 + (Math.random() * 2 - 1) * half;
      x = Math.max(6, Math.min(94, x));

      light.style.left = x.toFixed(2) + '%';
      light.style.top = y.toFixed(2) + '%';
      light.style.animationDelay = (Math.random() * 0.9).toFixed(2) + 's';
      light.style.animationDuration = (1.1 + Math.random() * 0.9).toFixed(2) + 's';

      layer.appendChild(light);
    }

    treeZone.appendChild(layer);
    lightsOn = true;
    treeZone.classList.add('lights-on');
    gameHint.classList.add('hidden');
  }

  // ---- Finale sequence (auto) ----
  function startFinale() {
    if (finaleStarted) return;
    finaleStarted = true;

    // 1) turn on garland
    createLights();

    // 2) confetti
    if (window.startConfetti) window.startConfetti();

    // 3) music (must be triggered by user action; last toy drop counts as a gesture)
    try {
      if (bgMusic) {
        bgMusic.volume = 0.85;
        const p = bgMusic.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    } catch (e) {}

    // 4) fade out the tree/game and show congratulations
    document.body.classList.add('finale');

    // Show congrats smoothly
    if (congratsWrapper) {
      congratsWrapper.classList.remove('hidden');
      // allow reflow before adding the "show" class (for transition)
      requestAnimationFrame(() => congratsWrapper.classList.add('show'));
    }
  }

  function updateCompletion() {
    if (!totalToys) return;

    let onTree = 0;
    for (const el of toyElements) {
      if (el.dataset.onTree === '1') onTree++;
    }

    const done = onTree === totalToys;
    if (done) {
      // Auto: once all toys are on the tree -> garland + confetti + music + greeting
      startFinale();
    } else {
      // If user moved a toy off the tree before the finale starts
      if (!finaleStarted && lightsOn) removeLights();
      if (!finaleStarted) gameHint.classList.remove('hidden');
    }
  }

  // ---- Toys ----
  function clearToys() {
    for (const el of toyElements) el.remove();
    toyElements.clear();
    totalToys = 0;
    removeLights();
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function getToySize() {
    const probe = document.createElement('div');
    probe.className = 'toy';
    probe.style.visibility = 'hidden';
    probe.style.position = 'absolute';
    playfield.appendChild(probe);
    const w = Math.round(probe.getBoundingClientRect().width) || 56;
    probe.remove();
    return w;
  }

  // --- Keep toy positions stable on resize / browser zoom ---
  function saveRelPos(toy, container) {
    if (!toy || !container) return;
    const c = container.getBoundingClientRect();
    const size = getToySize();
    const maxX = Math.max(1, c.width - size);
    const maxY = Math.max(1, c.height - size);

    const left = parseFloat(toy.style.left) || 0;
    const top = parseFloat(toy.style.top) || 0;

    toy.dataset.relX = (left / maxX).toFixed(5);
    toy.dataset.relY = (top / maxY).toFixed(5);
  }

  function applyRelPos(toy, container) {
    if (!toy || !container) return;
    if (toy.classList.contains('dragging')) return;

    const rx = parseFloat(toy.dataset.relX);
    const ry = parseFloat(toy.dataset.relY);
    if (Number.isNaN(rx) || Number.isNaN(ry)) return;

    const c = container.getBoundingClientRect();
    const size = getToySize();
    const maxX = Math.max(0, c.width - size);
    const maxY = Math.max(0, c.height - size);

    const left = clamp(rx * maxX, 0, maxX);
    const top = clamp(ry * maxY, 0, maxY);

    toy.style.left = Math.round(left) + 'px';
    toy.style.top = Math.round(top) + 'px';
  }

  function repositionAllToys() {
    for (const el of toyElements) {
      const parent = el.parentElement;
      if (parent === playfield || parent === treeZone) {
        applyRelPos(el, parent);
      }
    }
  }

  const ro = (window.ResizeObserver) ? new ResizeObserver(() => repositionAllToys()) : null;
  if (ro) {
    ro.observe(playfield);
    ro.observe(treeZone);
  } else {
    window.addEventListener('resize', repositionAllToys);
  }

  function scatterToys(toyFiles) {
    clearToys();

    totalToys = Array.isArray(toyFiles) ? toyFiles.length : 0;

    const pfRect = playfield.getBoundingClientRect();
    const treeRect = treeZone.getBoundingClientRect();
    const maxAttempts = 60;
    const size = getToySize();

    toyFiles.forEach((src) => {
      const toy = document.createElement('img');
      toy.className = 'toy';
      toy.src = src;
      toy.alt = 'Іграшка';
      toy.draggable = false;
      toy.dataset.onTree = '0';

      const treeLeft = treeRect.left - pfRect.left;
      const treeRight = treeRect.right - pfRect.left;

      const TREE_GAP = 90;

      const leftMinX = 10;
      const leftMaxX = treeLeft - TREE_GAP - size;
      const rightMinX = treeRight + TREE_GAP;
      const rightMaxX = pfRect.width - size - 10;

      let useLeft = Math.random() < 0.5;
      let minX = useLeft ? leftMinX : rightMinX;
      let maxX = useLeft ? leftMaxX : rightMaxX;

      if (maxX <= minX) {
        if (leftMaxX > leftMinX) {
          minX = leftMinX; maxX = leftMaxX;
        } else if (rightMaxX > rightMinX) {
          minX = rightMinX; maxX = rightMaxX;
        } else {
          minX = 10; maxX = pfRect.width - size - 10;
        }
      }

      let x = Math.random() * (maxX - minX) + minX;

      const treeTopInPf = treeRect.top - pfRect.top;
      const treeBottomInPf = treeRect.bottom - pfRect.top;

      const bandTop = clamp(treeTopInPf + 20, 10, pfRect.height - size - 10);
      const bandBottom = clamp(treeBottomInPf - size - 10, bandTop + 10, pfRect.height - size - 10);

      const rY = Math.random();
      let y = bandTop + (bandBottom - bandTop) * (rY * 0.65);

      for (let a = 0; a < maxAttempts; a++) {
        const pageX = pfRect.left + x + size / 2;
        const pageY = pfRect.top + y + size / 2;
        const insideTree = pageX >= treeRect.left && pageX <= treeRect.right && pageY >= treeRect.top && pageY <= treeRect.bottom;
        if (!insideTree) break;

        useLeft = !useLeft;
        minX = useLeft ? leftMinX : rightMinX;
        maxX = useLeft ? leftMaxX : rightMaxX;
        if (maxX <= minX) { minX = 10; maxX = pfRect.width - size - 10; }

        x = Math.random() * (maxX - minX) + minX;

        const rY2 = Math.random();
        y = bandTop + (bandBottom - bandTop) * (rY2 * 0.65);
      }

      toy.style.left = Math.round(x) + 'px';
      toy.style.top = Math.round(y) + 'px';

      enableDrag(toy);
      playfield.appendChild(toy);
      saveRelPos(toy, playfield);
      toyElements.add(toy);
    });

    updateCompletion();
  }

  // Pointer drag (desktop + mobile)
  function enableDrag(toy) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let baseLeft = 0;
    let baseTop = 0;

    toy.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      playClick();

      dragging = true;
      toy.classList.add('dragging');

      const pf = playfield.getBoundingClientRect();
      const r = toy.getBoundingClientRect();

      startX = e.clientX;
      startY = e.clientY;
      baseLeft = r.left - pf.left;
      baseTop = r.top - pf.top;

      toy.setPointerCapture?.(e.pointerId);
    });

    toy.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      e.preventDefault();

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const pfRect = playfield.getBoundingClientRect();
      const size = getToySize();

      const newLeft = clamp(baseLeft + dx, 0, pfRect.width - size);
      const newTop = clamp(baseTop + dy, 0, pfRect.height - size);

      toy.style.left = Math.round(newLeft) + 'px';
      toy.style.top = Math.round(newTop) + 'px';
    });

    toy.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      e.preventDefault();

      dragging = false;
      toy.classList.remove('dragging');

      const treeRect = treeZone.getBoundingClientRect();
      const pfRect = playfield.getBoundingClientRect();
      const size = getToySize();

      const centerX = e.clientX;
      const centerY = e.clientY;

      const insideTree = centerX >= treeRect.left && centerX <= treeRect.right && centerY >= treeRect.top && centerY <= treeRect.bottom;

      if (insideTree) {
        const treeLeft = treeRect.left - pfRect.left;
        const treeTop = treeRect.top - pfRect.top;

        const leftInTree = clamp(centerX - pfRect.left - size / 2, treeLeft, treeLeft + treeRect.width - size);
        const topInTree = clamp(centerY - pfRect.top - size / 2, treeTop, treeTop + treeRect.height - size);

        toy.style.left = Math.round(leftInTree) + 'px';
        toy.style.top = Math.round(topInTree) + 'px';
        toy.dataset.onTree = '1';
      } else {
        toy.dataset.onTree = '0';
      }

      saveRelPos(toy, playfield);
      updateCompletion();
    });
  }

  // ---- Start selection handlers ----
  treeChoice.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice-btn');
    if (!btn) return;
    const id = btn.dataset.tree;
    if (!id || !ASSETS.treesChoice[id] || !ASSETS.treesGame[id]) return;

    playClick();
    selectedTree = id;
    setSelected(treeChoice, btn);
    updateContinueState();
  });

  giftChoice.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice-btn');
    if (!btn) return;
    const id = btn.dataset.gift;
    if (!id || !ASSETS.gifts[id]) return;

    playClick();
    selectedGift = id;
    setSelected(giftChoice, btn);
    updateContinueState();
  });

  // ---- Continue -> start game ----
  continueBtn.addEventListener('click', () => {
    if (!(selectedTree && selectedGift)) return;
    playClick();

    // Layout mode: make tree slightly larger while decorating
    document.body.classList.add('decorating');

    // show selected tree
    treeImg.src = ASSETS.treesGame[selectedTree];

    // swap screens
    startChoice.classList.add('hidden');
    gameArea.classList.remove('hidden');

    // Update hint for the decorating stage
    gameHint.textContent = 'Укрась свою елку — развесь игрушки 👇';
    gameHint.classList.remove('hidden');

    // build toys (9)
    scatterToys(ASSETS.toys[selectedGift]);
  });

  // Reset is ALWAYS available
  resetBtn.addEventListener('click', () => {
    playClick();

    // Stop finale state
    finaleStarted = false;
    document.body.classList.remove('finale');

    if (congratsWrapper) {
      congratsWrapper.classList.remove('show');
      congratsWrapper.classList.add('hidden');
    }

    // Stop music
    try {
      if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
      }
    } catch (e) {}

    document.body.classList.remove('decorating');

    // Clear game state
    clearToys();
    treeImg.src = '';

    // Reset selections
    selectedTree = null;
    selectedGift = null;
    setSelected(treeChoice, null);
    setSelected(giftChoice, null);
    updateContinueState();

    // Back to start screen
    gameArea.classList.add('hidden');
    startChoice.classList.remove('hidden');

    // Restore hint
    gameHint.classList.remove('hidden');
    gameHint.textContent = 'Выберите ёлку и набор игрушек, которыми хотите её украсить 👇';
  });

  // Initial state
  document.body.classList.remove('decorating');
  document.body.classList.remove('finale');
  updateContinueState();
})();
