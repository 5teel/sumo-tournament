/**
 * SUMO TOURNAMENT V2 - Main Application Controller
 */

// Wrestler data for registration (using actual available images)
const WRESTLERS = [
    { id: 1, name: 'Hoshoryu', image: 'images/Hoshoryu.jpg' },
    { id: 2, name: 'Kirishima', image: 'images/Kirishima.jpg' },
    { id: 3, name: 'Onosato', image: 'images/Onosato.jpg' },
    { id: 4, name: 'Wakamotoharu', image: 'images/Wakamotoharu.jpg' },
    { id: 5, name: 'Tamawashi', image: 'images/Tamawashi.jpg' },
    { id: 6, name: 'Ura', image: 'images/Ura.jpg' },
    { id: 7, name: 'Yoshinofuji', image: 'images/Yoshinofuji.jpg' },
    { id: 8, name: 'Aonishiki', image: 'images/Aonishiki.jpg' },
    { id: 9, name: 'Ichiyamamoto', image: 'images/Ichiyamamoto.jpg' },
    { id: 10, name: 'Kotozakura', image: 'images/Kotozakura.jpg' },
    { id: 11, name: 'Oho', image: 'images/Oho.jpg' },
    { id: 12, name: 'Shodai', image: 'images/Shodai.jpg' }
];

// Phase definitions (mirror server)
const PHASES = {
    salt: {
        name: 'Salt Ritual (Shio)',
        choices: [
            { id: 'little', label: 'Little Salt', icon: '🧂' },
            { id: 'lots', label: 'Lots of Salt', icon: '🧂🧂' }
        ]
    },
    display: {
        name: 'Intimidation Display (Shikiri)',
        choices: [
            { id: 'mawashi', label: 'Slap Mawashi (Belt)', icon: '👋' },
            { id: 'aura', label: 'Powerful Aura', icon: '✨' }
        ]
    },
    tachiai: {
        name: 'Tachiai (Initial Charge)!',
        choices: [
            { id: 'hard', label: 'Hard Charge', icon: '💥' },
            { id: 'soft', label: 'Soft Absorb', icon: '🛡️' },
            { id: 'henka', label: 'Henka (Sidestep)', icon: '↪️' }
        ]
    },
    technique: {
        name: 'Attack (Waza)!',
        choices: [
            { id: 'grip', label: 'Belt Grip', icon: '🤝' },
            { id: 'tsuppari', label: 'Tsuppari (Thrusts)', icon: '✋' },
            { id: 'push', label: 'Push Attack', icon: '➡️' },
            { id: 'pull', label: 'Pull Down', icon: '⬅️' }
        ]
    },
    finish: {
        name: 'Kimarite (Finishing Move)!',
        choices: [
            { id: 'yorikiri', label: 'Yorikiri (Force Out)', icon: '🔄' },
            { id: 'oshidashi', label: 'Oshidashi (Push Out)', icon: '💨' },
            { id: 'uwatenage', label: 'Uwatenage (Overarm Throw)', icon: '🌀' },
            { id: 'hatakikomi', label: 'Hatakikomi (Slap Down)', icon: '⬇️' }
        ]
    }
};

const PLACEHOLDER_IMAGE = 'images/ukiyo-e-sumo.jpg';

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', init);

function init() {
    // Set up event delegation
    document.getElementById('app').addEventListener('click', handleClick);

    // Check for existing session
    if (loadSession()) {
        // Validate session and go to lobby
        validateAndEnterLobby();
    } else {
        setState({ screen: 'home' });
    }
}

async function validateAndEnterLobby() {
    showLoading(true);
    try {
        const data = await API.getLobby();
        if (data.success) {
            setState({
                screen: 'lobby',
                players: data.players,
                match: data.currentMatch,
                isAdmin: data.isAdmin
            });
            startPolling();
        } else {
            // API returned but not successful
            throw new Error('Session validation failed');
        }
    } catch (e) {
        // Session invalid, clear and go home
        console.log('Session invalid, redirecting to home');
        stopPolling();
        clearSession();
        setState({ screen: 'home' });
    }
    showLoading(false);
}

// ============================================
// SCREEN RENDERING
// ============================================

function renderScreen() {
    const app = document.getElementById('app');
    const templateId = `${GameState.screen}-screen`;
    const template = document.getElementById(templateId);

    if (!template) {
        console.error(`Template not found: ${templateId}`);
        return;
    }

    // Clone and insert template
    app.innerHTML = '';
    app.appendChild(template.content.cloneNode(true));

    // Run screen-specific setup
    switch (GameState.screen) {
        case 'home':
            break;
        case 'login':
            setupLoginScreen();
            break;
        case 'register':
            setupRegisterScreen();
            break;
        case 'lobby':
            setupLobbyScreen();
            break;
        case 'matchup':
            setupMatchupScreen();
            break;
        case 'battle':
            setupBattleScreen();
            break;
        case 'bout-winner':
            setupBoutWinnerScreen();
            break;
        case 'results':
            setupResultsScreen();
            break;
        case 'champion':
            setupChampionScreen();
            break;
    }
}

