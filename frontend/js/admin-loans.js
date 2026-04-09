requireAuth();

document.addEventListener('DOMContentLoaded', () => {
    loadLoans();
    loadStats();
});

async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/loans?limit=1`, { headers: authHeaders() });
        const total = (await res.json()).pagination.total;
        document.getElementById('stat-total').innerText = total;
    } catch { /* silent */ }
}

async function loadLoans(page = 1) {
    const name = document.getElementById('filter-name').value;
    const item = document.getElementById('filter-item').value;

    let url = `${API_URL}/loans?page=${page}&limit=12`;
    if (name) url += `&borrower_name=${encodeURIComponent(name)}`;
    if (item) url += `&item_name=${encodeURIComponent(item)}`;

    try {
        const res    = await fetch(url, { headers: authHeaders() });
        const result = await res.json();
        const list   = document.getElementById('loans-list');
        list.innerHTML = '';

        if (!result.data || result.data.length === 0) {
            list.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon"><i class="fas fa-clipboard-list"></i></div><p>Nenhuma retirada encontrada.</p></div></td></tr>';
            return;
        }

        result.data.forEach(loan => {
            const date = new Date(loan.withdrawn_at).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            list.innerHTML += `
                <tr>
                    <td><strong>${escHtml(loan.item_name)}</strong><br><small style="color:var(--text-muted)">${escHtml(loan.location)}</small></td>
                    <td>${escHtml(loan.borrower_name)}</td>
                    <td><code style="font-size:.82rem; background:var(--bg); padding:2px 6px; border-radius:4px;">${escHtml(loan.borrower_nif)}</code></td>
                    <td style="font-size:.85rem;">${date}</td>
                    <td style="text-align:center;">${loan.quantity_withdrawn}</td>
                </tr>
            `;
        });

        renderPagination('loans-pagination', result.pagination, loadLoans);
    } catch {
        toast('Erro ao carregar retiradas', 'error');
    }
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
