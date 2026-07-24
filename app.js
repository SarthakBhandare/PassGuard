/* =====================================================
   PassGuard — app.js
   Password Strength Checker with:
   - Real-time scoring algorithm
   - Common password check
   - HIBP breach check (k-Anonymity SHA-1)
   - Entropy calculation
   - Crack time estimation
   ===================================================== */

'use strict';

// =====================================================
// Common Passwords List
// =====================================================
const COMMON_PASSWORDS = new Set([
  '1234','12345','123456','1234567','12345678','123456789','1234567890',
  'password','password1','password123','passw0rd','p@ssword','p@ssw0rd',
  '111111','000000','654321','qwerty','qwerty123','qwertyuiop',
  'abc123','abcdef','letmein','monkey','dragon','master',
  'admin','admin123','root','toor','login','welcome',
  'iloveyou','sunshine','princess','football','baseball',
  'shadow','superman','batman','trustno1','hello','hello123',
  'pass','test','test123','guest','user','changeme',
  'secret','secret123','access','access123','1q2w3e4r','zxcvbnm',
  'asdfgh','asdfghjkl','mypassword','pass123','pass1234','passwd',
  '1234abcd','a1b2c3d4','flower','michael','jessica','ashley',
  'nicole','daniel','joshua','andrew','james','george',
  'hunter','ranger','buster','thomas','tigger','soccer',
  'hockey','harley','ranger','donald','batman','wizard',
  '696969','555555','777777','123321','112233','121212',
  'password!','password@','password#','password$','p4ssword',
]);

// =====================================================
// SHA-1 Implementation (pure JS, no external libs)
// =====================================================
async function sha1Hex(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// =====================================================
// Scoring Algorithm
// =====================================================
function scorePassword(password) {
  if (!password) return { score: 0, details: {} };

  const details = {
    length:   password.length >= 8,
    upper:    /[A-Z]/.test(password),
    lower:    /[a-z]/.test(password),
    number:   /[0-9]/.test(password),
    special:  /[^A-Za-z0-9]/.test(password),
    bonus:    password.length >= 12,
  };

  // Check against common passwords first
  const isCommon = COMMON_PASSWORDS.has(password.toLowerCase());

  let score = 0;
  if (details.length)  score += 1;
  if (details.upper)   score += 1;
  if (details.lower)   score += 1;
  if (details.number)  score += 1;
  if (details.special) score += 1.5;
  if (details.bonus)   score += 1.5;   // bonus points

  // Cap at 7
  score = Math.min(score, 7);

  // Force weak if common
  if (isCommon) score = Math.min(score, 1);

  return { score, details, isCommon };
}

// =====================================================
// Strength Label from Score
// =====================================================
function getStrengthInfo(score, password) {
  if (!password) return { label: '—', level: 'empty', percent: 0 };
  if (score <= 1.5) return { label: 'Weak',   level: 'weak',   percent: 18  };
  if (score <= 3.0) return { label: 'Fair',   level: 'fair',   percent: 42  };
  if (score <= 5.0) return { label: 'Good',   level: 'good',   percent: 68  };
  return               { label: 'Strong', level: 'strong', percent: 100 };
}

// =====================================================
// Entropy Calculation
// =====================================================
function calcEntropy(password) {
  if (!password) return 0;
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 32;
  return Math.round(password.length * Math.log2(pool || 1));
}

// =====================================================
// Crack Time Estimation
// =====================================================
function estimateCrackTime(entropy) {
  // Assume 1 billion guesses/second (fast online GPU cracking)
  const guessesPerSecond = 1e9;
  const combinations = Math.pow(2, entropy);
  const seconds = combinations / (guessesPerSecond * 2); // avg = half of combinations

  if (seconds < 1)           return 'Instantly';
  if (seconds < 60)          return `${Math.round(seconds)} seconds`;
  if (seconds < 3600)        return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400)       return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000)     return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000)    return `${Math.round(seconds / 2592000)} months`;
  if (seconds < 3153600000)  return `${Math.round(seconds / 31536000)} years`;

  const years = seconds / 31536000;
  if (years < 1e6)   return `${(years / 1000).toFixed(0)}K years`;
  if (years < 1e9)   return `${(years / 1e6).toFixed(0)}M years`;
  if (years < 1e12)  return `${(years / 1e9).toFixed(0)}B years`;
  return 'Heat death of the universe+';
}

// =====================================================
// UI Helpers
// =====================================================
const $ = id => document.getElementById(id);

function setClass(el, ...classes) {
  // Remove all variant classes then add the new ones
  el.className = el.className.replace(/\b(badge|pill|check)-\S+/g, '').trim();
  classes.forEach(c => el.classList.add(c));
}

function updateCriterion(id, active) {
  const el = $(id);
  if (active) {
    el.classList.add('active');
    el.querySelector('.crit-icon').setAttribute('aria-label', 'Passed');
  } else {
    el.classList.remove('active');
    el.querySelector('.crit-icon').setAttribute('aria-label', 'Not passed');
  }
}