// ============================================
// EVENT HANDLING
// ============================================

function handleClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    switch (action) {
        // Navigation
        case 'register':
            setState({ screen: 'register', registerStep: 1 });
            break;
        case 'login':
            setState({ screen: 'login' });
            break;
        case 'back-home':
            stopPolling();
            setState({ screen: 'home' });
            break;
        case 'back-lobby':
            setState({ screen: 'lobby' });
            break;

        // Registration
        case 'next-step':
            nextRegisterStep();
            break;
        case 'prev-step':
            prevRegisterStep();
            break;
        case 'register-submit':
            submitRegistration();
            break;

        // Session
        case 'logout':
            handleLogout();
            break;

        // Tournament
        case 'start-tournament':
            handleStartTournament();
            break;
        case 'next-bout':
            handleNextBout();
            break;
        case 'new-tournament':
            handleNewTournament();
            break;
        case 'reset-tournament':
            handleResetTournament();
            break;

        // Error
        case 'dismiss-error':
            clearError();
            break;
    }
}

// ============================================
// LOGIN SCREEN
// ============================================

function setupLoginScreen() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();

    if (!email) {
        document.getElementById('login-error').textContent = 'Email is required';
        return;
    }

    showLoading(true);
    try {
        const data = await API.login(email);
        if (data.success) {
            setState({
                token: data.token,
                user: data.user,
                isAdmin: data.isAdmin,
                players: data.players,
                match: data.currentMatch,
                screen: 'lobby'
            });
            startPolling();
        }
    } catch (e) {
        document.getElementById('login-error').textContent = e.message || 'Login failed';
    }
    showLoading(false);
}

async function handleLogout() {
    stopPolling();
    try {
        await API.logout();
    } catch (e) {
        // Ignore logout errors
    }
    clearSession();
    setState({ screen: 'home', user: null, token: null });
}

// ============================================
// REGISTRATION SCREEN
// ============================================

function setupRegisterScreen() {
    updateRegisterStep();
    populateWrestlerGrid();
    setupStatSliders();
}

function updateRegisterStep() {
    const step = GameState.registerStep;

    // Update step indicators
    document.querySelectorAll('.step-indicator .step').forEach((el, i) => {
        el.classList.toggle('active', i < step);
        el.classList.toggle('current', i + 1 === step);
    });

    // Show correct step
    document.querySelectorAll('.register-step').forEach((el, i) => {
        el.classList.toggle('hidden', i + 1 !== step);
    });
}

function nextRegisterStep() {
    const step = GameState.registerStep;

    // Validate current step
    if (step === 1) {
        const email = document.getElementById('reg-email').value.trim();
        const name = document.getElementById('reg-name').value.trim();
        const rikishi = document.getElementById('reg-rikishi').value.trim();

        if (!email || !name || !rikishi) {
            document.getElementById('register-error').textContent = 'All fields are required';
            return;
        }

        GameState.registerData.email = email;
        GameState.registerData.playerName = name;
        GameState.registerData.rikishiName = rikishi;
    }

    if (step === 2) {
        if (!GameState.registerData.wrestlerId) {
            document.getElementById('register-error').textContent = 'Please select a wrestler';
            return;
        }
    }

    document.getElementById('register-error').textContent = '';
    GameState.registerStep = Math.min(3, step + 1);
    updateRegisterStep();
}

function prevRegisterStep() {
    GameState.registerStep = Math.max(1, GameState.registerStep - 1);
    updateRegisterStep();
}

function populateWrestlerGrid() {
    const grid = document.getElementById('wrestler-grid');
    if (!grid) return;

    grid.innerHTML = WRESTLERS.map(w => `
        <div class="wrestler-option ${GameState.registerData.wrestlerId === w.id ? 'selected' : ''}"
             data-wrestler-id="${w.id}">
            <img src="${w.image}" alt="${w.name}" onerror="if(!this.dataset.failed){this.dataset.failed='1';this.src='${PLACEHOLDER_IMAGE}'}">
            <span>${w.name}</span>
        </div>
    `).join('');

    grid.addEventListener('click', (e) => {
        const option = e.target.closest('.wrestler-option');
        if (!option) return;

        const id = parseInt(option.dataset.wrestlerId);
        GameState.registerData.wrestlerId = id;

        // Update selection UI
        grid.querySelectorAll('.wrestler-option').forEach(el => {
            el.classList.toggle('selected', parseInt(el.dataset.wrestlerId) === id);
        });
    });
}

