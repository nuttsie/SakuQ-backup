// ==========================================
// 1. STATE APLIKASI & KONFIGURASI
// ==========================================
let appData = {
  allowance: 0,
  periodDays: 7,
  autoSavePercent: 10,
  targetName: '',
  targetAmount: 0,
  savingsTotal: 0,
  expenses: [],
  streakDays: 0,
  lastStreakDate: null,
  isCelebrated: false // Penanda agar efek 100% hanya meledak sekali per target
};

// Konfigurasi Lencana (Badges)
const BADGES = [
  { id: 'first_save', name: 'Nabung Perdana', icon: '🌱', reqStreak: 0 },
  { id: 'streak_3', name: 'Hemat 3 Hari', icon: '⚡', reqStreak: 3 },
  { id: 'streak_7', name: 'Master 7 Hari', icon: '👑', reqStreak: 7 }
];

// ==========================================
// 2. INISIALISASI SAAT HALAMAN DIMUAT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadData();
  initPWA();
  registerEvents();
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
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('sakuquest_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }

  // B. Langkah 1: Form Target Impian
  const targetForm = document.getElementById('targetForm');
  if (targetForm) {
    targetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const targetName = document.getElementById('targetNameInput').value;
      const targetAmount = parseFloat(document.getElementById('targetAmountInput').value) || 0;

      appData.targetName = targetName;
      appData.targetAmount = targetAmount;
      appData.isCelebrated = false; // Reset penanda perayaan untuk target baru

      saveData();
      alert(`🎯 Target "${targetName}" berhasil dibuat! Sekarang atur uang sakumu di Langkah 2.`);
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

      // Logika Kalkulasi Auto-Save di Awal (Pay Yourself First)
      const autoSavedAmount = (allowance * autoSavePercent) / 100;
      
      appData.allowance = allowance - autoSavedAmount; // Sisa uang jajan murni
      appData.periodDays = periodDays;
      appData.autoSavePercent = autoSavePercent;
      appData.savingsTotal += autoSavedAmount; // Langsung dialokasikan ke brankas tabungan

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
function calculateDailyBudget
