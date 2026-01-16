/**
 * SUMO TOURNAMENT V2 - Express Server
 * Clean rebuild with proper separation of concerns
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Import game modules
const { PHASES, resolvePhase, determineMatchWinner } = require('./game/phases');
const { getCPUChoice, resolveAIvsAI, createCPUPlayer } = require('./game/ai');
const { WRESTLERS, SIGNATURE_MOVES } = require('./data/wrestlers');

const app = express();
const PORT = process.env.PORT || 3001; // Use 3001 to avoid conflict with V1

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// DATA STORAGE
// ============================================
const DATA_FILE = path.join(__dirname, '../data/tournament.json');

let state = {
    users: {},           // email -> user
    sessions: {},        // token -> { email, lastActive }
    matches: {},         // matchId -> match
    currentMatch: null,  // Current active match ID
    adminEmail: null,    // First user becomes admin
    config: {
        tournamentSize: 8,
        moveTimerSeconds: 10,
        winsToQualify: 5
    }
};

// Load/Save data
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const dir = path.dirname(DATA_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            state.users = data.users || {};
            state.adminEmail = data.adminEmail || null;
            console.log(`Loaded ${Object.keys(state.users).length} users`);
        }
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

function saveData() {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify({
            users: state.users,
            adminEmail: state.adminEmail,
            savedAt: new Date().toISOString()
        }, null, 2));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function validateSession(token) {
    const session = state.sessions[token];
    if (!session) return null;

    // 30 minute timeout
    if (Date.now() - session.lastActive > 30 * 60 * 1000) {
        session.online = false;
    }
    return session;
}

function updateSession(token) {
    if (state.sessions[token]) {
        state.sessions[token].lastActive = Date.now();
        state.sessions[token].online = true;
    }
}

function getPlayerList() {
    return Object.values(state.users).map(u => ({
        email: u.email,
        playerName: u.playerName,
        rikishiName: u.rikishiName,
        wrestlerId: u.wrestlerId,
        wins: u.wins || 0,
        losses: u.losses || 0,
        isCPU: u.isCPU || false,
        online: u.isCPU ? true : Object.values(state.sessions).some(s => s.email === u.email && s.online)
    }));
}

function getCurrentMatch() {
    if (!state.currentMatch) return null;
    return state.matches[state.currentMatch] || null;
}

/**
 * Check if anyone has won the tournament (reached winsToQualify)
 * Returns the winner user object or null
 */
function checkTournamentWinner() {
    const winsNeeded = state.config.winsToQualify;
    for (const email in state.users) {
        if (state.users[email].wins >= winsNeeded) {
            return state.users[email];
        }
    }
    return null;
}

/**
 * Auto-resolve a phase when timer expires
 * Assigns random choice to any player who hasn't chosen
 */
function autoResolveTimeout(match) {
    if (!match || match.status !== 'active') return;

    const phase = match.currentPhase;
    const phaseData = PHASES[phase];
    if (!phaseData) return;

    const choices = phaseData.choices.map(c => c.id);

    // Assign random choice to any player who hasn't chosen
    if (!match.east.choice) {
        match.east.choice = choices[Math.floor(Math.random() * choices.length)];
        match.east.timedOut = true;
        console.log(`TIMEOUT: East (${match.east.rikishiName}) auto-chose ${match.east.choice}`);
    }

    if (!match.west.choice) {
        match.west.choice = choices[Math.floor(Math.random() * choices.length)];
        match.west.timedOut = true;
        console.log(`TIMEOUT: West (${match.west.rikishiName}) auto-chose ${match.west.choice}`);
    }

    // Resolve the phase
    const result = resolvePhase(match, phase);
    match.phaseResults[phase] = result;

    // Advance phase or complete match
    const phaseOrder = ['salt', 'display', 'tachiai', 'technique', 'finish'];
    const idx = phaseOrder.indexOf(phase);

    if (idx < phaseOrder.length - 1) {
        match.currentPhase = phaseOrder[idx + 1];
        match.east.choice = null;
        match.west.choice = null;
        match.east.timedOut = false;
        match.west.timedOut = false;
        match.phaseTimedOut = false; // Reset for new phase
        match.phaseStartTime = Date.now();
    } else {
        // Match complete
        match.status = 'completed';
        match.winner = determineMatchWinner(match);

        // Update records
        if (match.winner === 'east') {
            state.users[match.east.email].wins++;
            state.users[match.west.email].losses++;
        } else {
            state.users[match.west.email].wins++;
            state.users[match.east.email].losses++;
        }
        saveData();
    }
}