function setupStatSliders() {
    const sliders = document.querySelectorAll('.stat-row input[type="range"]');
    const totalPoints = 20;
    const pointsRemainingEl = document.getElementById('points-remaining');

    // Height: 175cm base + 3cm per point (1=178cm, 10=205cm)
    // Weight: 110kg base + 6kg per point (1=116kg, 10=170kg)
    function getHeightDisplay(points) {
        return `(${175 + points * 3}cm)`;
    }

    function getWeightDisplay(points) {
        return `(${110 + points * 6}kg)`;
    }

    function updateStats() {
        let used = 0;

        sliders.forEach(slider => {
            const stat = slider.dataset.stat;
            const value = parseInt(slider.value);
            GameState.registerData.stats[stat] = value;
            used += value;

            // Update point value display
            const valueEl = slider.nextElementSibling;
            valueEl.textContent = value;

            // Update height/weight display if applicable
            const displayEl = valueEl.nextElementSibling;
            if (displayEl && displayEl.classList.contains('stat-display')) {
                if (stat === 'height') {
                    displayEl.textContent = getHeightDisplay(value);
                } else if (stat === 'weight') {
                    displayEl.textContent = getWeightDisplay(value);
                }
            }
        });

        const remaining = totalPoints - used;
        pointsRemainingEl.textContent = remaining;

        // Visual feedback for over/under budget
        const statTotal = document.querySelector('.stat-total');
        if (remaining < 0) {
            statTotal.classList.add('over-budget');
            statTotal.classList.remove('under-budget');
        } else if (remaining > 0) {
            statTotal.classList.remove('over-budget');
            statTotal.classList.add('under-budget');
        } else {
            statTotal.classList.remove('over-budget', 'under-budget');
        }
    }

    // Each slider is independent - no clamping
    sliders.forEach(slider => {
        slider.addEventListener('input', updateStats);
    });

    updateStats();
}

async function submitRegistration() {
    // Get signature move
    const signatureInput = document.querySelector('input[name="signature"]:checked');
    GameState.registerData.signatureMove = signatureInput?.value || 'yorikiri';

    // Validate stats
    const stats = GameState.registerData.stats;
    const total = stats.height + stats.weight + stats.speed + stats.technique;
    if (total !== 20) {
        const diff = total - 20;
        const msg = diff > 0
            ? `You have ${diff} too many points allocated. Remove some points.`
            : `You have ${-diff} points remaining. Allocate all 20 points.`;
        document.getElementById('register-error').textContent = msg;
        return;
    }

    showLoading(true);
    try {
        const data = await API.register(GameState.registerData);
        if (data.success) {
            setState({
                token: data.token,
                user: data.user,
                isAdmin: data.isAdmin,
                players: data.players,
                screen: 'lobby'
            });
            startPolling();
        }
    } catch (e) {
        document.getElementById('register-error').textContent = e.message || 'Registration failed';
    }
    showLoading(false);
}

// ============================================
// LOBBY SCREEN
// ============================================

function setupLobbyScreen() {
    renderPlayerList();
    renderCurrentUser();
    updateAdminUI();
}

function renderPlayerList() {
    const list = document.getElementById('player-list');
    if (!list) return;

    const countEl = document.querySelector('.player-count');
    if (countEl) {
        countEl.textContent = `(${GameState.players.length})`;
    }

    // Sort by wins (descending), then alphabetically by rikishiName
    const sortedPlayers = [...GameState.players].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.rikishiName.localeCompare(b.rikishiName);
    });

    list.innerHTML = sortedPlayers.map(p => `
        <li class="player-item ${p.online ? 'online' : 'offline'} ${p.isCPU ? 'cpu' : ''}">
            <span class="player-name">${p.rikishiName}</span>
            <span class="player-record">${p.wins}W-${p.losses}L</span>
            ${p.isCPU ? '<span class="cpu-badge">CPU</span>' : ''}
        </li>
    `).join('');
}

function renderCurrentUser() {
    const card = document.getElementById('current-user-card');
    if (!card || !GameState.user) return;

    const wrestler = WRESTLERS.find(w => w.id === GameState.user.wrestlerId);
    const image = wrestler?.image || PLACEHOLDER_IMAGE;

    card.innerHTML = `
        <img src="${image}" alt="${GameState.user.rikishiName}" class="user-wrestler-image" onerror="if(!this.dataset.failed){this.dataset.failed='1';this.src='${PLACEHOLDER_IMAGE}'}">
        <div class="user-info">
            <h4>${GameState.user.rikishiName}</h4>
            <p>${GameState.user.playerName}</p>
            <p class="user-record">${GameState.user.wins || 0}W - ${GameState.user.losses || 0}L</p>
        </div>
    `;
}

function updateAdminUI() {
    document.querySelectorAll('.admin-only').forEach(el => {
        el.classList.toggle('hidden', !GameState.isAdmin);
    });
    document.querySelectorAll('.non-admin').forEach(el => {
        el.classList.toggle('hidden', GameState.isAdmin);
    });
}

