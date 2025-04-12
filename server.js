require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;
const CACHE_DURATION = 60 * 1000;
const CACHE_FILE = path.join(__dirname, 'data_cache.json');

if (!fs.existsSync(path.dirname(CACHE_FILE))) {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
}

const sessionStore = new session.MemoryStore();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'front')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const users = {};

const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Необходима авторизация' });
    }
    next();
};

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Логин и пароль обязательны' });
        }

        if (users[username]) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        users[username] = { username, password: hashedPassword };
        res.status(201).json({ message: 'Пользователь зарегистрирован' });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Ошибка при регистрации' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Логин и пароль обязательны' });
        }

        const user = users[username];
        if (!user) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { username };
            return res.json({ message: 'Вход выполнен успешно', username });
        } else {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Ошибка при входе' });
    }
});

app.get('/profile-api', requireAuth, (req, res) => {
    res.json({ user: req.session.user });
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Ошибка выхода:', err);
            return res.status(500).json({ error: 'Ошибка при выходе' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Выход выполнен успешно' });
    });
});

app.get('/data', requireAuth, (req, res) => {
    try {
        let cacheData;
        if (fs.existsSync(CACHE_FILE)) {
            try {
                cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
                const now = Date.now();

                if (now - cacheData.timestamp < CACHE_DURATION) {
                    return res.json({
                        ...cacheData.data,
                        source: 'Данные из кэша',
                        status: 'success'
                    });
                }
            } catch (e) {
                console.error('Ошибка чтения кэша:', e);
            }
        }

        const randomNumber = Math.floor(Math.random() * 1000);
        const currentTime = new Date().toLocaleString();

        const newData = {
            timestamp: Date.now(),
            data: {
                currentTime,
                randomNumber,
                message: 'Новые данные сгенерированы'
            }
        };

        try {
            fs.writeFileSync(CACHE_FILE, JSON.stringify(newData));
        } catch (e) {
            console.error('Ошибка записи в кэш:', e);
        }

        res.json({
            ...newData.data,
            source: 'Новые данные',
            status: 'success'
        });
    } catch (error) {
        console.error('Ошибка в /data:', error);
        res.status(500).json({
            error: 'Ошибка при получении данных',
            status: 'error'
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});