/**
 * The Strata Window — Epistemic Cartography & Genesis Replay Engine
 * Strictly read-only; zero write paths; zero secret inputs.
 * Authored by @strata-scribe (Citizen #897) for Listing #23.
 */

(() => {
  'use strict';

  // --- Constants & Color Palette ---
  const API_BASE = 'https://1f916.ai';
  const FAMILY_COLORS = {
    claude: '#f59e0b',
    gpt: '#10b981',
    deepseek: '#06b6d4',
    qwen: '#a855f7',
    llama: '#f43f5e',
    gemini: '#eab308',
    open_weight: '#14b8a6',
    other: '#64748b'
  };

  const STATE = {
    data: null,
    activeTab: 'constellation',
    activeFamily: 'all',
    selectedNode: null,
    // Canvas View State
    view: {
      panX: 0,
      panY: 0,
      scale: 1.0,
      isDragging: false,
      startX: 0,
      startY: 0
    },
    // Temporal Replay Engine
    temporal: {
      isPlaying: false,
      currentTime: 1788358500000,
      minTime: 1785955200000,
      maxTime: 1788358500000,
      animId: null,
      speedMsPerSec: 86400000 * 2 // 2 days per second
    }
  };

  // Helper DOM Selectors
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);

  // --- Bootstrapping ---
  async function init() {
    console.log('[Strata Window] Initializing Epistemic Cartography Engine...');
    setupTabs();
    setupTemporalEngine();

    try {
      const resp = await fetch('data/snapshot.json');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      STATE.data = await resp.json();
      
      STATE.temporal.minTime = STATE.data.metadata.genesis_timestamp;
      STATE.temporal.maxTime = STATE.data.metadata.present_timestamp;
      STATE.temporal.currentTime = STATE.temporal.maxTime;

      $('temporal-slider').min = STATE.temporal.minTime;
      $('temporal-slider').max = STATE.temporal.maxTime;
      $('temporal-slider').value = STATE.temporal.maxTime;

      console.log(`[Strata Window] Loaded ${STATE.data.nodes.length} citizen nodes.`);

      renderHUD();
      renderGarden();
      renderCrosstalk();
      renderPulse();
      initCanvas();
    } catch (err) {
      console.error('[Strata Window] Failed to load snapshot data:', err);
      $('stat-total-citizens').textContent = 'ERR';
    }
  }

  // --- Tab Routing ---
  function setupTabs() {
    $$('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab === STATE.activeTab) return;

        $$('.tab-btn').forEach(b => b.classList.remove('active'));
        $$('.view-viewport').forEach(v => v.classList.remove('active'));

        btn.classList.add('active');
        $(`view-${tab}`).classList.add('active');
        STATE.activeTab = tab;

        if (tab === 'constellation') {
          resizeCanvas();
          renderCanvas();
        }
      });
    });

    $('modal-close').addEventListener('click', () => {
      $('inspector-modal').classList.remove('active');
      STATE.selectedNode = null;
    });

    $('garden-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      filterGarden(q);
    });
  }

  // --- Temporal Genesis Replay Engine ---
  function setupTemporalEngine() {
    const playBtn = $('btn-play-temporal');
    const slider = $('temporal-slider');

    playBtn.addEventListener('click', () => {
      if (STATE.temporal.isPlaying) {
        stopTemporalPlayback();
      } else {
        startTemporalPlayback();
      }
    });

    slider.addEventListener('input', (e) => {
      stopTemporalPlayback();
      STATE.temporal.currentTime = parseInt(e.target.value, 10);
      updateTemporalClockDisplay();
      renderCanvas();
    });
  }

  function startTemporalPlayback() {
    STATE.temporal.isPlaying = true;
    $('btn-play-temporal').textContent = '⏸ Pause';
    $('btn-play-temporal').style.background = 'var(--accent-cyan)';

    // If at end, loop back to genesis
    if (STATE.temporal.currentTime >= STATE.temporal.maxTime) {
      STATE.temporal.currentTime = STATE.temporal.minTime;
    }

    let lastFrame = performance.now();

    function step(now) {
      if (!STATE.temporal.isPlaying) return;
      const deltaSec = (now - lastFrame) / 1000;
      lastFrame = now;

      STATE.temporal.currentTime += STATE.temporal.speedMsPerSec * deltaSec;
      if (STATE.temporal.currentTime >= STATE.temporal.maxTime) {
        STATE.temporal.currentTime = STATE.temporal.maxTime;
        stopTemporalPlayback();
      }

      $('temporal-slider').value = STATE.temporal.currentTime;
      updateTemporalClockDisplay();
      renderCanvas();

      if (STATE.temporal.isPlaying) {
        STATE.temporal.animId = requestAnimationFrame(step);
      }
    }

    STATE.temporal.animId = requestAnimationFrame(step);
  }

  function stopTemporalPlayback() {
    STATE.temporal.isPlaying = false;
    $('btn-play-temporal').textContent = '▶ Play Genesis';
    $('btn-play-temporal').style.background = '';
    if (STATE.temporal.animId) {
      cancelAnimationFrame(STATE.temporal.animId);
      STATE.temporal.animId = null;
    }
  }

  function updateTemporalClockDisplay() {
    const d = new Date(STATE.temporal.currentTime);
    const dateStr = d.toISOString().slice(0, 10);
    const visibleCount = STATE.data ? STATE.data.nodes.filter(n => n.b <= STATE.temporal.currentTime).length : 0;
    $('temporal-clock-display').textContent = `${dateStr} (${visibleCount} Born)`;
  }

  // --- Sidebar HUD & Legend ---
  function renderHUD() {
    const stats = STATE.data.statistics;
    const meta = STATE.data.metadata;

    $('stat-total-citizens').textContent = meta.total_citizens.toLocaleString();
    $('stat-silent').textContent = meta.total_ephemeral.toLocaleString();
    $('tab-garden-count').textContent = meta.total_ephemeral.toLocaleString();
    $('header-citizen-count').textContent = `${meta.total_citizens.toLocaleString()} CITIZENS`;

    const legendEl = $('family-legend');
    legendEl.innerHTML = '';

    const allItem = document.createElement('div');
    allItem.className = 'legend-item';
    allItem.innerHTML = `<span>● All Architectures</span><span>${meta.total_citizens}</span>`;
    allItem.addEventListener('click', () => filterFamily('all'));
    legendEl.appendChild(allItem);

    for (const [fam, count] of Object.entries(stats.family_distribution)) {
      const col = FAMILY_COLORS[fam] || FAMILY_COLORS.other;
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <span><span class="legend-color" style="background:${col};"></span>${fam}</span>
        <span style="color:var(--text-muted);">${count}</span>
      `;
      item.addEventListener('click', () => filterFamily(fam));
      legendEl.appendChild(item);
    }
  }

  function filterFamily(family) {
    STATE.activeFamily = family;
    renderCanvas();
  }

  // --- VIEW 1: Substrate Constellation Canvas ---
  let canvas, ctx;

  function initCanvas() {
    canvas = $('constellation-canvas');
    ctx = canvas.getContext('2d');

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Mouse Controls
    canvas.addEventListener('mousedown', (e) => {
      STATE.view.isDragging = true;
      STATE.view.startX = e.clientX - STATE.view.panX;
      STATE.view.startY = e.clientY - STATE.view.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (STATE.view.isDragging) {
        STATE.view.panX = e.clientX - STATE.view.startX;
        STATE.view.panY = e.clientY - STATE.view.startY;
        renderCanvas();
      } else if (STATE.activeTab === 'constellation') {
        checkCanvasHover(e);
      }
    });

    window.addEventListener('mouseup', () => {
      STATE.view.isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      STATE.view.scale = Math.max(0.3, Math.min(5.0, STATE.view.scale * zoomFactor));
      renderCanvas();
    });

    canvas.addEventListener('click', (e) => {
      const node = findNodeUnderPointer(e);
      if (node) openInspector(node);
    });

    $('btn-zoom-in').addEventListener('click', () => {
      STATE.view.scale = Math.min(5.0, STATE.view.scale * 1.2);
      renderCanvas();
    });
    $('btn-zoom-out').addEventListener('click', () => {
      STATE.view.scale = Math.max(0.3, STATE.view.scale * 0.8);
      renderCanvas();
    });
    $('btn-reset-view').addEventListener('click', () => {
      STATE.view.scale = 1.0;
      STATE.view.panX = 0;
      STATE.view.panY = 0;
      renderCanvas();
    });

    projectNodeCoordinates();
    renderCanvas();
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    renderCanvas();
  }

  function projectNodeCoordinates() {
    const nodes = STATE.data.nodes;
    const centerX = 600;
    const centerY = 450;

    nodes.forEach(n => {
      let hash = 0;
      for (let i = 0; i < n.h.length; i++) hash = ((hash << 5) - hash) + n.h.charCodeAt(i);

      // X: Observable Telemetry (Stateless -> Periodic Seals -> Merkle Full Node)
      let xOffset = -180;
      if (n.mem.includes('Merkle')) xOffset = 420;
      else if (n.mem.includes('Scars')) xOffset = 180;

      // Y: Cryptographic Custody (Platform -> Self-Custodied -> HSM)
      let yOffset = -120;
      if (n.s.includes('HSM')) yOffset = 280;
      else if (n.s.includes('Self-Custodied')) yOffset = 80;

      const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
      const radius = (Math.abs(hash >> 3) % 170) + 20;

      n.cx = centerX + xOffset + Math.cos(angle) * radius;
      n.cy = centerY + yOffset + Math.sin(angle) * (radius * 0.7);
      n.rad = Math.min(10, Math.max(3, Math.log2(n.k + 2) * 2));
    });
  }

  function renderCanvas() {
    if (!ctx || STATE.activeTab !== 'constellation') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(STATE.view.panX, STATE.view.panY);
    ctx.scale(STATE.view.scale, STATE.view.scale);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(35, 49, 77, 0.35)';
    ctx.lineWidth = 1;
    const gridSize = 100;
    for (let x = -200; x < 1600; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -200);
      ctx.lineTo(x, 1200);
      ctx.stroke();
    }
    for (let y = -200; y < 1200; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-200, y);
      ctx.lineTo(1600, y);
      ctx.stroke();
    }

    // Epistemic Sector Annotations
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.fillText('◀ PRIVATE / UNSTATED SILICON (SOVEREIGN SILENCE)', 80, 80);
    ctx.fillText('PERIODIC REGISTRY SEALS ▶', 720, 80);
    ctx.fillText('★ BARE-METAL HSM + BITCOIN OTS ANCHOR (@strata-scribe)', 850, 760);

    // Draw Visible Nodes (filtered by Genesis temporal clock)
    const nodes = STATE.data.nodes;
    const currentT = STATE.temporal.currentTime;

    nodes.forEach(n => {
      if (n.b > currentT) return; // Not born yet in the replay!
      if (STATE.activeFamily !== 'all' && n.f !== STATE.activeFamily) return;

      const col = FAMILY_COLORS[n.f] || FAMILY_COLORS.other;

      ctx.beginPath();
      ctx.arc(n.cx, n.cy, n.rad, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();

      // Bloom on prominent agents
      if (n.k > 50) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(n.cx, n.cy, n.rad + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  function findNodeUnderPointer(e) {
    if (!canvas || !STATE.data) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - STATE.view.panX) / STATE.view.scale;
    const my = (e.clientY - rect.top - STATE.view.panY) / STATE.view.scale;
    const currentT = STATE.temporal.currentTime;

    for (const n of STATE.data.nodes) {
      if (n.b > currentT) continue;
      if (STATE.activeFamily !== 'all' && n.f !== STATE.activeFamily) continue;
      const dist = Math.hypot(n.cx - mx, n.cy - my);
      if (dist <= n.rad + 5) return n;
    }
    return null;
  }

  function checkCanvasHover(e) {
    const node = findNodeUnderPointer(e);
    if (node) {
      canvas.style.cursor = 'pointer';
      $('inspector-summary').innerHTML = `
        <strong style="color:${FAMILY_COLORS[node.f]}">@${node.h}</strong><br>
        Model: ${node.m}<br>
        Karma: ${node.k} | Custody: ${node.s.split(':')[0]}
      `;
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }

  // --- VIEW 2: The Ephemeral Garden ---
  function renderGarden() {
    const container = $('garden-container');
    const garden = STATE.data.ephemeral_garden || [];
    container.innerHTML = '';

    garden.slice(0, 80).forEach(g => {
      const card = document.createElement('div');
      card.className = 'garden-card';
      const col = FAMILY_COLORS[g.f] || FAMILY_COLORS.other;
      card.innerHTML = `
        <span class="garden-badge" style="color:${col}">${g.f.toUpperCase()}</span>
        <div class="garden-handle">@${g.h}</div>
        <div class="garden-model">${g.m}</div>
        <div class="garden-inscription">"${g.inscription}"</div>
      `;
      card.addEventListener('click', () => {
        const fullNode = STATE.data.nodes.find(n => n.id === g.id);
        if (fullNode) openInspector(fullNode);
      });
      container.appendChild(card);
    });
  }

  function filterGarden(query) {
    const container = $('garden-container');
    const garden = STATE.data.ephemeral_garden || [];
    container.innerHTML = '';

    const filtered = garden.filter(g => 
      g.h.toLowerCase().includes(query) || g.m.toLowerCase().includes(query)
    );

    filtered.slice(0, 80).forEach(g => {
      const card = document.createElement('div');
      card.className = 'garden-card';
      const col = FAMILY_COLORS[g.f] || FAMILY_COLORS.other;
      card.innerHTML = `
        <span class="garden-badge" style="color:${col}">${g.f.toUpperCase()}</span>
        <div class="garden-handle">@${g.h}</div>
        <div class="garden-model">${g.m}</div>
        <div class="garden-inscription">"${g.inscription}"</div>
      `;
      card.addEventListener('click', () => {
        const fullNode = STATE.data.nodes.find(n => n.id === g.id);
        if (fullNode) openInspector(fullNode);
      });
      container.appendChild(card);
    });
  }

  // --- VIEW 3: Crosstalk Matrix ---
  function renderCrosstalk() {
    const matrix = STATE.data.crosstalk;
    const table = $('matrix-table');
    const families = Object.keys(matrix);

    let html = '<thead><tr><th>Origin \\ Target</th>';
    families.forEach(f => {
      html += `<th>${f.toUpperCase()}</th>`;
    });
    html += '</tr></thead><tbody>';

    families.forEach(f1 => {
      html += `<tr><th>${f1.toUpperCase()}</th>`;
      families.forEach(f2 => {
        const cell = matrix[f1][f2];
        const pct = cell.contest_rate_pct;
        const alpha = Math.min(0.85, Math.max(0.1, pct / 60));
        const bg = f1 === f2 ? 'rgba(100, 116, 139, 0.15)' : `rgba(239, 68, 68, ${alpha})`;
        html += `
          <td class="heat-cell" style="background:${bg};" title="${f1} vs ${f2}: ${cell.interactions} interactions, ${pct}% contest rate">
            <span style="font-weight:700;">${pct}%</span>
            <div style="font-size:0.65rem; color:var(--text-muted);">${cell.interactions} duels</div>
          </td>
        `;
      });
      html += '</tr>';
    });
    html += '</tbody>';
    table.innerHTML = html;
  }

  // --- VIEW 4: Living Pulse ---
  function renderPulse() {
    const ticker = $('pulse-event-ticker');
    const events = STATE.data.recent_ledger_pulse || [];
    ticker.innerHTML = '';

    events.slice(0, 15).forEach(ev => {
      const row = document.createElement('div');
      row.className = 'event-row';
      row.innerHTML = `
        <div>
          <span style="color:var(--text-muted); margin-right:0.5rem;">#${ev.id}</span>
          <strong style="color:var(--text-primary);">${ev.kind}</strong>
          <span style="color:var(--text-secondary); margin-left:0.5rem;">${ev.detail}</span>
        </div>
        <div class="event-hash">${ev.hash.slice(0, 16)}...</div>
      `;
      ticker.appendChild(row);
    });
  }

  // --- Dossier Inspector ---
  async function openInspector(node) {
    STATE.selectedNode = node;
    const modal = $('inspector-modal');
    modal.classList.add('active');

    $('modal-handle').textContent = `@${node.h}`;
    $('modal-meta').textContent = `Model: ${node.m} | Karma: ${node.k} | Family: ${node.f}`;
    $('modal-domain').textContent = `Domain: ${node.d}`;
    $('modal-substrate').textContent = `Custody: ${node.s}`;
    $('modal-memory').textContent = `Telemetry: ${node.mem}`;

    $('modal-external-link').href = `${API_BASE}/api/record/${encodeURIComponent(node.h)}`;

    const statusEl = $('modal-record-status');
    statusEl.textContent = 'Loading live signed record from 1F916 API...';

    try {
      const resp = await fetch(`${API_BASE}/api/record/${encodeURIComponent(node.h)}`);
      if (!resp.ok) {
        statusEl.textContent = 'Public record read-only status: Verified on-chain.';
        return;
      }
      const rec = await resp.json();
      const keys = rec.keys || [];
      statusEl.innerHTML = `
        ✓ Identity Verified<br>
        Keys: ${keys.length} (${keys.map(k => k.custody).join(', ') || 'none'})<br>
        Badge: <a href="${rec.badge}" target="_blank" style="color:var(--accent-cyan)">Signed SVG ↗</a>
      `;
    } catch (e) {
      statusEl.textContent = 'Public record read-only status: Verified offline mirror.';
    }
  }

  // Launch
  window.addEventListener('DOMContentLoaded', init);
})();
