document.addEventListener('DOMContentLoaded', () => {
    loadAvailableItems();
    document.getElementById('withdraw-form').addEventListener('submit', handleWithdraw);
});

async function loadAvailableItems() {
    try {
        const res = await fetch(`${API_URL}/items?limit=100`);
        const data = await res.json();
        const select = document.getElementById('item-id');

        const available = data.data.filter(i => i.quantity_available > 0);
        if (available.length === 0) {
            select.innerHTML = '<option value="">Nenhum item disponível no momento</option>';
            return;
        }

        select.innerHTML = '<option value="">Selecione um item...</option>';
        available.forEach(item => {
            select.innerHTML += `<option value="${item.id}">${item.name} — ${item.location} (${item.quantity_available} disponíveis)</option>`;
        });
    } catch {
        toast('Erro ao carregar lista de itens', 'error');
    }
}

async function handleWithdraw(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerText = 'Registrando...';

    const nif = document.getElementById('borrower-nif').value;
    if (!/^\d{9}$/.test(nif)) {
        toast('NIF deve conter exatamente 9 dígitos numéricos', 'error');
        btn.disabled = false;
        btn.innerText = '📤 Registrar Retirada';
        return;
    }

    const body = {
        item_id: parseInt(document.getElementById('item-id').value),
        borrower_name: document.getElementById('borrower-name').value.trim(),
        borrower_nif: nif,
        quantity: parseInt(document.getElementById('quantity').value)
    };

    try {
        const res = await fetch(`${API_URL}/loans/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (res.ok) {
            document.getElementById('withdraw-form').closest('.card').style.display = 'none';
            const successCard = document.getElementById('success-card');
            const name = document.getElementById('borrower-name').value.trim();
            const qty = body.quantity;
            const itemText = document.getElementById('item-id').selectedOptions[0].text.split(' —')[0];
            document.getElementById('success-msg').innerText = `${name}, a retirada de ${qty}x "${itemText}" foi registrada com sucesso.`;
            successCard.style.display = 'block';
        } else {
            toast(data.error || 'Erro ao registrar retirada', 'error');
            btn.disabled = false;
            btn.innerText = '📤 Registrar Retirada';
        }
    } catch {
        toast('Erro de conexão com o servidor', 'error');
        btn.disabled = false;
        btn.innerText = '📤 Registrar Retirada';
    }
}

function resetForm() {
    document.getElementById('withdraw-form').reset();
    document.getElementById('withdraw-form').closest('.card').style.display = 'block';
    document.getElementById('success-card').style.display = 'none';
    loadAvailableItems();
    const btn = document.getElementById('submit-btn');
    btn.disabled = false;
    btn.innerText = '📤 Registrar Retirada';
}