// =====================================================
// Main UI Update
// =====================================================
function updateUI(password) {
  const { score, details, isCommon } = scorePassword(password);
  const { label, level, percent } = getStrengthInfo(score, password);
  const entropy = calcEntropy(password);
  const crackTime = password ? estimateCrackTime(entropy) : '—';

  // Progress bar
  const bar = $('progress-bar');
  bar.style.width = password ? `${percent}%` : '0%';
  bar.style.background = {
    weak:   'linear-gradient(90deg,#ef4444,#f87171)',
    fair:   'linear-gradient(90deg,#f97316,#fb923c)',
    good:   'linear-gradient(90deg,#eab308,#facc15)',
    strong: 'linear-gradient(90deg,#22c55e,#4ade80)',
    empty:  '#1a2138',
  }[level];
  bar.parentElement.setAttribute('aria-valuenow', percent);

  // Badge
  const badge = $('strength-label');
  badge.textContent = label;
  badge.className = `strength-badge badge-${level}`;

  // Score & Entropy
  $('score-display').textContent = Math.round(score);
  $('entropy-display').textContent = entropy;

  // Crack time
  $('crack-time-display').textContent = crackTime;

  // Criteria
  updateCriterion('crit-length',  details.length);
  updateCriterion('crit-upper',   details.upper);
  updateCriterion('crit-lower',   details.lower);
  updateCriterion('crit-number',  details.number);
  updateCriterion('crit-special', details.special);
  updateCriterion('crit-bonus',   details.bonus);

  // Common password check
  const commonCard   = $('common-check-card');
  const commonStatus = $('common-status');
  const commonMsg    = $('common-message');

  if (!password) {
    commonCard.className = 'check-card';
    commonStatus.className = 'status-pill pill-idle';
    commonStatus.textContent = 'Not checked';
    commonMsg.textContent = 'Type a password to check against common passwords.';
  } else if (isCommon) {
    commonCard.className = 'check-card check-danger';
    commonStatus.className = 'status-pill pill-danger';
    commonStatus.textContent = 'FLAGGED';
    commonMsg.textContent = '⚠️ This is a very common password and will be cracked almost instantly.';
  } else {
    commonCard.className = 'check-card check-safe';
    commonStatus.className = 'status-pill pill-safe';
    commonStatus.textContent = 'Clear';
    commonMsg.textContent = '✅ Not found in the common password list.';
  }

  // Reset breach check if password changes
  resetBreachState();
}

// =====================================================
// Breach Check via Have I Been Pwned API
// =====================================================
let lastCheckedPassword = null;

function resetBreachState() {
  const pwd = $('password-input').value;
  if (pwd !== lastCheckedPassword) {
    const card   = $('breach-check-card');
    const status = $('breach-status');
    const msg    = $('breach-message');
    const btn    = $('breach-check-btn');

    card.className = 'check-card';
    status.className = 'status-pill pill-idle';
    status.textContent = 'Not checked';
    msg.textContent = 'Uses Have I Been Pwned API (only first 5 SHA-1 hash chars sent).';
    btn.disabled = false;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.8"/>
        <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
      Check for Breaches
    `;
  }
}

async function checkBreach() {
  const password = $('password-input').value.trim();
  const card     = $('breach-check-card');
  const status   = $('breach-status');
  const msg      = $('breach-message');
  const btn      = $('breach-check-btn');

  if (!password) {
    msg.textContent = '⚠️ Please enter a password first.';
    return;
  }

  // Loading state
  btn.disabled = true;
  status.className = 'status-pill pill-loading loading-pulse';
  status.textContent = 'Checking...';
  msg.textContent = 'Hashing and querying the breach database...';
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="loading-pulse">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" stroke-dasharray="30 20"/>
    </svg>
    Checking...
  `;

  try {
    const fullHash = await sha1Hex(password);
    const prefix   = fullHash.slice(0, 5);   // only 5 chars sent
    const suffix   = fullHash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const text  = await response.text();
    const lines = text.split('\n');

    let breachCount = 0;
    for (const line of lines) {
      const [hashSuffix, count] = line.trim().split(':');
      if (hashSuffix && hashSuffix.toUpperCase() === suffix) {
        breachCount = parseInt(count, 10);
        break;
      }
    }

    lastCheckedPassword = password;

    if (breachCount > 0) {
      card.className = 'check-card check-danger';
      status.className = 'status-pill pill-danger';
      status.textContent = 'BREACHED';
      msg.textContent = `🚨 This password has appeared in ${breachCount.toLocaleString()} data breach(es). Avoid using it!`;
    } else {
      card.className = 'check-card check-safe';
      status.className = 'status-pill pill-safe';
      status.textContent = 'Not Found';
      msg.textContent = '✅ Great news — this password wasn\'t found in any known data breaches.';
    }

  } catch (error) {
    card.className = 'check-card check-warn';
    status.className = 'status-pill pill-warn';
    status.textContent = 'Error';
    msg.textContent = `⚠️ Couldn't reach the breach database. Check your connection and try again. (${error.message})`;
    console.error('[PassGuard] Breach check error:', error);
  }

  // Restore button
  btn.disabled = false;
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.8"/>
      <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
    Check Again
  `;
}

// =====================================================
// Toggle Visibility
// =====================================================
function toggleVisibility() {
  const input   = $('password-input');
  const eyeOn   = $('eye-icon');
  const eyeOff  = $('eye-off-icon');
  const btn     = $('toggle-visibility');

  if (input.type === 'password') {
    input.type = 'text';
    eyeOn.classList.add('hidden');
    eyeOff.classList.remove('hidden');
    btn.setAttribute('aria-label', 'Hide password');
  } else {
    input.type = 'password';
    eyeOn.classList.remove('hidden');
    eyeOff.classList.add('hidden');
    btn.setAttribute('aria-label', 'Show password');
  }
}

// =====================================================
// Debounce Helper
// =====================================================
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// =====================================================
// Event Listeners
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  const input = $('password-input');

  // Real-time feedback (debounced slightly for performance)
  const debouncedUpdate = debounce((val) => updateUI(val), 80);
  input.addEventListener('input', e => debouncedUpdate(e.target.value));

  // Toggle eye button
  $('toggle-visibility').addEventListener('click', toggleVisibility);

  // Breach check button
  $('breach-check-btn').addEventListener('click', checkBreach);

  // Initial state
  updateUI('');
});
