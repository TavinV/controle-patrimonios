// ===================== STATE =====================
let nifValue     = '';
let personData   = null;   // { id, nif, name }
let allItems     = [];
let selectedItem = null;   // item object
let selectedQty  = 1;

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    loadAvailableItems();
});

// ===================== STEP 1: NIF PAD =====================
function nifPress(digit) {
    if (nifValue.length >= 9) return;
    nifValue += digit;
    updateNifDisplay();
    clearNifFeedback();
    if (nifValue.length === 9) lookupNif();
}

function nifBackspace() {
    nifValue = nifValue.slice(0, -1);
    updateNifDisplay();
    clearNifFeedback();
    hideNifNext();
}

function nifClear() {
    nifValue = '';
    personData = null;
    updateNifDisplay();
    clearNifFeedback();
    hideNifNext();
}

function updateNifDisplay() {
    const container = document.getElementById('nif-display');
    container.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('span');
        cell.className = 'nif-cell' + (i < nifValue.length ? ' nif-cell--filled' : '');
        cell.textContent = i < nifValue.length ? nifValue[i] : '—';
        container.appendChild(cell);
    }
}

async function lookupNif() {
    try {
        const res = await fetch(`${API_URL}/people/lookup?nif=${nifValue}`);
        if (res.ok) {
            const data = await res.json();
            personData = data.data;
            document.getElementById('nif-person-name').textContent = personData.name;
            document.getElementById('nif-person-preview').style.display = 'flex';
            document.getElementById('nif-next-btn').style.display = 'flex';
            document.getElementById('nif-error').style.display = 'none';
        } else {
            personData = null;
            const data = await res.json();
            showNifError(data.error || 'NIF não registado. Contacte o administrador.');
        }
    } catch {
        personData = null;
        showNifError('Erro de ligação ao servidor.');
    }
}

function showNifError(msg) {
    const el = document.getElementById('nif-error');
    el.textContent = msg;
    el.style.display = 'block';
    document.getElementById('nif-person-preview').style.display = 'none';
    document.getElementById('nif-next-btn').style.display = 'none';
}

function clearNifFeedback() {
    document.getElementById('nif-error').style.display = 'none';
    document.getElementById('nif-person-preview').style.display = 'none';
}

function hideNifNext() {
    document.getElementById('nif-next-btn').style.display = 'none';
}

// ===================== STEP 2: ITEMS =====================
async function loadAvailableItems() {
    try {
        const res  = await fetch(`${API_URL}/items?limit=100`);
        const data = await res.json();
        allItems   = (data.data || []).filter(i => i.quantity_available > 0);
        renderItems(allItems);
    } catch {
        document.getElementById('items-grid').innerHTML =
            '<p style="color:var(--danger); text-align:center">Erro ao carregar itens.</p>';
    }
}

function renderItems(items) {
    const grid = document.getElementById('items-grid');
    if (items.length === 0) {
        grid.innerHTML = '<div class="kiosk-empty"><i class="fas fa-box-open"></i><p>Nenhum item disponível</p></div>';
        return;
    }
    grid.innerHTML = items.map(item => `
        <button class="kiosk-item-card ${selectedItem && selectedItem.id === item.id ? 'selected' : ''}"
                onclick="selectItem(${item.id})"
                data-id="${item.id}">
            <div class="kitem-name">${escHtml(item.name)}</div>
            <div class="kitem-location"><i class="fas fa-location-dot"></i> ${escHtml(item.location)}</div>
            <div class="kitem-avail"><i class="fas fa-cubes"></i> ${item.quantity_available} disponível${item.quantity_available !== 1 ? 'eis' : ''}</div>
        </button>
    `).join('');
}

function filterItems() {
    const q = document.getElementById('item-search').value.toLowerCase();
    const clearBtn = document.getElementById('search-clear-btn');
    
    // Show/hide clear button based on search text
    if (q.length > 0) {
        clearBtn.style.display = 'flex';
    } else {
        clearBtn.style.display = 'none';
    }
    
    renderItems(allItems.filter(i =>
        i.name.toLowerCase().includes(q) || (i.location || '').toLowerCase().includes(q)
    ));
    // Re-highlight selection after re-render
    if (selectedItem) {
        const card = document.querySelector(`.kiosk-item-card[data-id="${selectedItem.id}"]`);
        if (card) card.classList.add('selected');
    }
}

