// ==========================================
// 1. STATE APLIKASI & KONFIGURASI
// ==========================================
let appData = {
  allowance: 0,
  periodDays: 7,
  autoSavePercent: 10,
  targetName: '',
  targetAmount: 0,
  targetLink: '',
  savingsTotal: 0,
  expenses: [],
  streakDays: 0,
  lastStreakDate: null,
  isCelebrated: false
};

// Konfigurasi Lencana (Badges)
const BADGES = [
  { id: 'first_save', name: 'Nabung Perdana', icon: '🌱', reqStreak: 0 },
  { id: 'streak_3', name: 'Hemat 3 Hari', icon: '⚡', reqStreak: 3 },
  { id: 'streak_7', name: 'Master 7 Hari', icon: '👑', reqStreak: 7 }
];

let deferredPrompt = null;

// ==========================================
// 2. INISIALISASI SAAT HALAMAN DIMUAT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadData();
  registerEvents();
  initPWA();
  render();
});

// ==========================================
// 3. FITUR TEMA (DARK / LIGHT MODE)
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem('sakuquest_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.textContent = theme === 'light' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('sakuquest_theme', newTheme);
  updateThemeIcon(newTheme);
}

// ==========================================
// 4. PENYIMPANAN DATA (LOCALSTORAGE)
// ==========================================
function loadData() {
  const saved = localStorage.getItem('sakuquest_data');
  if (saved) {
    appData = { ...appData, ...JSON.parse(saved) };
  }
}

function saveData() {
  localStorage.setItem('sakuquest_data', JSON.stringify(appData));
  render();
}

// ==========================================
// 5. EVENT LISTENERS & FORM HANDLING
// ==========================================
function registerEvents() {
  // A. Toggle Tema Gelap / Terang
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.onclick = toggleTheme;
  }

  // B. Langkah 1: Form Target Impian
  const targetForm = document.getElementById('targetForm');
  if (targetForm) {
    targetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const targetName = document.getElementById('targetNameInput').value;
      const targetAmount = parseFloat(document.getElementById('targetAmountInput').value) || 0;
      const targetLink = document.getElementById('targetLinkInput').value;

      appData.targetName = targetName;
      appData.targetAmount = targetAmount;
      appData.targetLink = targetLink;
      appData.isCelebrated = false;

      saveData();
      alert(`🎯 Target "${targetName}" berhasil disimpan! Sekarang atur uang sakumu di Langkah 2.`);
    });
  }

  // C. Langkah 2: Form Uang Saku & Auto-Save
  const allowanceForm = document.getElementById('allowanceForm');
  if (allowanceForm) {
    allowanceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const allowance = parseFloat(document.getElementById('allowanceInput').value) || 0;
      const periodDays = parseInt(document.getElementById('periodSelect').value) || 7;
      const autoSavePercent = parseFloat(document.getElementById('autoSavePercent').value) || 0;

      const autoSavedAmount = (allowance * autoSavePercent) / 100;
      
      appData.allowance = allowance - autoSavedAmount;
      appData.periodDays = periodDays;
      appData.autoSavePercent = autoSavePercent;
      appData.savingsTotal += autoSavedAmount;

      saveData();
      alert(`💰 Uang saku diatur! Rp ${autoSavedAmount.toLocaleString('id-ID')} berhasil dipindahkan ke tabungan target "${appData.targetName || 'Impian'}".`);
    });
  }

  // D. Form Catat Pengeluaran Harian
  const expenseForm = document.getElementById('expenseForm');
  if (expenseForm) {
    expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('expenseTitle').value;
      const amount = parseFloat(document.getElementById('expenseAmount').value) || 0;

      appData.expenses.unshift({
        id: Date.now(),
        title,
        amount,
        date: new Date().toLocaleDateString('id-ID')
      });

      updateStreak();
      document.getElementById('expenseTitle').value = '';
      document.getElementById('expenseAmount').value = '';
      saveData();
    });
  }

  // E. Tombol Reset Semua Data
  const resetBtn = document.getElementById('resetDataBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin menghapus seluruh data SakuQuest?')) {
        localStorage.removeItem('sakuquest_data');
        location.reload();
      }
    });
  }

  // F. Detektor Mode Online / Offline
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

// ==========================================
// 6. LOGIKA KALKULASI & STREAK
// ==========================================
function calculateDailyBudget() {
  if (appData.allowance <= 0) return 0;
  
  const totalSpent = appData.expenses.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = appData.allowance - totalSpent;
  const dailyLimit = remainingBudget / appData.periodDays;

  return dailyLimit > 0 ? dailyLimit : 0;
}

function updateStreak() {
  const today = new Date().toDateString();
  if (appData.lastStreakDate !== today) {
    appData.streakDays += 1;
    appData.lastStreakDate = today;
  }
}

