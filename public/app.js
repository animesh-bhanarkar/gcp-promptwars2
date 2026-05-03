/* CivicGuide — app.js v3
   New: multi-turn chat memory · localStorage persistence ·
        AI personal action plan · demo-mode for missing API key
   =========================================================== */
(() => {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  const STORAGE_KEY = 'civicguide_state';
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } })();

  const state = {
    profile: saved.profile || { firstTime: null, registered: null, location: '' },
    currentStep: saved.currentStep || 0,
    chatHistory: saved.chatHistory || [],
    planGenerated: saved.planGenerated || false
  };

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full */ }
  }

  // ── Step Content ───────────────────────────────────────────────────────────
  const STEPS = [
    {
      emoji: '📋', label: 'Registration',
      title: 'Step 1 — Register to Vote',
      desc: 'Before you can vote, you must be registered. Deadlines vary by state — some allow same-day registration, others require 2–4 weeks in advance.',
      actions: [
        { icon: '🌐', title: 'Register or check status online', text: 'Visit vote.gov to check your status or register in minutes using your driver\'s license.', link: 'https://vote.gov', linkText: 'Register at vote.gov →' },
        { icon: '📅', title: 'Find your deadline', text: 'Most states require registration 15–30 days before Election Day. Check your state\'s exact cutoff.', link: 'https://www.vote.org/voter-registration-deadlines/', linkText: 'Find your deadline →' },
        { icon: '🔄', title: 'Update your address', text: 'Moved recently? You need to re-register at your new address, even if you voted before.' }
      ],
      tip: 'First-timers: You can register online in most states in under 5 minutes. All you need is your driver\'s license or state ID!'
    },
    {
      emoji: '✅', label: 'Verification',
      title: 'Step 2 — Verify Your Registration',
      desc: 'Even if you registered before, confirm your registration is active, your address is current, and you know your polling place.',
      actions: [
        { icon: '🔍', title: 'Confirm your status', text: 'Look up your registration to make sure it\'s active and your info is correct.', link: 'https://www.vote411.org/voter-registration-check', linkText: 'Check status →' },
        { icon: '🏛️', title: 'Find your polling place', text: 'Your polling place is assigned based on your registered address. Confirm it ahead of time.', link: 'https://www.google.com/search?q=polling+place+near+me', linkText: 'Find via Google →' },
        { icon: '📬', title: 'Request a mail ballot', text: 'Prefer to vote from home? Request your absentee ballot early — processing takes time.', link: 'https://www.usa.gov/absentee-voting', linkText: 'Learn about mail voting →' }
      ],
      tip: 'Pro tip: Set a phone reminder 2 weeks before Election Day to double-check your polling place and bring your ID.'
    },
    {
      emoji: '🗳️', label: 'Voting',
      title: 'Step 3 — Choose How to Vote',
      desc: 'There are three ways to cast your ballot. Pick the one that fits your schedule best.',
      actions: [
        { icon: '🏛️', title: 'In person on Election Day', text: 'Go to your assigned polling place. Bring a valid photo ID. Polls are typically open 7AM–8PM.', link: 'https://www.usa.gov/find-polling-place', linkText: 'Find your polling place →' },
        { icon: '☀️', title: 'Early voting', text: 'Many states offer 1–2 weeks of early voting at select locations. Skip Election Day lines!', link: 'https://www.vote.org/early-voting-calendar/', linkText: 'Check early voting dates →' },
        { icon: '📬', title: 'Vote by mail / absentee', text: 'Request a ballot, fill it out at home, and return by your state\'s deadline (mail or drop box).', link: 'https://www.vote.org/absentee-ballot/', linkText: 'Get absentee info →' }
      ],
      tip: 'Bring a valid photo ID (driver\'s license, passport, or state ID) no matter how you plan to vote.'
    },
    {
      emoji: '🏆', label: 'Election Day',
      title: 'Step 4 — Election Day Checklist',
      desc: 'You\'re ready to vote! Here\'s exactly what to do on Election Day to make sure your vote counts.',
      actions: [
        { icon: '⏰', title: 'Arrive 30 min early', text: 'Lines are shortest mid-morning. Arriving early avoids last-minute stress. Polls close at 8PM in most states.' },
        { icon: '🪪', title: 'Bring your photo ID', text: 'ID requirements vary by state. Accepted: driver\'s license, passport, state-issued ID.', link: 'https://www.ncsl.org/research/elections-and-campaigns/voter-id.aspx', linkText: 'Check your state\'s ID rules →' },
        { icon: '📢', title: 'Know your rights', text: 'If you\'re in line before polls close, you can vote! Report problems to 1-866-OUR-VOTE.', link: 'https://866ourvote.org', linkText: 'Election protection hotline →' }
      ],
      tip: 'Made a mistake on your ballot? Ask a poll worker for a replacement before submitting!'
    }
  ];

  // ── Timeline Data ──────────────────────────────────────────────────────────
  const TIMELINE = [
    { date: '~120 days before', title: 'Voter Registration Opens', desc: 'Many states open registration early. Start the process now to avoid last-minute issues.', status: 'past', calTitle: 'Start Voter Registration' },
    { date: '~30 days before', title: 'Registration Deadline', desc: 'Last day to register in most states. Check your state\'s exact date at vote.gov.', status: 'upcoming', badge: 'soon', calTitle: 'Voter Registration Deadline' },
    { date: '~15 days before', title: 'Early Voting Begins', desc: 'Many states open early voting. A great way to avoid long Election Day lines!', status: 'upcoming', badge: 'soon', calTitle: 'Early Voting Begins' },
    { date: '~7 days before', title: 'Mail Ballot Request Deadline', desc: 'Last day to request a mail-in ballot in most states. Act now if voting by mail.', status: 'upcoming', badge: 'urgent', calTitle: 'Mail Ballot Deadline' },
    { date: '1 day before', title: 'Confirm Your Polling Place', desc: 'Double-check your polling place address and confirm what ID you need.', status: 'upcoming', badge: 'urgent', calTitle: 'Confirm Polling Place' },
    { date: '🗳️ Election Day', title: 'Go Vote!', desc: 'Polls open 7AM–8PM in most states. Bring your ID. In line before close = you WILL vote.', status: 'today', calTitle: 'Election Day — Go Vote!' },
    { date: 'After Election', title: 'Results & Certification', desc: 'Results reported on election night; official certification takes several weeks.', status: 'upcoming', calTitle: '' }
  ];

  // ── Confetti ───────────────────────────────────────────────────────────────
  function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * -canvas.height,
      r: Math.random() * 8 + 4, d: Math.random() * 2 + 1,
      color: ['#4f7ef7','#7c3aed','#22c55e','#f59e0b','#ec4899','#06b6d4'][Math.floor(Math.random()*6)],
      tilt: Math.random() * 10 - 5, tiltAngle: 0, tiltSpeed: Math.random() * 0.1 + 0.05
    }));
    let frame;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2); ctx.stroke();
        p.y += p.d; p.tiltAngle += p.tiltSpeed; p.tilt = Math.sin(p.tiltAngle) * 12;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      });
      frame = requestAnimationFrame(draw);
    }
    draw();
    setTimeout(() => { cancelAnimationFrame(frame); ctx.clearRect(0, 0, canvas.width, canvas.height); }, 4000);
  }

  // ── DOM Helpers ────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);

  // ── Screen Transitions ─────────────────────────────────────────────────────
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(`screen-${name}`).classList.add('active');
  }

  // ── Welcome ────────────────────────────────────────────────────────────────
  $('btn-start').addEventListener('click', () => {
    // If we have a saved profile, skip quiz and go straight to app
    if (state.profile.firstTime) {
      launchApp();
    } else {
      showScreen('quiz');
    }
  });

  // Show "Resume" label if returning user
  if (state.profile.firstTime) {
    $('btn-start').textContent = '▶ Resume My Guide';
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  let quizStep = 1;

  function goToQuiz(n) {
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    $(`q${n}`).classList.add('active');
    quizStep = n;
    $('quiz-progress').style.width = ((n - 1) / 3 * 100) + '%';
    $('quiz-step-label').textContent = `Step ${n} of 3`;
  }

  document.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      state.profile[btn.dataset.q] = btn.dataset.v;
      document.querySelectorAll(`[data-q="${btn.dataset.q}"]`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      saveState();
      setTimeout(() => { if (quizStep < 3) goToQuiz(quizStep + 1); }, 300);
    });
  });

  $('btn-skip-location').addEventListener('click', launchApp);
  $('btn-confirm-location').addEventListener('click', () => {
    state.profile.location = $('input-location').value.trim();
    saveState();
    launchApp();
  });
  $('input-location').addEventListener('keydown', e => {
    if (e.key === 'Enter') { state.profile.location = e.target.value.trim(); saveState(); launchApp(); }
  });

  // ── Launch App ─────────────────────────────────────────────────────────────
  function launchApp() {
    showScreen('app');

    if (state.profile.firstTime === 'yes') $('firstimer-banner').classList.remove('hidden');
    if (state.profile.registered === 'no') $('unreg-alert').classList.remove('hidden');

    if (state.profile.location) {
      $('maps-search-input').value = state.profile.location;
      $('btn-google-polls').href = `https://www.google.com/search?q=polling+place+near+${encodeURIComponent(state.profile.location)}`;
      $('timeline-note').textContent = `Showing general U.S. dates — verify exact dates for ${state.profile.location} at vote.gov`;
    } else {
      $('timeline-note').textContent = 'Showing general U.S. dates — confirm your state\'s exact dates at vote.gov';
    }

    renderStepCard(state.currentStep);
    renderTimeline();

    // Restore or init chat
    if (state.chatHistory.length > 0) {
      restoreChat();
    } else {
      initChat();
    }

    // Generate AI plan if not yet done
    if (!state.planGenerated) {
      generatePlan();
    } else {
      // Plan card already in DOM cache; show from storage if available
      const cached = saved.planHtml;
      if (cached) renderPlanCard(cached);
    }
  }

  // ── Tab Navigation ─────────────────────────────────────────────────────────
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      $(tab.id.replace('tab-','panel-')).classList.add('active');
    });
  });

  // ── Restart ────────────────────────────────────────────────────────────────
  $('btn-restart').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    state.profile = { firstTime: null, registered: null, location: '' };
    state.currentStep = 0;
    state.chatHistory = [];
    state.planGenerated = false;
    document.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
    $('input-location').value = '';
    $('firstimer-banner').classList.add('hidden');
    $('unreg-alert').classList.add('hidden');
    $('btn-start').textContent = 'Get Started →';
    const planCard = $('plan-card');
    if (planCard) planCard.remove();
    goToQuiz(1);
    showScreen('quiz');
  });

  // ── Step Guide ─────────────────────────────────────────────────────────────
  function renderStepCard(index) {
    state.currentStep = index;
    saveState();
    const s = STEPS[index];

    const actionsHtml = s.actions.map(a => `
      <div class="action-item">
        <span class="action-icon">${a.icon}</span>
        <div class="action-text">
          <strong>${a.title}</strong> ${a.text}
          ${a.link ? `<br><a class="action-link" href="${a.link}" target="_blank" rel="noopener">${a.linkText}</a>` : ''}
        </div>
      </div>`).join('');

    $('step-card').innerHTML = `
      <p class="step-card-eyebrow">${s.emoji} ${s.label}</p>
      <h2 class="step-card-title">${s.title}</h2>
      <p class="step-card-desc">${s.desc}</p>
      <div class="step-card-actions">${actionsHtml}</div>
      <div class="tip-box">${s.tip}</div>`;

    document.querySelectorAll('.step-nav-btn').forEach((btn, i) => {
      btn.classList.remove('active','done');
      if (i < index) btn.classList.add('done');
      if (i === index) btn.classList.add('active');
    });

    $('btn-prev-step').disabled = index === 0;
    const isLast = index === STEPS.length - 1;
    $('btn-next-step').textContent = isLast ? '✅ Complete Guide!' : 'Next Step →';
    $('btn-next-step').disabled = false;
  }

  document.querySelectorAll('.step-nav-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => renderStepCard(i));
  });
  $('btn-prev-step').addEventListener('click', () => {
    if (state.currentStep > 0) renderStepCard(state.currentStep - 1);
  });
  $('btn-next-step').addEventListener('click', () => {
    if (state.currentStep < STEPS.length - 1) {
      renderStepCard(state.currentStep + 1);
    } else {
      $('celebrate-overlay').classList.remove('hidden');
      launchConfetti();
    }
  });
  $('btn-celebrate-close').addEventListener('click', () => $('celebrate-overlay').classList.add('hidden'));

  // ── AI Personal Action Plan ────────────────────────────────────────────────
  async function generatePlan() {
    const planWrap = $('plan-wrap');
    if (!planWrap) return;
    planWrap.innerHTML = `<div class="plan-loading"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div><span>Generating your personal plan…</span></div>`;

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: state.profile })
      });
      const data = await res.json();

      if (data.demoMode || !data.plan) {
        planWrap.innerHTML = `<div class="plan-demo-note">🔑 Add a GEMINI_API_KEY to enable your personalized AI action plan.</div>`;
        return;
      }

      const { plan } = data;
      const stepsHtml = (plan.steps || []).map(s => `
        <div class="plan-step ${s.urgent ? 'plan-step-urgent' : ''}">
          <span class="plan-step-dot">${s.urgent ? '🔴' : '🔵'}</span>
          <div>
            <strong>${s.title}</strong>
            <p>${s.action}</p>
          </div>
        </div>`).join('');

      const html = `
        <div class="plan-greeting">${plan.greeting || ''}</div>
        <div class="plan-priority">⚡ <strong>Do this first:</strong> ${plan.priority || ''}</div>
        <div class="plan-steps">${stepsHtml}</div>
        <div class="plan-reminder">💪 ${plan.reminder || ''}</div>`;

      renderPlanCard(html);
      state.planGenerated = true;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, planHtml: html })); } catch {}
    } catch {
      planWrap.innerHTML = `<div class="plan-demo-note">⚠️ Could not generate plan. Check your connection and try reloading.</div>`;
    }
  }

  function renderPlanCard(html) {
    const planWrap = $('plan-wrap');
    if (planWrap) planWrap.innerHTML = html;
  }

  // ── Timeline ───────────────────────────────────────────────────────────────
  function makeCalLink(title) {
    if (!title) return '';
    return `<a class="tl-cal" href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}" target="_blank" rel="noopener">📅 Add to Calendar</a>`;
  }

  function renderTimeline() {
    $('timeline-list').innerHTML = TIMELINE.map(item => `
      <div class="timeline-item" role="listitem">
        <span class="tl-date">${item.date}</span>
        <span class="tl-dot ${item.status}"></span>
        <div class="tl-content">
          <p class="tl-title">${item.title}</p>
          <p class="tl-desc">${item.desc}</p>
        </div>
        <div class="tl-right">
          ${item.badge ? `<span class="tl-badge ${item.badge}">${item.badge==='urgent'?'🔴 Urgent':'🟡 Soon'}</span>` : ''}
          ${makeCalLink(item.calTitle)}
        </div>
      </div>`).join('');
  }

  // ── Chat ───────────────────────────────────────────────────────────────────
  const FOLLOWUPS = {
    register: ['What ID do I need to register?','Can I register online?','What\'s the deadline in my state?'],
    mail: ['How early should I request a ballot?','Where do I return a mail ballot?','What if my ballot is lost?'],
    id: ['What if I don\'t have a photo ID?','What counts as valid ID?','Can I use a student ID?'],
    general: ['What happens at a polling place?','Can I take time off work to vote?','How do I check if my vote was counted?']
  };

  function pickFollowups(text) {
    const t = text.toLowerCase();
    if (t.includes('register')) return FOLLOWUPS.register;
    if (t.includes('mail') || t.includes('absentee')) return FOLLOWUPS.mail;
    if (t.includes('id') || t.includes('identification')) return FOLLOWUPS.id;
    return FOLLOWUPS.general;
  }

  function initChat() {
    const role = state.profile.firstTime === 'yes' ? 'first-time voter' : 'voter';
    const loc = state.profile.location ? ` in ${state.profile.location}` : '';
    addMessage('bot', `Hi! I'm CivicGuide 🗳️ — your personal election assistant. I can see you're a ${role}${loc}. Ask me anything about registration, voting methods, deadlines, or what to expect on Election Day!`, true);
  }

  function restoreChat() {
    const wrap = $('chat-messages');
    wrap.innerHTML = '';
    $('suggested-qs').style.display = 'none';
    state.chatHistory.forEach((msg, i) => {
      const isLast = i === state.chatHistory.length - 1;
      addMessageDOM(msg.role, msg.text, isLast && msg.role === 'bot');
    });
  }

  function addMessageDOM(role, text, showFollowups = false) {
    const wrap = $('chat-messages');
    const div = document.createElement('div');
    div.className = `msg ${role}`;

    let followupHtml = '';
    if (showFollowups && role === 'bot') {
      const pills = pickFollowups(text).map(q =>
        `<button class="followup-pill" data-q="${q}">${q}</button>`
      ).join('');
      followupHtml = `<div class="followup-pills">${pills}</div>`;
    }

    div.innerHTML = `
      <div class="msg-avatar">${role === 'bot' ? '🤖' : '👤'}</div>
      <div class="msg-bubble">${text.replace(/\n/g,'<br>')}${followupHtml}</div>`;

    div.querySelectorAll('.followup-pill').forEach(pill => {
      pill.addEventListener('click', () => sendMessage(pill.dataset.q));
    });

    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
  }

  function addMessage(role, text, showFollowups = false) {
    addMessageDOM(role, text, showFollowups);
    state.chatHistory.push({ role, text });
    saveState();
  }

  function showTyping() {
    const wrap = $('chat-messages');
    const el = document.createElement('div');
    el.className = 'msg bot'; el.id = 'typing-bubble';
    el.innerHTML = `<div class="msg-avatar">🤖</div><div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
    wrap.appendChild(el);
    wrap.scrollTop = wrap.scrollHeight;
    return el;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    addMessage('user', text);
    $('chat-input').value = '';
    $('chat-input').style.height = 'auto';
    $('btn-send').disabled = true;
    $('suggested-qs').style.display = 'none';

    const typingEl = showTyping();
    try {
      // Send full chat history for multi-turn memory (exclude the message just added)
      const history = state.chatHistory.slice(0, -1);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: state.profile, history })
      });
      const data = await res.json();
      typingEl.remove();

      if (data.demoMode) {
        addMessage('bot', '🔑 AI chat requires a Gemini API key configured on the server. The guide, timeline, and maps all work without it!');
      } else {
        addMessage('bot', data.reply || data.error || 'Sorry, I couldn\'t process that. Try again!', true);
      }
    } catch {
      typingEl.remove();
      addMessage('bot', '⚠️ Connection error. Please check your internet and try again.');
    } finally {
      $('btn-send').disabled = false;
    }
  }

  $('btn-send').addEventListener('click', () => sendMessage($('chat-input').value));
  $('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e.target.value); }
  });
  $('chat-input').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
  document.querySelectorAll('.suggest-pill').forEach(p => {
    p.addEventListener('click', () => sendMessage(p.dataset.q));
  });

  // ── Maps ───────────────────────────────────────────────────────────────────
  function loadMap(query) {
    $('maps-iframe').src = `https://maps.google.com/maps?q=${encodeURIComponent(query + ' polling station')}&output=embed`;
    $('maps-placeholder').classList.add('hidden');
  }

  $('btn-maps-search').addEventListener('click', () => {
    const q = $('maps-search-input').value.trim();
    if (q) loadMap(q);
  });
  $('maps-search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) loadMap(q); }
  });
  $('btn-use-location').addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    $('btn-use-location').textContent = '⏳ Locating…';
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        $('maps-iframe').src = `https://maps.google.com/maps?q=polling+station&ll=${lat},${lng}&z=13&output=embed`;
        $('maps-placeholder').classList.add('hidden');
        $('btn-use-location').textContent = '📍 My Location';
        $('btn-google-polls').href = `https://www.google.com/maps/search/polling+station/@${lat},${lng},14z`;
      },
      () => {
        alert('Could not get location. Please enter your address manually.');
        $('btn-use-location').textContent = '📍 My Location';
      }
    );
  });

  // ── Register service worker (PWA) ──────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* SW optional */ });
  }

})();
