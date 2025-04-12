document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    window.location.href = '/profile.html';
                } else {
                    loginError.textContent = data.error || 'Ошибка при входе';
                }
            } catch (error) {
                loginError.textContent = 'Ошибка соединения';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    registerError.textContent = 'Регистрация успешна. Теперь вы можете войти.';
                    registerError.style.color = 'var(--success-color)';

                    tabButtons[0].click();
                } else {
                    registerError.textContent = data.error || 'Ошибка при регистрации';
                    registerError.style.color = 'var(--error-color)';
                }
            } catch (error) {
                registerError.textContent = 'Ошибка соединения';
                registerError.style.color = 'var(--error-color)';
            }
        });
    }
});