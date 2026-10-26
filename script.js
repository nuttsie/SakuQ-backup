// State Aplikasi
let appData = {
  allowance: 0,
  periodDays: 7,
  autoSavePercent: 10,
  targetName: '',
  targetAmount: 0,
  savingsTotal: 0,
  expenses: [],
  streakDays: 0,
  lastStreakDate: null
};

// Lencana (Badges) Config
const BADGES = [
  { id: 'first_save', name: 'Nabung Perdana', icon: '🌱', reqStreak: 0 },
  { id: 'streak_3', name: 'Hemat 3 Hari', icon: '⚡', reqStreak: 3 },
  { id: 'streak_7', name: 'Master 7 Hari', icon: '👑', reqStreak: 7 }
];

// Inisialisasi Aplikasi Saat Diumuat
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initPWA();
  registerEvents();
  render();
});

// Load Data dari LocalStorage
function loadData() {
  const saved = localStorage.getItem('sakuquest_data');
  if (saved) {
    appData = { ...appData, ...JSON.parse(saved) };
  }
}

// Simpan Data ke LocalStorage
function saveData() {
  localStorage.setItem('sakuquest_data', JSON.stringify(appData));
  render();
}

// Event Listeners
function registerEvents() {
  // Form Setup
  document.getElementById('setupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const allowance = parseFloat(document.getElementById('allowanceInput').value) || 0;
    const periodDays = parseInt(document.getElementById('periodSelect').value) || 7;
    const autoSavePercent = parseFloat(document.getElementById('autoSavePercent').value) || 0;
    const targetName = document.getElementById('targetNameInput').value;
    const targetAmount = parseFloat(document.getElementById('targetAmountInput').value) || 0;

    // Kalkulasi Auto-Save awal
    const autoSavedAmount = (allowance * autoSavePercent) / 100;
    
    appData.allowance = allowance - autoSavedAmount; // Sisa uang jajan murni
    appData.periodDays = periodDays;
    appData.autoSavePercent = autoSavePercent;
    appData.targetName = targetName;
    appData.targetAmount = targetAmount;
    appData.savingsTotal += autoSavedAmount; // Otomatis masuk tabungan

    document.getElementById('setupDetails').open = false;
    saveData();
    alert(`Pengaturan disimpan! Rp ${autoSavedAmount.toLocaleString('id-ID')} berhasil dipindahkan ke Tabungan.`);
  });

  // Form Pengeluaran
  document.getElementById('expenseForm').addEventListener('submit', (e) => {
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

  // Reset Data
  document.getElementById('resetDataBtn').addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh data?')) {
      localStorage.removeItem('sakuquest_data');
      location.reload();
    }
  });

  // Status Online/Offline Detector
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

// Kalkulasi Sisa Uang Jajan Harian
function calculateDailyBudget() {
  if (appData.allowance <= 0) return 0;
  
  const totalSpent = appData.expenses.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = appData.allowance - totalSpent;
  const dailyLimit = remainingBudget / appData.periodDays;

  return dailyLimit > 0 ? dailyLimit : 0;
}

// Logika Perkembangan Streak
function updateStreak() {
  const today = new Date().toDateString();
  if (appData.lastStreakDate !== today) {
    appData.streakDays += 1;
    appData.lastStreakDate = today;
  }
}

// Render Antarmuka (UI)
function render() {
  // Render Ringkasan
  const dailyBudget = calculateDailyBudget();
  document.getElementById('dailyBudgetDisplay').textContent = `Rp ${Math.round(dailyBudget).toLocaleString('id-ID')}`;
  document.getElementById('totalSavingsDisplay').textContent = `Rp ${appData.savingsTotal.toLocaleString('id-ID')}`;
  document.getElementById('streakCount').textContent = appData.streakDays;

  // Render Target Progress
  document.getElementById('targetNameDisplay').textContent = appData.targetName || 'Belum Ada Target';
  let progressPercent = 0;
  if (appData.targetAmount > 0) {
    progressPercent = Math.min(100, Math.round((appData.savingsTotal / appData.targetAmount) * 100));
  }
  document.getElementById('targetProgressPercent').textContent = `${progressPercent}%`;
  document.getElementById('targetProgressBar').style.width = `${progressPercent}%`;

  // Render Badges
  const badgesContainer = document.getElementById('badgesContainer');
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

  // Render Riwayat
  const historyList = document.getElementById('historyList');
  if (appData.expenses.length === 0) {
    historyList.innerHTML = '<li class="empty-msg">Belum ada pengeluaran dicatat.</li>';
  } else {
    historyList.innerHTML = appData.expenses.map(item => `
      <li class="history-item">
        <span>${item.title} <small style="color:#94a3b8">(${item.date})</small></span>
        <strong style="color:#ef4444">- Rp ${item.amount.toLocaleString('id-ID')}</strong>
      </li>
    `).join('');
  }
}

// Inisialisasi Fitur Offline PWA
function initPWA() {
  updateOnlineStatus();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Reg Failed', err));
  }
}

function updateOnlineStatus() {
  const notice = document.getElementById('offlineNotice');
  if (!navigator.onLine) {
    notice.classList.remove('hidden');
  } else {
    notice.classList.add('hidden');
  }
}
