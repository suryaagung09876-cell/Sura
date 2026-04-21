// script.js - FULL VERSION WITH PAYMENT FEATURE

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
import { getDatabase, ref, set, get, child, update, remove, onValue } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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

// ---------- AVATAR RANDOM ----------
function getRandomAvatar(seed = null) {
  return 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (seed || Math.random().toString(36).substring(7));
}
function refreshAvatars() {
  const av = getRandomAvatar();
  ['authAvatar','drawerAvatar','headerAvatar','homeAvatar'].forEach(id => {
    const el = document.getElementById(id); if(el) el.src = av;
  });
}
refreshAvatars();

// ---------- VIDEO BACKGROUND ----------
const bgVideo = document.getElementById('bgVideo');
let videoMuted = true;
function pauseBg() { bgVideo.pause(); }
function playBg() { bgVideo.play().catch(()=>{}); }
document.getElementById('unmuteVideoBtn').addEventListener('click', () => {
  if (videoMuted) {
    bgVideo.muted = false;
    bgVideo.play().catch(()=>{});
    document.getElementById('unmuteVideoBtn').innerHTML = '<i class="fas fa-volume-up"></i>';
    videoMuted = false;
  } else {
    bgVideo.muted = true;
    document.getElementById('unmuteVideoBtn').innerHTML = '<i class="fas fa-volume-mute"></i>';
    videoMuted = true;
  }
});

// ---------- MUSIC PLAYER ----------
const audio = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playPauseBtn');
audio.volume = 0.5;
document.getElementById('volumeSlider').addEventListener('input', e => audio.volume = e.target.value);
playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play(); playBtn.innerHTML = '<i class="fas fa-pause"></i>'; pauseBg();
  } else {
    audio.pause(); playBtn.innerHTML = '<i class="fas fa-play"></i>'; playBg();
  }
});
audio.addEventListener('ended', () => {
  playBtn.innerHTML = '<i class="fas fa-play"></i>'; playBg();
});

// ---------- DARK MODE ----------
document.getElementById('darkModeToggle').addEventListener('click', function() {
  document.body.classList.toggle('dark');
  this.innerHTML = document.body.classList.contains('dark') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// ---------- UI ELEMENTS ----------
const authContainer = document.getElementById('authContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const adminModal = document.getElementById('adminModal');

// ---------- AUTH TABS ----------
document.getElementById('tabLogin').addEventListener('click', () => {
  document.getElementById('tabLogin').classList.add('border-white','text-white');
  document.getElementById('tabRegister').classList.remove('border-white','text-white');
  document.getElementById('tabRegister').classList.add('text-white/60');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
});
document.getElementById('tabRegister').addEventListener('click', () => {
  document.getElementById('tabRegister').classList.add('border-white','text-white');
  document.getElementById('tabLogin').classList.remove('border-white','text-white');
  document.getElementById('tabLogin').classList.add('text-white/60');
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('loginForm').classList.add('hidden');
});

// ---------- FIREBASE FUNCTIONS ----------
async function registerUser(name, identifier, password) {
  try {
    const dbRef = ref(db, 'users');
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const usersObj = snapshot.val();
      const exists = Object.values(usersObj).some(u => u.identifier === identifier);
      if (exists) { alert('❌ Email/Telepon sudah terdaftar!'); return false; }
    }
    const newId = Date.now().toString();
    const newUser = { id: newId, name, identifier, password, premiumExpiry: null, activationCodes: [] };
    await set(ref(db, 'users/' + newId), newUser);
    currentUser = newUser;
    localStorage.setItem('zb_current', JSON.stringify(newUser));
    alert('✅ Pendaftaran berhasil! Silakan login.');
    return true;
  } catch (error) { console.error(error); alert('❌ Gagal: ' + error.message); return false; }
}

async function loginUser(identifier, password) {
  try {
    const dbRef = ref(db, 'users');
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const usersObj = snapshot.val();
      const user = Object.values(usersObj).find(u => u.identifier === identifier && u.password === password);
      if (user) { currentUser = user; localStorage.setItem('zb_current', JSON.stringify(user)); return true; }
    }
    return false;
  } catch (error) { console.error(error); return false; }
}

// ---------- FORM SUBMIT ----------
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const id = document.getElementById('regId').value.trim();
  const pw = document.getElementById('regPw').value;
  if (pw.length < 6) return alert('❌ Password minimal 6 karakter');
  const btn = document.querySelector('#registerForm button[type="submit"]');
  btn.textContent = 'Mendaftar...'; btn.disabled = true;
  const success = await registerUser(name, id, pw);
  btn.textContent = 'Daftar'; btn.disabled = false;
  if (success) { document.getElementById('tabLogin').click(); }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value;
  const btn = document.querySelector('#loginForm button[type="submit"]');
  btn.textContent = 'Memeriksa...'; btn.disabled = true;
  const success = await loginUser(id, pw);
  btn.textContent = 'Masuk'; btn.disabled = false;
  if (success) { isAdminMode = false; showDashboard(); }
  else alert('❌ Login gagal!');
});

