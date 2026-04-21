// script.js - SIMPLE & FIXED VERSION

const firebaseConfig = {
  apiKey: "AIzaSyCJGnr4C_tG6ItiLmITprjMUHA_7xP6rUE",
  authDomain: "zhennblast.firebaseapp.com",
  databaseURL: "https://zhennblast-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zhennblast",
  storageBucket: "zhennblast.firebasestorage.app",
  messagingSenderId: "844515346587",
  appId: "1:844515346587:web:bec0878e5e3e5f2e75de3e"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_CODE = 'Admin131313';
let currentUser = null;
let isAdminMode = false;

// UI Elements
const authContainer = document.getElementById('authContainer');
const dashboard = document.getElementById('dashboardContainer');

// Avatar
function refreshAvatars() {
  const av = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random();
  ['authAvatar','drawerAvatar','headerAvatar','homeAvatar'].forEach(id => {
    const el = document.getElementById(id); if(el) el.src = av;
  });
}
refreshAvatars();

// Video & Music
const bgVideo = document.getElementById('bgVideo');
let videoMuted = true;
document.getElementById('unmuteVideoBtn').addEventListener('click', () => {
  bgVideo.muted = videoMuted; videoMuted = !videoMuted;
  document.getElementById('unmuteVideoBtn').innerHTML = videoMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
});

const audio = document.getElementById('audioPlayer');
audio.volume = 0.5;
document.getElementById('playPauseBtn').addEventListener('click', () => {
  audio.paused ? audio.play() : audio.pause();
  document.getElementById('playPauseBtn').innerHTML = audio.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
});
document.getElementById('volumeSlider').addEventListener('input', e => audio.volume = e.target.value);

// Dark Mode
document.getElementById('darkModeToggle').addEventListener('click', function() {
  document.body.classList.toggle('dark');
  this.innerHTML = document.body.classList.contains('dark') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// Auth Tabs
document.getElementById('tabLogin').addEventListener('click', () => {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
});
document.getElementById('tabRegister').addEventListener('click', () => {
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('loginForm').classList.add('hidden');
});

// Register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const id = document.getElementById('regId').value;
  const pw = document.getElementById('regPw').value;
  if (pw.length < 6) return alert('Password min 6');
  const snap = await get(ref(db, 'users'));
  if (snap.exists() && Object.values(snap.val()).some(u => u.identifier === id)) return alert('Sudah terdaftar');
  const newUser = { id: Date.now().toString(), name, identifier: id, password: pw, premiumExpiry: null };
  await set(ref(db, 'users/' + newUser.id), newUser);
  alert('Berhasil! Silakan login.');
  document.getElementById('tabLogin').click();
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('loginId').value;
  const pw = document.getElementById('loginPw').value;
  const snap = await get(ref(db, 'users'));
  if (snap.exists()) {
    const user = Object.values(snap.val()).find(u => u.identifier === id && u.password === pw);
    if (user) { currentUser = user; showDashboard(); return; }
  }
  alert('Login gagal');
});

// Admin
document.getElementById('showAdminLogin').addEventListener('click', () => document.getElementById('adminModal').classList.remove('hidden'));
document.getElementById('adminLoginBtn').addEventListener('click', () => {
  if (document.getElementById('adminCodeInput').value === ADMIN_CODE) {
    isAdminMode = true;
    currentUser = { role: 'admin', name: 'Admin' };
    document.getElementById('adminModal').classList.add('hidden');
    showDashboard();
  }
});

// Dashboard
function showDashboard() {
  authContainer.classList.add('hidden');
  dashboard.classList.remove('hidden');
  updateUI();
  document.getElementById('homeName').textContent = currentUser.name || 'User';
  document.getElementById('drawerName').textContent = currentUser.name || 'User';
  navigateTo('beranda');
}

// Check Premium
function isPremium() {
  if (isAdminMode) return true;
  return currentUser?.premiumExpiry && new Date(currentUser.premiumExpiry) > new Date();
}

// Update UI (BUKA/TUTUP FITUR)
function updateUI() {
  const premium = isPremium();
  
  // Update badge
  const badge = document.getElementById('userPremiumBadge');
  if (premium) { badge.textContent = 'Premium Aktif'; badge.className = 'text-xs bg-green-500/30 text-white px-3 py-1 rounded-full'; }
  else { badge.textContent = 'Free'; badge.className = 'text-xs bg-white/20 text-white px-3 py-1 rounded-full'; }
  
  // Update profil
  if (!isAdminMode && currentUser) {
    document.getElementById('profName').textContent = currentUser.name;
    document.getElementById('profEmail').textContent = currentUser.identifier;
    document.getElementById('profStatus').textContent = premium ? 'Premium Aktif' : 'Free';
    document.getElementById('profExpiry').textContent = currentUser.premiumExpiry ? new Date(currentUser.premiumExpiry).toLocaleDateString() : '-';
  }
  
  // BUKA/TUTUP OVERLAY
  const overlays = ['fixMerahOverlay', 'banOverlay', 'limitOverlay', 'blastOverlay', 'tutorialOverlay'];
  overlays.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (premium) el.classList.add('hidden');
      else el.classList.remove('hidden');
    }
  });
  
  // Max Blast
  let max = 50;
  if (premium && currentUser?.premiumExpiry) {
    const days = Math.ceil((new Date(currentUser.premiumExpiry) - new Date()) / (1000*60*60*24));
    if (days <= 3) max = 100; else if (days <= 7) max = 500; else max = 1000;
  }
  document.getElementById('maxBlast').textContent = max;
}

