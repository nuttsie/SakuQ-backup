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

// ==========================================
// 2. HELPER FORMAT RUPIAH
// ==========================================
function formatRupiahInput(e) {
  let value = e.target.value.replace(/[^0-9]/g, '');
  if (value) {
    let numberVal = parseInt(value, 10);
    e.target.value = 'Rp ' + numberVal.toLocaleString('id-ID');
  } else {
    e.target.value = '';
  }
}

function parseRupiahValue(textValue) {
  if (!textValue) return 0;
  const cleanNumber = textValue.replace(/[^0-9]/g, '');
  return parseFloat(cleanNumber) || 0;
}

// ==========================================
// 3. INISIALISASI SAAT HALAMAN DIMUAT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadData();
  registerEvents();
  render();
});

// ==========================================
// 4. FITUR TEMA (DARK / LIGHT MODE)
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
// 5. PENYIMPANAN DATA (LOCALSTORAGE)
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
// 6. EVENT LISTENERS & FORM HANDLING
// ==========================================
function registerEvents() {
  // A. Toggle Tema Gelap / Terang
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.onclick = toggleTheme;
  }

  // B. Pasang Format Rupiah Otomatis ke Input Nominal
  const rupiahInputs = ['targetAmountInput', 'allowanceInput', 'expenseAmount'];
  rupiahInputs.forEach(id => {
    const inputEl = document.getElementById(id);
    if (inputEl) {
      inputEl.addEventListener('input', formatRupiahInput);
    }
  });

  // C. Langkah 1: Form Target Impian
  const targetForm = document.getElementById('targetForm');
  if (targetForm) {
    targetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const targetName = document.getElementById('targetNameInput').value;
      const targetAmount = parseRupiahValue(document.getElementById('targetAmountInput').value);
      const targetLink = document.getElementById('targetLinkInput').value;

      appData.targetName = targetName;
      appData.targetAmount = targetAmount;
      appData.targetLink = targetLink;
      appData.isCelebrated = false;

      saveData();
      alert(`🎯 Target "${targetName}" berhasil disimpan! Sekarang atur uang sakumu di Langkah 2.`);
    });
  }

  // D. Langkah 2: Form Uang Saku & Auto-Save
  const allowanceForm = document.getElementById('allowanceForm');
  if (allowanceForm) {
    allowanceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const allowance = parseRupiahValue(document.getElementById('allowanceInput').value);
      const periodDays = parseInt(document.getElementById('periodSelect').value) || 1;
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

  // E. Form Catat Pengeluaran Harian
  const expenseForm = document.getElementById('expenseForm');
  if (expenseForm) {
    expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('expenseTitle').value;
      const amount = parseRupiahValue(document.getElementById('expenseAmount').value);

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

  // F. Tombol Reset Semua Data
  const resetBtn = document.getElementById('resetDataBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin menghapus seluruh data SakuQuest?')) {
        localStorage.removeItem('sakuquest_data');
        location.reload();
      }
    });
  }
}

// ==========================================
// 7. LOGIKA KALKULASI & STREAK AKURAT
// ==========================================
function calculateDailyBudget() {
  if (appData.allowance <= 0) return 0;
  
  const totalSpent = appData.expenses.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = appData.allowance - totalSpent;
  const dailyLimit = remainingBudget / appData.periodDays;

  return dailyLimit > 0 ? dailyLimit : 0;
}

function updateStreak() {
  const today = new Date().toLocaleDateString('id-ID');
  
  const todayExpenses = appData.expenses
    .filter(item => item.date === today)
    .reduce((sum, item) => sum + item.amount, 0);

  const dailyBudget = calculateDailyBudget();

  if (todayExpenses <= dailyBudget) {
    if (appData.lastStreakDate !== today) {
      appData.streakDays += 1;
      appData.lastStreakDate = today;
    }
  } else {
    appData.streakDays = 0;
    appData.lastStreakDate = today;
  }
}

// ==========================================
// 8. RENDER TAMPILAN (UI UPDATE)
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
// 9. UTILITY (EFEK KONFETI)
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
