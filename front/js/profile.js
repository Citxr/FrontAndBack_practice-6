document.addEventListener('DOMContentLoaded', async () => {
    const usernameElement = document.getElementById('username');
    const logoutBtn = document.getElementById('logout-btn');
    const refreshBtn = document.getElementById('refresh-data');
    const dataContent = document.getElementById('data-content');

    async function checkAuthAndLoadData() {
        try {
            const response = await fetch('/profile-api');
            const data = await response.json();

            if (response.ok && data.user) {
                usernameElement.textContent = data.user.username;
                await loadData();
                return true;
            } else {
                window.location.href = '/';
                return false;
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            window.location.href = '/';
            return false;
        }
    }

    async function loadData(forceRefresh = false) {
        dataContent.innerHTML = '<div class="loading">Загрузка данных...</div>';

        try {
            const url = forceRefresh ? '/data?refresh=' + Date.now() : '/data';
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'success') {
                renderData(data);
            } else {
                showError(data.error || 'Ошибка при загрузке данных');
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            showError('Ошибка соединения с сервером');
        }
    }

    function renderData(data) {
        const html = `
            <div class="data-item">
                <span>Время генерации:</span>
                <span>${data.currentTime}</span>
            </div>
            <div class="data-item">
                <span>Случайное число:</span>
                <span>${data.randomNumber}</span>
            </div>
            <div class="timestamp">
                Данные получены: ${new Date().toLocaleString()}
            </div>
        `;
        dataContent.innerHTML = html;
    }

    function showError(message) {
        dataContent.innerHTML = `<div class="error-message">${message}</div>`;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/logout', { method: 'POST' });
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    showError('Ошибка при выходе');
                }
            } catch (error) {
                showError('Ошибка соединения при выходе');
            }
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadData(true);
        });
    }

    checkAuthAndLoadData();
});