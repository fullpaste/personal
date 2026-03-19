// ─────────────────────────────────────────────
//  PRESENCE CONFIG  ← fill these in
// ─────────────────────────────────────────────
// 1) Your 18-digit Discord user ID (right-click your name → Copy User ID, needs Developer Mode on)
const DISCORD_USER_ID = '396664090895974401';

// 2) Join the Lanyard server so the bot can track you:
//    https://discord.gg/lanyard  (just stay in it — you don't need to do anything else)

// 3) Your GitHub username
const GITHUB_USERNAME = 'fullpaste';
// ─────────────────────────────────────────────

let hasUserInteracted = false;

function initMedia() {
  console.log("initMedia called");
  const backgroundMusic = document.getElementById('background-music');
  const backgroundVideo = document.getElementById('background');
  if (!backgroundMusic || !backgroundVideo) {
    console.error("Media elements not found");
    return;
  }
  backgroundMusic.volume = 0.3;
  backgroundVideo.muted = false;
  backgroundVideo.play().catch(err => {
    console.error("Failed to play background video:", err);
  });
}

// ─────────────────────────────────────────────
//  LANYARD — real-time Discord presence via WebSocket
// ─────────────────────────────────────────────
function initLanyard() {
  if (!DISCORD_USER_ID || DISCORD_USER_ID === 'YOUR_DISCORD_ID_HERE') {
    document.getElementById('dc-display-name').textContent = 'set DISCORD_USER_ID';
    document.getElementById('dc-display-name').classList.remove('presence-loading');
    return;
  }

  let heartbeatInterval = null;
  let ws;

  function connect() {
    ws = new WebSocket('wss://api.lanyard.rest/socket');

    ws.addEventListener('open', () => {
      console.log('[Lanyard] WebSocket connected');
    });

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.op) {
        case 1: // Hello
          // Start heartbeat
          heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ op: 3 }));
            }
          }, msg.d.heartbeat_interval);

          // Subscribe to user's presence
          ws.send(JSON.stringify({
            op: 2,
            d: { subscribe_to_id: DISCORD_USER_ID }
          }));
          break;

        case 0: // Event
          if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
            renderDiscordPresence(msg.d);
          }
          break;
      }
    });

    ws.addEventListener('close', () => {
      console.warn('[Lanyard] WebSocket closed — reconnecting in 5s');
      clearInterval(heartbeatInterval);
      setTimeout(connect, 5000);
    });

    ws.addEventListener('error', (err) => {
      console.error('[Lanyard] WebSocket error', err);
      ws.close();
    });
  }

  connect();
}