// ---------- ADMIN ----------
document.getElementById('showAdminLogin').addEventListener('click', () => adminModal.classList.remove('hidden'));
document.getElementById('adminLoginBtn').addEventListener('click', () => {
  if (document.getElementById('adminCodeInput').value === ADMIN_CODE) {
    isAdminMode = true;
    currentUser = { role: 'admin', name: 'Administrator', identifier: 'admin@zhennblast' };
    adminModal.classList.add('hidden');
    showDashboard();
  } else alert('❌ Kode admin salah');
});

function showDashboard() {
  authContainer.classList.add('hidden');
  dashboardContainer.classList.remove('hidden');
  updateUI();
  renderDrawerMenu();
  navigateTo('beranda');
  const phone = getTargetPhone();
  document.getElementById('fixMerahText').value = generateFixMerah(phone);
  document.getElementById('banText').value = generateBanText(phone);
  document.getElementById('limitText').value = generateLimitText(phone);
}

function getTargetPhone() {
  return document.getElementById('globalTargetPhone')?.value.trim() || '08123456789';
}

function generateFixMerah(phone) {
  const cleanPhone = phone.replace(/^0/, '');
  return `Appeal – Login Not Available (New Account)\nDear WhatsApp Support,\n\nI would like to appeal my account: Nomor anda +62 ${cleanPhone}\n\nMy account shows "login not available at this time" (red warning) and cannot be used.\n\nThis is a newly registered account and I have not violated any policies. This may be an error or unintended issue.\n\nPlease review and restore my account.\n\nThank you.`;
}

function generateBanText(phone) {
  let text = `Kepada Tim Support WhatsApp,\n\nDengan hormat,\nNama: ${currentUser?.name||'Pengguna'}\nNomor: ${phone}\n\n`;
  for (let i = 1; i <= 30; i++) text += `Paragraf ${i}: Saya mohon banned akun dibuka. Saya tidak melanggar aturan. `;
  text += `\nTerima kasih.`;
  return text;
}

function generateLimitText(phone) {
  let text = `Kepada Tim Support WhatsApp,\n\nDengan hormat,\nNama: ${currentUser?.name||'Pengguna'}\nNomor: ${phone}\n\n`;
  for (let i = 1; i <= 30; i++) text += `Paragraf ${i}: Saya mohon limit akun dinaikkan untuk riset. Saya tidak melanggar aturan. `;
  text += `\nTerima kasih.`;
  return text;
}

function isPremiumActive() {
  if (isAdminMode) return true;
  return currentUser && currentUser.premiumExpiry && new Date(currentUser.premiumExpiry) > new Date();
}

