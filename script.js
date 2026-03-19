// ─────────────────────────────────────────────
//  PRESENCE CONFIG
// ─────────────────────────────────────────────
const DISCORD_USER_ID = '396664090895974401';
const GITHUB_USERNAME = 'fullpaste';
// ─────────────────────────────────────────────

let hasUserInteracted = false;

function initMedia() {
  const backgroundMusic = document.getElementById('background-music');
  const backgroundVideo = document.getElementById('background');
  if (!backgroundMusic || !backgroundVideo) return;
  backgroundMusic.volume = 0.3;
  backgroundVideo.muted = false;
  backgroundVideo.play().catch(() => {});
}

// ─────────────────────────────────────────────
//  LANYARD
// ─────────────────────────────────────────────
async function initLanyard() {
  const nameEl = document.getElementById('dc-display-name');
  const userEl = document.getElementById('dc-username');
  nameEl.textContent = 'loading...';

  try {
    const res  = await fetch('https://api.lanyard.rest/v1/users/' + DISCORD_USER_ID);
    const json = await res.json();

    if (!json.success) {
      nameEl.textContent = 'join discord.gg/lanyard';
      nameEl.classList.remove('presence-loading');
      userEl.textContent = 'then reload the page';
      return;
    }

    renderDiscordPresence(json.data);
    startLanyardWS();
  } catch (err) {
    console.error('[Lanyard]', err);
    nameEl.textContent = 'failed to load';
    nameEl.classList.remove('presence-loading');
  }
}

function startLanyardWS() {
  let hb;
  function connect() {
    const ws = new WebSocket('wss://api.lanyard.rest/socket');
    ws.addEventListener('message', e => {
      const msg = JSON.parse(e.data);
      if (msg.op === 1) {
        hb = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_USER_ID } }));
      } else if (msg.op === 0 && (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE')) {
        renderDiscordPresence(msg.d);
      }
    });
    ws.addEventListener('close', () => { clearInterval(hb); setTimeout(connect, 5000); });
    ws.addEventListener('error', () => ws.close());
  }
  connect();
}

function renderDiscordPresence(data) {
  const { discord_user, discord_status, activities = [] } = data;

  const pfpEl = document.getElementById('dc-pfp');
  if (discord_user.avatar) {
    const ext = discord_user.avatar.startsWith('a_') ? 'gif' : 'webp';
    pfpEl.src = 'https://cdn.discordapp.com/avatars/' + discord_user.id + '/' + discord_user.avatar + '.' + ext + '?size=128';
  } else {
    pfpEl.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
  }

  const nameEl = document.getElementById('dc-display-name');
  nameEl.textContent = discord_user.global_name || discord_user.username;
  nameEl.classList.remove('presence-loading');

  document.getElementById('dc-username').textContent = '@' + discord_user.username;

  const clanEl = document.getElementById('dc-clan-tag');
  if (discord_user.clan && discord_user.clan.tag) {
    clanEl.textContent = discord_user.clan.tag;
    clanEl.style.display = 'inline-block';
  } else {
    clanEl.style.display = 'none';
  }

  document.getElementById('dc-status-dot').className = 'dc-status-dot dc-' + (discord_status || 'offline');

  const customStatus  = activities.find(a => a.type === 4);
  const richPresence  = activities.find(a => a.type === 0);
  const musicActivity = activities.find(a => a.type === 2);

  document.getElementById('dc-activity').textContent = (customStatus && customStatus.state) ? customStatus.state : '';

  const rpc    = richPresence || musicActivity;
  const rpcRow = document.getElementById('dc-rpc-row');
  if (rpc) {
    rpcRow.style.display = 'flex';
    document.getElementById('dc-rpc-name').textContent   = rpc.name    || '';
    document.getElementById('dc-rpc-detail').textContent = rpc.details || '';
    document.getElementById('dc-rpc-state').textContent  = rpc.state   || '';
    const artEl = document.getElementById('dc-rpc-art');
    if (rpc.assets && rpc.assets.large_image) {
      let src = rpc.assets.large_image;
      if (src.startsWith('mp:external/')) {
        src = 'https://media.discordapp.net/' + src.replace('mp:', '');
      } else {
        src = 'https://cdn.discordapp.com/app-assets/' + rpc.application_id + '/' + src + '.png';
      }
      artEl.src = src;
      artEl.style.display = 'block';
    } else {
      artEl.style.display = 'none';
    }
  } else {
    rpcRow.style.display = 'none';
  }
}