// Navigasi
const pages = ['beranda','aktivitas','tutorial','akun','order','kontak'];
function navigateTo(page) {
  pages.forEach(p => document.getElementById(`page-${p}`).classList.toggle('active', p === page));
  document.querySelectorAll('.bottom-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
    b.classList.toggle('text-white', b.dataset.page === page);
  });
}
document.querySelectorAll('.bottom-nav-item').forEach(b => b.addEventListener('click', () => navigateTo(b.dataset.page)));

// Drawer
const drawer = document.getElementById('drawer');
document.getElementById('menuToggle').addEventListener('click', () => {
  drawer.classList.add('open');
  document.getElementById('drawerOverlay').classList.add('show');
});
document.getElementById('closeDrawer').addEventListener('click', () => {
  drawer.classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('show');
});

// Template Teks
function getPhone() { return document.getElementById('globalTargetPhone').value || '08123456789'; }
function banText(p) { return `Banding Ban untuk ${p}\n\nSaya mohon akun dibuka.`; }
function limitText(p) { return `Banding Limit untuk ${p}\n\nMohon naikkan limit.`; }
function fixMerahText(p) { return `Appeal Login Not Available\nNomor: +62${p.replace(/^0/,'')}\n\nPlease restore.`; }

// Event Listeners Fitur
function checkPremium() { if (!isPremium()) { alert('Premium Only'); return false; } return true; }

document.getElementById('generateFixMerah').addEventListener('click', () => { if (checkPremium()) document.getElementById('fixMerahText').value = fixMerahText(getPhone()); });
document.getElementById('salinFixMerah').addEventListener('click', () => { if (checkPremium()) navigator.clipboard.writeText(document.getElementById('fixMerahText').value); });
document.getElementById('kirimFixMerah').addEventListener('click', () => { if (checkPremium()) window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=smb@support.whatsapp.com&body=${encodeURIComponent(document.getElementById('fixMerahText').value)}`); });

document.getElementById('kocokBan').addEventListener('click', () => { if (checkPremium()) document.getElementById('banText').value = banText(getPhone()); });
document.getElementById('salinBan').addEventListener('click', () => { if (checkPremium()) navigator.clipboard.writeText(document.getElementById('banText').value); });
document.getElementById('kirimBan').addEventListener('click', () => { if (checkPremium()) window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=smb@support.whatsapp.com&body=${encodeURIComponent(document.getElementById('banText').value)}`); });

