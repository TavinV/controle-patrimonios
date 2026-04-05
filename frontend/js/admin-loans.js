requireAuth();

document.addEventListener('DOMContentLoaded', () => {
    loadLoans();
    loadStats();
});

async function loadStats() {
    try {
        const [totalRes, openRes] = await Promise.all([
            fetch(`${API_URL}/loans?limit=1`, { headers: authHeaders() }),
            fetch(`${API_URL}/loans/open?limit=1`, { headers: authHeaders() })
        ]);
        const total = (await totalRes.json()).pagination.total;
        const open  = (await openRes.json()).pagination.total;

        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-open').innerText  = open;
        document.getElementById('stat-closed').innerText = total - open;
    } catch { /* silent */ }
}

async function loadLoans(page = 1) {
    const name   = document.getElementById('filter-name').value;
    const item   = document.getElementById('filter-item').value;
    const status = document.getElementById('filter-status').value;

    let url = `${API_URL}/loans?page=${page}&limit=12`;
    if (name)   url += `&borrower_name=${encodeURIComponent(name)}`;
    if (item)   url += `&item_name=${encodeURIComponent(item)}`;
    if (status) url += `&status=${status}`;

    try {
        const res    = await fetch(url, { headers: authHeaders() });
        const result = await res.json();
        const list   = document.getElementById('loans-list');
        list.innerHTML = '';

        if (!result.data || result.data.length === 0) {
            list.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📋</div><p>Nenhum empréstimo encontrado.</p></div></td></tr>';
            return;
        }

        result.data.forEach(loan => {
            const date = new Date(loan.withdrawn_at).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const badgeClass = loan.status === 'open' ? 'badge-open' : 'badge-closed';
            const badgeText  = loan.status === 'open' ? 'Em Aberto' : 'Encerrado';
            const pending    = loan.quantity_withdrawn - loan.quantity_returned;

            list.innerHTML += `
                <tr>
                    <td><strong>${escHtml(loan.item_name)}</strong><br><small style="color:var(--text-muted)">${escHtml(loan.location)}</small></td>
                    <td>${escHtml(loan.borrower_name)}</td>
                    <td><code style="font-size:.82rem; background:var(--bg); padding:2px 6px; border-radius:4px;">${escHtml(loan.borrower_nif)}</code></td>
                    <td style="font-size:.85rem;">${date}</td>
                    <td style="text-align:center;">${loan.quantity_withdrawn}</td>
                    <td style="text-align:center;">${loan.quantity_returned}${pending > 0 ? ` <small style="color:var(--danger)">(${pending} pend.)</small>` : ''}</td>
                    <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                </tr>
            `;
        });

        renderPagination('loans-pagination', result.pagination, loadLoans);
    } catch {
        toast('Erro ao carregar empréstimos', 'error');
    }
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
