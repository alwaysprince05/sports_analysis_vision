// SportsVision AI – Dashboard Controller & CV Simulator v3.3
(function () {
  'use strict';

  // ─── STATE ────────────────────────────────────────────────────────────────
  const state = {
    sport: 'basketball',
    tab: 'dashboard',
    status: 'idle',      // idle | running | paused
    isPlaying: false,
    frameRate: 30,
    frame: 0,
    totalFrames: 450,
    possessionPct: { a: 50, b: 50 },
    activePoss: 'a',
    speedHistory: [],
    posA: [], posB: [],
    entities: [],
    ball: null,
    cam: { x: 0, y: 0, tx: 0, ty: 0 },
    maxSpeed: 0,
    distA: 0, distB: 0,
    rallyCount: 0,
    uploadedFile: null,
    isDemo: true
  };

  // ─── CONFIG ───────────────────────────────────────────────────────────────
  const SPORT = {
    basketball: {
      title: 'Basketball Match Analytics',
      desc:  'Real-time player tracking, possession control, and kinetic team metrics.',
      file:  'demo_basketball_court.mp4',
      labelA: 'Team A (Silver)', labelB: 'Team B (Blue)',
      accent: '#ff8800', glow: 'rgba(255,136,0,.18)',
      frames: 450, pA: 5, pB: 5, spd: [4, 28]
    },
    hockey: {
      title: 'Hockey Match Analytics',
      desc:  'Puck velocity estimation, player collision metrics, and zone occupancy.',
      file:  'demo_hockey_rink.mp4',
      labelA: 'Team A (Light)', labelB: 'Team B (Blue)',
      accent: '#00e5ff', glow: 'rgba(0,229,255,.18)',
      frames: 600, pA: 6, pB: 6, spd: [10, 42]
    },
    volleyball: {
      title: 'Volleyball Rally Analytics',
      desc:  'Parabolic ball analytics, rally classification, and spike speed.',
      file:  'demo_volleyball_arena.mp4',
      labelA: 'Team A (Silver)', labelB: 'Team B (Blue)',
      accent: '#a855f7', glow: 'rgba(168,85,247,.18)',
      frames: 350, pA: 6, pB: 6, spd: [2, 22]
    }
  };

  const BCOLOR = { basketball: '#ff6600', hockey: '#1a1a1a', volleyball: '#f43f5e' };
  const TS = {
    a: { box:'rgba(255,255,255,.85)', fill:'rgba(255,255,255,.10)', ring:'rgba(200,200,200,.9)', bg:'rgba(40,40,60,.85)', txt:'#ffffff' },
    b: { box:'rgba(60,140,255,.85)',  fill:'rgba(30,90,220,.10)',   ring:'rgba(60,140,255,.9)',  bg:'rgba(8,20,60,.85)',  txt:'#8cb3ff' }
  };

  // ─── DOM ──────────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const DOM = {
    navItems:     document.querySelectorAll('.nav-item[data-sport]'),
    tabDocs:      document.querySelector('.nav-item[data-tab="documentation"]'),
    sportTitle:   $('current-sport-title'),
    sportDesc:    $('current-sport-desc'),
    videoName:    $('active-video-name'),
    statusTxt:    $('engine-status'),
    pulse:        document.querySelector('.status-pulse'),
    btnToggle:    $('btn-toggle-engine'),
    btnUpload:    $('btn-upload'),
    fileInput:    $('video-file-input'),
    dropZone:     $('drop-zone'),
    loadOverlay:  $('loading-overlay'),
    loadSub:      $('loading-subtext'),
    canvas:       $('cv-canvas'),
    srcVideo:     $('source-video'),
    placeholder:  $('visualizer-placeholder'),
    hudFps:       $('hud-fps'),
    hudFrame:     $('hud-frame'),
    hudDets:      $('hud-detections'),
    ctrlPlay:     $('ctrl-play-pause'),
    ctrlStop:     $('ctrl-stop'),
    timeline:     $('timeline'),
    timeCur:      $('time-current'),
    timeTotal:    $('time-total'),
    miniCanvas:   $('minimap-canvas'),
    flowEl:       $('telemetry-flow'),
    driftEl:      $('telemetry-drift'),
    possPct:      $('possession-val-pct'),
    possTeam:     $('possession-active-team'),
    legAName:     $('legend-team-a-name'),
    legBName:     $('legend-team-b-name'),
    legAPct:      $('legend-team-a-pct'),
    legBPct:      $('legend-team-b-pct'),
    barA:         document.querySelector('.team-a-bar'),
    barB:         document.querySelector('.team-b-bar'),
    kineticsChart:$('kinetics-chart'),
    consoleBox:   $('console-stream'),
    heatCanvas:   $('heatmap-gen-canvas'),
    dashCanvas:   $('dashboard-gen-canvas'),
    heatMsg:      $('heatmap-message'),
    dashMsg:      $('dashboard-message'),
    btnCsv:       $('btn-export-csv'),
    btnArt:       $('btn-save-artifacts'),
    dashView:     $('main-dashboard-view'),
    docsView:     $('documentation-view'),
    docsContent:  $('docs-markdown-content'),
    btnCloseDocs: $('btn-close-docs')
  };

  const CTX = {};   // populated after canvas sizing

  let animId    = null;
  let lastTime  = 0;
  let ro        = null;   // ResizeObserver

  // ─── BOOT ─────────────────────────────────────────────────────────────────
  function boot() {
    bindEvents();
    applySport('basketball', false);   // apply theme without auto-start flag

    // Use ResizeObserver so canvas always matches container
    ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (DOM.canvas && width > 0 && height > 0) {
          DOM.canvas.width  = width;
          DOM.canvas.height = height;
          // If running, just redraw; otherwise draw idle court
          if (!state.isPlaying) drawIdleCourt();
        }
      }
    });
    ro.observe(DOM.dropZone);

    sizeAux();   // minimap, kinetics, artifacts

    // Initialise contexts
    CTX.cv   = DOM.canvas.getContext('2d');
    CTX.mini = DOM.miniCanvas.getContext('2d');
    CTX.kin  = DOM.kineticsChart.getContext('2d');
    CTX.heat = DOM.heatCanvas.getContext('2d');
    CTX.dash = DOM.dashCanvas.getContext('2d');

    drawMiniStatic();
    drawKinStatic();
    log('[SYS] SportsVision AI v3.3 engine ready.', 'system');
    log('[SYS] Auto-starting demo simulation…', 'system');

    // Auto-start demo after layout settles
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sizeAux();
      startEngine();   // ← auto-play on load
    }));
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────
  function bindEvents() {
    DOM.navItems.forEach(item =>
      item.addEventListener('click', () => {
        const s = item.dataset.sport;
        if (s && s !== state.sport) {
          if (state.isPlaying) fullStop();
          applySport(s, true);
        }
      })
    );
    DOM.tabDocs.addEventListener('click', () => showTab('documentation'));
    DOM.btnCloseDocs.addEventListener('click', () => showTab('dashboard'));

    DOM.btnToggle.addEventListener('click', () => {
      state.isPlaying ? pauseEngine() : startEngine();
    });
    DOM.ctrlPlay.addEventListener('click', () => {
      state.isPlaying ? pauseEngine() : startEngine();
    });
    DOM.ctrlStop.addEventListener('click', fullStop);

    DOM.timeline.addEventListener('input', e => {
      seekFrame(Math.floor((+e.target.value / 100) * state.totalFrames));
    });

    DOM.btnUpload.addEventListener('click', () => DOM.fileInput.click());
    DOM.fileInput.addEventListener('change', e => {
      const f = e.target.files[0];
      if (f && f.type.startsWith('video/')) loadFile(f);
    });
    DOM.dropZone.addEventListener('dragover', e => { e.preventDefault(); DOM.dropZone.classList.add('drag-over'); });
    DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('drag-over'));
    DOM.dropZone.addEventListener('drop', e => {
      e.preventDefault(); DOM.dropZone.classList.remove('drag-over');
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith('video/')) loadFile(f);
    });

    DOM.srcVideo.addEventListener('loadedmetadata', () => {
      state.totalFrames = Math.floor(DOM.srcVideo.duration * state.frameRate) || 300;
      DOM.timeTotal.textContent = fmt(DOM.srcVideo.duration);
      hideLoad();
      log(`[VIDEO] ${state.uploadedFile.name} (${DOM.srcVideo.duration.toFixed(1)}s) ready.`, 'system');
      startEngine();
    });

    DOM.btnCsv.addEventListener('click', exportCSV);
    DOM.btnArt.addEventListener('click', exportArt);

    window.addEventListener('resize', sizeAux);
  }

  // ─── SPORT THEME ──────────────────────────────────────────────────────────
  function applySport(sport, autoStart) {
    state.sport = sport;
    const c = SPORT[sport];

    DOM.navItems.forEach(it => {
      const sel = it.dataset.sport === sport;
      it.classList.toggle('active', sel);
      let b = it.querySelector('.badge');
      if (sel && !b) {
        b = document.createElement('span');
        b.className = 'badge active-badge'; b.textContent = 'Live';
        it.appendChild(b);
      } else if (!sel && b) b.remove();
    });

    DOM.sportTitle.textContent = c.title;
    DOM.sportDesc.textContent  = c.desc;
    DOM.videoName.textContent  = state.uploadedFile ? state.uploadedFile.name : c.file;
    DOM.legAName.textContent   = c.labelA;
    DOM.legBName.textContent   = c.labelB;

    document.documentElement.style.setProperty('--accent', c.accent);
    document.documentElement.style.setProperty('--accent-glow', c.glow);

    state.totalFrames = c.frames;
    DOM.timeTotal.textContent   = fmt(c.frames / state.frameRate);
    DOM.hudFrame.textContent    = `0 / ${c.frames}`;
    DOM.timeline.value          = 0;
    DOM.timeCur.textContent     = '00:00';

    resetSim();
    if (autoStart) startEngine();
  }

  // ─── TABS ─────────────────────────────────────────────────────────────────
  async function showTab(tab) {
    if (state.tab === tab) return;
    state.tab = tab;
    const go = () => {
      if (tab === 'documentation') {
        DOM.dashView.style.display = 'none';
        DOM.docsView.style.display = 'block';
        DOM.tabDocs.classList.add('active');
        loadDocs();
      } else {
        DOM.docsView.style.display = 'none';
        DOM.dashView.style.display = 'grid';
        DOM.tabDocs.classList.remove('active');
      }
    };
    document.startViewTransition ? document.startViewTransition(go) : go();
  }

  async function loadDocs() {
    DOM.docsContent.innerHTML = '<p>Loading…</p>';
    try {
      const md = await (await fetch('README.md')).text();
      DOM.docsContent.innerHTML = window.marked ? window.marked.parse(md) : `<pre>${md}</pre>`;
    } catch (e) {
      DOM.docsContent.innerHTML = `<p style="color:#f87171">Could not load README.md — ${e.message}</p>`;
    }
  }

  // ─── CANVAS SIZING ────────────────────────────────────────────────────────
  function sizeAux() {
    // Minimap
    const mp = DOM.miniCanvas.parentNode;
    DOM.miniCanvas.width  = mp.clientWidth  || 220;
    DOM.miniCanvas.height = mp.clientHeight || 130;

    // Kinetics
    const kp = DOM.kineticsChart.parentNode;
    DOM.kineticsChart.width  = kp.clientWidth  || 320;
    DOM.kineticsChart.height = kp.clientHeight || 150;

    // Artifact canvases
    const hp = DOM.heatCanvas.parentNode;
    DOM.heatCanvas.width  = hp.clientWidth  || 320;
    DOM.heatCanvas.height = hp.clientHeight || 180;

    const dp = DOM.dashCanvas.parentNode;
    DOM.dashCanvas.width  = dp.clientWidth  || 320;
    DOM.dashCanvas.height = dp.clientHeight || 180;
  }

  // ─── ENGINE ───────────────────────────────────────────────────────────────
  function startEngine() {
    if (state.frame >= state.totalFrames) resetSim();

    // ── Hide placeholder ──
    DOM.placeholder.style.opacity  = '0';
    DOM.placeholder.style.pointerEvents = 'none';
    setTimeout(() => { DOM.placeholder.style.display = 'none'; }, 250);

    setStatus('running');
    DOM.ctrlPlay.disabled  = false;
    DOM.ctrlStop.disabled  = false;
    DOM.timeline.disabled  = false;
    setPlayBtn('pause');
    DOM.btnToggle.innerHTML = pauseIcon(16) + '<span>Pause Analysis</span>';

    DOM.heatMsg.style.display = 'none';
    DOM.dashMsg.style.display = 'none';

    if (!state.isDemo && DOM.srcVideo.readyState >= 2) DOM.srcVideo.play().catch(() => {});

    state.isPlaying = true;
    lastTime = performance.now();
    log('[ENGINE] Analysis pipeline started.', 'system');
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function pauseEngine() {
    setStatus('paused');
    state.isPlaying = false;
    cancelAnimationFrame(animId);
    if (!state.isDemo) DOM.srcVideo.pause();
    setPlayBtn('play');
    DOM.btnToggle.innerHTML = playIcon(16) + '<span>Resume Analysis</span>';
    log(`[ENGINE] Paused at frame ${state.frame}.`, 'system');
  }

  function fullStop() {
    setStatus('idle');
    state.isPlaying = false;
    cancelAnimationFrame(animId);
    if (!state.isDemo) { DOM.srcVideo.pause(); DOM.srcVideo.currentTime = 0; }

    state.frame = 0;
    DOM.timeline.value       = 0;
    DOM.hudFrame.textContent = `0 / ${state.totalFrames}`;
    DOM.timeCur.textContent  = '00:00';
    DOM.ctrlPlay.disabled    = true;
    DOM.ctrlStop.disabled    = true;
    DOM.timeline.disabled    = true;
    setPlayBtn('play');
    DOM.btnToggle.innerHTML  = playIcon(16) + '<span>Start Analysis</span>';

    // Show placeholder
    DOM.placeholder.style.display     = 'flex';
    DOM.placeholder.style.opacity     = '1';
    DOM.placeholder.style.pointerEvents = 'auto';

    if (CTX.cv) CTX.cv.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
    drawIdleCourt();
    log('[ENGINE] Stopped.', 'system');
  }

  function seekFrame(f) {
    state.frame = clamp(f, 0, state.totalFrames - 1);
    DOM.timeline.value       = (state.frame / state.totalFrames) * 100;
    DOM.hudFrame.textContent = `${state.frame} / ${state.totalFrames}`;
    DOM.timeCur.textContent  = fmt(state.frame / state.frameRate);
    if (!state.isDemo) DOM.srcVideo.currentTime = state.frame / state.frameRate;
    tick(0);
    renderCV();
    renderMini();
    renderKin();
  }

  function setStatus(s) {
    state.status = s;
    DOM.statusTxt.textContent = `Engine ${s.toUpperCase()}`;
    DOM.pulse.className = 'status-pulse' +
      (s === 'running' ? ' active' : s === 'loading' ? ' loading' : '');
  }

  // ─── FILE UPLOAD ──────────────────────────────────────────────────────────
  function loadFile(file) {
    fullStop();
    state.uploadedFile = file;
    state.isDemo       = false;
    DOM.videoName.textContent = file.name;
    showLoad(`Loading ${file.name}…`);
    DOM.srcVideo.src = URL.createObjectURL(file);
    DOM.srcVideo.load();
    log(`[SYS] Loaded: ${file.name}`, 'system');
  }

  function showLoad(msg) {
    setStatus('loading');
    DOM.loadSub.textContent   = msg;
    DOM.loadOverlay.style.display = 'flex';
  }
  function hideLoad() {
    setStatus('idle');
    DOM.loadOverlay.style.display = 'none';
  }

  // ─── SIMULATION RESET ──────────────────────────────────────────────────────
  function resetSim() {
    state.frame = 0;
    state.posA  = []; state.posB = [];
    state.speedHistory = [];
    state.maxSpeed = 0; state.distA = 0; state.distB = 0;
    state.rallyCount = 0;
    state.possessionPct = { a: 50, b: 50 };
    state.activePoss = 'a';
    state.entities = [];
    state.cam = { x: 0, y: 0, tx: 0, ty: 0 };

    const cfg = SPORT[state.sport];
    for (let i = 0; i < cfg.pA; i++) state.entities.push(mkPlayer('a', i + 1));
    for (let i = 0; i < cfg.pB; i++) state.entities.push(mkPlayer('b', i + 1));

    state.ball = {
      x: 640, y: 360, z: 0,
      vx: (Math.random() > .5 ? 1 : -1) * (4 + Math.random() * 5),
      vy: (Math.random() > .5 ? 1 : -1) * 3,
      vz: -8, grav: .5,
      owner: null, trail: []
    };

    updatePossUI();
    DOM.hudFrame.textContent = `0 / ${state.totalFrames}`;
    DOM.timeCur.textContent  = '00:00';
    DOM.timeline.value       = 0;
  }

  function mkPlayer(team, id) {
    const m = 80;
    const px = team === 'a' ? m + Math.random() * 420 : 760 + Math.random() * 420;
    const py = m + Math.random() * 560;
    return { id, team, x: px, y: py, tx: px, ty: py, speed: 0, dist: 0, lr: .04 + Math.random() * .05 };
  }

  // ─── MAIN LOOP ────────────────────────────────────────────────────────────
  function loop(ts) {
    if (!state.isPlaying) return;
    const ms  = ts - lastTime;
    const inv = 1000 / state.frameRate;

    if (ms >= inv) {
      lastTime = ts - (ms % inv);
      state.frame++;

      if (state.frame >= state.totalFrames) {
        state.frame = state.totalFrames;
        pauseEngine();
        DOM.hudFrame.textContent = `${state.frame} / ${state.totalFrames}`;
        log('[ENGINE] Match complete. Generating artifacts…', 'system');
        genHeatmap(); genDashArt();
        return;
      }

      DOM.timeline.value       = (state.frame / state.totalFrames) * 100;
      DOM.hudFrame.textContent = `${state.frame} / ${state.totalFrames}`;
      DOM.timeCur.textContent  = fmt(state.frame / state.frameRate);
      DOM.hudFps.textContent   = ms > 0 ? (1000 / ms).toFixed(1) : '0.0';

      tick(ms);
      renderCV();
      renderMini();
      renderKin();
    }

    animId = requestAnimationFrame(loop);
  }

  // ─── SIMULATION TICK ──────────────────────────────────────────────────────
  function tick() {
    const sport = state.sport;
    const cfg   = SPORT[sport];
    const t     = state.frame / 60;
    const B     = state.ball;
    const MX = 50, XX = 1230, MY = 50, XY = 670;

    // Camera drift
    state.cam.tx = Math.sin(t * .4) * 30;
    state.cam.ty = Math.cos(t * .3) * 10;
    state.cam.x += (state.cam.tx - state.cam.x) * .08;
    state.cam.y += (state.cam.ty - state.cam.y) * .08;
    DOM.flowEl.textContent  = `dx: ${(state.cam.tx - state.cam.x).toFixed(2)}, dy: ${(state.cam.ty - state.cam.y).toFixed(2)}`;
    DOM.driftEl.textContent = `x: ${(state.cam.x * .045).toFixed(2)}m, y: ${(state.cam.y * .045).toFixed(2)}m`;

    let spA = 0, spB = 0;

    // Players
    state.entities.forEach(p => {
      if (Math.random() < .04 || Math.hypot(p.x - p.tx, p.y - p.ty) < 10) {
        if (sport === 'volleyball') {
          p.tx = p.team === 'a' ? MX + Math.random() * 530 : 750 + Math.random() * 420;
          p.ty = MY + Math.random() * (XY - MY);
        } else {
          const spread = sport === 'hockey' ? 280 : 200;
          p.tx = clamp(B.x + (Math.random() - .5) * spread, MX, XX);
          p.ty = clamp(B.y + (Math.random() - .5) * spread, MY, XY);
        }
      }
      const ox = p.x, oy = p.y;
      const lr  = sport === 'hockey' ? p.lr * 1.6 : p.lr;
      p.x += (p.tx - p.x) * lr;
      p.y += (p.ty - p.y) * lr;
      const dm = Math.hypot(p.x - ox, p.y - oy) * .045;
      p.dist += dm;
      p.speed = clamp(dm * state.frameRate * 3.6, cfg.spd[0] * .5, cfg.spd[1] + 4);
      if (p.speed > state.maxSpeed) state.maxSpeed = p.speed;
      if (p.team === 'a') { spA += p.speed; state.distA += dm; state.posA.push({ x: p.x, y: p.y }); }
      else                { spB += p.speed; state.distB += dm; state.posB.push({ x: p.x, y: p.y }); }
    });

    DOM.hudDets.textContent = state.entities.length + 1;

    // Ball physics
    if (sport !== 'volleyball') {
      if (!B.owner) {
        B.x += B.vx; B.y += B.vy;
        if (B.x < MX) { B.x = MX; B.vx =  Math.abs(B.vx); }
        if (B.x > XX) { B.x = XX; B.vx = -Math.abs(B.vx); }
        if (B.y < MY) { B.y = MY; B.vy =  Math.abs(B.vy); }
        if (B.y > XY) { B.y = XY; B.vy = -Math.abs(B.vy); }
        B.vx *= sport === 'hockey' ? .999 : .97;
        B.vy *= sport === 'hockey' ? .999 : .97;
        if (Math.hypot(B.vx, B.vy) < .8) { B.vx = (Math.random() - .5) * 9; B.vy = (Math.random() - .5) * 9; }

        let pick = null, pd = sport === 'hockey' ? 38 : 68;
        state.entities.forEach(p => {
          const d = Math.hypot(p.x - B.x, p.y - B.y);
          if (d < pd) { pick = p; pd = d; }
        });
        if (pick) { B.owner = pick; state.activePoss = pick.team; log(`[POSS] Ball → Team ${pick.team.toUpperCase()} #${pick.id}`, 'track'); }
      } else {
        B.x = B.owner.x + (B.owner.team === 'a' ? 16 : -16);
        B.y = B.owner.y + 6;
        if (Math.random() < .018) {
          const mates = state.entities.filter(e => e.team === B.owner.team && e.id !== B.owner.id);
          const recv  = mates[Math.floor(Math.random() * mates.length)];
          if (recv) {
            const d = Math.hypot(recv.x - B.x, recv.y - B.y);
            const s = sport === 'hockey' ? 34 : 22;
            B.vx = (recv.x - B.x) / (d / s);
            B.vy = (recv.y - B.y) / (d / s);
          }
          const own = B.owner;
          B.owner = null;
          log(`[EVENT] Pass by Team ${own.team.toUpperCase()} #${own.id}`, 'det');
        }
      }
    } else {
      // Volleyball
      if (!B.owner) {
        const prevX = B.x;
        B.x += B.vx; B.y += B.vy;
        B.vz += B.grav; B.z -= B.vz;
        if (B.z < 0) { B.z = 0; B.vz = -Math.abs(B.vz) * .6; }
        // Net check
        if ((prevX < 640 && B.x >= 640) || (prevX > 640 && B.x <= 640)) {
          if (B.z < 55) { B.vx *= -.85; B.x = prevX; log('[ALERT] Net touch!', 'alert'); }
        }
        if (B.x < MX) { B.x = MX; B.vx =  Math.abs(B.vx) * .8; }
        if (B.x > XX) { B.x = XX; B.vx = -Math.abs(B.vx) * .8; }
        if (B.y < MY) { B.y = MY; B.vy =  Math.abs(B.vy) * .8; }
        if (B.y > XY) { B.y = XY; B.vy = -Math.abs(B.vy) * .8; }

        let hit = null, hd = 88;
        state.entities.forEach(p => {
          if ((B.vx > 0 && p.team === 'b') || (B.vx < 0 && p.team === 'a') || B.vx === 0) {
            const d = Math.hypot(p.x - B.x, p.y - B.y);
            if (d < hd) { hit = p; hd = d; }
          }
        });
        if (hit && B.z < 85) {
          const spike = Math.random() < .28;
          const tx = hit.team === 'a' ? 690 + Math.random() * 440 : MX + Math.random() * 440;
          const ty = MY + Math.random() * (XY - MY);
          const d = Math.hypot(tx - B.x, ty - B.y);
          const s = spike ? 32 : 18;
          B.vx = (tx - B.x) / (d / s); B.vy = (ty - B.y) / (d / s);
          B.vz = spike ? -4 : -13; B.z = 18;
          B.owner = hit; state.activePoss = hit.team; state.rallyCount++;
          log(spike
            ? `[ALERT] SPIKE! Team ${hit.team.toUpperCase()} #${hit.id} — Rally #${state.rallyCount}`
            : `[EVENT] Return — Team ${hit.team.toUpperCase()} #${hit.id} — Rally #${state.rallyCount}`,
            spike ? 'alert' : 'det');
        }
      } else { B.owner = null; }
    }

    // Trail
    B.trail.push({ x: B.x, y: B.y, z: B.z || 0 });
    if (B.trail.length > 20) B.trail.shift();

    // Possession
    const step = .07;
    if (state.activePoss === 'a') { state.possessionPct.a = clamp(state.possessionPct.a + step, 0, 100); state.possessionPct.b = clamp(state.possessionPct.b - step, 0, 100); }
    else                          { state.possessionPct.b = clamp(state.possessionPct.b + step, 0, 100); state.possessionPct.a = clamp(state.possessionPct.a - step, 0, 100); }
    updatePossUI();

    const avgA = spA / (cfg.pA || 1);
    const avgB = spB / (cfg.pB || 1);
    state.avgSpeed = (avgA + avgB) / 2;
    state.speedHistory.push({ f: state.frame, a: avgA, b: avgB, act: clamp((state.avgSpeed / cfg.spd[1]) * 100, 0, 100) });
    if (state.speedHistory.length > 120) state.speedHistory.shift();
  }

  // ─── RENDER CV CANVAS ─────────────────────────────────────────────────────
  function drawIdleCourt() {
    if (!CTX.cv) return;
    const c = CTX.cv, cw = DOM.canvas.width, ch = DOM.canvas.height;
    if (!cw || !ch) return;
    c.clearRect(0, 0, cw, ch);
    drawCourtBg(c, cw, ch);
  }

  function renderCV() {
    if (!CTX.cv) return;
    const c = CTX.cv;
    const cw = DOM.canvas.width;
    const ch = DOM.canvas.height;
    if (!cw || !ch) return;

    c.clearRect(0, 0, cw, ch);

    // Background
    if (!state.isDemo && DOM.srcVideo.readyState >= 2) {
      c.drawImage(DOM.srcVideo, 0, 0, cw, ch);
    } else {
      drawCourtBg(c, cw, ch);
    }

    const sx = cw / 1280;
    const sy = ch / 720;

    c.save();
    c.translate(state.cam.x * sx, state.cam.y * sy);

    // Ball trail
    const B = state.ball;
    if (B.trail.length > 1) {
      for (let i = 1; i < B.trail.length; i++) {
        const alpha = (i / B.trail.length) * .55;
        const w     = (i / B.trail.length) * 4;
        c.beginPath();
        c.moveTo(B.trail[i-1].x * sx, (B.trail[i-1].y - B.trail[i-1].z) * sy);
        c.lineTo(B.trail[i].x   * sx, (B.trail[i].y   - B.trail[i].z)   * sy);
        c.strokeStyle = `rgba(255,180,60,${alpha})`;
        c.lineWidth   = w;
        c.lineCap     = 'round';
        c.stroke();
      }
    }

    // Players
    state.entities.forEach(p => {
      const px = p.x * sx, py = p.y * sy;
      const ts = TS[p.team];
      const bw = 46 * sx, bh = 108 * sy;
      const bx = px - bw / 2, by = py - bh;

      // Shadow
      c.beginPath();
      c.ellipse(px, py + 3 * sy, 22 * sx, 7 * sy, 0, 0, Math.PI * 2);
      c.fillStyle = 'rgba(0,0,0,.4)'; c.fill();

      // Body fill
      c.fillStyle = ts.fill;
      c.fillRect(bx, by, bw, bh);

      // Detection box
      c.strokeStyle = ts.box; c.lineWidth = 2;
      c.strokeRect(bx, by, bw, bh);

      // Corner tick marks (YOLO style)
      const tk = 9 * sx;
      c.strokeStyle = ts.ring; c.lineWidth = 2.5;
      [[bx, by, 1, 1],[bx + bw, by, -1, 1],[bx, by + bh, 1, -1],[bx + bw, by + bh, -1, -1]]
        .forEach(([cx, cy, dx, dy]) => {
          c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + dx * tk, cy); c.stroke();
          c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy + dy * tk); c.stroke();
        });

      // Ground ring
      c.beginPath();
      c.ellipse(px, py, 20 * sx, 6 * sy, 0, 0, Math.PI * 2);
      c.strokeStyle = ts.ring; c.lineWidth = 1.5; c.stroke();

      // Label
      const lh = 22 * sy, lw = bw + 14 * sx;
      c.fillStyle = ts.bg;
      c.fillRect(bx, by - lh, lw, lh);
      c.strokeStyle = ts.ring; c.lineWidth = 1;
      c.strokeRect(bx, by - lh, lw, lh);
      c.fillStyle = ts.txt;
      c.font = `bold ${Math.max(9, Math.round(11 * sy))}px Inter,sans-serif`;
      c.fillText(`P${p.id}  ${p.speed.toFixed(0)} km/h`, bx + 4 * sx, by - 7 * sy);
    });

    // Ball / Puck
    const bclr = BCOLOR[state.sport];
    const bx = B.x * sx;
    const by = (B.y - B.z) * sy;

    if (state.sport === 'hockey') {
      c.beginPath();
      c.ellipse(bx, by, 13 * sx, 5 * sy, 0, 0, Math.PI * 2);
      c.fillStyle = '#111'; c.fill();
      c.strokeStyle = '#666'; c.lineWidth = 1.5; c.stroke();
    } else {
      // Halo glow
      c.beginPath();
      c.arc(bx, by, 22 * sx, 0, Math.PI * 2);
      c.fillStyle = bclr + '33'; c.fill();

      // Ball
      const g = c.createRadialGradient(bx - 2 * sx, by - 2 * sy, 0, bx, by, 10 * sx);
      g.addColorStop(0, '#fff');
      g.addColorStop(.4, bclr);
      g.addColorStop(1, bclr + '88');
      c.beginPath();
      c.arc(bx, by, 10 * sx, 0, Math.PI * 2);
      c.fillStyle = g; c.fill();
      c.strokeStyle = bclr; c.lineWidth = 2; c.stroke();
    }

    c.restore();

    // HUD strip
    c.fillStyle = 'rgba(0,0,0,.5)';
    c.fillRect(0, ch - 26, cw, 26);
    c.fillStyle = '#888';
    c.font = `${Math.max(9, Math.round(10 * (cw / 1280)))}px JetBrains Mono,monospace`;
    c.fillText(`SPORTSVISION AI  v3.3  |  ${SPORT[state.sport].title.toUpperCase()}  |  dev: alwaysprince05`, 10, ch - 8);
  }

  // ─── COURT BACKGROUND ─────────────────────────────────────────────────────
  function drawCourtBg(c, cw, ch) {
    const sport = state.sport;
    const sx = cw / 1280, sy = ch / 720;
    const pad = 40;

    // Floor fill
    if (sport === 'basketball') {
      const g = c.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, '#3b1e0a'); g.addColorStop(.5, '#7c4a18'); g.addColorStop(1, '#3b1e0a');
      c.fillStyle = g;
    } else if (sport === 'hockey') {
      const g = c.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, '#cfe9fb'); g.addColorStop(1, '#a8d8f0');
      c.fillStyle = g;
    } else {
      const g = c.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, '#0a1020'); g.addColorStop(1, '#0e1a30');
      c.fillStyle = g;
    }
    c.fillRect(0, 0, cw, ch);

    c.save();
    const lc = sport === 'hockey' ? 'rgba(30,70,200,.3)' : 'rgba(255,255,255,.25)';
    c.strokeStyle = lc; c.lineWidth = 2 * sx;
    c.strokeRect(pad * sx, pad * sy, cw - pad * 2 * sx, ch - pad * 2 * sy);

    if (sport === 'basketball') {
      // Center line + circle
      c.beginPath(); c.moveTo(cw / 2, pad * sy); c.lineTo(cw / 2, ch - pad * sy); c.stroke();
      c.beginPath(); c.arc(cw / 2, ch / 2, 68 * sx, 0, Math.PI * 2); c.stroke();
      // Keys
      const kw = 110 * sx, kh = 140 * sy;
      c.strokeRect(pad * sx, (ch - kh) / 2, kw, kh);
      c.strokeRect(cw - pad * sx - kw, (ch - kh) / 2, kw, kh);
      // Arcs
      c.beginPath(); c.arc(pad * sx + kw, ch / 2, 78 * sx, -Math.PI / 2, Math.PI / 2); c.stroke();
      c.beginPath(); c.arc(cw - pad * sx - kw, ch / 2, 78 * sx, Math.PI / 2, -Math.PI / 2); c.stroke();
      // Baskets
      [pad * sx + 36 * sx, cw - pad * sx - 36 * sx].forEach(bx => {
        c.beginPath(); c.arc(bx, ch / 2, 9 * sx, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,140,0,.7)'; c.fill(); c.strokeStyle = lc; c.stroke();
      });
    } else if (sport === 'hockey') {
      // Red center line
      c.strokeStyle = 'rgba(200,30,30,.7)'; c.lineWidth = 4 * sx;
      c.beginPath(); c.moveTo(cw / 2, pad * sy); c.lineTo(cw / 2, ch - pad * sy); c.stroke();
      // Blue lines
      c.strokeStyle = 'rgba(30,70,200,.6)'; c.lineWidth = 3 * sx;
      [cw * .28, cw * .72].forEach(x => {
        c.beginPath(); c.moveTo(x, pad * sy); c.lineTo(x, ch - pad * sy); c.stroke();
      });
      // Face-off circles
      c.strokeStyle = 'rgba(200,30,30,.4)'; c.lineWidth = 2 * sx;
      [[cw * .2, ch * .3],[cw * .2, ch * .7],[cw * .8, ch * .3],[cw * .8, ch * .7]].forEach(([fx, fy]) => {
        c.beginPath(); c.arc(fx, fy, 55 * sx, 0, Math.PI * 2); c.stroke();
      });
      // Goal creases
      c.strokeStyle = 'rgba(30,70,200,.5)'; c.lineWidth = 2 * sx;
      [pad * sx, cw - pad * sx - 28 * sx].forEach(gx => {
        c.strokeRect(gx, (ch - 48 * sy) / 2, 28 * sx, 48 * sy);
      });
    } else {
      // Volleyball net (thick center line)
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 5 * sx;
      c.beginPath(); c.moveTo(cw / 2, pad * sy); c.lineTo(cw / 2, ch - pad * sy); c.stroke();
      // Net lattice
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1;
      for (let y = pad * sy; y < ch - pad * sy; y += 18 * sy) {
        c.beginPath(); c.moveTo(cw / 2 - 4, y); c.lineTo(cw / 2 + 4, y); c.stroke();
      }
      // 3m attack lines
      c.strokeStyle = lc; c.lineWidth = 2 * sx;
      [cw / 2 - 88 * sx, cw / 2 + 88 * sx].forEach(x => {
        c.beginPath(); c.moveTo(x, pad * sy); c.lineTo(x, ch - pad * sy); c.stroke();
      });
    }
    c.restore();
  }

  // ─── MINIMAP ──────────────────────────────────────────────────────────────
  function drawMiniStatic() {
    if (!CTX.mini) return;
    const c = CTX.mini, mw = DOM.miniCanvas.width, mh = DOM.miniCanvas.height;
    c.fillStyle = '#0d1421'; c.fillRect(0, 0, mw, mh);
    c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 1.5;
    c.strokeRect(8, 8, mw - 16, mh - 16);
    c.beginPath(); c.moveTo(mw / 2, 8); c.lineTo(mw / 2, mh - 8);
    c.strokeStyle = 'rgba(255,255,255,.08)'; c.stroke();
    c.beginPath(); c.arc(mw / 2, mh / 2, Math.min(mw, mh) * .18, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(255,255,255,.05)'; c.stroke();
  }

  function renderMini() {
    if (!CTX.mini) return;
    drawMiniStatic();
    const c = CTX.mini, mw = DOM.miniCanvas.width, mh = DOM.miniCanvas.height;
    const pd = 10;
    const mx = x => pd + (x / 1280) * (mw - pd * 2);
    const my = y => pd + (y / 720)  * (mh - pd * 2);

    state.entities.forEach(p => {
      c.beginPath(); c.arc(mx(p.x), my(p.y), 4.5, 0, Math.PI * 2);
      c.fillStyle = p.team === 'a' ? '#e2e8f0' : '#3b82f6'; c.fill();
      c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1; c.stroke();
    });

    const B = state.ball;
    c.beginPath(); c.arc(mx(B.x), my(B.y), 4, 0, Math.PI * 2);
    c.fillStyle = BCOLOR[state.sport]; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.stroke();
  }

  // ─── KINETICS CHART ───────────────────────────────────────────────────────
  function drawKinStatic() {
    if (!CTX.kin) return;
    const c = CTX.kin, kw = DOM.kineticsChart.width, kh = DOM.kineticsChart.height;
    c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(0, 0, kw, kh);
    c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      c.beginPath(); c.moveTo(0, (kh / 4) * i); c.lineTo(kw, (kh / 4) * i); c.stroke();
    }
  }

  function renderKin() {
    if (!CTX.kin) return;
    drawKinStatic();
    const c = CTX.kin, kw = DOM.kineticsChart.width, kh = DOM.kineticsChart.height;
    const hist = state.speedHistory;
    if (hist.length < 2) return;
    const maxV = SPORT[state.sport].spd[1];
    const gx = i => (i / 119) * kw;
    const gy = v => kh - 12 - clamp(v / maxV, 0, 1) * (kh - 22);
    const line = (key, clr) => {
      c.beginPath(); c.strokeStyle = clr; c.lineWidth = 2;
      hist.forEach((pt, i) => { i === 0 ? c.moveTo(gx(i), gy(pt[key])) : c.lineTo(gx(i), gy(pt[key])); });
      c.stroke();
    };
    line('a', 'rgba(226,232,240,.85)');
    line('b', 'rgba(59,130,246,.85)');
    // Activity dashed
    const accent = SPORT[state.sport].accent;
    c.beginPath(); c.strokeStyle = accent; c.lineWidth = 1.5; c.setLineDash([4, 4]);
    hist.forEach((pt, i) => {
      const y = kh - 12 - (pt.act / 100) * (kh - 22);
      i === 0 ? c.moveTo(gx(i), y) : c.lineTo(gx(i), y);
    });
    c.stroke(); c.setLineDash([]);
    // Legend
    c.font = '10px Inter,sans-serif';
    c.fillStyle = 'rgba(226,232,240,.7)'; c.fillText('Team A', 6, 13);
    c.fillStyle = 'rgba(59,130,246,.7)';  c.fillText('Team B', 55, 13);
    c.fillStyle = accent;                  c.fillText('Activity %', 104, 13);
  }

  // ─── POSSESSION UI ────────────────────────────────────────────────────────
  function updatePossUI() {
    const a = state.possessionPct.a, b = state.possessionPct.b;
    DOM.legAPct.textContent = `${a.toFixed(1)}%`;
    DOM.legBPct.textContent = `${b.toFixed(1)}%`;
    const ap = state.activePoss === 'a' ? a : b;
    DOM.possPct.textContent  = `${Math.round(ap)}%`;
    DOM.possTeam.textContent = state.activePoss === 'a' ? 'TEAM A' : 'TEAM B';
    const C = 314.16;
    DOM.barA.style.strokeDashoffset = (C - (a / 100) * C).toString();
    DOM.barB.style.strokeDashoffset = C.toString();
  }

  // ─── ARTIFACTS ────────────────────────────────────────────────────────────
  function genHeatmap() {
    if (!CTX.heat) return;
    const c = CTX.heat, w = DOM.heatCanvas.width, h = DOM.heatCanvas.height;
    c.fillStyle = '#080e1a'; c.fillRect(0, 0, w, h);
    [[state.posA, 240, 240, 240],[state.posB, 50, 130, 255]].forEach(([pts, r, g, b]) => {
      pts.forEach((pt, i) => {
        if (i % 12) return;
        const rx = 8 + (pt.x / 1280) * (w - 16);
        const ry = 8 + (pt.y / 720)  * (h - 16);
        const rr = 10 + Math.random() * 5;
        const gd = c.createRadialGradient(rx, ry, 0, rx, ry, rr);
        gd.addColorStop(0, `rgba(${r},${g},${b},.32)`);
        gd.addColorStop(1, 'rgba(0,0,0,0)');
        c.beginPath(); c.arc(rx, ry, rr, 0, Math.PI * 2); c.fillStyle = gd; c.fill();
      });
    });
    c.font = 'bold 11px Inter,sans-serif';
    c.fillStyle = 'rgba(220,220,220,.8)'; c.fillText('■ Team A', 10, 16);
    c.fillStyle = 'rgba(60,140,255,.9)';  c.fillText('■ Team B', 80, 16);
  }

  function genDashArt() {
    if (!CTX.dash) return;
    const c = CTX.dash, w = DOM.dashCanvas.width, h = DOM.dashCanvas.height;
    c.fillStyle = '#080e1a'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e2e8f0'; c.font = 'bold 12px Inter,sans-serif';
    c.fillText('Post-Match Telemetry', 12, 18);
    const rows = [
      ['Max Sprint Speed', `${state.maxSpeed.toFixed(1)} km/h`],
      ['Team A Distance',  `${state.distA.toFixed(0)} m`],
      ['Team B Distance',  `${state.distB.toFixed(0)} m`],
      ['Possession A',     `${state.possessionPct.a.toFixed(1)}%`],
      ['Possession B',     `${state.possessionPct.b.toFixed(1)}%`],
    ];
    rows.forEach(([k, v], i) => {
      const y = 40 + i * 22;
      c.fillStyle = '#9ca3af'; c.font = '10px Inter,sans-serif'; c.fillText(k, 12, y);
      c.fillStyle = '#e2e8f0'; c.font = 'bold 10px JetBrains Mono,monospace'; c.fillText(v, w - 80, y);
    });
    // Bar chart
    const mxD = Math.max(state.distA, state.distB, 1);
    const bw  = w - 28;
    c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(12, h - 55, bw, 14);
    c.fillStyle = '#c9d1d9';               c.fillRect(12, h - 55, (state.distA / mxD) * bw, 14);
    c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(12, h - 32, bw, 14);
    c.fillStyle = '#3b82f6';               c.fillRect(12, h - 32, (state.distB / mxD) * bw, 14);
  }

  // ─── EXPORT ───────────────────────────────────────────────────────────────
  function exportCSV() {
    if (!state.speedHistory.length) { alert('Start analysis first.'); return; }
    let csv = 'frame,team_a,team_b,activity\n';
    state.speedHistory.forEach(h => { csv += `${h.f},${h.a.toFixed(2)},${h.b.toFixed(2)},${h.act.toFixed(2)}\n`; });
    dl(new Blob([csv], { type: 'text/csv' }), `sportsvision_${state.sport}.csv`);
    log('[SYS] CSV exported.', 'system');
  }

  function exportArt() {
    if (!state.posA.length) { alert('Start analysis first.'); return; }
    genHeatmap(); genDashArt();
    dl(b64Blob(DOM.heatCanvas.toDataURL()), `heatmap_${state.sport}.png`);
    log('[SYS] Artifacts saved.', 'system');
  }

  function dl(blob, name) {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    a.click(); URL.revokeObjectURL(a.href);
  }

  function b64Blob(d) {
    const [h, data] = d.split(','), mime = h.match(/:(.*?);/)[1], b = atob(data);
    const u = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return new Blob([u], { type: mime });
  }

  // ─── CONSOLE ──────────────────────────────────────────────────────────────
  function log(msg, type = 'system') {
    const el = document.createElement('div');
    el.className = `console-line ${type}`;
    el.textContent = `[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg}`;
    DOM.consoleBox.appendChild(el);
    DOM.consoleBox.scrollTop = DOM.consoleBox.scrollHeight;
    while (DOM.consoleBox.children.length > 80) DOM.consoleBox.removeChild(DOM.consoleBox.firstChild);
  }

  // ─── UTIL ─────────────────────────────────────────────────────────────────
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function fmt(s) {
    if (!isFinite(s)) return '00:00';
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  }
  function playIcon(sz = 20) {
    return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  }
  function pauseIcon(sz = 20) {
    return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
  }
  function setPlayBtn(mode) {
    DOM.ctrlPlay.innerHTML = mode === 'play' ? playIcon() : pauseIcon();
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();