function renderDiscordPresence(data) {
  const { discord_user, discord_status, activities = [] } = data;

  // ── Avatar ──
  const pfpEl = document.getElementById('dc-pfp');
  if (discord_user.avatar) {
    const ext = discord_user.avatar.startsWith('a_') ? 'gif' : 'webp';
    pfpEl.src = `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.${ext}?size=128`;
  } else {
    const idx = discord_user.discriminator === '0'
      ? Number(BigInt(discord_user.id) >> 22n) % 6
      : parseInt(discord_user.discriminator) % 5;
    pfpEl.src = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  }

  // ── Display name ──
  const nameEl = document.getElementById('dc-display-name');
  nameEl.textContent = discord_user.global_name || discord_user.username;
  nameEl.classList.remove('presence-loading');

  // ── Username ──
  document.getElementById('dc-username').textContent = '@' + discord_user.username;

  // ── Clan / guild tag ──
  const clanEl = document.getElementById('dc-clan-tag');
  if (discord_user.clan && discord_user.clan.tag) {
    clanEl.textContent = discord_user.clan.tag;
    clanEl.style.display = 'inline-block';
  } else {
    clanEl.style.display = 'none';
  }

  // ── Status dot ──
  const dotEl = document.getElementById('dc-status-dot');
  dotEl.className = `dc-status-dot dc-${discord_status || 'offline'}`;

  // ── Activity / RPC ──
  const customStatus   = activities.find(a => a.type === 4);   // Custom status
  const richPresence   = activities.find(a => a.type === 0);   // Game / rich presence
  const musicActivity  = activities.find(a => a.type === 2);   // Listening (Spotify etc.)
  const activityEl     = document.getElementById('dc-activity');
  const rpcRow         = document.getElementById('dc-rpc-row');

  // Simple text status
  if (customStatus && customStatus.state) {
    activityEl.textContent = customStatus.state;
  } else {
    activityEl.textContent = '';
  }

  // Rich presence row (game / music)
  const rpc = richPresence || musicActivity;
  if (rpc) {
    rpcRow.style.display = 'flex';
    document.getElementById('dc-rpc-name').textContent = rpc.name || '';
    document.getElementById('dc-rpc-detail').textContent = rpc.details || '';
    document.getElementById('dc-rpc-state').textContent = rpc.state || '';

    // Album / large image art
    const artEl = document.getElementById('dc-rpc-art');
    if (rpc.assets && rpc.assets.large_image) {
      let artSrc = rpc.assets.large_image;
      if (artSrc.startsWith('mp:external/')) {
        // Spotify / external image
        artSrc = 'https://media.discordapp.net/' + artSrc.replace('mp:', '');
      } else {
        artSrc = `https://cdn.discordapp.com/app-assets/${rpc.application_id}/${rpc.assets.large_image}.png`;
      }
      artEl.src = artSrc;
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
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`);
    if (!res.ok) throw new Error('GitHub API error: ' + res.status);
    const user = await res.json();

    // Avatar
    const pfpEl = document.getElementById('gh-pfp');
    pfpEl.src = user.avatar_url;
    pfpEl.style.display = 'block';

    // Login
    const loginEl = document.getElementById('gh-login');
    loginEl.textContent = user.login;
    loginEl.classList.remove('presence-loading');

    // Stats
    document.getElementById('gh-followers-count').textContent = user.followers;
    document.getElementById('gh-repos-count').textContent = user.public_repos;

    // Link
    document.getElementById('gh-view-btn').href = user.html_url;
  } catch (err) {
    console.error('[GitHub]', err);
    const loginEl = document.getElementById('gh-login');
    loginEl.textContent = GITHUB_USERNAME;
    loginEl.classList.remove('presence-loading');
    document.getElementById('gh-view-btn').href = `https://github.com/${GITHUB_USERNAME}`;
  }
}

// ─────────────────────────────────────────────
//  MAIN PAGE LOGIC (unchanged from original)
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const startScreen = document.getElementById('start-screen');
  const startText = document.getElementById('start-text');
  const profileName = document.getElementById('profile-name');
  const profileBio = document.getElementById('profile-bio');
  const visitorCount = document.getElementById('visitor-count');
  const backgroundMusic = document.getElementById('background-music');
  const hackerMusic = document.getElementById('hacker-music');
  const rainMusic = document.getElementById('rain-music');
  const animeMusic = document.getElementById('anime-music');
  const carMusic = document.getElementById('car-music');
  const homeButton = document.getElementById('home-theme');
  const hackerButton = document.getElementById('hacker-theme');
  const rainButton = document.getElementById('rain-theme');
  const animeButton = document.getElementById('anime-theme');
  const carButton = document.getElementById('car-theme');
  const resultsButtonContainer = document.getElementById('results-button-container');
  const resultsButton = document.getElementById('results-theme');
  const volumeIcon = document.getElementById('volume-icon');
  const volumeSlider = document.getElementById('volume-slider');
  const transparencySlider = document.getElementById('transparency-slider');
  const backgroundVideo = document.getElementById('background');
  const hackerOverlay = document.getElementById('hacker-overlay');
  const snowOverlay = document.getElementById('snow-overlay');
  const glitchOverlay = document.querySelector('.glitch-overlay');
  const profileBlock = document.getElementById('profile-block');
  const skillsBlock = document.getElementById('skills-block');
  const pythonBar = document.getElementById('python-bar');
  const cppBar = document.getElementById('cpp-bar');
  const csharpBar = document.getElementById('csharp-bar');
  const resultsHint = document.getElementById('results-hint');
  const profilePicture = document.querySelector('.profile-picture');
  const profileContainer = document.querySelector('.profile-container');
  const socialIcons = document.querySelectorAll('.social-icon');
  const badges = document.querySelectorAll('.badge');

  // ── Cursor ──
  const cursor = document.querySelector('.custom-cursor');
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

  if (isTouchDevice) {
    document.body.classList.add('touch-device');
    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      cursor.style.left = touch.clientX + 'px';
      cursor.style.top = touch.clientY + 'px';
    });
    document.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      cursor.style.left = touch.clientX + 'px';
      cursor.style.top = touch.clientY + 'px';
    });
  } else {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
    document.addEventListener('mousedown', () => {
      cursor.style.transform = 'scale(0.8) translate(-50%, -50%)';
    });
    document.addEventListener('mouseup', () => {
      cursor.style.transform = 'scale(1) translate(-50%, -50%)';
    });
  }

  // ── Start screen typewriter ──
  const startMessage = "Action Wins│Click Anywhere";
  let startTextContent = '';
  let startIndex = 0;
  let startCursorVisible = true;

  function typeWriterStart() {
    if (startIndex < startMessage.length) {
      startTextContent = startMessage.slice(0, startIndex + 1);
      startIndex++;
    }
    startText.textContent = startTextContent + (startCursorVisible ? '|' : ' ');
    setTimeout(typeWriterStart, 100);
  }

  setInterval(() => {
    startCursorVisible = !startCursorVisible;
    startText.textContent = startTextContent + (startCursorVisible ? '|' : ' ');
  }, 500);

  // ── Visitor counter ──
  function initializeVisitorCounter() {
    let totalVisitors = localStorage.getItem('totalVisitorCount');
    if (!totalVisitors) {
      totalVisitors = 5671;
      localStorage.setItem('totalVisitorCount', totalVisitors);
    } else {
      totalVisitors = parseInt(totalVisitors);
    }
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      totalVisitors++;
      localStorage.setItem('totalVisitorCount', totalVisitors);
      localStorage.setItem('hasVisited', 'true');
    }
    visitorCount.textContent = totalVisitors.toLocaleString();
  }
  initializeVisitorCounter();

  // ── Start screen click / touch ──
  function onStart() {
    startScreen.classList.add('hidden');
    backgroundMusic.muted = false;
    backgroundMusic.play().catch(err => {
      console.error("Failed to play music after start screen click:", err);
    });
    profileBlock.classList.remove('hidden');
    gsap.fromTo(profileBlock,
      { opacity: 0, y: -50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out', onComplete: () => {
        profileBlock.classList.add('profile-appear');
        profileContainer.classList.add('orbit');
      }}
    );
    if (!isTouchDevice) {
      try {
        new cursorTrailEffect({ length: 10, size: 8, speed: 0.2 });
      } catch (err) {
        console.error("Failed to initialize cursor trail effect:", err);
      }
    }
    typeWriterName();
    typeWriterBio();

    // ── Init Discord + GitHub presence ──
    initLanyard();
    initGitHub();
  }

  startScreen.addEventListener('click', onStart);
  startScreen.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(); });

  // ── Name typewriter ──
  const name = "@prince";
  let nameText = '';
  let nameIndex = 0;
  let isNameDeleting = false;
  let nameCursorVisible = true;

  function typeWriterName() {
    if (!isNameDeleting && nameIndex < name.length) {
      nameText = name.slice(0, nameIndex + 1);
      nameIndex++;
    } else if (isNameDeleting && nameIndex > 0) {
      nameText = name.slice(0, nameIndex - 1);
      nameIndex--;
    } else if (nameIndex === name.length) {
      isNameDeleting = true;
      setTimeout(typeWriterName, 10000);
      return;
    } else if (nameIndex === 0) {
      isNameDeleting = false;
    }
    profileName.textContent = nameText + (nameCursorVisible ? '|' : ' ');
    if (Math.random() < 0.1) {
      profileName.classList.add('glitch');
      setTimeout(() => profileName.classList.remove('glitch'), 200);
    }
    setTimeout(typeWriterName, isNameDeleting ? 150 : 300);
  }

  setInterval(() => {
    nameCursorVisible = !nameCursorVisible;
    profileName.textContent = nameText + (nameCursorVisible ? '|' : ' ');
  }, 500);

  // ── Bio typewriter ──
  const bioMessages = [
    "open source social platform, INSPIRED by guns.lol, not based on",
    "\"Hello, World!\", party/xd9"
  ];
  let bioText = '';
  let bioIndex = 0;
  let bioMessageIndex = 0;
  let isBioDeleting = false;
  let bioCursorVisible = true;

  function typeWriterBio() {
    if (!isBioDeleting && bioIndex < bioMessages[bioMessageIndex].length) {
      bioText = bioMessages[bioMessageIndex].slice(0, bioIndex + 1);
      bioIndex++;
    } else if (isBioDeleting && bioIndex > 0) {
      bioText = bioMessages[bioMessageIndex].slice(0, bioIndex - 1);
      bioIndex--;
    } else if (bioIndex === bioMessages[bioMessageIndex].length) {
      isBioDeleting = true;
      setTimeout(typeWriterBio, 2000);
      return;
    } else if (bioIndex === 0 && isBioDeleting) {
      isBioDeleting = false;
      bioMessageIndex = (bioMessageIndex + 1) % bioMessages.length;
    }
    profileBio.textContent = bioText + (bioCursorVisible ? '|' : ' ');
    if (Math.random() < 0.1) {
      profileBio.classList.add('glitch');
      setTimeout(() => profileBio.classList.remove('glitch'), 200);
    }
    setTimeout(typeWriterBio, isBioDeleting ? 75 : 150);
  }

  setInterval(() => {
    bioCursorVisible = !bioCursorVisible;
    profileBio.textContent = bioText + (bioCursorVisible ? '|' : ' ');
  }, 500);

  // ── Volume ──
  let currentAudio = backgroundMusic;
  let isMuted = false;

  volumeIcon.addEventListener('click', () => {
    isMuted = !isMuted;
    currentAudio.muted = isMuted;
    volumeIcon.innerHTML = isMuted
      ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>`
      : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
  });

  volumeIcon.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isMuted = !isMuted;
    currentAudio.muted = isMuted;
    volumeIcon.innerHTML = isMuted
      ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>`
      : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
  });

  volumeSlider.addEventListener('input', () => {
    currentAudio.volume = volumeSlider.value;
    isMuted = false;
    currentAudio.muted = false;
    volumeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
  });

  // ── Transparency ──
  transparencySlider.addEventListener('input', () => {
    const opacity = transparencySlider.value;
    if (opacity == 0) {
      profileBlock.style.background = 'rgba(0, 0, 0, 0)';
      profileBlock.style.borderColor = 'transparent';
      profileBlock.style.backdropFilter = 'none';
      skillsBlock.style.background = 'rgba(0, 0, 0, 0)';
      skillsBlock.style.borderColor = 'transparent';
      skillsBlock.style.backdropFilter = 'none';
    } else {
      profileBlock.style.background = `rgba(0, 0, 0, ${opacity})`;
      profileBlock.style.borderColor = '';
      profileBlock.style.backdropFilter = `blur(${10 * opacity}px)`;
      skillsBlock.style.background = `rgba(0, 0, 0, ${opacity})`;
      skillsBlock.style.borderColor = '';
      skillsBlock.style.backdropFilter = `blur(${10 * opacity}px)`;
    }
    profileBlock.style.pointerEvents = 'auto';
    socialIcons.forEach(icon => { icon.style.pointerEvents = 'auto'; icon.style.opacity = '1'; });
    badges.forEach(badge => { badge.style.pointerEvents = 'auto'; badge.style.opacity = '1'; });
    profilePicture.style.pointerEvents = 'auto';
    profilePicture.style.opacity = '1';
    profileName.style.opacity = '1';
    profileBio.style.opacity = '1';
    visitorCount.style.opacity = '1';
  });

  // ── Theme switcher ──
  function switchTheme(videoSrc, audio, themeClass, overlay = null, overlayOverProfile = false) {
    let primaryColor;
    switch (themeClass) {
      case 'home-theme':   primaryColor = '#00CED1'; break;
      case 'hacker-theme': primaryColor = '#22C55E'; break;
      case 'rain-theme':   primaryColor = '#1E3A8A'; break;
      case 'anime-theme':  primaryColor = '#DC2626'; break;
      case 'car-theme':    primaryColor = '#EAB308'; break;
      default:             primaryColor = '#00CED1';
    }
    document.documentElement.style.setProperty('--primary-color', primaryColor);

    gsap.to(backgroundVideo, {
      opacity: 0, duration: 0.5, ease: 'power2.in',
      onComplete: () => {
        backgroundVideo.src = videoSrc;
        if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
        currentAudio = audio;
        currentAudio.volume = volumeSlider.value;
        currentAudio.muted = isMuted;
        currentAudio.play().catch(err => console.error("Failed to play theme music:", err));

        document.body.classList.remove('home-theme', 'hacker-theme', 'rain-theme', 'anime-theme', 'car-theme');
        document.body.classList.add(themeClass);

        hackerOverlay.classList.add('hidden');
        snowOverlay.classList.add('hidden');
        profileBlock.style.zIndex = overlayOverProfile ? 10 : 20;
        skillsBlock.style.zIndex = overlayOverProfile ? 10 : 20;
        if (overlay) overlay.classList.remove('hidden');

        if (themeClass === 'hacker-theme') {
          resultsButtonContainer.classList.remove('hidden');
        } else {
          resultsButtonContainer.classList.add('hidden');
          skillsBlock.classList.add('hidden');
          resultsHint.classList.add('hidden');
          profileBlock.classList.remove('hidden');
          gsap.to(profileBlock, { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
        }

        gsap.to(backgroundVideo, {
          opacity: 1, duration: 0.5, ease: 'power2.out',
          onComplete: () => {
            profileContainer.classList.remove('orbit');
            void profileContainer.offsetWidth;
            profileContainer.classList.add('orbit');
          }
        });
      }
    });
  }

  homeButton.addEventListener('click', () => switchTheme('assets/background.mp4', backgroundMusic, 'home-theme'));
  homeButton.addEventListener('touchstart', (e) => { e.preventDefault(); switchTheme('assets/background.mp4', backgroundMusic, 'home-theme'); });

  hackerButton.addEventListener('click', () => switchTheme('assets/hacker_background.mp4', hackerMusic, 'hacker-theme', hackerOverlay, false));
  hackerButton.addEventListener('touchstart', (e) => { e.preventDefault(); switchTheme('assets/hacker_background.mp4', hackerMusic, 'hacker-theme', hackerOverlay, false); });

  rainButton.addEventListener('click', () => switchTheme('assets/rain_background.mov', rainMusic, 'rain-theme', snowOverlay, true));
  rainButton.addEventListener('touchstart', (e) => { e.preventDefault(); switchTheme('assets/rain_background.mov', rainMusic, 'rain-theme', snowOverlay, true); });

  animeButton.addEventListener('click', () => switchTheme('assets/anime_background.mp4', animeMusic, 'anime-theme'));
  animeButton.addEventListener('touchstart', (e) => { e.preventDefault(); switchTheme('assets/anime_background.mp4', animeMusic, 'anime-theme'); });

  carButton.addEventListener('click', () => switchTheme('assets/car_background.mp4', carMusic, 'car-theme'));
  carButton.addEventListener('touchstart', (e) => { e.preventDefault(); switchTheme('assets/car_background.mp4', carMusic, 'car-theme'); });

  // ── 3D tilt ──
  function handleTilt(e, element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let clientX, clientY;
    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const maxTilt = 15;
    const tiltX = ((clientY - centerY) / rect.height) * maxTilt;
    const tiltY = -((clientX - centerX) / rect.width) * maxTilt;
    gsap.to(element, { rotationX: tiltX, rotationY: tiltY, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
  }

  profileBlock.addEventListener('mousemove', (e) => handleTilt(e, profileBlock));
  profileBlock.addEventListener('touchmove', (e) => { e.preventDefault(); handleTilt(e, profileBlock); });
  skillsBlock.addEventListener('mousemove', (e) => handleTilt(e, skillsBlock));
  skillsBlock.addEventListener('touchmove', (e) => { e.preventDefault(); handleTilt(e, skillsBlock); });

  profileBlock.addEventListener('mouseleave', () => gsap.to(profileBlock, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power2.out' }));
  profileBlock.addEventListener('touchend', () => gsap.to(profileBlock, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power2.out' }));
  skillsBlock.addEventListener('mouseleave', () => gsap.to(skillsBlock, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power2.out' }));
  skillsBlock.addEventListener('touchend', () => gsap.to(skillsBlock, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power2.out' }));

  // ── Profile picture glitch + orbit ──
  profilePicture.addEventListener('mouseenter', () => {
    glitchOverlay.style.opacity = '1';
    setTimeout(() => { glitchOverlay.style.opacity = '0'; }, 500);
  });

  profilePicture.addEventListener('click', () => {
    profileContainer.classList.remove('fast-orbit', 'orbit');
    void profileContainer.offsetWidth;
    profileContainer.classList.add('fast-orbit');
    setTimeout(() => {
      profileContainer.classList.remove('fast-orbit');
      void profileContainer.offsetWidth;
      profileContainer.classList.add('orbit');
    }, 500);
  });

  profilePicture.addEventListener('touchstart', (e) => {
    e.preventDefault();
    profileContainer.classList.remove('fast-orbit', 'orbit');
    void profileContainer.offsetWidth;
    profileContainer.classList.add('fast-orbit');
    setTimeout(() => {
      profileContainer.classList.remove('fast-orbit');
      void profileContainer.offsetWidth;
      profileContainer.classList.add('orbit');
    }, 500);
  });

  // ── Results / skills toggle ──
  let isShowingSkills = false;

  function toggleSkills() {
    if (!isShowingSkills) {
      gsap.to(profileBlock, {
        x: -100, opacity: 0, duration: 0.5, ease: 'power2.in',
        onComplete: () => {
          profileBlock.classList.add('hidden');
          skillsBlock.classList.remove('hidden');
          gsap.fromTo(skillsBlock, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
          gsap.to(pythonBar, { width: '87%', duration: 2, ease: 'power2.out' });
          gsap.to(cppBar,    { width: '75%', duration: 2, ease: 'power2.out' });
          gsap.to(csharpBar, { width: '80%', duration: 2, ease: 'power2.out' });
        }
      });
      resultsHint.classList.remove('hidden');
      isShowingSkills = true;
    } else {
      gsap.to(skillsBlock, {
        x: 100, opacity: 0, duration: 0.5, ease: 'power2.in',
        onComplete: () => {
          skillsBlock.classList.add('hidden');
          profileBlock.classList.remove('hidden');
          gsap.fromTo(profileBlock, { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
        }
      });
      resultsHint.classList.add('hidden');
      isShowingSkills = false;
    }
  }

  resultsButton.addEventListener('click', toggleSkills);
  resultsButton.addEventListener('touchstart', (e) => { e.preventDefault(); toggleSkills(); });

  // ── Start typewriter ──
  typeWriterStart();
});