async function handleStartTournament() {
    showLoading(true);
    try {
        const data = await API.startTournament();
        if (data.success) {
            // Play intro taiko drums
            SoundManager.playIntro();

            // Add activity entry
            addActivityEntry('<strong>Tournament started!</strong>', 'match');
            const cpuCount = data.players.filter(p => p.isCPU).length;
            if (cpuCount > 0) {
                addActivityEntry(`${cpuCount} CPU wrestlers have joined`, 'info');
            }

            // Update current user's record from server (tournament reset sets to 0-0)
            const updatedUser = data.players.find(p => p.email === GameState.user?.email);
            if (updatedUser) {
                GameState.user.wins = updatedUser.wins;
                GameState.user.losses = updatedUser.losses;
            }

            setState({
                players: data.players,
                match: data.currentMatch
            });

            // If we're in the match, go to matchup screen first
            if (data.currentMatch) {
                addActivityEntry(`<strong>First match:</strong> ${data.currentMatch.east.rikishiName} vs ${data.currentMatch.west.rikishiName}`, 'match');

                const inMatch = data.currentMatch.east.email === GameState.user.email ||
                               data.currentMatch.west.email === GameState.user.email;
                if (inMatch) {
                    setState({ screen: 'matchup' });
                }
            }
        }
    } catch (e) {
        showError(e.message || 'Failed to start tournament');
    }
    showLoading(false);
}

// ============================================
// MATCHUP SCREEN
// ============================================

function setupMatchupScreen() {
    const match = GameState.match;
    if (!match) {
        setState({ screen: 'lobby' });
        return;
    }

    // Prevent re-running setup for the same match
    if (GameState.matchupSetupForMatchId === match.id) {
        console.log('Matchup screen already setup for this match, skipping');
        return;
    }
    GameState.matchupSetupForMatchId = match.id;
    console.log('Setting up matchup screen for match:', match.id);

    // Get fighter data
    const east = match.east;
    const west = match.west;

    // Set up east fighter
    const eastImage = document.getElementById('matchup-east-image');
    const eastRikishi = document.getElementById('matchup-east-rikishi');
    const eastPlayer = document.getElementById('matchup-east-player');
    const eastStats = document.getElementById('matchup-east-stats');
    const eastRecord = document.getElementById('matchup-east-record');

    const eastWrestler = WRESTLERS.find(w => w.id === east.wrestlerId);
    if (eastImage) eastImage.src = eastWrestler?.image || 'images/ukiyo-e-sumo.jpg';
    if (eastRikishi) eastRikishi.textContent = east.rikishiName;
    if (eastPlayer) eastPlayer.textContent = east.isCPU ? 'CPU' : east.playerName;
    if (eastStats) {
        eastStats.innerHTML = `
            <div class="matchup-stat">
                <span class="matchup-stat-value">${east.stats?.height || 5}</span>
                <span class="matchup-stat-label">Height</span>
            </div>
            <div class="matchup-stat">
                <span class="matchup-stat-value">${east.stats?.weight || 5}</span>
                <span class="matchup-stat-label">Weight</span>
            </div>
            <div class="matchup-stat">
                <span class="matchup-stat-value">${east.stats?.speed || 5}</span>
                <span class="matchup-stat-label">Speed</span>
            </div>
            <div class="matchup-stat">
                <span class="matchup-stat-value">${east.stats?.technique || 5}</span>
                <span class="matchup-stat-label">Technique</span>
            </div>
        `;
    }
    if (eastRecord) eastRecord.textContent = `${east.wins || 0}W - ${east.losses || 0}L`;

    // Set up west fighter
    const westImage = document.getElementById('matchup-west-image');
    const westRikishi = document.getElementById('matchup-west-rikishi');
    const westPlayer = document.getElementById('matchup-west-player');
    const westStats = document.getElementById('matchup-west-stats');
    const westRecord = document.getElementById('matchup-west-record');

    const westWrestler = WRESTLERS.find(w => w.id === west.wrestlerId);
    if (westImage) westImage.src = westWrestler?.image || 'images/ukiyo-e-sumo.jpg';
    if (westRikishi) westRikishi.textContent = west.rikishiName;
    if (westPlayer) westPlayer.textContent = west.isCPU ? 'CPU' : west.playerName;
    if (westStats) {
        westStats.innerHTML = `
            <div class="matchup-stat">
                <span class="matchup-stat-value">${west.stats?.height || 5}</span>
                <span class="matchup-stat-label">Height</span>
            </div>
            <div class="matchup-stat">
                <span class="matchup-stat-value">${west.stats?.weight || 5}</span>
                <span class="matchup-stat-label">Weight</span>
            </div>
            <div class="matchup-stat">
                <span class="matchup-stat-value">${west.stats?.speed || 5}</span>
                <span class="matchup-stat-label">Speed</span>
            </div>
            <div class="matchup-stat">
                <span class="matchup-stat-value">${west.stats?.technique || 5}</span>
                <span class="matchup-stat-label">Technique</span>
            </div>
        `;
    }
    if (westRecord) westRecord.textContent = `${west.wins || 0}W - ${west.losses || 0}L`;

    // Clear any existing countdown interval to prevent duplicates
    if (GameState.matchupCountdownInterval) {
        console.log('Clearing existing countdown interval');
        clearInterval(GameState.matchupCountdownInterval);
        GameState.matchupCountdownInterval = null;
    }

    // Start countdown
    let countdown = 5;
    const countdownEl = document.getElementById('matchup-countdown');
    if (countdownEl) countdownEl.textContent = countdown;
    console.log('Starting matchup countdown from', countdown);

    GameState.matchupCountdownInterval = setInterval(() => {
        countdown--;
        console.log('Countdown tick:', countdown);
        if (countdownEl) countdownEl.textContent = countdown;

        if (countdown <= 0) {
            console.log('Countdown complete, transitioning to battle');
            clearInterval(GameState.matchupCountdownInterval);
            GameState.matchupCountdownInterval = null;
            GameState.matchupSetupForMatchId = null; // Reset for next match
            // Fade out and transition to battle
            const screen = document.querySelector('.matchup-screen');
            if (screen) {
                screen.style.animation = 'matchupFadeOut 0.5s ease-out forwards';
            }
            setTimeout(() => {
                setState({ screen: 'battle' });
            }, 500);
        }
    }, 1000);
}

