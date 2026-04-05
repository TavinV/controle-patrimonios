requireAuth();

let currentPage = 1;
let deleteTargetId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    loadStats();
    document.getElementById('add-item-form').addEventListener('submit', handleAddItem);
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
    document.getElementById('edit-item-form').addEventListener('submit', handleEditItem);
});

function togglePanel() {
    document.getElementById('add-panel').classList.toggle('open');
}

async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/items?limit=1`, { headers: authHeaders() });
        const data = await res.json();
        const total = data.pagination.total;

        // Full load to calc available/lent
        const fullRes = await fetch(`${API_URL}/items?limit=1000`, { headers: authHeaders() });
        const fullData = await fullRes.json();
        const items = fullData.data;

        const totalQty = items.reduce((s, i) => s + i.quantity_total, 0);
        const availQty = items.reduce((s, i) => s + i.quantity_available, 0);

        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-available').innerText = availQty;
        document.getElementById('stat-lent').innerText = totalQty - availQty;
    } catch { /* silent */ }
}

async function loadItems(page = 1) {
    currentPage = page;
    const name = document.getElementById('filter-name').value;
    const location = document.getElementById('filter-location').value;

    let url = `${API_URL}/items?page=${page}&limit=10`;
    if (name) url += `&name=${encodeURIComponent(name)}`;
    if (location) url += `&location=${encodeURIComponent(location)}`;

    try {
        const res = await fetch(url, { headers: authHeaders() });
        const result = await res.json();

        const list = document.getElementById('items-list');
        list.innerHTML = '';

        if (result.data.length === 0) {
            list.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🗃️</div><p>Nenhum item encontrado.</p></div></td></tr>';
            return;
        }

        result.data.forEach(item => {
            const available = item.quantity_available;
            const pct = Math.round((available / item.quantity_total) * 100);
            const badgeClass = available === 0 ? 'badge-open' : (available === item.quantity_total ? 'badge-closed' : 'badge-warning');
            const badgeText = available === 0 ? 'Sem estoque' : (available === item.quantity_total ? 'Disponível' : 'Parcial');

            list.innerHTML += `
                <tr>
                    <td><strong>${escHtml(item.name)}</strong></td>
                    <td>${escHtml(item.location)}</td>
                    <td>${item.quantity_total}</td>
                    <td>${available}</td>
                    <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                    <td>
                        <button class="btn btn-ghost btn-sm" onclick="openEditModal(${item.id}, '${escHtml(item.name).replace(/'/g, "\\'")}', '${escHtml(item.location).replace(/'/g, "\\'")}', ${item.quantity_total})">
                            <i class="fas fa-pen"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${item.id}, '${escHtml(item.name).replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </td>
                </tr>
            `;
        });

        renderPagination('items-pagination', result.pagination, loadItems);
    } catch {
        toast('Erro ao carregar inventário', 'error');
    }
}

async function handleAddItem(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.innerText = 'Adicionando...';

    const body = {
        name: document.getElementById('item-name').value.trim(),
        location: document.getElementById('item-location').value.trim(),
        quantity_total: parseInt(document.getElementById('item-quantity').value)
    };

    try {
        const res = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body)
        });
        if (res.ok) {
            toast('Item adicionado com sucesso!', 'success');
            e.target.reset();
            togglePanel();
            loadItems(1);
            loadStats();
        } else {
            const data = await res.json();
            toast(data.error || 'Erro ao adicionar item', 'error');
        }
    } catch {
        toast('Erro de conexão', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = '✔ Adicionar';
    }
}

function openDeleteModal(id, name) {
    deleteTargetId = id;
    document.getElementById('delete-item-name').innerText = name;
    document.getElementById('delete-modal').style.display = 'flex';
}

async function confirmDelete() {
    const btn = document.getElementById('confirm-delete-btn');
    btn.disabled = true;
    btn.innerText = 'Excluindo...';

    try {
        const res = await fetch(`${API_URL}/items/${deleteTargetId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        document.getElementById('delete-modal').style.display = 'none';

        if (res.ok) {
            toast('Item excluído', 'success');
            loadItems(currentPage);
            loadStats();
        } else {
            const data = await res.json();
            toast(data.error || 'Erro ao excluir item', 'error');
        }
    } catch {
        toast('Erro ao excluir', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Excluir';
        deleteTargetId = null;
    }
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function openEditModal(id, name, location, quantityTotal) {
    document.getElementById('edit-item-id').value = id;
    document.getElementById('edit-item-name').value = name;
    document.getElementById('edit-item-location').value = location;
    document.getElementById('edit-item-quantity').value = quantityTotal;
    document.getElementById('edit-modal').style.display = 'flex';
}

async function handleEditItem(e) {
    e.preventDefault();
    const btn = document.getElementById('edit-save-btn');
    btn.disabled = true;

    const id = document.getElementById('edit-item-id').value;
    const body = {
        name: document.getElementById('edit-item-name').value.trim(),
        location: document.getElementById('edit-item-location').value.trim(),
        quantity_total: parseInt(document.getElementById('edit-item-quantity').value)
    };

    try {
        const res = await fetch(`${API_URL}/items/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(body)
        });
        document.getElementById('edit-modal').style.display = 'none';
        if (res.ok) {
            toast('Item atualizado com sucesso!', 'success');
            loadItems(currentPage);
            loadStats();
        } else {
            const data = await res.json();
            toast(data.error || 'Erro ao atualizar item', 'error');
        }
    } catch {
        toast('Erro de conexão', 'error');
    } finally {
        btn.disabled = false;
    }
}