function updateUI() {
  if (isAdminMode) {
    document.getElementById('homeName').textContent = 'Administrator';
    document.getElementById('drawerName').textContent = 'Administrator';
    document.getElementById('drawerEmail').textContent = 'admin@zhennblast';
    document.getElementById('userPremiumBadge').textContent = 'Admin';
    document.getElementById('adminPanelDrawer').classList.remove('hidden');
  } else if (currentUser) {
    document.getElementById('homeName').textContent = currentUser.name;
    document.getElementById('drawerName').textContent = currentUser.name;
    document.getElementById('drawerEmail').textContent = currentUser.identifier;
    document.getElementById('profName').textContent = currentUser.name;
    document.getElementById('profEmail').textContent = currentUser.identifier;
    const active = isPremiumActive();
    const badge = document.getElementById('userPremiumBadge');
    const profStatus = document.getElementById('profStatus');
    if (active) {
      badge.textContent = 'Premium Aktif'; badge.className = 'text-xs bg-green-500/30 text-white px-3 py-1 rounded-full';
      profStatus.textContent = 'Premium Aktif';
    } else {
      badge.textContent = 'Free'; badge.className = 'text-xs bg-white/20 text-white px-3 py-1 rounded-full';
      profStatus.textContent = 'Free';
    }
    document.getElementById('profExpiry').textContent = currentUser.premiumExpiry ? new Date(currentUser.premiumExpiry).toLocaleDateString() : '-';
    document.getElementById('adminPanelDrawer').classList.add('hidden');
  }

  document.querySelectorAll('.premium-lock').forEach(el => {
    if (!isPremiumActive()) {
      el.classList.add('locked');
      if (!el.querySelector('.lock-message')) {
        const msg = document.createElement('div'); msg.className = 'lock-message';
        msg.innerHTML = '<i class="fas fa-lock mr-1"></i> Premium Only';
        el.appendChild(msg);
      }
    } else { el.classList.remove('locked'); const msg = el.querySelector('.lock-message'); if(msg) msg.remove(); }
  });

  let max = 50;
  if (isPremiumActive() && !isAdminMode) {
    const days = Math.ceil((new Date(currentUser.premiumExpiry) - new Date())/(1000*60*60*24));
    if (days <= 3) max = 100; else if (days <=7) max = 500; else max = 1000;
  }
  document.getElementById('maxBlast').textContent = max;
}

// ---------- NAVIGATION ----------
const menuItems = [
  { id: 'beranda', icon: 'fa-home', label: 'Beranda' },
  { id: 'aktivitas', icon: 'fa-history', label: 'Aktivitas' },
  { id: 'tutorial', icon: 'fa-book-open', label: 'Tutorial' },
  { id: 'profil', icon: 'fa-user-cog', label: 'Profil' },
  { id: 'kontak', icon: 'fab fa-telegram', label: 'Kontak' }
];

function renderDrawerMenu(filter='') {
  const nav = document.getElementById('drawerNav');
  const filtered = menuItems.filter(m => m.label.toLowerCase().includes(filter.toLowerCase()));
  nav.innerHTML = filtered.map(m => `
    <div class="drawer-item p-3 hover:bg-white/20 rounded-xl flex items-center gap-3 cursor-pointer" data-page="${m.id}">
      <i class="fas ${m.icon} w-5 text-white"></i><span class="text-white">${m.label}</span>
    </div>
  `).join('');
  document.querySelectorAll('.drawer-item').forEach(el => {
    el.addEventListener('click', () => {
      navigateTo(el.dataset.page);
      document.getElementById('drawer').classList.remove('open');
      document.getElementById('drawerOverlay').classList.remove('show');
    });
  });
}

function navigateTo(pageId) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageId}`).classList.add('active');
  document.querySelectorAll('.bottom-nav-item').forEach(b => {
    if (b.dataset.page === pageId) b.classList.add('active');
    else b.classList.remove('active');
  });
  if (pageId === 'adminUsers') renderAdminUserList();
}

// Drawer
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('drawerOverlay');
document.getElementById('menuToggle').addEventListener('click', () => { drawer.classList.add('open'); overlay.classList.add('show'); });
document.getElementById('closeDrawer').addEventListener('click', () => { drawer.classList.remove('open'); overlay.classList.remove('show'); });
overlay.addEventListener('click', () => { drawer.classList.remove('open'); overlay.classList.remove('show'); });
document.getElementById('drawerSearch').addEventListener('input', e => renderDrawerMenu(e.target.value));
document.querySelectorAll('.bottom-nav-item').forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.page)));

let touchStart = 0;
document.addEventListener('touchstart', e => touchStart = e.changedTouches[0].screenX, {passive: true});
document.addEventListener('touchend', e => { if (e.changedTouches[0].screenX - touchStart > 70 && touchStart < 30) { drawer.classList.add('open'); overlay.classList.add('show'); } });

// ---------- FITUR BANDING ----------
document.getElementById('generateFixMerah').addEventListener('click', () => {
  if (!isPremiumActive()) return alert('🔒 Premium only');
  document.getElementById('fixMerahText').value = generateFixMerah(getTargetPhone());
});
document.getElementById('salinFixMerah').addEventListener('click', () => {
  if (!isPremiumActive()) return alert('🔒 Premium only');
  navigator.clipboard.writeText(document.getElementById('fixMerahText').value).then(()=>alert('📋 Teks disalin'));
});
document.getElementById('kirimFixMerah').addEventListener('click', () => {
  if (!isPremiumActive()) return alert('🔒 Premium only');
  const body = document.getElementById('fixMerahText').value;
  window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=smb@support.whatsapp.com,support@support.whatsapp.com&su=Appeal%20Login%20Not%20Available&body=${encodeURIComponent(body)}`, '_blank');
});