// ============================================
// BOUT WINNER SCREEN
// ============================================

function setupBoutWinnerScreen() {
    const match = GameState.lastCompletedMatch;
    if (!match || !match.winner) {
        console.log('No completed match data, going to lobby');
        setState({ screen: 'lobby' });
        return;
    }

    // Prevent re-running setup for the same match
    if (GameState.boutWinnerSetupForMatchId === match.id) {
        console.log('Bout winner screen already setup for this match, skipping');
        return;
    }
    GameState.boutWinnerSetupForMatchId = match.id;
    console.log('Setting up bout winner screen for match:', match.id);

    const winner = match[match.winner];
    const winnerWrestler = WRESTLERS.find(w => w.id === winner.wrestlerId);

    // Set winner image
    const winnerImage = document.getElementById('bout-winner-image');
    if (winnerImage) {
        winnerImage.src = winnerWrestler?.image || 'images/ukiyo-e-sumo.jpg';
    }

    // Set winner name
    const winnerName = document.getElementById('bout-winner-name');
    if (winnerName) {
        winnerName.textContent = winner.rikishiName;
    }

    // Set winning move - get the finish phase result
    const winningMove = document.getElementById('bout-winner-move');
    if (winningMove) {
        const finishResult = match.phaseResults?.finish;
        let moveText = 'Victory!';
        if (finishResult) {
            const winnerChoice = finishResult[match.winner + 'Choice'];
            // Find the label for this choice
            const finishPhase = PHASES.finish;
            const choiceData = finishPhase?.choices.find(c => c.id === winnerChoice);
            if (choiceData) {
                moveText = `by ${choiceData.label}`;
            }
        }
        winningMove.textContent = moveText;
    }

    // Set record
    const winnerRecord = document.getElementById('bout-winner-record');
    if (winnerRecord) {
        const wins = winner.wins || 0;
        const losses = winner.losses || 0;
        winnerRecord.innerHTML = `<span class="wins">${wins}W</span> - <span class="losses">${losses}L</span>`;
    }

    // Auto-transition to next matchup after 4 seconds
    setTimeout(() => {
        // Fade out
        const screen = document.querySelector('.bout-winner-screen');
        if (screen) {
            screen.style.animation = 'boutWinnerFadeOut 0.5s ease-out forwards';
        }

        setTimeout(() => {
            GameState.boutWinnerSetupForMatchId = null;
            // Check if there's a next match
            handleNextBout();
        }, 500);
    }, 4000);
}

// ============================================
// BATTLE SCREEN
// ============================================

function setupBattleScreen() {
    const match = GameState.match;
    if (!match) {
        setState({ screen: 'lobby' });
        return;
    }

    // Play battle start sound
    SoundManager.playBattleStart();

    // Start timer beats
    SoundManager.startTimerBeats(10);

    // Determine our side
    if (match.east.email === GameState.user?.email) {
        GameState.mySide = 'east';
    } else if (match.west.email === GameState.user?.email) {
        GameState.mySide = 'west';
    } else {
        GameState.mySide = 'spectator';
    }

    // Render wrestlers
    renderWrestlers(match);

    // Render current phase
    renderPhase(match.currentPhase);

    // Set up choice buttons
    setupChoiceButtons();

    // Render sidebar players
    renderSidebarPlayers();

    // Show spectator panel if not in match
    if (GameState.mySide === 'spectator') {
        document.getElementById('choice-panel').classList.add('hidden');
        document.getElementById('spectator-panel').classList.remove('hidden');
    }
}