function clearSearch() {
    document.getElementById('item-search').value = '';
    document.getElementById('search-clear-btn').style.display = 'none';
    renderItems(allItems);
    if (selectedItem) {
        const card = document.querySelector(`.kiosk-item-card[data-id="${selectedItem.id}"]`);
        if (card) card.classList.add('selected');
    }
}

function selectItem(id) {
    selectedItem = allItems.find(i => i.id === id) || null;
    selectedQty  = 1;

    // Highlight card
    document.querySelectorAll('.kiosk-item-card').forEach(c => c.classList.remove('selected'));
    const card = document.querySelector(`.kiosk-item-card[data-id="${id}"]`);
    if (card) card.classList.add('selected');

    if (selectedItem) {
        document.getElementById('qty-item-name').textContent = selectedItem.name;
        document.getElementById('qty-value').textContent = selectedQty;
        document.getElementById('qty-bar').style.display = 'flex';
    }
}

function changeQty(delta) {
    if (!selectedItem) return;
    const next = selectedQty + delta;
    if (next < 1 || next > selectedItem.quantity_available) return;
    selectedQty = next;
    document.getElementById('qty-value').textContent = selectedQty;
}

// ===================== NAVIGATION =====================
function goToStep1() {
    setStep(1);
}

function goToStep2() {
    if (!personData) { toast('Por favor complete o NIF primeiro', 'error'); return; }
    setStep(2);
    document.getElementById('step2-subtitle').textContent =
        `Olá, ${personData.name}. Selecione o item que pretende retirar.`;
    // Reset selection
    selectedItem = null;
    selectedQty = 1;
    document.getElementById('qty-bar').style.display = 'none';
    document.getElementById('item-search').value = '';
    renderItems(allItems);
}

function goToStep3() {
    if (!selectedItem) { toast('Selecione um item primeiro', 'error'); return; }
    document.getElementById('confirm-name').textContent = personData.name;
    document.getElementById('confirm-nif').textContent  = personData.nif;
    document.getElementById('confirm-item').textContent = `${selectedItem.name} — ${selectedItem.location}`;
    document.getElementById('confirm-qty').textContent  = selectedQty;
    setStep(3);
}

function setStep(n) {
    [1, 2, 3].forEach(i => {
        document.getElementById(`step-${i}`).style.display = i === n ? 'flex' : 'none';
        const kstep = document.getElementById(`kstep-${i}`);
        kstep.classList.toggle('active', i === n);
        kstep.classList.toggle('done', i < n);
    });
    document.getElementById('step-success').style.display = 'none';
}

// ===================== SUBMIT =====================
async function submitWithdraw() {
    const btn = document.getElementById('confirm-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A registar...';

    try {
        const res = await fetch(`${API_URL}/loans/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item_id: selectedItem.id,
                borrower_name: personData.name,
                borrower_nif: personData.nif,
                quantity: selectedQty
            })
        });
        const data = await res.json();

        if (res.ok) {
            [1, 2, 3].forEach(i => {
                document.getElementById(`step-${i}`).style.display = 'none';
            });
            document.getElementById('step-indicator').style.display = 'none';
            document.getElementById('success-msg').textContent =
                `${personData.name}, a retirada de ${selectedQty}× "${selectedItem.name}" foi registada com sucesso.`;
            document.getElementById('step-success').style.display = 'flex';
        } else {
            toast(data.error || 'Erro ao registar retirada', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Retirada';
        }
    } catch {
        toast('Erro de ligação ao servidor', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Retirada';
    }
}

// ===================== RESET =====================
function resetKiosk() {
    nifValue     = '';
    personData   = null;
    selectedItem = null;
    selectedQty  = 1;
    nifClear();
    document.getElementById('step-indicator').style.display = 'flex';
    document.getElementById('step-success').style.display   = 'none';
    loadAvailableItems();
    setStep(1);
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
