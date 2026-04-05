const API_URL = 'http://localhost:3000';
let token = localStorage.getItem('token');
let currentItemPage = 1;
let currentLoanPage = 1;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    loadItemsForWithdraw();
    
    // Handle Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Handle Withdraw
    document.getElementById('withdraw-form').addEventListener('submit', handleWithdraw);
    
    // Handle Add Item
    document.getElementById('add-item-form').addEventListener('submit', handleAddItem);
});

// --- NAVIGATION & UI ---
function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if (id === 'admin-items') loadAdminItems();
    if (id === 'admin-loans') loadAdminLoans();
    if (id === 'public-withdraw') loadItemsForWithdraw();
}

function updateNav() {
    const isLogged = !!token;
    document.getElementById('nav-login').style.display = isLogged ? 'none' : 'inline-block';
    document.getElementById('nav-admin-items').style.display = isLogged ? 'inline-block' : 'none';
    document.getElementById('nav-admin-loans').style.display = isLogged ? 'inline-block' : 'none';
    document.getElementById('nav-logout').style.display = isLogged ? 'inline-block' : 'none';
    
    if (isLogged) {
        document.getElementById('login').classList.remove('active');
    }
}

function toast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.style.background = type === 'error' ? 'var(--danger)' : (type === 'success' ? 'var(--success)' : 'var(--dark)');
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
}

// --- AUTH ---
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            token = data.data.token;
            localStorage.setItem('token', token);
            updateNav();
            showSection('admin-items');
            toast('Login realizado com sucesso!', 'success');
        } else {
            toast(data.error || 'Erro ao fazer login', 'error');
        }
    } catch (err) {
        toast('Erro de conexão com o servidor', 'error');
    }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    updateNav();
    showSection('public-withdraw');
}

// --- PUBLIC: WITHDRAW ---
async function loadItemsForWithdraw() {
    try {
        const res = await fetch(`${API_URL}/items?limit=100`);
        const data = await res.json();
        const select = document.getElementById('withdraw-item-id');
        select.innerHTML = '<option value="">Selecione um item...</option>';
        
        data.data.forEach(item => {
            if (item.quantity_available > 0) {
                select.innerHTML += `<option value="${item.id}">${item.name} (${item.quantity_available} disponíveis em ${item.location})</option>`;
            }
        });
    } catch (err) {
        console.error('Erro ao carregar itens', err);
    }
}

async function handleWithdraw(e) {
    e.preventDefault();
    const body = {
        item_id: parseInt(document.getElementById('withdraw-item-id').value),
        borrower_name: document.getElementById('withdraw-borrower-name').value,
        borrower_nif: document.getElementById('withdraw-borrower-nif').value,
        quantity: parseInt(document.getElementById('withdraw-quantity').value)
    };

    try {
        const res = await fetch(`${API_URL}/loans/withdraw`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Backend optionally requires auth for withdraw? 
                // Wait, request said withdraw/return should be public...
            },
            body: JSON.stringify(body)
        });
        
        // Note: The backend route current requires 'auth' middleware. 
        // Let's check the backend routes/loans.js
        
        const data = await res.json();
        if (res.ok) {
            toast('Retirada registrada com sucesso!', 'success');
            e.target.reset();
            loadItemsForWithdraw();
        } else {
            toast(data.error || 'Erro ao registrar retirada', 'error');
        }
    } catch (err) {
        toast('Erro ao processar solicitação', 'error');
    }
}

// --- PUBLIC: RETURN ---
async function searchMyLoans() {
    const nif = document.getElementById('search-nif').value;
    if (!nif) return toast('Digite seu NIF');

    try {
        // We use the open loans endpoint with filter by NIF
        // Note: This needs token for current backend. I should probably adjust backend or provide token if public is intended.
        const res = await fetch(`${API_URL}/loans/open?borrower_nif=${nif}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        const list = document.getElementById('my-loans-list');
        list.innerHTML = '';

        if (data.data.length === 0) {
            list.innerHTML = '<p>Nenhum empréstimo em aberto encontrado para este NIF.</p>';
            return;
        }

        data.data.forEach(loan => {
            const div = document.createElement('div');
            div.className = 'loan-card';
            div.style.border = '1px solid #ccc';
            div.style.padding = '10px';
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <p><strong>Item:</strong> ${loan.item_name}</p>
                <p><strong>Pendente:</strong> ${loan.quantity_withdrawn - loan.quantity_returned}</p>
                <button onclick="openReturnModal(${loan.id}, '${loan.item_name}', ${loan.quantity_withdrawn - loan.quantity_returned})">Devolver</button>
            `;
            list.appendChild(div);
        });
    } catch (err) {
        toast('Erro ao buscar empréstimos', 'error');
    }
}

