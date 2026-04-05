let activeLoanId = null;
let activeMaxQty = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-nif').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchLoans();
    });
});

async function searchLoans() {
    const nif = document.getElementById('search-nif').value.trim();
    if (!/^\d{9}$/.test(nif)) {
        toast('NIF deve conter exatamente 9 dígitos numéricos', 'error');
        return;
    }

    const btn = document.getElementById('search-btn');
    btn.disabled = true;
    btn.innerText = 'Buscando...';

    try {
        const res = await fetch(`${API_URL}/loans/open?borrower_nif=${nif}&limit=50`);
        const data = await res.json();

        const area = document.getElementById('results-area');
        area.innerHTML = '';

        if (!data.data || data.data.length === 0) {
            area.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>Nenhum empréstimo em aberto encontrado para o NIF <strong>${nif}</strong>.</p>
                </div>`;
            return;
        }

        const heading = document.createElement('p');
        heading.style.cssText = 'font-size:.85rem; color:var(--text-muted); margin-bottom:14px;';
        heading.innerText = `${data.data.length} empréstimo(s) em aberto para NIF ${nif}`;
        area.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'loan-cards-grid';

        data.data.forEach(loan => {
            const pending = loan.quantity_withdrawn - loan.quantity_returned;
            const card = document.createElement('div');
            card.className = 'loan-card-item';
            card.innerHTML = `
                <h4>${loan.item_name}</h4>
                <p class="loan-card-meta">📍 ${loan.location}</p>
                <p class="loan-card-meta">📅 Retirado em: ${new Date(loan.withdrawn_at).toLocaleDateString('pt-BR')}</p>
                <p class="loan-card-meta">📦 Retirado: ${loan.quantity_withdrawn} &emsp; Devolvido: ${loan.quantity_returned}</p>
                <p style="margin-top:8px; font-size:.85rem; font-weight:700; color:var(--danger);">Pendente: ${pending}</p>
                <div class="loan-card-footer">
                    <button class="btn btn-success btn-sm" onclick="openModal(${loan.id}, '${loan.item_name}', ${pending})">
                        📥 Devolver
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

        area.appendChild(grid);
    } catch {
        toast('Erro ao buscar empréstimos', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Buscar';
    }
}

function openModal(loanId, itemName, maxQty) {
    activeLoanId = loanId;
    activeMaxQty = maxQty;
    document.getElementById('modal-info').innerText = `Item: ${itemName} — Pendente: ${maxQty}`;
    const qtyInput = document.getElementById('modal-quantity');
    qtyInput.value = maxQty;
    qtyInput.max = maxQty;
    document.getElementById('return-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('return-modal').style.display = 'none';
    activeLoanId = null;
}

async function confirmReturn() {
    const quantity = parseInt(document.getElementById('modal-quantity').value);
    if (!quantity || quantity < 1 || quantity > activeMaxQty) {
        toast(`Quantidade deve ser entre 1 e ${activeMaxQty}`, 'error');
        return;
    }

    const btn = document.getElementById('confirm-btn');
    btn.disabled = true;
    btn.innerText = 'Registrando...';

    try {
        const res = await fetch(`${API_URL}/loans/return/${activeLoanId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity })
        });

        if (res.ok) {
            toast('Devolução registrada com sucesso!', 'success');
            closeModal();
            // Re-search to refresh cards
            searchLoans();
        } else {
            const data = await res.json();
            toast(data.error || 'Erro ao registrar devolução', 'error');
        }
    } catch {
        toast('Erro de conexão', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = '✅ Confirmar';
    }
}