// ============================================
// AUTH ROUTES
// ============================================
app.post('/api/auth/register', (req, res) => {
    const { email, playerName, rikishiName, wrestlerId, stats, signatureMove } = req.body;

    if (!email || !playerName || !rikishiName || !wrestlerId) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (state.users[email]) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Create user
    state.users[email] = {
        id: uuidv4(),
        email,
        playerName,
        rikishiName,
        wrestlerId,
        stats: stats || { height: 5, weight: 5, speed: 5, technique: 5 },
        signatureMove: signatureMove || 'yorikiri',
        wins: 0,
        losses: 0,
        isCPU: false,
        createdAt: Date.now()
    };

    // First user is admin
    if (!state.adminEmail) {
        state.adminEmail = email;
    }

    // Create session
    const token = uuidv4();
    state.sessions[token] = { email, lastActive: Date.now(), online: true };

    saveData();
    console.log(`Registered: ${email} (${rikishiName})`);

    res.json({
        success: true,
        token,
        user: state.users[email],
        isAdmin: email === state.adminEmail,
        players: getPlayerList()
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Email required' });
    }

    const user = state.users[email];
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Clear old sessions for this user
    for (const t in state.sessions) {
        if (state.sessions[t].email === email) delete state.sessions[t];
    }

    const token = uuidv4();
    state.sessions[token] = { email, lastActive: Date.now(), online: true };

    console.log(`Login: ${email}`);

    res.json({
        success: true,
        token,
        user,
        isAdmin: email === state.adminEmail,
        players: getPlayerList(),
        currentMatch: getCurrentMatch()
    });
});

app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && state.sessions[token]) {
        delete state.sessions[token];
    }
    res.json({ success: true });
});

// ============================================
// LOBBY ROUTES
// ============================================
app.get('/api/lobby', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = validateSession(token);

    if (!session) {
        return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    updateSession(token);

    res.json({
        success: true,
        players: getPlayerList(),
        currentMatch: getCurrentMatch(),
        isAdmin: session.email === state.adminEmail,
        config: state.config
    });
});

app.post('/api/heartbeat', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = validateSession(token);

    if (!session) {
        return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    updateSession(token);

    let match = getCurrentMatch();
    let timerRemaining = null;
    let timerExpired = false;

    if (match && match.status === 'active' && match.phaseStartTime) {
        const elapsed = (Date.now() - match.phaseStartTime) / 1000;
        timerRemaining = Math.max(0, state.config.moveTimerSeconds - elapsed);

        // Check if timer expired and someone hasn't chosen
        // Use a small buffer (0.5s) to avoid race conditions with submissions
        if (timerRemaining <= 0 && (!match.east.choice || !match.west.choice) && !match.phaseTimedOut) {
            // Mark phase as timed out to prevent multiple triggers
            match.phaseTimedOut = true;
            timerExpired = true;
            autoResolveTimeout(match);
            match = getCurrentMatch(); // Get updated match after resolution
        }
    }

    // Check for tournament winner
    const tournamentWinner = checkTournamentWinner();

    res.json({
        success: true,
        players: getPlayerList(),
        currentMatch: match,
        timerRemaining,
        timerSeconds: state.config.moveTimerSeconds,
        timerExpired,
        tournamentWinner: tournamentWinner ? {
            email: tournamentWinner.email,
            playerName: tournamentWinner.playerName,
            rikishiName: tournamentWinner.rikishiName,
            wrestlerId: tournamentWinner.wrestlerId,
            wins: tournamentWinner.wins,
            losses: tournamentWinner.losses
        } : null,
        winsToQualify: state.config.winsToQualify
    });
});

// ============================================
// MATCH ROUTES
// ============================================
app.post('/api/match/start', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = validateSession(token);

    if (!session) {
        return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    if (session.email !== state.adminEmail) {
        return res.status(403).json({ success: false, error: 'Admin only' });
    }

    // Reset all matches for fresh tournament
    state.matches = {};
    state.currentMatch = null;

    // Fill with CPU players
    const humanCount = Object.values(state.users).filter(u => !u.isCPU).length;
    const cpuNeeded = state.config.tournamentSize - humanCount;

    // Remove old CPU players and reset human records
    for (const email in state.users) {
        if (state.users[email].isCPU) {
            delete state.users[email];
        } else {
            // Reset human player records for fresh tournament
            state.users[email].wins = 0;
            state.users[email].losses = 0;
        }
    }

    // Add fresh CPU players
    const usedWrestlers = new Set(Object.values(state.users).map(u => u.wrestlerId));
    for (let i = 0; i < cpuNeeded; i++) {
        const cpu = createCPUPlayer(i, usedWrestlers, WRESTLERS, SIGNATURE_MOVES);
        state.users[cpu.email] = cpu;
        usedWrestlers.add(cpu.wrestlerId);
    }

    console.log(`Tournament: ${humanCount} humans + ${cpuNeeded} CPU`);

    // Create first match
    const match = createNextMatch();

    saveData();

    res.json({
        success: true,
        message: `Tournament started with ${cpuNeeded} CPU players`,
        players: getPlayerList(),
        currentMatch: match
    });
});

