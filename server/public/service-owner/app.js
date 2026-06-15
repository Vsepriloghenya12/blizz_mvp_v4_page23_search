const tokenKey = 'blizz_service_owner_token';
let state = { token: localStorage.getItem(tokenKey), section: 'overview', period: '7d' };

const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const panelError = document.getElementById('panelError');
const panelContent = document.getElementById('panelContent');
const sectionTitle = document.getElementById('sectionTitle');
const sectionSubtitle = document.getElementById('sectionSubtitle');
const periodSelect = document.getElementById('periodSelect');

const titles = {
  overview: ['Обзор приложения', 'Общие показатели платформы Близз.'],
  users: ['Пользователи', 'Аккаунты пользователей и сервисные роли.'],
  businesses: ['Бизнесы', 'Бизнес-аккаунты, витрина, жалобы и обращения.'],
  content: ['Контент', 'Посты, видео, Близзы, предложения и ограниченный контент.'],
  reports: ['Жалобы', 'Глобальная очередь жалоб и статусов модерации.'],
  metrics: ['Метрики', 'Событийная аналитика приложения без финансовых показателей.']
};

function showError(target, message) {
  target.textContent = message;
  target.hidden = false;
}

function clearError(target) {
  target.textContent = '';
  target.hidden = true;
}

async function api(path, options = {}) {
  const headers = { Accept: 'application/json' };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json && json.error ? json.error.message : 'Ошибка запроса');
  }
  return json;
}

function setAuthenticated(isAuth) {
  loginView.hidden = isAuth;
  dashboardView.hidden = !isAuth;
}

function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(Number(value || 0));
}

function stat(title, value, caption = '') {
  return `<article class="card"><div class="card-title">${title}</div><div class="card-value">${formatNumber(value)}</div>${caption ? `<div class="card-caption">${caption}</div>` : ''}</article>`;
}

function badge(value) {
  const safe = String(value || 'active');
  const cls = safe.includes('new') ? 'warning' : safe.includes('resolved') || safe.includes('active') ? 'success' : safe.includes('rejected') || safe.includes('restricted') ? 'danger' : '';
  return `<span class="badge ${cls}">${safe}</span>`;
}