document.getElementById('kocokBan').addEventListener('click', () => {
  if (!isPremiumActive()) return alert('🔒 Premium only');
  document.getElementById('banText').value = generateBanText(getTargetPhone());
});
document.getElementById('salinBan').addEventListener('click', () => {
  if (!isPremiumActive()) return alert('🔒 Premium only');
  navigator.clipboard.writeText(document.getElementById('banText').value).then(()=>alert('📋 Teks disalin'));
});
document.getElementById('kirimBan').addEventListener('click', () => {
  if (!isPremiumActive()) return alert('🔒 Premium only');
  const body = document.getElementById('banText').value;
  window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=smb@support.whatsapp.com&su=Banding%20Lepas%20Ban&body=${encodeURIComponent(body)}`, '_blank');
});

document.getElementById('kocokLimit').addEventListener('click', () => {
  if (!isPremiumActive()) return alert('🔒 Premium only');
  document.getElementById('limitText').value = generateLimitText(getTargetPhone());
});
document.getElementById('salinLimit').addEventListener('click', () => {
  if (!isPremiumActive()) return alert('🔒 Premium only');
  navigator.clipboard.writeText(document.getElementById('limitText').value).then(()=>alert('📋 Teks disalin'));
});
document.getElementById('kirimLimit').addEventListener('click', () => {
  if (!isPremiumActive()) return alert('🔒 Premium only');
  const body = document.getElementById('limitText').value;
  window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=smb@support.whatsapp.com&su=Banding%20Lepas%20Limit&body=${encodeURIComponent(body)}`, '_blank');
});

// ---------- BLAST DENGAN EFEK ACAK ----------
let blastInterval;
document.getElementById('startBlast').addEventListener('click', function() {
  if (!isPremiumActive()) return alert('🔒 Premium only');
  const phone = document.getElementById('blastPhoneInput').value.trim() || getTargetPhone();
  if (!phone) return alert('📱 Masukkan nomor telepon!');
  const max = parseInt(document.getElementById('maxBlast').textContent);
  let val = parseInt(document.getElementById('blastInput').value);
  if (val > max) val = max;
  
  const cont = document.getElementById('blastProgressContainer');
  const bar = document.getElementById('blastProgressBar');
  const text = document.getElementById('blastProgressText');
  cont.classList.remove('hidden');
  
  let prog = 0;
  if (blastInterval) clearInterval(blastInterval);
  blastInterval = setInterval(() => {
    prog += 2;
    if (prog > 100) prog = 100;
    bar.style.width = prog + '%';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|:"<>?';
    let fake = '';
    for (let i=0; i<40; i++) fake += chars[Math.floor(Math.random()*chars.length)];
    text.textContent = `[${phone}] Encrypting: ${fake} ... ${prog}%`;
    if (prog >= 100) {
      clearInterval(blastInterval);
      text.textContent = `✅ Blast ke ${phone} selesai! (${val} pesan)`;
    }
  }, 150);
});

// ---------- TUTORIAL UNLOCK ----------
document.getElementById('unlockTutorialBtn').addEventListener('click', () => navigateTo('profil'));

// ---------- GANTI PASSWORD ----------
document.getElementById('changePassBtn').addEventListener('click', async () => {
  const old = document.getElementById('oldPassInput').value;
  const newPw = document.getElementById('newPassInput').value;
  if (!old || !newPw) return alert('❌ Isi semua field');
  if (isAdminMode) return alert('❌ Admin tidak perlu ganti password');
  if (currentUser.password !== old) return alert('❌ Password lama salah');
  const userRef = ref(db, 'users/' + currentUser.id);
  await update(userRef, { password: newPw });
  currentUser.password = newPw;
  localStorage.setItem('zb_current', JSON.stringify(currentUser));
  alert('✅ Password berhasil diubah');
  document.getElementById('oldPassInput').value = '';
  document.getElementById('newPassInput').value = '';
});

document.getElementById('forgotPassBtn').addEventListener('click', () => {
  alert('📞 Hubungi admin via Telegram @ZhennBlast');
});