function renderWrestlers(match) {
    // East wrestler
    const eastWrestler = WRESTLERS.find(w => w.id === match.east.wrestlerId);
    const eastImg = document.getElementById('east-image');
    eastImg.src = eastWrestler?.image || PLACEHOLDER_IMAGE;
    eastImg.onerror = function() { if(!this.dataset.failed){this.dataset.failed='1';this.src=PLACEHOLDER_IMAGE;} };
    document.getElementById('east-rikishi').textContent = match.east.rikishiName;
    document.getElementById('east-player').textContent = match.east.playerName;

    // West wrestler
    const westWrestler = WRESTLERS.find(w => w.id === match.west.wrestlerId);
    const westImg = document.getElementById('west-image');
    westImg.src = westWrestler?.image || PLACEHOLDER_IMAGE;
    westImg.onerror = function() { if(!this.dataset.failed){this.dataset.failed='1';this.src=PLACEHOLDER_IMAGE;} };
    document.getElementById('west-rikishi').textContent = match.west.rikishiName;
    document.getElementById('west-player').textContent = match.west.playerName;
}

function renderPhase(phaseName) {
    const phase = PHASES[phaseName];
    if (!phase) return;

    document.getElementById('phase-name').textContent = phase.name;

    // Render choices
    const choicesContainer = document.getElementById('choices');
    choicesContainer.innerHTML = phase.choices.map(c => `
        <button class="choice-btn" data-choice="${c.id}">
            <span class="choice-icon">${c.icon}</span>
            <span class="choice-label">${c.label}</span>
        </button>
    `).join('');
}

function setupChoiceButtons() {
    const choicesContainer = document.getElementById('choices');
    const confirmBtn = document.getElementById('confirm-choice');

    choicesContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.choice-btn');
        if (!btn) return;

        // Play selection sound
        SoundManager.playSelect();

        // Update selection
        choicesContainer.querySelectorAll('.choice-btn').forEach(b => {
            b.classList.remove('selected');
        });
        btn.classList.add('selected');

        GameState.ui.selectedChoice = btn.dataset.choice;
        confirmBtn.disabled = false;
    });

    confirmBtn.addEventListener('click', submitChoice);
}

async function submitChoice() {
    const choice = GameState.ui.selectedChoice;
    if (!choice) return;

    const confirmBtn = document.getElementById('confirm-choice');
    confirmBtn.disabled = true;

    showLoading(true);
    try {
        const data = await API.submitChoice(choice);

        if (data.waiting) {
            // Show waiting overlay
            document.getElementById('waiting-overlay').classList.remove('hidden');
            document.getElementById('choice-panel').classList.add('hidden');
        } else {
            // Phase resolved
            showPhaseResult(data.phaseResult);

            // Update state
            setState({
                match: data.match,
                players: data.players
            });

            // Check if match complete
            if (data.match.status === 'completed') {
                // Stop timer beats
                SoundManager.stopTimerBeats();

                // Play victory sound
                SoundManager.playVictory();

                const winner = data.match[data.match.winner];
                const loser = data.match[data.match.winner === 'east' ? 'west' : 'east'];
                const finishResult = data.match.phaseResults?.finish;
                const winningMove = finishResult
                    ? PHASES.finish.choices.find(c => c.id === (data.match.winner === 'east' ? finishResult.eastChoice : finishResult.westChoice))?.label
                    : 'decision';

                // Show full results in activity feed
                addActivityEntry(`<strong>${winner?.rikishiName}</strong> defeats ${loser?.rikishiName} by ${winningMove}!`, 'winner');

                // Update user's record display
                if (winner?.email === GameState.user?.email) {
                    GameState.user.wins = (GameState.user.wins || 0) + 1;
                } else if (loser?.email === GameState.user?.email) {
                    GameState.user.losses = (GameState.user.losses || 0) + 1;
                }

                // Store completed match and show bout-winner screen after brief delay
                setTimeout(() => {
                    setState({
                        lastCompletedMatch: data.match,
                        screen: 'bout-winner'
                    });
                }, 2000);
            } else {
                // Advance to next phase after delay
                setTimeout(() => {
                    GameState.ui.selectedChoice = null;
                    renderPhase(data.match.currentPhase);
                    document.getElementById('waiting-overlay').classList.add('hidden');
                    document.getElementById('choice-panel').classList.remove('hidden');
                    document.getElementById('confirm-choice').disabled = true;

                    // Clear announcements
                    document.getElementById('east-announcement').textContent = '';
                    document.getElementById('west-announcement').textContent = '';

                    // Restart timer beats for next phase
                    SoundManager.startTimerBeats(10);
                }, 2500);
            }
        }
    } catch (e) {
        showError(e.message || 'Failed to submit choice');
        confirmBtn.disabled = false;
    }
    showLoading(false);
}

