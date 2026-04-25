const API_URL = 'http://localhost:3000';

function getToken() {
    return localStorage.getItem('token');
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

function authHeadersForFormData() {
    return {
        'Authorization': `Bearer ${getToken()}`
    };
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = '../login.html';
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
}

function toast(msg, type = 'info') {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.innerText = msg;
    const colors = { success: '#10B981', error: '#EF4444', info: '#2563EB' };
    t.style.background = colors[type] || colors.info;
    t.style.display = 'block';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.display = 'none'; }, 3000);
}

function renderPagination(containerId, pagination, loadFunc) {
    const container = document.getElementById(containerId);
    if (!container || !pagination) return;
    container.innerHTML = '';
    if (pagination.totalPages <= 1) return;

    for (let i = 1; i <= pagination.totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === pagination.currentPage) btn.classList.add('active');
        btn.onclick = () => loadFunc(i);
        container.appendChild(btn);
    }
}
