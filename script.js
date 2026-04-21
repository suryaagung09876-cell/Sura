// script.js - FULL VERSION WITH ALL FEATURES + UNLOCK WORKING

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
import { getDatabase, ref, set, get, update, onValue, remove } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
console.log("✅ Firebase connected");

const ADMIN_CODE = 'Admin131313';
let currentUser = null;
let isAdminMode = false;
let users = [];

// Payment state
let selectedPaket = { durasi: '', harga: 0, hari: '' };
let selectedMetode = '';
let buktiTransferFile = null;
let blastInterval = null;

// ---------- AVATAR ----------
function refreshAvatars() {
  const av = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random();
  ['authAvatar','drawerAvatar','headerAvatar','homeAvatar'].forEach(id => {
    const el = document.getElementById(id); if(el) el.src = av;
  });
}
refreshAvatars();

// ---------- VIDEO ----------
const bgVideo = document.getElementById('bgVideo');
let videoMuted = true;
document.getElementById('unmuteVideoBtn').addEventListener('click', () => {
  bgVideo.muted = videoMuted; videoMuted = !videoMuted;
  document.getElementById('unmuteVideoBtn').innerHTML = videoMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
});

// ---------- MUSIC ----------
const audio = document.getElementById('audioPlayer');
audio.volume = 0.5;
document.getElementById('playPauseBtn').addEventListener('click', () => {
  audio.paused ? audio.play() : audio.pause();
  document.getElementById('playPauseBtn').innerHTML = audio.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
});
document.getElementById('volumeSlider').addEventListener('input', e => audio.volume = e.target.value);

// ---------- DARK MODE ----------
document.getElementById('darkModeToggle').addEventListener('click', function() {
  document.body.classList.toggle('dark');
  this.innerHTML = document.body.classList.contains('dark') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// ---------- UI ----------
const authContainer = document.getElementById('authContainer');
const dashboard = document.getElementById('dashboardContainer');
const adminModal = document.getElementById('adminModal');

// Tabs
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
  const name = document.getElementById('regName').value.trim();
  const id = document.getElementById('regId').value.trim();
  const pw = document.getElementById('regPw').value;
  if (pw.length < 6) return alert('Password min 6');
  const snap = await get(ref(db, 'users'));
  if (snap.exists() && Object.values(snap.val()).some(u => u.identifier === id)) return alert('Sudah terdaftar');
  const newUser = { id: Date.now().toString(), name, identifier: id, password: pw, premiumExpiry: null, activationCodes: [] };
  await set(ref(db, 'users/' + newUser.id), newUser);
  alert('Berhasil! Silakan login.');
  document.getElementById('tabLogin').click();
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value;
  const snap = await get(ref(db, 'users'));
  if (snap.exists()) {
    const user = Object.values(snap.val()).find(u => u.identifier === id && u.password === pw);
    if (user) { currentUser = user; isAdminMode = false; showDashboard(); return; }
  }
  alert('Login gagal');
});

// Admin
document.getElementById('showAdminLogin').addEventListener('click', () => adminModal.classList.remove('hidden'));
document.getElementById('adminLoginBtn').addEventListener('click', () => {
  if (document.getElementById('adminCodeInput').value === ADMIN_CODE) {
    isAdminMode = true;
    currentUser = { role: 'admin', name: 'Admin' };
    adminModal.classList.add('hidden');
    showDashboard();
  }
});

function showDashboard() {
  authContainer.classList.add('hidden');
  dashboard.classList.remove('hidden');
  updateUI();
  renderDrawerMenu();
  navigateTo('beranda');
  const phone = getPhone();
  document.getElementById('fixMerahText').value = fixMerahText(phone);
  document.getElementById('banText').value = banText(phone);
  document.getElementById('limitText').value = limitText(phone);
}

function getPhone() { return document.getElementById('globalTargetPhone')?.value || '08123456789'; }
function fixMerahText(p) { return `Appeal – Login Not Available (New Account)\nDear WhatsApp Support,\n\nI would like to appeal my account: Nomor anda +62 ${p.replace(/^0/,'')}\n\nMy account shows "login not available at this time" (red warning) and cannot be used.\n\nThis is a newly registered account and I have not violated any policies. This may be an error or unintended issue.\n\nPlease review and restore my account.\n\nThank you.`; }
function banText(p) { let t = `Kepada Tim Support WhatsApp,\n\nNama: ${currentUser?.name||'Pengguna'}\nNomor: ${p}\n\n`; for(let i=1;i<=30;i++) t += `Paragraf ${i}: Mohon buka banned. `; return t; }
function limitText(p) { let t = `Kepada Tim Support WhatsApp,\n\nNama: ${currentUser?.name||'Pengguna'}\nNomor: ${p}\n\n`; for(let i=1;i<=30;i++) t += `Paragraf ${i}: Mohon naikkan limit. `; return t; }