function showPhaseResult(result) {
    // Stop timer beats while showing result
    SoundManager.stopTimerBeats();

    // Play phase result sound
    const isMyWin = result.winner === GameState.mySide;
    SoundManager.playPhaseResult(isMyWin);

    // Show announcements
    document.getElementById('east-announcement').textContent = result.eastAnnouncement || '';
    document.getElementById('west-announcement').textContent = result.westAnnouncement || '';

    // Add to activity feed
    const match = GameState.match;
    const phaseName = result.phaseName || result.phase;

    if (result.eastAnnouncement) {
        addActivityEntry(result.eastAnnouncement, 'action');
    }
    if (result.westAnnouncement) {
        addActivityEntry(result.westAnnouncement, 'action');
    }

    if (result.winner && match) {
        const winnerName = match[result.winner]?.rikishiName || result.winner;
        addActivityEntry(`<strong>${phaseName}:</strong> ${winnerName} wins the exchange!`, 'phase');
    }

    // Highlight winner if any
    if (result.winner) {
        document.querySelector(`.wrestler-panel.${result.winner}`).classList.add('phase-winner');
        setTimeout(() => {
            document.querySelectorAll('.wrestler-panel').forEach(el => {
                el.classList.remove('phase-winner');
            });
        }, 2000);
    }
}

function renderSidebarPlayers() {
    const list = document.getElementById('sidebar-players');
    if (!list) return;

    // Sort by wins (descending), then alphabetically by rikishiName
    const sortedPlayers = [...GameState.players].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.rikishiName.localeCompare(b.rikishiName);
    });

    list.innerHTML = sortedPlayers.map(p => `
        <li class="sidebar-player ${p.email === GameState.match?.east?.email || p.email === GameState.match?.west?.email ? 'in-match' : ''}">
            <span>${p.rikishiName}</span>
            <span class="sidebar-record">${p.wins}W-${p.losses}L</span>
        </li>
    `).join('');
}

// ============================================
// RESULTS SCREEN
// ============================================

function setupResultsScreen() {
    const match = GameState.match;
    if (!match || !match.winner) {
        // No valid match data, go back to lobby
        setState({ screen: 'lobby' });
        return;
    }

    const winner = match[match.winner];
    const loser = match[match.winner === 'east' ? 'west' : 'east'];

    if (!winner) {
        setState({ screen: 'lobby' });
        return;
    }

    // Winner announcement
    document.getElementById('winner-announcement').textContent =
        `${winner.rikishiName} wins!`;

    // Winning move
    const finishResult = match.phaseResults?.finish;
    if (finishResult) {
        const winningChoice = PHASES.finish.choices.find(c =>
            c.id === (match.winner === 'east' ? finishResult.eastChoice : finishResult.westChoice)
        );
        document.getElementById('winning-move').textContent =
            `Victory by ${winningChoice?.label || 'decision'}!`;
    }

    // Match summary
    const summary = document.getElementById('match-summary');
    summary.innerHTML = Object.entries(match.phaseResults || {}).map(([phase, result]) => {
        const phaseData = PHASES[phase];
        return `
            <div class="phase-summary">
                <strong>${phaseData?.name || phase}:</strong>
                ${result.winner ? `Winner: ${match[result.winner].rikishiName}` : 'No winner'}
            </div>
        `;
    }).join('');

    // Qualification status
    const qualStatus = document.getElementById('qualification-status');
    const winsNeeded = 5;

    if (winner.email === GameState.user?.email) {
        const newWins = (GameState.user.wins || 0) + 1;
        if (newWins >= winsNeeded) {
            qualStatus.innerHTML = `<span class="qualified">You have qualified for the finals!</span>`;
        } else {
            qualStatus.innerHTML = `<span>Wins: ${newWins}/${winsNeeded} to qualify</span>`;
        }
    } else if (loser.email === GameState.user?.email) {
        qualStatus.innerHTML = `<span>Better luck next time!</span>`;
    }
}

async function handleNextBout() {
    showLoading(true);
    try {
        const data = await API.nextMatch();
        if (data.success) {
            // Process any AI matches and keep getting next until we find a human match or no more matches
            let currentMatch = data.currentMatch;
            let players = data.players;

            // Show AI matches in feed but don't loop infinitely - just show results
            while (currentMatch && currentMatch.isAIvsAI) {
                displayAIMatchResult(currentMatch);
                players = data.players;

                // Get next match
                const nextData = await API.nextMatch();
                if (!nextData.success) break;
                currentMatch = nextData.currentMatch;
                players = nextData.players || players;
            }

            if (currentMatch) {
                // Check if we're in this match
                const inMatch = currentMatch.east.email === GameState.user?.email ||
                               currentMatch.west.email === GameState.user?.email;

                // Announce the match
                addActivityEntry(`<strong>Next match:</strong> ${currentMatch.east.rikishiName} vs ${currentMatch.west.rikishiName}`, 'match');

                if (inMatch) {
                    // Notify player it's their turn
                    addActivityEntry(`<strong>YOUR TURN!</strong> Get ready to battle!`, 'winner');
                    setState({
                        match: currentMatch,
                        players: players,
                        screen: 'matchup'
                    });
                } else {
                    // Spectator mode - go to lobby to watch feed
                    setState({
                        match: currentMatch,
                        players: players,
                        screen: 'lobby'
                    });
                }
            } else {
                addActivityEntry('<strong>Tournament complete!</strong> No more matches.', 'winner');
                setState({
                    match: null,
                    players: players,
                    screen: 'lobby'
                });
            }
        }
    } catch (e) {
        showError(e.message || 'Failed to get next match');
        setState({ screen: 'lobby' });
    }
    showLoading(false);
}

