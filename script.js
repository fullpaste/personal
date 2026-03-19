/* ══════════════════════════════════
   xd9 profile — script.js
   ══════════════════════════════════ */

const DISCORD_ID = '396664090895974401';
const THEME_VIDEOS = [
  'https://r2.guns.lol/8739d20d-297a-4f85-a8b3-9ef34916dfc7.mp4', // 1 default
  'assets/hacker_background.mp4',   // 2
  'assets/rain_background.mov',     // 3
  'assets/anime_background.mp4',    // 4
  'assets/car_background.mp4',      // 5
];
const THEME_CLASSES = ['', 'theme-hacker', 'theme-rain', 'theme-anime', 'theme-car'];

/* ── DOM ── */
const $ = id => document.getElementById(id);
const startScreen   = $('start-screen');
const profileBlock  = $('profile-block');
const playerBlock   = $('player-block');
const bottomCtrls   = $('bottom-controls');
const bgVideo       = $('background');
const bgMusic       = $('background-music');
const cursor        = $('cursor');
const snowContainer = $('snow-container');

/* ══════════════════════════════════
   CURSOR
   ══════════════════════════════════ */
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});
document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));

/* ══════════════════════════════════
   SNOWFLAKES
   ══════════════════════════════════ */
const SF_CHARS = ['❄','✦','✧','*','·','∗','•'];
for (let i = 0; i < 24; i++) {
  const el = document.createElement('span');
  el.className = 'snowflake';
  el.textContent = SF_CHARS[i % SF_CHARS.length];
  el.style.cssText = `
    left:${Math.random()*100}%;
    top:${-10-Math.random()*50}px;
    font-size:${7+Math.random()*8}px;
    animation-duration:${7+Math.random()*13}s;
    animation-delay:${-Math.random()*15}s;
    opacity:${0.18+Math.random()*0.45};
  `;
  snowContainer.appendChild(el);
}

/* ══════════════════════════════════
   TYPEWRITER — start screen
   ══════════════════════════════════ */
const startMsg = 'Click Anywhere│';
let stIdx = 0;
function typeStart() {
  $('start-text').textContent = startMsg.slice(0, stIdx) + (Date.now() % 1000 < 500 ? '|' : '');
  if (stIdx < startMsg.length) stIdx++;
  setTimeout(typeStart, 90);
}
typeStart();

/* ══════════════════════════════════
   START SCREEN CLICK
   ══════════════════════════════════ */
let started = false;
startScreen.addEventListener('click', handleStart);
startScreen.addEventListener('touchstart', e => { e.preventDefault(); handleStart(); }, { passive: false });

function handleStart() {
  if (started) return;
  started = true;
  startScreen.classList.add('hidden');

  bgMusic.volume = 0.5;
  bgMusic.play().catch(() => {});

  profileBlock.classList.remove('hidden');
  profileBlock.classList.add('animate-in');
  playerBlock.classList.remove('hidden');
  playerBlock.classList.add('animate-in-delay');
  bottomCtrls.style.display = 'flex';
  bottomCtrls.classList.add('animate-in-delay2');
}

/* ══════════════════════════════════
   CARD TILT
   ══════════════════════════════════ */
