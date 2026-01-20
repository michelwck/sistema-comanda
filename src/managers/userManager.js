import * as api from '../services/api.js';

export function attachUserEvents(state, render) {
    const modal = document.querySelector('#user-modal');
    const form = document.querySelector('#user-form');
    const newBtn = document.querySelector('#new-user-btn');
    const cancelBtn = document.querySelector('#cancel-user-modal');

    if (newBtn) {
        newBtn.addEventListener('click', () => {
            document.querySelector('#user-modal-title').textContent = 'Novo Usuário';
            form.reset();
            document.querySelector('#user-id').value = '';
            document.querySelector('#user-status-container').style.display = 'none';
            document.querySelector('#user-active').checked = true;
            modal.classList.remove('hidden');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    // Edit User
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const user = state.users.find(u => u.id === id);
            if (user) {
                document.querySelector('#user-modal-title').textContent = 'Editar Permissão';
                document.querySelector('#user-id').value = user.id;
                document.querySelector('#user-email').value = user.email;
                document.querySelector('#user-name').value = user.name;
                document.querySelector('#user-role').value = user.role;

                // Show Status Checkbox for existing users
                const statusContainer = document.querySelector('#user-status-container');
                statusContainer.style.display = 'block';
                document.querySelector('#user-active').checked = user.isActive;

                modal.classList.remove('hidden');
            }
        });
    });

    // Delete User
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            // Prevent deleting self
            if (state.currentUser && state.currentUser.id === id) {
                alert('Você não pode remover seu próprio acesso.');
                return;
            }

            const user = state.users.find(u => u.id === id);
            if (user && confirm(`Tem certeza que deseja remover o acesso de "${user.name}" (${user.email})?`)) {
                api.deleteUser(id)
                    .then(() => api.getUsers())
                    .then(users => {
                        state.users = users;
                        render();
                    })
                    .catch(err => alert('Erro ao remover usuário: ' + (err.message || 'Erro desconhecido')));
            }
        });
    });

    // Save Form
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.querySelector('#user-id').value;
            const data = {
                email: document.querySelector('#user-email').value,
                name: document.querySelector('#user-name').value,
                role: document.querySelector('#user-role').value,
                isActive: document.querySelector('#user-active').checked
            };

            const action = id ? api.updateUser(id, data) : api.createUser(data);
            action
                .then((savedUser) => {
                    api.getUsers().then(users => {
                        state.users = users;
                        modal.classList.add('hidden');
                        form.reset();
                        render();
                    });
                })
                .catch(err => {
                    console.error(err);
                    alert('Erro ao salvar permissão: ' + (err.message || 'Erro desconhecido'));
                });
        });
    }
}