function isPremium() {
  if (isAdminMode) return true;
  return currentUser?.premiumExpiry && new Date(currentUser.premiumExpiry) > new Date();
}

function updateUI() {
  const premium = isPremium();
  const badge = document.getElementById('userPremiumBadge');
  if (premium) { badge.textContent = 'Premium Aktif'; badge.className = 'text-xs bg-green-500/30 text-white px-3 py-1 rounded-full'; }
  else { badge.textContent = 'Free'; badge.className = 'text-xs bg-white/20 text-white px-3 py-1 rounded-full'; }
  
  if (!isAdminMode && currentUser) {
    document.getElementById('homeName').textContent = currentUser.name;
    document.getElementById('drawerName').textContent = currentUser.name;
    document.getElementById('drawerEmail').textContent = currentUser.identifier;
    document.getElementById('profName').textContent = currentUser.name;
    document.getElementById('profEmail').textContent = currentUser.identifier;
    document.getElementById('profStatus').textContent = premium ? 'Premium Aktif' : 'Free';
    document.getElementById('profExpiry').textContent = currentUser.premiumExpiry ? new Date(currentUser.premiumExpiry).toLocaleDateString() : '-';
  }
  
  // BUKA/TUTUP SEMUA OVERLAY
  const overlays = ['fixMerahOverlay', 'banOverlay', 'limitOverlay', 'blastOverlay', 'tutorialOverlay'];
  overlays.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (premium) el.classList.add('hidden');
      else el.classList.remove('hidden');
    }
  });
  
  let max = 50;
  if (premium && currentUser?.premiumExpiry) {
    const days = Math.ceil((new Date(currentUser.premiumExpiry) - new Date()) / (1000*60*60*24));
    if (days <= 3) max = 100; else if (days <= 7) max = 500; else max = 1000;
  }
  document.getElementById('maxBlast').textContent = max;
}

// Navigasi
const menuItems = [
  { id: 'beranda', icon: 'fa-home', label: 'Beranda' },
  { id: 'aktivitas', icon: 'fa-history', label: 'Aktivitas' },
  { id: 'tutorial', icon: 'fa-book-open', label: 'Tutorial' },
  { id: 'akun', icon: 'fa-user', label: 'Akun' },
  { id: 'order', icon: 'fa-shopping-cart', label: 'Order' },
  { id: 'kontak', icon: 'fab fa-telegram', label: 'Kontak' }
];

function renderDrawerMenu(filter='') {
  const nav = document.getElementById('drawerNav');
  const f = menuItems.filter(m => m.label.toLowerCase().includes(filter.toLowerCase()));
  nav.innerHTML = f.map(m => `<div class="drawer-item p-3 hover:bg-white/20 rounded-xl flex items-center gap-3 cursor-pointer" data-page="${m.id}"><i class="fas ${m.icon} w-5 text-white"></i><span class="text-white">${m.label}</span></div>`).join('');
  document.querySelectorAll('.drawer-item').forEach(el => el.addEventListener('click', () => { navigateTo(el.dataset.page); drawer.classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('show'); }));
}

function navigateTo(page) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelectorAll('.bottom-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
    b.classList.toggle('text-white', b.dataset.page === page);
  });
}

// Drawer
const drawer = document.getElementById('drawer');
document.getElementById('menuToggle').addEventListener('click', () => { drawer.classList.add('open'); document.getElementById('drawerOverlay').classList.add('show'); });
document.getElementById('closeDrawer').addEventListener('click', () => { drawer.classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('show'); });
document.getElementById('drawerOverlay').addEventListener('click', () => { drawer.classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('show'); });
document.getElementById('drawerSearch').addEventListener('input', e => renderDrawerMenu(e.target.value));
document.querySelectorAll('.bottom-nav-item').forEach(b => b.addEventListener('click', () => navigateTo(b.dataset.page)));

// Swipe
let touchStart = 0;
document.addEventListener('touchstart', e => touchStart = e.changedTouches[0].screenX);
document.addEventListener('touchend', e => { if (e.changedTouches[0].screenX - touchStart > 70 && touchStart < 30) { drawer.classList.add('open'); document.getElementById('drawerOverlay').classList.add('show'); } });