// ---------- AKTIVASI PREMIUM (KODE) ----------
document.getElementById('activatePremiumBtn').addEventListener('click', async () => {
  const code = document.getElementById('kodePremiumInput').value.trim().toUpperCase();
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.id);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    const user = snapshot.val();
    const codes = user.activationCodes || [];
    let days = 0;
    if (code === 'PREMIUM0102831') days = 3;
    else if (code === 'PREMIUM02738271') days = 7;
    else if (code === 'PREMIUM637182618') days = 30;
    else if (codes.includes(code)) {
      if (code.startsWith('PREMIUM3')) days = 3;
      else if (code.startsWith('PREMIUM7')) days = 7;
      else if (code.startsWith('PREMIUM30')) days = 30;
    }
    if (days === 0) return alert('❌ Kode tidak valid');
    const exp = new Date();
    exp.setDate(exp.getDate() + days);
    const newCodes = codes.filter(c => c !== code);
    await update(userRef, { premiumExpiry: exp.toISOString(), activationCodes: newCodes });
    currentUser.premiumExpiry = exp.toISOString();
    localStorage.setItem('zb_current', JSON.stringify(currentUser));
    updateUI();
    alert(`✅ Premium aktif hingga ${exp.toLocaleDateString()}`);
    document.getElementById('kodePremiumInput').value = '';
  }
});

// ---------- PAYMENT SYSTEM ----------
const paymentModal = document.getElementById('paymentModal');
const paketBtns = document.querySelectorAll('.paket-btn');
const metodeBtns = document.querySelectorAll('.metode-btn');
const qrisContainer = document.getElementById('qrisContainer');
const buktiInput = document.getElementById('buktiTransferInput');

// Pilih Paket
paketBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    paketBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPaket = {
      durasi: btn.dataset.durasi,
      harga: parseInt(btn.dataset.harga),
      hari: btn.dataset.hari
    };
  });
});

// Order Now
document.getElementById('orderNowBtn').addEventListener('click', () => {
  if (!selectedPaket.durasi) return alert('❌ Pilih paket terlebih dahulu!');
  document.getElementById('selectedPaket').textContent = `${selectedPaket.hari} Hari ${selectedPaket.hari === 'unlimited' ? '(Admin Panel)' : ''}`;
  document.getElementById('selectedHarga').textContent = `Rp ${selectedPaket.harga.toLocaleString()}`;
  paymentModal.classList.remove('hidden');
});

// Pilih Metode
metodeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    metodeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMetode = btn.dataset.metode;
    if (selectedMetode === 'QRIS') {
      qrisContainer.classList.remove('hidden');
    } else {
      qrisContainer.classList.add('hidden');
    }
  });
});

// Upload Bukti
buktiInput.addEventListener('change', (e) => {
  buktiTransferFile = e.target.files[0];
});

// Konfirmasi & Kirim ke Telegram
document.getElementById('konfirmasiPaymentBtn').addEventListener('click', async () => {
  if (!selectedMetode) return alert('❌ Pilih metode pembayaran!');
  if (!buktiTransferFile) return alert('❌ Upload bukti transfer!');
  
  const paketText = `${selectedPaket.hari} Hari ${selectedPaket.hari === 'unlimited' ? '(Admin Panel)' : ''}`;
  const totalText = `Rp ${selectedPaket.harga.toLocaleString()}`;
  const message = `Saya sudah bayar Dengan keterangan yang dipilih ${paketText} dan bayar ${totalText}`;
  
  // Buka Telegram dengan teks
  const telegramUrl = `https://t.me/ZhennBlast?text=${encodeURIComponent(message)}`;
  window.open(telegramUrl, '_blank');
  
  alert('✅ Silakan kirim bukti transfer di chat Telegram yang terbuka.\n\nJika tidak terbuka otomatis, buka @ZhennBlast dan tempel pesan serta kirim gambar bukti transfer.');
  
  paymentModal.classList.add('hidden');
  selectedPaket = { durasi: '', harga: 0, hari: '' };
  selectedMetode = '';
  buktiTransferFile = null;
  paketBtns.forEach(b => b.classList.remove('active'));
  metodeBtns.forEach(b => b.classList.remove('active'));
  qrisContainer.classList.add('hidden');
});