function renderTable(headers, rows) {
  if (!rows.length) return '<div class="card">Нет данных</div>';
  return `<div class="card"><table class="table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function renderOverview(data) {
  panelContent.innerHTML = `
    <div class="grid">
      ${stat('Пользователи', data.users.total, `Новые: ${formatNumber(data.users.new)}`)}
      ${stat('Активные пользователи', data.users.active, 'по сессиям за период')}
      ${stat('Бизнесы', data.business.total, `Новые: ${formatNumber(data.business.new)}`)}
      ${stat('Жалобы', data.moderation.total, `Новые: ${formatNumber(data.moderation.byStatus.new)}`)}
      ${stat('Посты', data.content.posts)}
      ${stat('Видео', data.content.videos)}
      ${stat('Близзы', data.content.stories)}
      ${stat('Предложения', data.content.offers, `Активные: ${formatNumber(data.business.activeOffers)}`)}
      ${stat('Сообщения', data.content.messages)}
      ${stat('Маршруты', data.activity.routeClicks)}
      ${stat('Сохранения', data.activity.saves)}
      ${stat('Поиск', data.activity.searches)}
    </div>
    <section class="card section-card">
      <h2>Модерация</h2>
      <div class="grid">
        ${stat('Новые', data.moderation.byStatus.new)}
        ${stat('На проверке', data.moderation.byStatus.reviewing)}
        ${stat('Решённые', data.moderation.byStatus.resolved)}
        ${stat('Отклонённые', data.moderation.byStatus.rejected)}
      </div>
    </section>`;
}

async function renderUsers() {
  const query = document.getElementById('queryInput')?.value || '';
  const data = await api(`/api/service-owner/users?query=${encodeURIComponent(query)}`);
  panelContent.innerHTML = `<div class="search-row"><input id="queryInput" placeholder="Поиск по email, телефону, id или статусу" value="${query}" /><button id="queryButton" class="secondary-button">Найти</button></div>` +
    renderTable(['Логин', 'Статус', 'Аккаунты', 'Бизнесы', 'Сессии'], data.items.map((item) => `<tr><td>${item.login}</td><td>${badge(item.status)}</td><td>${item.accountsCount}</td><td>${item.businessAccountsCount}</td><td>${item.sessionsCount}</td></tr>`));
  document.getElementById('queryButton').onclick = renderUsers;
}

async function renderBusinesses() {
  const query = document.getElementById('queryInput')?.value || '';
  const data = await api(`/api/service-owner/businesses?query=${encodeURIComponent(query)}`);
  panelContent.innerHTML = `<div class="search-row"><input id="queryInput" placeholder="Поиск по бизнесу, категории или адресу" value="${query}" /><button id="queryButton" class="secondary-button">Найти</button></div>` +
    renderTable(['Бизнес', 'Категория', 'Статус', 'Предложения', 'Жалобы', 'Чаты'], data.items.map((item) => `<tr><td><b>${item.name}</b><br><span class="card-caption">@${item.username}</span></td><td>${item.category || '—'}</td><td>${badge(item.status)}</td><td>${item.activeOffers}/${item.offersTotal}</td><td>${item.reportsTotal}</td><td>${item.conversationsTotal}</td></tr>`));
  document.getElementById('queryButton').onclick = renderBusinesses;
}

function renderContent(data) {
  panelContent.innerHTML = `
    <div class="grid">
      ${stat('Посты', data.summary.posts, `Новые: ${formatNumber(data.summary.newPosts)}`)}
      ${stat('Видео', data.summary.videos, `Новые: ${formatNumber(data.summary.newVideos)}`)}
      ${stat('Близзы', data.summary.stories, `Новые: ${formatNumber(data.summary.newStories)}`)}
      ${stat('Предложения', data.summary.offers, `Активные: ${formatNumber(data.summary.activeOffers)}`)}
    </div>
    ${renderTable(['Тип', 'Название', 'Статус', 'Аккаунт'], data.recent.map((item) => `<tr><td>${item.type}</td><td>${item.title}</td><td>${badge(item.status)}</td><td>${item.accountId || '—'}</td></tr>`))}`;
}

function renderReports(data) {
  panelContent.innerHTML = `
    <div class="grid">
      ${stat('Всего жалоб', data.summary.total)}
      ${stat('Новые', data.summary.byStatus.new)}
      ${stat('На проверке', data.summary.byStatus.reviewing)}
      ${stat('Решённые', data.summary.byStatus.resolved)}
    </div>
    ${renderTable(['Объект', 'Причина', 'Статус', 'Автор', 'Описание'], data.items.map((item) => `<tr><td>${item.targetType}<br><span class="card-caption">${item.targetTitle || item.targetId}</span></td><td>${item.reason}</td><td>${badge(item.moderationStatus)}</td><td>${item.reporterAccountId || '—'}</td><td>${item.comment || '—'}</td></tr>`))}`;
}

function renderMetrics(data) {
  const byType = data.events.byType || {};
  const rows = Object.keys(byType).sort().map((key) => `<tr><td>${key}</td><td>${formatNumber(byType[key])}</td></tr>`);
  panelContent.innerHTML = `
    <div class="grid">
      ${stat('События', data.events.total)}
      ${stat('Новые пользователи', data.registrations.users)}
      ${stat('Новые бизнесы', data.registrations.businesses)}
      ${stat('Топ бизнесов', data.topBusinessByOffers.length)}
    </div>
    ${renderTable(['Событие', 'Количество'], rows)}
    ${renderTable(['Бизнес', 'Предложения', 'Жалобы', 'Чаты'], data.topBusinessByOffers.map((item) => `<tr><td>${item.account ? item.account.name : '—'}</td><td>${item.offers}</td><td>${item.reports}</td><td>${item.messages}</td></tr>`))}`;
}

async function loadSection() {
  clearError(panelError);
  const [title, subtitle] = titles[state.section];
  sectionTitle.textContent = title;
  sectionSubtitle.textContent = subtitle;
  document.querySelectorAll('.nav-button').forEach((btn) => btn.classList.toggle('active', btn.dataset.section === state.section));
  periodSelect.disabled = state.section === 'users' || state.section === 'businesses' || state.section === 'reports';
  panelContent.innerHTML = '<div class="card">Загрузка...</div>';
  try {
    if (state.section === 'overview') return renderOverview(await api(`/api/service-owner/overview?period=${state.period}`));
    if (state.section === 'users') return renderUsers();
    if (state.section === 'businesses') return renderBusinesses();
    if (state.section === 'content') return renderContent(await api(`/api/service-owner/content?period=${state.period}`));
    if (state.section === 'reports') return renderReports(await api('/api/service-owner/reports'));
    if (state.section === 'metrics') return renderMetrics(await api(`/api/service-owner/metrics?period=${state.period}`));
  } catch (error) {
    showError(panelError, error.message);
    if (String(error.message).includes('Сессия') || String(error.message).includes('доступ')) {
      localStorage.removeItem(tokenKey);
      state.token = null;
      setAuthenticated(false);
    }
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError(loginError);
  try {
    const login = document.getElementById('loginInput').value;
    const password = document.getElementById('passwordInput').value;
    const response = await api('/api/service-owner/login', { method: 'POST', body: { login, password } });
    state.token = response.session.token;
    localStorage.setItem(tokenKey, state.token);
    setAuthenticated(true);
    loadSection();
  } catch (error) {
    showError(loginError, error.message);
  }
});

document.getElementById('logoutButton').addEventListener('click', async () => {
  try { await api('/api/service-owner/logout', { method: 'POST' }); } catch (_error) {}
  localStorage.removeItem(tokenKey);
  state.token = null;
  setAuthenticated(false);
});

document.querySelectorAll('.nav-button').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.section = btn.dataset.section;
    loadSection();
  });
});

periodSelect.addEventListener('change', () => {
  state.period = periodSelect.value;
  loadSection();
});
document.getElementById('refreshButton').addEventListener('click', loadSection);

(async function boot() {
  if (!state.token) {
    setAuthenticated(false);
    return;
  }
  try {
    await api('/api/service-owner/me');
    setAuthenticated(true);
    loadSection();
  } catch (_error) {
    localStorage.removeItem(tokenKey);
    state.token = null;
    setAuthenticated(false);
  }
})();