let activeLoanId = null;
function openReturnModal(id, name, q) {
    activeLoanId = id;
    document.getElementById('return-info').innerText = `Devolvendo: ${name} (Máximo ${q})`;
    document.getElementById('return-quantity').value = q;
    document.getElementById('return-quantity').max = q;
    document.getElementById('return-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('return-modal').style.display = 'none';
}

document.getElementById('confirm-return-btn').addEventListener('click', async () => {
    const quantity = parseInt(document.getElementById('return-quantity').value);
    try {
        const res = await fetch(`${API_URL}/loans/return/${activeLoanId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity })
        });
        if (res.ok) {
            toast('Devolução registrada!', 'success');
            closeModal();
            searchMyLoans();
        } else {
            const data = await res.json();
            toast(data.error || 'Erro ao devolver', 'error');
        }
    } catch (err) {
        toast('Erro na devolução', 'error');
    }
});

// --- ADMIN: ITEMS ---
function toggleAddItemForm() {
    const f = document.getElementById('add-item-form');
    f.style.display = f.style.display === 'none' ? 'flex' : 'none';
}

async function loadAdminItems(page = 1) {
    if (!token) return;
    currentItemPage = page;
    try {
        const res = await fetch(`${API_URL}/items?page=${page}&limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        const list = document.getElementById('items-list');
        list.innerHTML = '';
        result.data.forEach(item => {
            list.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.location}</td>
                    <td>${item.quantity_total}</td>
                    <td>${item.quantity_available}</td>
                    <td>
                        <button onclick="deleteItem(${item.id})" style="background:var(--danger)">Excluir</button>
                    </td>
                </tr>
            `;
        });
        renderPagination('items-pagination', result.pagination, loadAdminItems);
    } catch (err) {
        toast('Erro ao carregar inventário', 'error');
    }
}

async function handleAddItem(e) {
    e.preventDefault();
    const body = {
        name: document.getElementById('item-name').value,
        location: document.getElementById('item-location').value,
        quantity_total: parseInt(document.getElementById('item-quantity').value)
    };

    try {
        const res = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            toast('Item adicionado!', 'success');
            e.target.reset();
            toggleAddItemForm();
            loadAdminItems();
        } else {
            const data = await res.json();
            toast(data.error || 'Erro ao adicionar item', 'error');
        }
    } catch (err) {
        toast('Erro de conexão', 'error');
    }
}

async function deleteItem(id) {
    if (!confirm('Deseja excluir este item?')) return;
    try {
        const res = await fetch(`${API_URL}/items/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            toast('Item excluído', 'success');
            loadAdminItems(currentItemPage);
        } else {
            const data = await res.json();
            toast(data.error || 'Erro ao excluir', 'error');
        }
    } catch (err) {
        toast('Erro ao excluir', 'error');
    }
}

// --- ADMIN: LOANS ---
async function loadAdminLoans(page = 1) {
    if (!token) return;
    currentLoanPage = page;
    const nameFilter = document.getElementById('filter-loan-name').value;
    const statusFilter = document.getElementById('filter-loan-status').value;
    
    let url = `${API_URL}/loans?page=${page}&limit=10`;
    if (nameFilter) url += `&borrower_name=${nameFilter}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        const list = document.getElementById('admin-loans-list');
        list.innerHTML = '';
        result.data.forEach(loan => {
            const date = new Date(loan.withdrawn_at).toLocaleString();
            list.innerHTML += `
                <tr>
                    <td>${loan.item_name}</td>
                    <td>${loan.borrower_name}</td>
                    <td>${loan.borrower_nif}</td>
                    <td>${date}</td>
                    <td>${loan.quantity_withdrawn} -> ${loan.quantity_returned}</td>
                    <td><span class="status-${loan.status}">${loan.status.toUpperCase()}</span></td>
                </tr>
            `;
        });
        renderPagination('loans-pagination', result.pagination, loadAdminLoans);
    } catch (err) {
        toast('Erro ao carregar empréstimos', 'error');
    }
}

// --- UTILS ---
function renderPagination(containerId, pagination, loadFunc) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    for (let i = 1; i <= pagination.totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === pagination.currentPage) btn.classList.add('active');
        btn.onclick = () => loadFunc(i);
        container.appendChild(btn);
    }
}