// ============================================
// AI MATCH NOTIFICATION
// ============================================

/**
 * Add entry to activity feed
 */
function addActivityEntry(message, type = 'info') {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;

    const entry = document.createElement('div');
    entry.className = `activity-entry activity-${type}`;
    entry.innerHTML = `<span class="activity-time">${new Date().toLocaleTimeString()}</span> ${message}`;

    // Add to top of feed
    feed.insertBefore(entry, feed.firstChild);

    // Keep only last 50 entries
    while (feed.children.length > 50) {
        feed.removeChild(feed.lastChild);
    }
}

/**
 * Display AI match result in activity feed (non-blocking)
 */
function displayAIMatchResult(match) {
    if (!match) return;

    const eastName = match.east?.rikishiName || 'CPU';
    const westName = match.west?.rikishiName || 'CPU';
    const winnerName = match.winner && match[match.winner]
        ? match[match.winner].rikishiName
        : 'Unknown';

    // Add to activity feed
    addActivityEntry(`<strong>CPU Match:</strong> ${eastName} vs ${westName}`, 'match');
    addActivityEntry(`<strong>${winnerName}</strong> wins!`, 'winner');
}

// ============================================
// CHAMPION SCREEN
// ============================================

function setupChampionScreen() {
    const winner = GameState.tournamentWinner;
    if (!winner) {
        setState({ screen: 'lobby' });
        return;
    }

    // Play champion celebration fanfare
    SoundManager.playChampion();

    // Set champion image
    const wrestler = WRESTLERS.find(w => w.id === winner.wrestlerId);
    const image = wrestler?.image || PLACEHOLDER_IMAGE;

    const championImg = document.getElementById('champion-image');
    championImg.src = image;
    championImg.alt = winner.rikishiName;
    championImg.onerror = function() {
        if(!this.dataset.failed) {
            this.dataset.failed = '1';
            this.src = PLACEHOLDER_IMAGE;
        }
    };

    document.getElementById('champion-name').textContent = winner.rikishiName;
    document.getElementById('champion-player').textContent = winner.playerName;
    document.getElementById('champion-record').textContent = `${winner.wins}W - ${winner.losses}L`;

    // Start confetti
    startConfetti();
}

function startConfetti() {
    const confettiContainer = document.getElementById('confetti');
    if (!confettiContainer) return;

    const colors = ['#d4af37', '#c41e3a', '#1a472a', '#fff', '#ff6b35'];

    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 4 + 's';
        piece.style.animationDuration = (3 + Math.random() * 2) + 's';
        confettiContainer.appendChild(piece);
    }
}

async function handleNewTournament() {
    if (!GameState.isAdmin) {
        // Non-admin goes to lobby
        setState({
            screen: 'lobby',
            tournamentWinner: null
        });
        return;
    }

    // Admin resets and can start a new tournament
    showLoading(true);
    try {
        const data = await API.resetTournament();
        if (data.success) {
            addActivityEntry('<strong>Tournament reset!</strong> Ready for a new tournament.', 'info');
            setState({
                screen: 'lobby',
                players: data.players,
                match: null,
                tournamentWinner: null
            });
        }
    } catch (e) {
        showError(e.message || 'Failed to reset tournament');
    }
    showLoading(false);
}

async function handleResetTournament() {
    if (!GameState.isAdmin) {
        showError('Only admin can reset the tournament');
        return;
    }

    if (!confirm('Reset tournament? This will clear all matches and CPU players.')) {
        return;
    }

    showLoading(true);
    try {
        const data = await API.resetTournament();
        if (data.success) {
            // Stop any timer beats
            if (typeof SoundManager !== 'undefined') {
                SoundManager.stopTimerBeats();
            }

            addActivityEntry('<strong>Tournament reset!</strong> Waiting for admin to start.', 'info');
            setState({
                screen: 'lobby',
                players: data.players,
                match: null,
                tournamentWinner: null
            });
        }
    } catch (e) {
        showError(e.message || 'Failed to reset tournament');
    }
    showLoading(false);
}