// ─────────────────────────────────────────────
//  GITHUB
// ─────────────────────────────────────────────
async function initGitHub() {
  const loginEl = document.getElementById('gh-login');
  loginEl.textContent = GITHUB_USERNAME;
  loginEl.classList.remove('presence-loading');
  document.getElementById('gh-view-btn').href = 'https://github.com/' + GITHUB_USERNAME;

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://api.github.com/users/' + GITHUB_USERNAME, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error('status ' + res.status);
    const user = await res.json();

    const pfpEl = document.getElementById('gh-pfp');
    pfpEl.src = user.avatar_url;
    pfpEl.style.display = 'block';

    loginEl.textContent = user.login;
    document.getElementById('gh-followers-count').textContent = user.followers;
    document.getElementById('gh-repos-count').textContent     = user.public_repos;
    document.getElementById('gh-view-btn').href               = user.html_url;
  } catch (err) {
    console.error('[GitHub]', err);
  }
}

// ─────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const startScreen  = document.getElementById('start-screen');
  const startText    = document.getElementById('start-text');
  const profileName  = document.getElementById('profile-name');
  const profileBio   = document.getElementById('profile-bio');
  const visitorCount = document.getElementById('visitor-count');
  const backgroundMusic = document.getElementById('background-music');
  const hackerMusic     = document.getElementById('hacker-music');
  const rainMusic       = document.getElementById('rain-music');
  const animeMusic      = document.getElementById('anime-music');
  const carMusic        = document.getElementById('car-music');
  const homeButton      = document.getElementById('home-theme');
  const hackerButton    = document.getElementById('hacker-theme');
  const rainButton      = document.getElementById('rain-theme');
  const animeButton     = document.getElementById('anime-theme');
  const carButton       = document.getElementById('car-theme');
  const resultsButtonContainer = document.getElementById('results-button-container');
  const resultsButton   = document.getElementById('results-theme');
  const volumeIcon      = document.getElementById('volume-icon');
  const volumeSlider    = document.getElementById('volume-slider');
  const transparencySlider = document.getElementById('transparency-slider');
  const backgroundVideo = document.getElementById('background');
  const hackerOverlay   = document.getElementById('hacker-overlay');
  const snowOverlay     = document.getElementById('snow-overlay');
  const glitchOverlay   = document.querySelector('.glitch-overlay');
  const profileBlock    = document.getElementById('profile-block');
  const skillsBlock     = document.getElementById('skills-block');
  const pythonBar       = document.getElementById('python-bar');
  const cppBar          = document.getElementById('cpp-bar');
  const csharpBar       = document.getElementById('csharp-bar');
  const resultsHint     = document.getElementById('results-hint');
  const profilePicture  = document.querySelector('.profile-picture');
  const profileContainer = document.querySelector('.profile-container');
  const socialIcons     = document.querySelectorAll('.social-icon');
  const badges          = document.querySelectorAll('.badge');

  const cursor = document.querySelector('.custom-cursor');
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  if (isTouchDevice) {
    document.body.classList.add('touch-device');
    document.addEventListener('touchstart', e => { cursor.style.left = e.touches[0].clientX + 'px'; cursor.style.top = e.touches[0].clientY + 'px'; });
    document.addEventListener('touchmove',  e => { cursor.style.left = e.touches[0].clientX + 'px'; cursor.style.top = e.touches[0].clientY + 'px'; });
  } else {
    document.addEventListener('mousemove', e => { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; });
    document.addEventListener('mousedown', () => { cursor.style.transform = 'scale(0.8) translate(-50%, -50%)'; });
    document.addEventListener('mouseup',   () => { cursor.style.transform = 'scale(1) translate(-50%, -50%)'; });
  }

  const startMessage = 'Action Wins|Click Anywhere';
  let startTextContent = '', startIndex = 0, startCursorVisible = true;

  function typeWriterStart() {
    if (startIndex < startMessage.length) startTextContent = startMessage.slice(0, ++startIndex);
    startText.textContent = startTextContent + (startCursorVisible ? '|' : ' ');
    setTimeout(typeWriterStart, 100);
  }
  setInterval(() => { startCursorVisible = !startCursorVisible; startText.textContent = startTextContent + (startCursorVisible ? '|' : ' '); }, 500);

  function initializeVisitorCounter() {
    let total = parseInt(localStorage.getItem('totalVisitorCount')) || 5671;
    if (!localStorage.getItem('hasVisited')) { total++; localStorage.setItem('totalVisitorCount', total); localStorage.setItem('hasVisited', 'true'); }
    visitorCount.textContent = total.toLocaleString();
  }
  initializeVisitorCounter();

  function onStart() {
    startScreen.classList.add('hidden');
    backgroundMusic.muted = false;
    backgroundMusic.play().catch(() => {});
    profileBlock.classList.remove('hidden');
    gsap.fromTo(profileBlock, { opacity: 0, y: -50 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out', onComplete: () => {
      profileBlock.classList.add('profile-appear');
      profileContainer.classList.add('orbit');
    }});
    if (!isTouchDevice) { try { new cursorTrailEffect({ length: 10, size: 8, speed: 0.2 }); } catch (e) {} }
    typeWriterName();
    typeWriterBio();
    initLanyard();
    initGitHub();
  }

  startScreen.addEventListener('click', onStart);
  startScreen.addEventListener('touchstart', e => { e.preventDefault(); onStart(); });

  const name = '@prince';
  let nameText = '', nameIndex = 0, isNameDeleting = false, nameCursorVisible = true;
  function typeWriterName() {
    if (!isNameDeleting && nameIndex < name.length) nameText = name.slice(0, ++nameIndex);
    else if (isNameDeleting && nameIndex > 0) nameText = name.slice(0, --nameIndex);
    else if (nameIndex === name.length) { isNameDeleting = true; setTimeout(typeWriterName, 10000); return; }
    else if (nameIndex === 0) isNameDeleting = false;
    profileName.textContent = nameText + (nameCursorVisible ? '|' : ' ');
    if (Math.random() < 0.1) { profileName.classList.add('glitch'); setTimeout(() => profileName.classList.remove('glitch'), 200); }
    setTimeout(typeWriterName, isNameDeleting ? 150 : 300);
  }
  setInterval(() => { nameCursorVisible = !nameCursorVisible; profileName.textContent = nameText + (nameCursorVisible ? '|' : ' '); }, 500);

  const bioMessages = ['open source social platform, INSPIRED by guns.lol, not based on', '"Hello, World!", party/xd9'];
  let bioText = '', bioIndex = 0, bioMessageIndex = 0, isBioDeleting = false, bioCursorVisible = true;
  function typeWriterBio() {
    const msg = bioMessages[bioMessageIndex];
    if (!isBioDeleting && bioIndex < msg.length) bioText = msg.slice(0, ++bioIndex);
    else if (isBioDeleting && bioIndex > 0) bioText = msg.slice(0, --bioIndex);
    else if (bioIndex === msg.length) { isBioDeleting = true; setTimeout(typeWriterBio, 2000); return; }
    else if (bioIndex === 0 && isBioDeleting) { isBioDeleting = false; bioMessageIndex = (bioMessageIndex + 1) % bioMessages.length; }
    profileBio.textContent = bioText + (bioCursorVisible ? '|' : ' ');
    if (Math.random() < 0.1) { profileBio.classList.add('glitch'); setTimeout(() => profileBio.classList.remove('glitch'), 200); }
    setTimeout(typeWriterBio, isBioDeleting ? 75 : 150);
  }
  setInterval(() => { bioCursorVisible = !bioCursorVisible; profileBio.textContent = bioText + (bioCursorVisible ? '|' : ' '); }, 500);

  let currentAudio = backgroundMusic, isMuted = false;
  volumeIcon.addEventListener('click', () => {
    isMuted = !isMuted; currentAudio.muted = isMuted;
    volumeIcon.innerHTML = isMuted
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>';
  });
  volumeIcon.addEventListener('touchstart', e => {
    e.preventDefault(); isMuted = !isMuted; currentAudio.muted = isMuted;
    volumeIcon.innerHTML = isMuted
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>';
  });
  volumeSlider.addEventListener('input', () => {
    currentAudio.volume = volumeSlider.value; isMuted = false; currentAudio.muted = false;
    volumeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>';
  });

  transparencySlider.addEventListener('input', () => {
    const o = transparencySlider.value;
    const bg = o == 0 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,' + o + ')';
    const bd = o == 0 ? 'none' : 'blur(' + (10 * o) + 'px)';
    const bc = o == 0 ? 'transparent' : '';
    [profileBlock, skillsBlock].forEach(el => { el.style.background = bg; el.style.backdropFilter = bd; el.style.borderColor = bc; });
    profileBlock.style.pointerEvents = 'auto';
    socialIcons.forEach(i => { i.style.pointerEvents = 'auto'; i.style.opacity = '1'; });
    badges.forEach(b => { b.style.pointerEvents = 'auto'; b.style.opacity = '1'; });
    profilePicture.style.opacity = '1'; profileName.style.opacity = '1'; profileBio.style.opacity = '1'; visitorCount.style.opacity = '1';
  });

  function switchTheme(videoSrc, audio, themeClass, overlay, overlayOverProfile) {
    overlayOverProfile = overlayOverProfile || false;
    const colors = { 'home-theme': '#00CED1', 'hacker-theme': '#22C55E', 'rain-theme': '#1E3A8A', 'anime-theme': '#DC2626', 'car-theme': '#EAB308' };
    document.documentElement.style.setProperty('--primary-color', colors[themeClass] || '#00CED1');
    gsap.to(backgroundVideo, { opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: () => {
      backgroundVideo.src = videoSrc;
      if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
      currentAudio = audio; currentAudio.volume = volumeSlider.value; currentAudio.muted = isMuted;
      currentAudio.play().catch(() => {});
      document.body.classList.remove('home-theme', 'hacker-theme', 'rain-theme', 'anime-theme', 'car-theme');
      document.body.classList.add(themeClass);
      hackerOverlay.classList.add('hidden'); snowOverlay.classList.add('hidden');
      profileBlock.style.zIndex = overlayOverProfile ? 10 : 20;
      skillsBlock.style.zIndex  = overlayOverProfile ? 10 : 20;
      if (overlay) overlay.classList.remove('hidden');
      if (themeClass === 'hacker-theme') {
        resultsButtonContainer.classList.remove('hidden');
      } else {
        resultsButtonContainer.classList.add('hidden');
        skillsBlock.classList.add('hidden'); resultsHint.classList.add('hidden');
        profileBlock.classList.remove('hidden');
        gsap.to(profileBlock, { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
      }
      gsap.to(backgroundVideo, { opacity: 1, duration: 0.5, ease: 'power2.out', onComplete: () => {
        profileContainer.classList.remove('orbit'); void profileContainer.offsetWidth; profileContainer.classList.add('orbit');
      }});
    }});
  }

  homeButton.addEventListener('click',      () => switchTheme('assets/background.mp4', backgroundMusic, 'home-theme', null, false));
  homeButton.addEventListener('touchstart', e => { e.preventDefault(); switchTheme('assets/background.mp4', backgroundMusic, 'home-theme', null, false); });
  hackerButton.addEventListener('click',      () => switchTheme('assets/hacker_background.mp4', hackerMusic, 'hacker-theme', hackerOverlay, false));
  hackerButton.addEventListener('touchstart', e => { e.preventDefault(); switchTheme('assets/hacker_background.mp4', hackerMusic, 'hacker-theme', hackerOverlay, false); });
  rainButton.addEventListener('click',      () => switchTheme('assets/rain_background.mov', rainMusic, 'rain-theme', snowOverlay, true));
  rainButton.addEventListener('touchstart', e => { e.preventDefault(); switchTheme('assets/rain_background.mov', rainMusic, 'rain-theme', snowOverlay, true); });
  animeButton.addEventListener('click',      () => switchTheme('assets/anime_background.mp4', animeMusic, 'anime-theme', null, false));
  animeButton.addEventListener('touchstart', e => { e.preventDefault(); switchTheme('assets/anime_background.mp4', animeMusic, 'anime-theme', null, false); });
  carButton.addEventListener('click',      () => switchTheme('assets/car_background.mp4', carMusic, 'car-theme', null, false));
  carButton.addEventListener('touchstart', e => { e.preventDefault(); switchTheme('assets/car_background.mp4', carMusic, 'car-theme', null, false); });

  function handleTilt(e, el) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    gsap.to(el, { rotationX: ((clientY - cy) / r.height) * 15, rotationY: -((clientX - cx) / r.width) * 15, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
  }
  profileBlock.addEventListener('mousemove', e => handleTilt(e, profileBlock));
  profileBlock.addEventListener('touchmove', e => { e.preventDefault(); handleTilt(e, profileBlock); });
  skillsBlock.addEventListener('mousemove',  e => handleTilt(e, skillsBlock));
  skillsBlock.addEventListener('touchmove',  e => { e.preventDefault(); handleTilt(e, skillsBlock); });
  const resetTilt = el => gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power2.out' });
  profileBlock.addEventListener('mouseleave', () => resetTilt(profileBlock));
  profileBlock.addEventListener('touchend',   () => resetTilt(profileBlock));
  skillsBlock.addEventListener('mouseleave',  () => resetTilt(skillsBlock));
  skillsBlock.addEventListener('touchend',    () => resetTilt(skillsBlock));

  profilePicture.addEventListener('mouseenter', () => { glitchOverlay.style.opacity = '1'; setTimeout(() => { glitchOverlay.style.opacity = '0'; }, 500); });
  function spinPfp() {
    profileContainer.classList.remove('fast-orbit', 'orbit'); void profileContainer.offsetWidth; profileContainer.classList.add('fast-orbit');
    setTimeout(() => { profileContainer.classList.remove('fast-orbit'); void profileContainer.offsetWidth; profileContainer.classList.add('orbit'); }, 500);
  }
  profilePicture.addEventListener('click',      spinPfp);
  profilePicture.addEventListener('touchstart', e => { e.preventDefault(); spinPfp(); });

  let isShowingSkills = false;
  function toggleSkills() {
    if (!isShowingSkills) {
      gsap.to(profileBlock, { x: -100, opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: () => {
        profileBlock.classList.add('hidden'); skillsBlock.classList.remove('hidden');
        gsap.fromTo(skillsBlock, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
        gsap.to(pythonBar, { width: '87%', duration: 2, ease: 'power2.out' });
        gsap.to(cppBar,    { width: '75%', duration: 2, ease: 'power2.out' });
        gsap.to(csharpBar, { width: '80%', duration: 2, ease: 'power2.out' });
      }});
      resultsHint.classList.remove('hidden'); isShowingSkills = true;
    } else {
      gsap.to(skillsBlock, { x: 100, opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: () => {
        skillsBlock.classList.add('hidden'); profileBlock.classList.remove('hidden');
        gsap.fromTo(profileBlock, { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
      }});
      resultsHint.classList.add('hidden'); isShowingSkills = false;
    }
  }
  resultsButton.addEventListener('click',      toggleSkills);
  resultsButton.addEventListener('touchstart', e => { e.preventDefault(); toggleSkills(); });

  typeWriterStart();
});
