requireAuth();

let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadPeople();
    document.getElementById('add-person-form').addEventListener('submit', handleAddPerson);
    document.getElementById('edit-person-form').addEventListener('submit', handleEditPerson);
});

function togglePanel() {
    const panel = document.getElementById('add-panel');
    panel.classList.toggle('open');
}

async function loadPeople(page = 1) {
    currentPage = page;
    const name = document.getElementById('filter-name').value;
    const nif  = document.getElementById('filter-nif').value;

    let url = `${API_URL}/people?page=${page}&limit=15`;
    if (name) url += `&name=${encodeURIComponent(name)}`;
    if (nif)  url += `&nif=${encodeURIComponent(nif)}`;

    try {
        const res    = await fetch(url, { headers: authHeaders() });
        const result = await res.json();
        const list   = document.getElementById('people-list');
        list.innerHTML = '';

        document.getElementById('stat-total').innerText = result.pagination?.total ?? '—';

        if (!result.data || result.data.length === 0) {
            list.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="empty-icon"><i class="fas fa-id-card"></i></div><p>Nenhuma pessoa encontrada.</p></div></td></tr>';
            return;
        }

        result.data.forEach(p => {
            const date = new Date(p.created_at).toLocaleDateString('pt-BR');
            list.innerHTML += `
                <tr>
                    <td><code style="font-size:.85rem; background:var(--bg); padding:2px 8px; border-radius:4px;">${escHtml(p.nif)}</code></td>
                    <td>${escHtml(p.name)}</td>
                    <td style="font-size:.85rem; color:var(--text-muted)">${date}</td>
                    <td>
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-ghost btn-sm" onclick="openEditModal(${p.id}, '${escHtml(p.nif)}', '${escHtml(p.name).replace(/'/g,'\\\'')}')" title="Editar"><i class="fas fa-pen"></i></button>
                            <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${p.id}, '${escHtml(p.name).replace(/'/g,'\\\'')}')" title="Remover"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });

        renderPagination('people-pagination', result.pagination, loadPeople);
    } catch {
        toast('Erro ao carregar pessoas', 'error');
    }
}

async function handleAddPerson(e) {
    e.preventDefault();
    const nif  = document.getElementById('person-nif').value.trim();
    const name = document.getElementById('person-name').value.trim();

    if (!/^\d{1,20}$/.test(nif)) {
        toast('NIF deve ter entre 1 e 20 dígitos numéricos', 'error');
        return;
    }

    try {
        const res  = await fetch(`${API_URL}/people`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ nif, name })
        });
        const data = await res.json();

        if (res.ok) {
            toast('Pessoa adicionada com sucesso', 'success');
            document.getElementById('add-person-form').reset();
            document.getElementById('add-panel').classList.remove('open');
            loadPeople(currentPage);
        } else {
            toast(data.error || 'Erro ao adicionar pessoa', 'error');
        }
    } catch {
        toast('Erro de conexão', 'error');
    }
}

function openEditModal(id, nif, name) {
    document.getElementById('edit-person-id').value   = id;
    document.getElementById('edit-person-nif').value  = nif;
    document.getElementById('edit-person-name').value = name;
    document.getElementById('edit-modal').style.display = 'flex';
}

async function handleEditPerson(e) {
    e.preventDefault();
    const id   = document.getElementById('edit-person-id').value;
    const nif  = document.getElementById('edit-person-nif').value.trim();
    const name = document.getElementById('edit-person-name').value.trim();

    if (!/^\d{1,20}$/.test(nif)) {
        toast('NIF deve ter entre 1 e 20 dígitos numéricos', 'error');
        return;
    }

    try {
        const res  = await fetch(`${API_URL}/people/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ nif, name })
        });
        const data = await res.json();

        if (res.ok) {
            toast('Pessoa atualizada', 'success');
            document.getElementById('edit-modal').style.display = 'none';
            loadPeople(currentPage);
        } else {
            toast(data.error || 'Erro ao atualizar', 'error');
        }
    } catch {
        toast('Erro de conexão', 'error');
    }
}

function openDeleteModal(id, name) {
    document.getElementById('delete-person-name').innerText = name;
    const btn = document.getElementById('confirm-delete-btn');
    btn.onclick = () => deletePerson(id);
    document.getElementById('delete-modal').style.display = 'flex';
}

async function deletePerson(id) {
    try {
        const res = await fetch(`${API_URL}/people/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        const data = await res.json();

        if (res.ok) {
            toast('Pessoa removida', 'success');
            document.getElementById('delete-modal').style.display = 'none';
            loadPeople(currentPage);
        } else {
            toast(data.error || 'Erro ao remover', 'error');
        }
    } catch {
        toast('Erro de conexão', 'error');
    }
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