document.getElementById('kocokLimit').addEventListener('click', () => { if (checkPremium()) document.getElementById('limitText').value = limitText(getPhone()); });
document.getElementById('salinLimit').addEventListener('click', () => { if (checkPremium()) navigator.clipboard.writeText(document.getElementById('limitText').value); });
document.getElementById('kirimLimit').addEventListener('click', () => { if (checkPremium()) window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=smb@support.whatsapp.com&body=${encodeURIComponent(document.getElementById('limitText').value)}`); });

// Blast
document.getElementById('startBlast').addEventListener('click', () => {
  if (!checkPremium()) return;
  const cont = document.getElementById('blastProgressContainer');
  const bar = document.getElementById('blastProgressBar');
  const text = document.getElementById('blastProgressText');
  cont.classList.remove('hidden');
  let p = 0;
  const int = setInterval(() => { p+=5; bar.style.width=p+'%'; text.textContent=p+'%'; if(p>=100){ clearInterval(int); text.textContent='Selesai!'; } }, 100);
});

// Aktivasi Premium
document.getElementById('activatePremiumBtn').addEventListener('click', async () => {
  const code = document.getElementById('kodePremiumInput').value.toUpperCase();
  let days = 0;
  if (code === 'PREMIUM0102831') days = 3;
  else if (code === 'PREMIUM02738271') days = 7;
  else if (code === 'PREMIUM637182618') days = 30;
  else return alert('Kode tidak valid');
  
  const exp = new Date(); exp.setDate(exp.getDate() + days);
  await update(ref(db, 'users/' + currentUser.id), { premiumExpiry: exp.toISOString() });
  currentUser.premiumExpiry = exp.toISOString();
  updateUI();
  alert(`Premium aktif hingga ${exp.toLocaleDateString()}`);
  navigateTo('beranda');
});

// Unlock Tutorial
document.getElementById('unlockTutorialBtn').addEventListener('click', () => navigateTo('order'));

// Payment
let selectedPaket = {};
document.querySelectorAll('.paket-btn').forEach(b => b.addEventListener('click', function() {
  document.querySelectorAll('.paket-btn').forEach(x => x.classList.remove('active'));
  this.classList.add('active');
  selectedPaket = { hari: this.dataset.hari, harga: this.dataset.harga };
}));
document.getElementById('orderNowBtn').addEventListener('click', () => {
  if (!selectedPaket.hari) return alert('Pilih paket!');
  document.getElementById('selectedPaket').textContent = `${selectedPaket.hari} Hari`;
  document.getElementById('selectedHarga').textContent = `Rp ${parseInt(selectedPaket.harga).toLocaleString()}`;
  document.getElementById('paymentModal').classList.remove('hidden');
});
document.querySelectorAll('.metode-btn').forEach(b => b.addEventListener('click', function() {
  document.querySelectorAll('.metode-btn').forEach(x => x.classList.remove('active'));
  this.classList.add('active');
  if (this.dataset.metode === 'QRIS') document.getElementById('qrisContainer').classList.remove('hidden');
  else document.getElementById('qrisContainer').classList.add('hidden');
}));
document.getElementById('konfirmasiPaymentBtn').addEventListener('click', () => {
  if (!document.querySelector('.metode-btn.active')) return alert('Pilih metode!');
  window.open(`https://t.me/ZhennBlast?text=Saya sudah bayar ${selectedPaket.hari} Hari sebesar Rp ${parseInt(selectedPaket.harga).toLocaleString()}`, '_blank');
  document.getElementById('paymentModal').classList.add('hidden');
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null; isAdminMode = false;
  dashboard.classList.add('hidden');
  authContainer.classList.remove('hidden');
});

// Start
authContainer.classList.remove('hidden');
dashboard.classList.add('hidden');