function createNextMatch() {
    const available = Object.values(state.users).filter(u => {
        // Not in current match
        const currentMatch = getCurrentMatch();
        if (currentMatch && currentMatch.status !== 'completed') {
            if (currentMatch.east.email === u.email || currentMatch.west.email === u.email) {
                return false;
            }
        }
        return true;
    });

    if (available.length < 2) return null;

    // Prioritize: human vs human > human vs CPU > CPU vs CPU
    const humans = available.filter(u => !u.isCPU);
    const cpus = available.filter(u => u.isCPU);

    let east, west;
    if (humans.length >= 2) {
        [east, west] = humans.sort(() => Math.random() - 0.5).slice(0, 2);
    } else if (humans.length === 1) {
        east = humans[0];
        west = cpus[Math.floor(Math.random() * cpus.length)];
    } else {
        [east, west] = cpus.sort(() => Math.random() - 0.5).slice(0, 2);
    }

    const matchId = uuidv4();
    const match = {
        id: matchId,
        status: 'active',
        east: { ...east, choice: null },
        west: { ...west, choice: null },
        currentPhase: 'salt',
        phaseResults: {},
        battleStats: {
            east: { spirit: 0, focus: 0, intimidation: 0, crowdSupport: 0, momentum: 0, throwPower: 0, strikePower: 0, pushPower: 0, balance: 0 },
            west: { spirit: 0, focus: 0, intimidation: 0, crowdSupport: 0, momentum: 0, throwPower: 0, strikePower: 0, pushPower: 0, balance: 0 }
        },
        winner: null,
        phaseStartTime: Date.now(),
        createdAt: Date.now(),
        isAIvsAI: east.isCPU && west.isCPU
    };

    // Handle AI vs AI instantly
    if (match.isAIvsAI) {
        const result = resolveAIvsAI(match, PHASES);
        match.status = 'completed';
        match.winner = result.winner;
        match.phaseResults = result.phaseResults;
        match.aiResult = result;

        // Update records
        if (result.winner === 'east') {
            state.users[east.email].wins++;
            state.users[west.email].losses++;
        } else {
            state.users[west.email].wins++;
            state.users[east.email].losses++;
        }
        saveData();
    }

    state.matches[matchId] = match;
    state.currentMatch = matchId;

    console.log(`Match: ${east.rikishiName} vs ${west.rikishiName}${match.isAIvsAI ? ' (AI vs AI)' : ''}`);

    return match;
}

app.post('/api/match/choice', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = validateSession(token);

    if (!session) {
        return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    const { choice } = req.body;
    const match = getCurrentMatch();

    if (!match || match.status !== 'active') {
        return res.status(400).json({ success: false, error: 'No active match' });
    }

    // Check if phase already timed out
    if (match.phaseTimedOut) {
        return res.status(400).json({ success: false, error: 'Phase already timed out' });
    }

    // Determine player side
    let side = null;
    if (session.email === match.east.email) side = 'east';
    else if (session.email === match.west.email) side = 'west';
    else {
        return res.status(403).json({ success: false, error: 'Not in this match' });
    }

    const phase = match.currentPhase;
    match[side].choice = choice;

    console.log(`${side} chose ${choice} for ${phase}`);

    // If opponent is CPU, auto-choose
    const oppSide = side === 'east' ? 'west' : 'east';
    if (match[oppSide].isCPU && !match[oppSide].choice) {
        match[oppSide].choice = getCPUChoice(phase, match, oppSide, PHASES);
        console.log(`CPU chose ${match[oppSide].choice} for ${phase}`);
    }

    // Check if both chose
    if (match.east.choice && match.west.choice) {
        const result = resolvePhase(match, phase);
        match.phaseResults[phase] = result;

        // Advance phase or complete
        const phaseOrder = ['salt', 'display', 'tachiai', 'technique', 'finish'];
        const idx = phaseOrder.indexOf(phase);

        if (idx < phaseOrder.length - 1) {
            match.currentPhase = phaseOrder[idx + 1];
            match.east.choice = null;
            match.west.choice = null;
            match.phaseTimedOut = false; // Reset for new phase
            match.phaseStartTime = Date.now();
        } else {
            // Match complete
            match.status = 'completed';
            match.winner = determineMatchWinner(match);

            // Update records
            if (match.winner === 'east') {
                state.users[match.east.email].wins++;
                state.users[match.west.email].losses++;
            } else {
                state.users[match.west.email].wins++;
                state.users[match.east.email].losses++;
            }
            saveData();
        }

        res.json({
            success: true,
            waiting: false,
            phaseResult: result,
            match,
            players: getPlayerList()
        });
    } else {
        res.json({
            success: true,
            waiting: true,
            match
        });
    }
});

app.post('/api/match/next', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = validateSession(token);

    if (!session) {
        return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    const match = createNextMatch();

    res.json({
        success: true,
        currentMatch: match,
        players: getPlayerList()
    });
});

// ============================================
// ADMIN ROUTES
// ============================================
app.post('/api/admin/reset', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = validateSession(token);

    if (!session || session.email !== state.adminEmail) {
        return res.status(403).json({ success: false, error: 'Admin only' });
    }

    // Clear CPU players and reset stats
    for (const email in state.users) {
        if (state.users[email].isCPU) {
            delete state.users[email];
        } else {
            state.users[email].wins = 0;
            state.users[email].losses = 0;
        }
    }

    state.matches = {};
    state.currentMatch = null;

    saveData();

    res.json({
        success: true,
        players: getPlayerList()
    });
});

// ============================================
// START SERVER
// ============================================
loadData();

app.listen(PORT, () => {
    console.log(`Sumo Tournament V2 running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT}`);
});
