import * as api from '../services/api.js';

function refreshFiadoData(state, render) {
    if (!state.fiadoSelectedClientId) return;
    Promise.all([
        api.getClients(),
        api.getClientTransactions(state.fiadoSelectedClientId)
    ]).then(([clients, transactions]) => {
        state.clients = clients;
        state.fiadoTransactions = transactions;
        render();
        // Auto-scroll to bottom of transaction list
        const transactionList = document.querySelector('#fiado-transaction-list');
        if (transactionList) {
            transactionList.scrollTop = transactionList.scrollHeight;
        }
    });
}

export function attachFiadoEvents(state, render) {
    // Client selection
    const clientItems = document.querySelectorAll('.fiado-client-item');
    clientItems.forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            if (state.fiadoSelectedClientId !== id) {
                state.fiadoSelectedClientId = id;
                state.fiadoTransactions = null; // Loading state indicator if needed
                render(); // Show loader? Or just list.

                api.getClientTransactions(id)
                    .then(transactions => {
                        state.fiadoTransactions = transactions;
                        render();
                        // Auto-scroll to bottom of transaction list
                        const transactionList = document.querySelector('#fiado-transaction-list');
                        if (transactionList) {
                            transactionList.scrollTop = transactionList.scrollHeight;
                        }
                    })
                    .catch(err => alert('Erro ao carregar extrato: ' + err.message));
            }
        });
    });

    // Filtering
    const filterInput = document.querySelector('#fiado-search-filter');
    if (filterInput) {
        // Restore focus
        filterInput.value = state.fiadoSearchTerm || '';
        filterInput.focus();

        filterInput.addEventListener('input', (e) => {
            state.fiadoSearchTerm = e.target.value;
            render();

            // Maintain focus
            const input = document.querySelector('#fiado-search-filter');
            if (input) {
                input.focus();
                // Move cursor to end
                const val = input.value;
                input.value = '';
                input.value = val;
            }
        });
    }

    // Payment Logic
    const openPaymentBtn = document.querySelector('#open-payment-modal-btn');
    const paymentModal = document.querySelector('#fiado-payment-modal');
    const cancelPaymentBtn = document.querySelector('#cancel-payment-web-btn');
    const cancelPaymentBtn2 = document.querySelector('#cancel-payment-web-btn-2');
    const paymentForm = document.querySelector('#fiado-payment-form');

    if (openPaymentBtn && paymentModal) {
        openPaymentBtn.addEventListener('click', () => {
            paymentModal.classList.remove('hidden');
            setTimeout(() => {
                const amountInput = document.querySelector('#payment-amount');
                if (amountInput) amountInput.focus();
            }, 50);
        });
    }

    const closePaymentModal = () => paymentModal && paymentModal.classList.add('hidden');
    if (cancelPaymentBtn) cancelPaymentBtn.addEventListener('click', closePaymentModal);
    if (cancelPaymentBtn2) cancelPaymentBtn2.addEventListener('click', closePaymentModal);

    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.querySelector('#payment-amount').value);
            const desc = document.querySelector('#payment-desc').value;

            if (!amount || amount <= 0) return alert('Valor inválido');

            api.createClientTransaction(state.fiadoSelectedClientId, {
                amount: -Math.abs(amount), // Negative for payment
                type: 'PAYMENT',
                description: desc || 'Pagamento'
            }).then(() => {
                closePaymentModal();
                refreshFiadoData(state, render);
            }).catch(err => alert('Erro: ' + err.message));
        });
    }

    // Debt Logic
    const openDebtBtn = document.querySelector('#open-debt-modal-btn');
    const debtModal = document.querySelector('#fiado-debt-modal');
    const cancelDebtBtn = document.querySelector('#cancel-debt-web-btn');
    const cancelDebtBtn2 = document.querySelector('#cancel-debt-web-btn-2');
    const debtForm = document.querySelector('#fiado-debt-form');

    if (openDebtBtn && debtModal) {
        openDebtBtn.addEventListener('click', () => {
            debtModal.classList.remove('hidden');
            setTimeout(() => {
                const amountInput = document.querySelector('#debt-amount');
                if (amountInput) amountInput.focus();
            }, 50);
        });
    }

    const closeDebtModal = () => debtModal && debtModal.classList.add('hidden');
    if (cancelDebtBtn) cancelDebtBtn.addEventListener('click', closeDebtModal);
    if (cancelDebtBtn2) cancelDebtBtn2.addEventListener('click', closeDebtModal);

    if (debtForm) {
        debtForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.querySelector('#debt-amount').value);
            const desc = document.querySelector('#debt-desc').value;

            if (!amount || amount <= 0) return alert('Valor inválido');

            api.createClientTransaction(state.fiadoSelectedClientId, {
                amount: Math.abs(amount), // Positive for debt
                type: 'MANUAL_DEBT',
                description: desc || 'Dívida Manual'
            }).then(() => {
                closeDebtModal();
                refreshFiadoData(state, render);
            }).catch(err => alert('Erro: ' + err.message));
        });
    }

    // View Detail Logic
    const viewDetailBtns = document.querySelectorAll('.view-fiado-tab-btn');
    viewDetailBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tabId = btn.dataset.tabId;
            api.getTabById(tabId)
                .then(tab => {
                    state.tempTab = tab;
                    state.view = 'fiado-detail';
                    render();
                })
                .catch(err => alert('Erro ao carregar detalhes: ' + err.message));
        });
    });
}

export function attachFiadoDetailEvents(state, render) {
    const backBtn = document.querySelector('#back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            state.tempTab = null;
            state.view = 'fiado';
            render();
        });
    }
}