function addTilt(el) {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = ((e.clientY - r.top)  / r.height - 0.5) * 10;
    const y = -((e.clientX - r.left) / r.width  - 0.5) * 10;
    el.style.transform = `perspective(900px) rotateX(${x}deg) rotateY(${y}deg)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
  });
}
addTilt(profileBlock);

/* ══════════════════════════════════
   PFP CLICK — fast orbit
   ══════════════════════════════════ */
$('profile-picture').addEventListener('click', () => {
  const c = $('profile-container');
  c.classList.add('fast-orbit');
  setTimeout(() => c.classList.remove('fast-orbit'), 450);
});

/* ══════════════════════════════════
   AUDIO PLAYER
   ══════════════════════════════════ */
const aud    = bgMusic;
const pfill  = $('progress-fill');
const tcEl   = $('time-current');
const ttEl   = $('time-total');
let audioPlaying = false;

const fmtTime = s => {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
};

aud.addEventListener('loadedmetadata', () => { ttEl.textContent = fmtTime(aud.duration); });
aud.addEventListener('timeupdate', () => {
  if (!aud.duration) return;
  pfill.style.width = (aud.currentTime / aud.duration * 100) + '%';
  tcEl.textContent  = fmtTime(aud.currentTime);
});

function toggleAudio() {
  if (audioPlaying) {
    aud.pause();
    $('play-icon').style.display  = '';
    $('pause-icon').style.display = 'none';
    audioPlaying = false;
  } else {
    aud.play().catch(() => {});
    $('play-icon').style.display  = 'none';
    $('pause-icon').style.display = '';
    audioPlaying = true;
  }
}

function audioSkip(sec) {
  aud.currentTime = Math.max(0, Math.min(aud.duration || 0, aud.currentTime + sec));
}

function seekAudio(e) {
  const r = $('progress-track').getBoundingClientRect();
  aud.currentTime = Math.max(0, Math.min(aud.duration || 0,
    ((e.clientX - r.left) / r.width) * (aud.duration || 0)));
}

/* ══════════════════════════════════
   VOLUME + MUTE
   ══════════════════════════════════ */
let muted = false;
$('volume-slider').addEventListener('input', e => {
  aud.volume = e.target.value;
  muted = false; aud.muted = false;
});
function toggleMute() {
  muted = !muted; aud.muted = muted;
  $('volume-icon').style.opacity = muted ? '0.35' : '1';
}

/* ══════════════════════════════════
   TRANSPARENCY SLIDER
   ══════════════════════════════════ */
$('transparency-slider').addEventListener('input', e => {
  const v = parseFloat(e.target.value);
  profileBlock.style.background  = `rgba(13,13,16,${v})`;
  profileBlock.style.backdropFilter = `blur(${22*v}px)`;
  playerBlock.style.background   = `rgba(13,13,16,${v})`;
  playerBlock.style.backdropFilter  = `blur(${22*v}px)`;
});

/* ══════════════════════════════════
   THEME SWITCHER
   ══════════════════════════════════ */
let currentTheme = 1;
function switchTheme(n) {
  if (n === currentTheme) return;
  currentTheme = n;

  // Update button states
  document.querySelectorAll('.theme-btn').forEach((b, i) => {
    b.classList.toggle('active', i + 1 === n);
  });

  // Swap video
  const src = THEME_VIDEOS[n - 1];
  bgVideo.style.opacity = '0';
  bgVideo.style.transition = 'opacity 0.4s';
  setTimeout(() => {
    bgVideo.src = src;
    bgVideo.play().catch(() => {});
    bgVideo.style.opacity = '1';
  }, 400);

  // Swap theme class
  document.body.className = THEME_CLASSES[n - 1];

  // Hacker overlay
  const ho = $('hacker-overlay');
  if (ho) ho.style.display = n === 2 ? 'block' : 'none';
}

/* ══════════════════════════════════
   UTILS
   ══════════════════════════════════ */
function openLink(url) { window.open(url, '_blank'); }

function copyText(text, msg) {
  navigator.clipboard.writeText(text)
    .then(() => showToast(msg))
    .catch(() => showToast('Copy failed'));
}

function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2300);
}

/* ══════════════════════════════════
   VISITOR COUNTER
   ══════════════════════════════════ */
(function() {
  const key = 'xd9_vc';
  let v = parseInt(localStorage.getItem(key) || '517');
  if (!localStorage.getItem('xd9_visited')) {
    v++;
    localStorage.setItem('xd9_visited', '1');
  }
  localStorage.setItem(key, v);
  $('visitor-count').textContent = v.toLocaleString();
})();

/* ══════════════════════════════════
   GITHUB API
   ══════════════════════════════════ */
fetch('https://api.github.com/users/fullpaste')
  .then(r => r.json())
  .then(d => {
    $('gh-pfp').src = d.avatar_url;
    $('gh-name').textContent = d.login;
    $('gh-followers').innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      ${d.followers} Followers`;
    $('gh-repos').innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
      ${d.public_repos} Repos`;
    $('gh-link').href = d.html_url;
  })
  .catch(() => {});

/* ══════════════════════════════════
   DISCORD LANYARD (live presence)
   ══════════════════════════════════ */
async function loadLanyard() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    const json = await res.json();
    if (!json.success) return;

    const data = json.data;
    const user = data.discord_user;

    // Avatar (animated support)
    if (user.avatar) {
      const ext = user.avatar.startsWith('a_') ? 'gif' : 'webp';
      $('dc-pfp').src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=80`;
    }

    // Display name
    $('dc-name').textContent = user.global_name || user.username;

    // Status dot
    const dot = $('dc-dot');
    dot.className = 'status-dot s-' + (data.discord_status || 'offline');

    // Activity text
    let actText = '';
    if (data.listening_to_spotify && data.spotify) {
      actText = `${data.spotify.song} — ${data.spotify.artist}`;
      $('dc-activity').innerHTML = `<span>🎵</span><span id="dc-act">${actText}</span>`;
    } else if (data.activities && data.activities.length) {
      // type 4 = custom status
      const custom = data.activities.find(a => a.type === 4);
      const other  = data.activities.find(a => a.type !== 4);
      if (custom && custom.state) {
        actText = custom.state;
      } else if (other) {
        actText = other.details || other.name || '';
      }
      $('dc-act').textContent = actText || 'UPDATED WEBSITE, IN BIO';
    }

    // Poll every 15s
    setTimeout(loadLanyard, 15000);
  } catch (e) {
    setTimeout(loadLanyard, 30000);
  }
}
loadLanyard();