// ==========================================
// 7. RENDER TAMPILAN (UI UPDATE)
// ==========================================
function render() {
  // A. Ringkasan Angka
  const dailyBudget = calculateDailyBudget();
  document.getElementById('dailyBudgetDisplay').textContent = `Rp ${Math.round(dailyBudget).toLocaleString('id-ID')}`;
  document.getElementById('totalSavingsDisplay').textContent = `Rp ${appData.savingsTotal.toLocaleString('id-ID')}`;
  document.getElementById('streakCount').textContent = appData.streakDays;

  // B. Target Name (dengan link jika ada)
  const targetNameEl = document.getElementById('targetNameDisplay');
  if (targetNameEl) {
    if (appData.targetLink) {
      targetNameEl.innerHTML = `<a href="${appData.targetLink}" target="_blank" style="color: var(--primary); text-decoration: underline;">${appData.targetName} 🔗</a>`;
    } else {
      targetNameEl.textContent = appData.targetName || 'Belum Ada Target';
    }
  }

  // C. Display Nominal Terkumpul vs Target
  const targetAmountEl = document.getElementById('targetAmountDisplay');
  if (targetAmountEl) {
    targetAmountEl.textContent = `Rp ${appData.savingsTotal.toLocaleString('id-ID')} / Rp ${appData.targetAmount.toLocaleString('id-ID')}`;
  }

  // D. Hitung Persentase & Progress Bar Dinamis
  let progressPercent = 0;
  if (appData.targetAmount > 0) {
    progressPercent = Math.min(100, Math.round((appData.savingsTotal / appData.targetAmount) * 100));
  }
  
  document.getElementById('targetProgressPercent').textContent = `${progressPercent}%`;
  
  const progressBar = document.getElementById('targetProgressBar');
  if (progressBar) {
    progressBar.style.width = `${progressPercent}%`;
    
    if (progressPercent < 30) {
      progressBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
    } else if (progressPercent <= 70) {
      progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    } else {
      progressBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    }
  }

  // E. Pesta Konfeti 100%
  if (progressPercent >= 100 && !appData.isCelebrated) {
    triggerRewardConfetti();
    appData.isCelebrated = true;
    localStorage.setItem('sakuquest_data', JSON.stringify(appData));
    
    setTimeout(() => {
      alert(`🎉 SELAMAT! Target kamu "${appData.targetName}" senilai Rp ${appData.targetAmount.toLocaleString('id-ID')} SUDAH TERCAPAI! Kamu keren banget! 🙌`);
    }, 400);
  }

  // F. Lencana Badges
  const badgesContainer = document.getElementById('badgesContainer');
  if (badgesContainer) {
    badgesContainer.innerHTML = '';
    BADGES.forEach(badge => {
      const isUnlocked = appData.savingsTotal > 0 && appData.streakDays >= badge.reqStreak;
      const badgeEl = document.createElement('div');
      badgeEl.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
      badgeEl.innerHTML = `
        <span class="badge-icon">${badge.icon}</span>
        <div class="badge-name">${badge.name}</div>
      `;
      badgesContainer.appendChild(badgeEl);
    });
  }

  // G. Riwayat Transaksi
  const historyList = document.getElementById('historyList');
  if (historyList) {
    if (appData.expenses.length === 0) {
      historyList.innerHTML = '<li class="empty-msg">Belum ada pengeluaran dicatat.</li>';
    } else {
      historyList.innerHTML = appData.expenses.map(item => `
        <li class="history-item">
          <span>${item.title} <small style="color:var(--text-muted)">(${item.date})</small></span>
          <strong style="color:var(--danger)">- Rp ${item.amount.toLocaleString('id-ID')}</strong>
        </li>
      `).join('');
    }
  }
}

// ==========================================
// 8. UTILITY & PWA (OFFLINE & INSTALL)
// ==========================================
function triggerRewardConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function initPWA() {
  updateOnlineStatus();
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Reg Failed', err));
  }

  const installBtn = document.getElementById('installBtn');

  // Menangkap event install bawaan PWA
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (installBtn) {
      installBtn.classList.remove('hidden');
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            installBtn.classList.add('hidden');
          }
          deferredPrompt = null;
        });
      } else {
        // Petunjuk manual jika dibuka di PC/Browser yang tidak mendukung prompt otomatis
        alert('📲 Untuk menginstal di HP:\nBuka via Chrome di HP > Klik Titik 3 di pojok kanan atas > Pilih "Tambahkan ke Layar Utama" / "Add to Home Screen".');
      }
    });
  }

  window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.classList.add('hidden');
    deferredPrompt = null;
  });
}

function updateOnlineStatus() {
  const notice = document.getElementById('offlineNotice');
  if (notice) {
    if (!navigator.onLine) {
      notice.classList.remove('hidden');
    } else {
      notice.classList.add('hidden');
    }
  }
    }