// ---------- ADMIN FUNCTIONS ----------
async function addPremiumDays(userId, days) {
  const userRef = ref(db, 'users/' + userId);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    const user = snapshot.val();
    let exp = user.premiumExpiry ? new Date(user.premiumExpiry) : new Date();
    if (exp < new Date()) exp = new Date();
    exp.setDate(exp.getDate() + days);
    await update(userRef, { premiumExpiry: exp.toISOString() });
    alert(`✅ Berhasil menambah ${days} hari`);
    renderAdminUserList();
  }
}

async function deleteUser(userId) {
  if (confirm('Yakin hapus?')) {
    await remove(ref(db, 'users/' + userId));
    alert('✅ User dihapus');
    renderAdminUserList();
  }
}

async function generateActivationCode(userId) {
  const userRef = ref(db, 'users/' + userId);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    const user = snapshot.val();
    const codes = user.activationCodes || [];
    const types = ['3', '7', '30'];
    const prefix = 'PREMIUM' + types[Math.floor(Math.random() * types.length)];
    const newCode = prefix + Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(newCode);
    await update(userRef, { activationCodes: codes });
    alert(`🎁 Kode untuk ${user.name}: ${newCode}`);
    renderAdminUserList();
  }
}

async function renderAdminUserList() {
  const list = document.getElementById('adminUserList');
  const search = document.getElementById('adminSearchUser')?.value.toLowerCase() || '';
  const filtered = users.filter(u => u.identifier && (u.identifier.toLowerCase().includes(search) || (u.name||'').toLowerCase().includes(search)));
  list.innerHTML = filtered.map(u => {
    const exp = u.premiumExpiry ? new Date(u.premiumExpiry).toLocaleDateString() : 'Tidak';
    const codes = u.activationCodes ? u.activationCodes.join(', ') : '';
    return `
      <div class="border border-white/30 p-3 rounded-lg bg-white/5">
        <p class="text-white font-medium">${u.name} (${u.identifier})</p>
        <p class="text-white/70 text-xs">Premium: ${exp}</p>
        <p class="text-white/70 text-xs">Kode: ${codes || '-'}</p>
        <div class="flex flex-wrap gap-2 mt-2">
          <button data-id="${u.id}" class="set-days bg-blue-500/50 text-white px-2 py-1 rounded text-xs" data-days="3">+3</button>
          <button data-id="${u.id}" class="set-days bg-blue-500/50 text-white px-2 py-1 rounded text-xs" data-days="7">+7</button>
          <button data-id="${u.id}" class="set-days bg-blue-500/50 text-white px-2 py-1 rounded text-xs" data-days="30">+30</button>
          <button data-id="${u.id}" class="gen-code bg-green-500/50 text-white px-2 py-1 rounded text-xs">Kode</button>
          <button data-id="${u.id}" class="delete-user bg-red-500/50 text-white px-2 py-1 rounded text-xs">Hapus</button>
        </div>
      </div>
    `;
  }).join('');
  document.querySelectorAll('.set-days').forEach(btn => {
    btn.addEventListener('click', () => addPremiumDays(btn.dataset.id, parseInt(btn.dataset.days)));
  });
  document.querySelectorAll('.gen-code').forEach(btn => {
    btn.addEventListener('click', () => generateActivationCode(btn.dataset.id));
  });
  document.querySelectorAll('.delete-user').forEach(btn => {
    btn.addEventListener('click', () => deleteUser(btn.dataset.id));
  });
}

document.getElementById('adminManageUsers').addEventListener('click', () => navigateTo('adminUsers'));
document.getElementById('refreshAdminList')?.addEventListener('click', renderAdminUserList);

// ---------- LOGOUT ----------
document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null; isAdminMode = false;
  localStorage.removeItem('zb_current');
  dashboardContainer.classList.add('hidden');
  authContainer.classList.remove('hidden');
});

// ---------- REALTIME LISTENER ----------
onValue(ref(db, 'users'), (snapshot) => {
  const data = snapshot.val();
  users = data ? Object.values(data) : [];
  if (isAdminMode && document.getElementById('page-adminUsers')?.classList.contains('active')) {
    renderAdminUserList();
  }
});

// ---------- INIT DEFAULT USER ----------
if (users.length === 0) {
  const defaultUser = { id: '1', name: 'Admin System', identifier: 'admin@system', password: 'admin', premiumExpiry: new Date(2099,0,1).toISOString(), activationCodes: [] };
  set(ref(db, 'users/1'), defaultUser);
}

// ---------- START ----------
authContainer.classList.remove('hidden');
dashboardContainer.classList.add('hidden');
