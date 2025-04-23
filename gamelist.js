const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const gameIds = {}; // Stores gameId -> { playerCount, timeout, log }

function logActivity(gameId, message) {
    const timestamp = new Date().toISOString();
    if (gameIds[gameId]) {
        gameIds[gameId].log.push({ timestamp, message });
    }
}

function removeGameId(gameId) {
    if (gameIds[gameId]) {
        clearTimeout(gameIds[gameId].timeout);
        logActivity(gameId, 'Game ID auto-removed after timeout');
        delete gameIds[gameId];
    }
}

// POST /create
app.post('/create', (req, res) => {
    console.log('Received request body:', req.body);
    const { gameId } = req.body;
    if (!gameId) return res.status(400).json({ error: 'gameId is required' });
    if (gameIds[gameId]) return res.status(409).json({ error: 'gameId already exists' });

    console.log('Creating game with gameId:', gameId);
    const timeout = setTimeout(() => removeGameId(gameId), 12 * 60 * 1000);
    gameIds[gameId] = {
        playerCount: 1,
        timeout,
        log: []
    };

    logActivity(gameId, 'Game ID created');
    return res.status(200).json({ message: 'gameId created', gameId });
});

// GET /check/:gameId
app.get('/check/:gameId', (req, res) => {
    const { gameId } = req.params;
    console.log(`Checking gameId: ${gameId}`);

    const game = gameIds[gameId];
    if (!game) {
        console.log(`Game not found: ${gameId}`);
        return res.status(404).json({ valid: false, message: 'gameId not found' });
    }

    if (game.playerCount >= 2) {
        console.log(`Game is full: ${gameId}`);
        return res.status(403).json({ valid: false, message: 'gameId full' });
    }

    game.playerCount += 1;
    console.log(`Player joined: ${gameId}, Total: ${game.playerCount}`);
    return res.status(200).json({ valid: true, message: 'gameId valid' });
});

// DELETE /remove/:gameId
app.delete('/remove/:gameId', (req, res) => {
    const { gameId } = req.params;
    if (gameIds[gameId]) {
        logActivity(gameId, 'Game ID manually removed');
        removeGameId(gameId);
        return res.status(200).json({ message: 'gameId manually removed' });
    }
    return res.status(404).json({ error: 'gameId not found' });
});

// GET /log/:gameId
app.get('/log/:gameId', (req, res) => {
    const { gameId } = req.params;
    if (!gameIds[gameId]) {
        return res.status(404).json({ error: 'gameId not found' });
    }
    return res.status(200).json({ gameId, log: gameIds[gameId].log });
});

app.listen(PORT, () => {
    console.log(`Game ID server running at http://localhost:${PORT}`);
});