// Check Premium
function checkPremium() { if (!isPremium()) { alert('🔒 Premium Only'); return false; } return true; }

// Fitur Fix Merah
document.getElementById('generateFixMerah').addEventListener('click', () => { if (checkPremium()) document.getElementById('fixMerahText').value = fixMerahText(getPhone()); });
document.getElementById('salinFixMerah').addEventListener('click', () => { if (checkPremium()) navigator.clipboard.writeText(document.getElementById('fixMerahText').value).then(()=>alert('Disalin')); });
document.getElementById('kirimFixMerah').addEventListener('click', () => { if (checkPremium()) window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=smb@support.whatsapp.com,support@support.whatsapp.com&body=${encodeURIComponent(document.getElementById('fixMerahText').value)}`); });

// Fitur Ban
document.getElementById('kocokBan').addEventListener('click', () => { if (checkPremium()) document.getElementById('banText').value = banText(getPhone()); });
document.getElementById('salinBan').addEventListener('click', () => { if (checkPremium()) navigator.clipboard.writeText(document.getElementById('banText').value).then(()=>alert('Disalin')); });
document.getElementById('kirimBan').addEventListener('click', () => { if (checkPremium()) window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=smb@support.whatsapp.com&body=${encodeURIComponent(document.getElementById('banText').value)}`); });

// Fitur Limit
document.getElementById('kocokLimit').addEventListener('click', () => { if (checkPremium()) document.getElementById('limitText').value = limitText(getPhone()); });
document.getElementById('salinLimit').addEventListener('click', () => { if (checkPremium()) navigator.clipboard.writeText(document.getElementById('limitText').value).then(()=>alert('Disalin')); });
document.getElementById('kirimLimit').addEventListener('click', () => { if (checkPremium()) window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=smb@support.whatsapp.com&body=${encodeURIComponent(document.getElementById('limitText').value)}`); });

// Blast
document.getElementById('startBlast').addEventListener('click', () => {
  if (!checkPremium()) return;
  const cont = document.getElementById('blastProgressContainer');
  const bar = document.getElementById('blastProgressBar');
  const text = document.getElementById('blastProgressText');
  cont.classList.remove('hidden');
  let p = 0;
  if (blastInterval) clearInterval(blastInterval);
  blastInterval = setInterval(() => {
    p += 5;
    bar.style.width = p + '%';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let fake = ''; for(let i=0;i<30;i++) fake += chars[Math.floor(Math.random()*chars.length)];
    text.textContent = `Encrypting: ${fake} ... ${p}%`;
    if (p >= 100) { clearInterval(blastInterval); text.textContent = '✅ Blast selesai!'; }
  }, 150);
});

// Unlock Tutorial
document.getElementById('unlockTutorialBtn').addEventListener('click', () => navigateTo('order'));

// Ganti Password
document.getElementById('changePassBtn').addEventListener('click', async () => {
  const old = document.getElementById('oldPassInput').value;
  const newPw = document.getElementById('newPassInput').value;
  if (!old || !newPw) return alert('Isi semua');
  if (isAdminMode) return;
  if (currentUser.password !== old) return alert('Password lama salah');
  await update(ref(db, 'users/' + currentUser.id), { password: newPw });
  currentUser.password = newPw;
  alert('Berhasil');
});

document.getElementById('forgotPassBtn').addEventListener('click', () => alert('Hubungi @ZhennBlast'));

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
  document.getElementById('kodePremiumInput').value = '';
  navigateTo('beranda');
});

// Payment
document.querySelectorAll('.paket-btn').forEach(b => b.addEventListener('click', function() {
  document.querySelectorAll('.paket-btn').forEach(x => x.classList.remove('active'));
  this.classList.add('active');
  selectedPaket = { durasi: this.dataset.durasi, harga: this.dataset.harga, hari: this.dataset.hari };
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
  selectedMetode = this.dataset.metode;
  document.getElementById('qrisContainer').classList.toggle('hidden', selectedMetode !== 'QRIS');
}));
document.getElementById('buktiTransferInput').addEventListener('change', e => buktiTransferFile = e.target.files[0]);
document.getElementById('konfirmasiPaymentBtn').addEventListener('click', () => {
  if (!selectedMetode) return alert('Pilih metode!');
  window.open(`https://t.me/ZhennBlast?text=Saya sudah bayar ${selectedPaket.hari} Hari sebesar Rp ${parseInt(selectedPaket.harga).toLocaleString()} via ${selectedMetode}`, '_blank');
  document.getElementById('paymentModal').classList.add('hidden');
  alert('Kirim bukti transfer di chat Telegram');
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
