// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const ADMIN_KEY = '!1394712839-XD9-1294712839?';
let adminUnlocked = false;

// Music tracklist — mirrors background-music audio
const TRACKS = [
  { title: 'Background Theme',  artist: '@party',  duration: '4:27', src: 'https://files.catbox.moe/njj44a.mp3' }
];
let currentTrackIdx = 0;

// ─────────────────────────────────────────────

function initMedia() {
  const backgroundMusic = document.getElementById('background-music');
  const backgroundVideo = document.getElementById('background');
  if (!backgroundMusic || !backgroundVideo) return;
  backgroundMusic.volume = 0.3;
  backgroundVideo.muted = false;
  backgroundVideo.play().catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {

  // ── Element refs ──
  const startScreen   = document.getElementById('start-screen');
  const startText     = document.getElementById('start-text');
  const profileName   = document.getElementById('profile-name');
  const profileBio    = document.getElementById('profile-bio');
  const visitorCount  = document.getElementById('visitor-count');
  const bgMusic       = document.getElementById('background-music');
  const bgVideo       = document.getElementById('background');
  const glitchOverlay = document.querySelector('.glitch-overlay');
  const profileBlock  = document.getElementById('profile-block');
  const skillsBlock   = document.getElementById('skills-block');
  const networkBlock  = document.getElementById('network-block');
  const musicBlock    = document.getElementById('music-block');
  const adminBlock    = document.getElementById('admin-block');
  const pythonBar     = document.getElementById('python-bar');
  const cppBar        = document.getElementById('cpp-bar');
  const csharpBar     = document.getElementById('csharp-bar');
  const resultsBtn    = document.getElementById('results-button-container');
  const resultsToggle = document.getElementById('results-theme');
  const resultsHint   = document.getElementById('results-hint');
  const profilePic    = document.querySelector('.profile-picture');
  const profileCont   = document.querySelector('.profile-container');
  const socialIcons   = document.querySelectorAll('.social-icon');
  const badges        = document.querySelectorAll('.badge');
  const volumeIcon    = document.getElementById('volume-icon');
  const volumeSlider  = document.getElementById('volume-slider');
  const transpSlider  = document.getElementById('transparency-slider');
  const adminModal    = document.getElementById('admin-modal');
  const adminKeyInput = document.getElementById('admin-key-input');
  const adminKeyError = document.getElementById('admin-key-error');
  const adminCancel   = document.getElementById('admin-modal-cancel');
  const adminLogout   = document.getElementById('admin-logout');

  const btnEls = [1,2,3,4,5].map(n => document.getElementById('btn-' + n));

  // All panels indexed 1-5
  const panels = {
    1: profileBlock,
    2: skillsBlock,
    3: networkBlock,
    4: musicBlock,
    5: adminBlock
  };

  const primaryColors = {
    1: '#00CED1',
    2: '#22C55E',
    3: '#A855F7',
    4: '#F97316',
    5: '#EF4444'
  };

  // ── Custom cursor ──
  const cursor = document.querySelector('.custom-cursor');
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  if (isTouchDevice) {
    document.body.classList.add('touch-device');
    document.addEventListener('touchstart', e => {
      cursor.style.left = e.touches[0].clientX + 'px';
      cursor.style.top  = e.touches[0].clientY + 'px';
    });
    document.addEventListener('touchmove', e => {
      cursor.style.left = e.touches[0].clientX + 'px';
      cursor.style.top  = e.touches[0].clientY + 'px';
    });
  } else {
    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
    document.addEventListener('mousedown', () => { cursor.style.transform = 'scale(0.8) translate(-50%,-50%)'; });
    document.addEventListener('mouseup',   () => { cursor.style.transform = 'scale(1) translate(-50%,-50%)'; });
  }

  // ── Start screen typewriter ──
  const startMsg = 'Action Wins│Click Anywhere';
  let sIdx = 0, sTxt = '', sCursor = true;

  function typeStart() {
    if (sIdx < startMsg.length) sTxt = startMsg.slice(0, ++sIdx);
    startText.textContent = sTxt + (sCursor ? '|' : ' ');
    setTimeout(typeStart, 100);
  }
  setInterval(() => { sCursor = !sCursor; startText.textContent = sTxt + (sCursor ? '|' : ' '); }, 500);

  // ── Visitor counter ──
  function initVisitorCounter() {
    let total = parseInt(localStorage.getItem('totalVisitorCount')) || 5671;
    if (!localStorage.getItem('hasVisited')) {
      total++;
      localStorage.setItem('totalVisitorCount', total);
      localStorage.setItem('hasVisited', 'true');
    }
    visitorCount.textContent = total.toLocaleString();
  }
  initVisitorCounter();

  // ── PAGE SWITCHING ──────────────────────────────────────────────
  let currentPage = 1;
  let skillsAnimated = false;

  function showPage(n) {
    if (n === 5 && !adminUnlocked) {
      openAdminModal();
      return;
    }

    const oldPanel = panels[currentPage];
    const newPanel = panels[n];

    // Update nav buttons
    btnEls.forEach((b, i) => b.classList.toggle('active', i + 1 === n));

    // Update body class for border colours
    document.body.classList.remove('page-1','page-2','page-3','page-4','page-5');
    document.body.classList.add('page-' + n);

    // Update primary colour CSS var
    document.documentElement.style.setProperty('--primary-color', primaryColors[n] || '#00CED1');

    // Show/hide Open Source button (page 2 only, and only when profile is shown, not skills)
    if (n === 2) {
      resultsBtn.classList.remove('hidden');
    } else {
      resultsBtn.classList.add('hidden');
      resultsHint.classList.add('hidden');
      skillsShowing = false;
    }

    if (oldPanel === newPanel) return;

    // Animate out old panel
    gsap.to(oldPanel, {
      x: -60, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        oldPanel.classList.add('hidden');
        oldPanel.style.transform = '';

        // Animate in new panel
        newPanel.classList.remove('hidden');
        gsap.fromTo(newPanel,
          { x: 60, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out', clearProps: 'transform' }
        );

        // Page-specific on-enter logic
        if (n === 2 && !skillsAnimated) {
          skillsAnimated = true;
          gsap.to(pythonBar,  { width: '87%', duration: 2, ease: 'power2.out', delay: 0.2 });
          gsap.to(cppBar,     { width: '75%', duration: 2, ease: 'power2.out', delay: 0.3 });
          gsap.to(csharpBar,  { width: '80%', duration: 2, ease: 'power2.out', delay: 0.4 });
        }

        if (n === 4) initMusicPage();

        // Restart orbit on page 1
        if (n === 1) {
          profileCont.classList.remove('orbit');
          void profileCont.offsetWidth;
          profileCont.classList.add('orbit');
        }
      }
    });

    currentPage = n;
  }

  // Wire nav buttons
  btnEls.forEach((btn, i) => {
    const n = i + 1;
    btn.addEventListener('click',      () => showPage(n));
    btn.addEventListener('touchstart', e => { e.preventDefault(); showPage(n); });
  });

  // ── OPEN SOURCE TOGGLE (within page 2) ──
  let skillsShowing = false;

  resultsToggle.addEventListener('click', toggleSkillsView);
  resultsToggle.addEventListener('touchstart', e => { e.preventDefault(); toggleSkillsView(); });

  function toggleSkillsView() {
    // On page 2, "Open Source" was originally a toggle between profile and skills
    // Now page 2 IS the skills page, so this just highlights that we're viewing it
    resultsHint.classList.toggle('hidden');
  }

  // ── START SCREEN ──
  function onStart() {
    startScreen.classList.add('hidden');
    bgMusic.muted = false;
    bgMusic.play().catch(() => {});

    // Show page 1
    profileBlock.classList.remove('hidden');
    gsap.fromTo(profileBlock,
      { opacity: 0, y: -50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out', onComplete: () => {
        profileBlock.classList.add('profile-appear');
        profileCont.classList.add('orbit');
      }}
    );

    if (!isTouchDevice) {
      try { new cursorTrailEffect({ length: 10, size: 8, speed: 0.2 }); } catch (e) {}
    }

    typeWriterName();
    typeWriterBio();
  }

  startScreen.addEventListener('click', onStart);
  startScreen.addEventListener('touchstart', e => { e.preventDefault(); onStart(); });

  // ── NAME TYPEWRITER ──
  const nameStr = '@prince';
  let nTxt = '', nIdx = 0, nDel = false, nCursor = true;

  function typeWriterName() {
    if (!nDel && nIdx < nameStr.length)      nTxt = nameStr.slice(0, ++nIdx);
    else if (nDel && nIdx > 0)               nTxt = nameStr.slice(0, --nIdx);
    else if (nIdx === nameStr.length)        { nDel = true; setTimeout(typeWriterName, 10000); return; }
    else if (nIdx === 0)                     nDel = false;
    profileName.textContent = nTxt + (nCursor ? '|' : ' ');
    if (Math.random() < 0.1) { profileName.classList.add('glitch'); setTimeout(() => profileName.classList.remove('glitch'), 200); }
    setTimeout(typeWriterName, nDel ? 150 : 300);
  }
  setInterval(() => { nCursor = !nCursor; profileName.textContent = nTxt + (nCursor ? '|' : ' '); }, 500);

  // ── BIO TYPEWRITER ──
  const bioMsgs = [
    'open source social platform, INSPIRED by guns.lol, not based on',
    '"Hello, World!", party/xd9'
  ];
  let bTxt = '', bIdx = 0, bMsgIdx = 0, bDel = false, bCursor = true;

  function typeWriterBio() {
    const msg = bioMsgs[bMsgIdx];
    if (!bDel && bIdx < msg.length)         bTxt = msg.slice(0, ++bIdx);
    else if (bDel && bIdx > 0)              bTxt = msg.slice(0, --bIdx);
    else if (bIdx === msg.length)           { bDel = true; setTimeout(typeWriterBio, 2000); return; }
    else if (bIdx === 0 && bDel)            { bDel = false; bMsgIdx = (bMsgIdx + 1) % bioMsgs.length; }
    profileBio.textContent = bTxt + (bCursor ? '|' : ' ');
    if (Math.random() < 0.1) { profileBio.classList.add('glitch'); setTimeout(() => profileBio.classList.remove('glitch'), 200); }
    setTimeout(typeWriterBio, bDel ? 75 : 150);
  }
  setInterval(() => { bCursor = !bCursor; profileBio.textContent = bTxt + (bCursor ? '|' : ' '); }, 500);

  // ── VOLUME ──
  let isMuted = false;

  volumeIcon.addEventListener('click', toggleMute);
  volumeIcon.addEventListener('touchstart', e => { e.preventDefault(); toggleMute(); });

  function toggleMute() {
    isMuted = !isMuted;
    bgMusic.muted = isMuted;
    volumeIcon.innerHTML = isMuted
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>';
  }

  volumeSlider.addEventListener('input', () => {
    bgMusic.volume = volumeSlider.value;
    isMuted = false; bgMusic.muted = false;
    volumeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>';
  });

  // ── TRANSPARENCY ──
  transpSlider.addEventListener('input', () => {
    const o = transpSlider.value;
    document.querySelectorAll('.panel-block').forEach(el => {
      el.style.background    = o == 0 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,' + o + ')';
      el.style.backdropFilter = o == 0 ? 'none' : 'blur(' + (10 * o) + 'px)';
      el.style.borderColor    = o == 0 ? 'transparent' : '';
    });
    socialIcons.forEach(i => { i.style.opacity = '1'; i.style.pointerEvents = 'auto'; });
    badges.forEach(b => { b.style.opacity = '1'; b.style.pointerEvents = 'auto'; });
    [profileName, profileBio, visitorCount].forEach(el => { if (el) el.style.opacity = '1'; });
  });

  // ── 3D TILT ──
  function handleTilt(e, el) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const cx2 = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const cy2 = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    gsap.to(el, {
      rotationX:  ((cy2 - cy) / r.height) * 12,
      rotationY: -((cx2 - cx) / r.width)  * 12,
      duration: 0.3, ease: 'power2.out', transformPerspective: 1000
    });
  }
  const resetTilt = el => gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power2.out' });

  Object.values(panels).forEach(p => {
    p.addEventListener('mousemove', e => handleTilt(e, p));
    p.addEventListener('mouseleave', () => resetTilt(p));
    p.addEventListener('touchmove', e => { e.preventDefault(); handleTilt(e, p); });
    p.addEventListener('touchend', () => resetTilt(p));
  });

  // ── PROFILE PICTURE ──
  profilePic.addEventListener('mouseenter', () => {
    glitchOverlay.style.opacity = '1';
    setTimeout(() => { glitchOverlay.style.opacity = '0'; }, 500);
  });

  function spinPfp() {
    profileCont.classList.remove('fast-orbit','orbit');
    void profileCont.offsetWidth;
    profileCont.classList.add('fast-orbit');
    setTimeout(() => {
      profileCont.classList.remove('fast-orbit');
      void profileCont.offsetWidth;
      profileCont.classList.add('orbit');
    }, 500);
  }
  profilePic.addEventListener('click', spinPfp);
  profilePic.addEventListener('touchstart', e => { e.preventDefault(); spinPfp(); });

  // ── MUSIC PAGE ──────────────────────────────────────────────────
  let musicInited = false;

  function initMusicPage() {
    if (musicInited) return;
    musicInited = true;

    const vinyl      = document.getElementById('music-vinyl');
    const trackName  = document.getElementById('music-track-name');
    const trackArtist= document.getElementById('music-artist');
    const tracklist  = document.getElementById('music-tracklist');
    const playBtn    = document.getElementById('music-play');
    const prevBtn    = document.getElementById('music-prev');
    const nextBtn    = document.getElementById('music-next');

    function renderTrack() {
      const t = TRACKS[currentTrackIdx];
      trackName.textContent   = t.title;
      trackArtist.textContent = t.artist;

      // Sync vinyl spin with audio state
      if (!bgMusic.paused) vinyl.classList.add('playing');
      else                  vinyl.classList.remove('playing');

      playBtn.textContent = bgMusic.paused ? '▶' : '⏸';

      // Tracklist
      tracklist.innerHTML = '';
      TRACKS.forEach((tr, i) => {
        const row = document.createElement('div');
        row.className = 'track-row' + (i === currentTrackIdx ? ' active' : '');
        row.innerHTML =
          '<span class="track-num">' + (i + 1) + '</span>' +
          '<div class="track-info">' +
            '<div class="track-title">' + tr.title + '</div>' +
            '<div class="track-artist">' + tr.artist + '</div>' +
          '</div>' +
          '<span class="track-duration">' + tr.duration + '</span>';
        row.addEventListener('click', () => {
          currentTrackIdx = i;
          bgMusic.src = tr.src;
          bgMusic.play().catch(() => {});
          renderTrack();
        });
        tracklist.appendChild(row);
      });
    }

    playBtn.addEventListener('click', () => {
      if (bgMusic.paused) { bgMusic.play().catch(() => {}); }
      else                { bgMusic.pause(); }
      setTimeout(renderTrack, 50);
    });

    prevBtn.addEventListener('click', () => {
      currentTrackIdx = (currentTrackIdx - 1 + TRACKS.length) % TRACKS.length;
      bgMusic.src = TRACKS[currentTrackIdx].src;
      bgMusic.play().catch(() => {});
      renderTrack();
    });

    nextBtn.addEventListener('click', () => {
      currentTrackIdx = (currentTrackIdx + 1) % TRACKS.length;
      bgMusic.src = TRACKS[currentTrackIdx].src;
      bgMusic.play().catch(() => {});
      renderTrack();
    });

    bgMusic.addEventListener('play',  () => { vinyl.classList.add('playing');    playBtn.textContent = '⏸'; });
    bgMusic.addEventListener('pause', () => { vinyl.classList.remove('playing'); playBtn.textContent = '▶'; });

    renderTrack();
  }

  // ── ADMIN MODAL ──────────────────────────────────────────────────
  function openAdminModal() {
    adminModal.classList.remove('hidden');
    adminKeyInput.value = '';
    adminKeyInput.className = 'admin-key-input';
    adminKeyError.textContent = '';
    setTimeout(() => adminKeyInput.focus(), 100);
  }

  function closeAdminModal() {
    adminModal.classList.add('hidden');
  }

  adminCancel.addEventListener('click', () => {
    closeAdminModal();
    // Snap active back to current page
    btnEls.forEach((b, i) => b.classList.toggle('active', i + 1 === currentPage));
  });

  adminKeyInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') attemptAdminLogin();
    // Clear error on type
    adminKeyInput.classList.remove('error');
    adminKeyError.textContent = '';
  });

  function attemptAdminLogin() {
    const val = adminKeyInput.value.trim();
    if (val === ADMIN_KEY) {
      adminKeyInput.className = 'admin-key-input success';
      adminUnlocked = true;
      setTimeout(() => {
        closeAdminModal();
        currentPage = 4; // set to prev so showPage(5) animates from it
        showPage(5);
      }, 400);
    } else {
      adminKeyInput.className = 'admin-key-input error';
      adminKeyError.textContent = 'Invalid key. Access denied.';
      setTimeout(() => {
        adminKeyInput.className = 'admin-key-input';
      }, 700);
    }
  }

  // Also allow clicking outside modal box to cancel
  adminModal.addEventListener('click', e => {
    if (e.target === adminModal) {
      closeAdminModal();
      btnEls.forEach((b, i) => b.classList.toggle('active', i + 1 === currentPage));
    }
  });

  adminLogout.addEventListener('click', () => {
    adminUnlocked = false;
    showPage(1);
  });

  // ── KICK OFF ──
  typeStart();
});
