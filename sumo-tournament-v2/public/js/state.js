/**
 * SUMO TOURNAMENT V2 - State Management
 * Single source of truth for all UI state
 */

const GameState = {
    // Current screen
    screen: 'home', // home | login | register | lobby | matchup | battle | bout-winner | results | champion

    // Last completed match (for bout-winner screen)
    lastCompletedMatch: null,

    // User & session
    user: null,
    token: null,
    isAdmin: false,

    // Players list
    players: [],

    // Current match
    match: null,
    mySide: null, // 'east' | 'west' | 'spectator'

    // Tournament winner (when someone reaches 5 wins)
    tournamentWinner: null,
    winsToQualify: 5,

    // Registration flow
    registerStep: 1,
    registerData: {
        email: '',
        playerName: '',
        rikishiName: '',
        wrestlerId: null,
        stats: { height: 5, weight: 5, speed: 5, technique: 5 },
        signatureMove: 'yorikiri'
    },

    // Timer
    timer: {
        seconds: 10,
        running: false,
        intervalId: null
    },

    // UI state
    ui: {
        loading: false,
        error: null,
        selectedChoice: null
    },

    // Polling interval
    pollIntervalId: null
};

/**
 * Update state and trigger re-render
 */
function setState(updates, options = {}) {
    const previousScreen = GameState.screen;

    // Deep merge updates
    for (const key in updates) {
        if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
            GameState[key] = { ...GameState[key], ...updates[key] };
        } else {
            GameState[key] = updates[key];
        }
    }

    // Persist session data
    if (updates.token !== undefined || updates.user !== undefined) {
        saveSession();
    }

    // Only re-render if screen changed or explicitly requested
    // Skip re-render for polling updates on battle/matchup/bout-winner screens to preserve UI state
    const screenChanged = updates.screen !== undefined && updates.screen !== previousScreen;
    const skipRender = options.skipRender ||
        ((GameState.screen === 'battle' || GameState.screen === 'matchup' || GameState.screen === 'bout-winner') && !screenChanged && !updates.screen);

    if (!skipRender && typeof renderScreen === 'function') {
        renderScreen();
    }
}

/**
 * Save session to localStorage
 */
function saveSession() {
    if (GameState.token && GameState.user) {
        localStorage.setItem('sumo_session', JSON.stringify({
            token: GameState.token,
            user: GameState.user,
            isAdmin: GameState.isAdmin
        }));
    } else {
        localStorage.removeItem('sumo_session');
    }
}

/**
 * Load session from localStorage
 */
function loadSession() {
    try {
        const saved = localStorage.getItem('sumo_session');
        if (saved) {
            const data = JSON.parse(saved);
            GameState.token = data.token;
            GameState.user = data.user;
            GameState.isAdmin = data.isAdmin;
            return true;
        }
    } catch (e) {
        console.error('Failed to load session:', e);
    }
    return false;
}

/**
 * Clear session
 */
function clearSession() {
    GameState.token = null;
    GameState.user = null;
    GameState.isAdmin = false;
    localStorage.removeItem('sumo_session');
}

/**
 * Start polling for updates
 */
function startPolling() {
    if (GameState.pollIntervalId) return;

    GameState.pollIntervalId = setInterval(async () => {
        if (!GameState.token) return;

        try {
            const data = await API.heartbeat();
            if (data.success) {
                // Track previous phase to detect changes
                const prevPhase = GameState.match?.currentPhase;
                const prevMatchId = GameState.match?.id;

                // Update state without re-rendering (preserves UI state like button selections)
                GameState.players = data.players || GameState.players;
                GameState.match = data.currentMatch;

                // Detect phase change during active match
                const newPhase = data.currentMatch?.currentPhase;
                const newMatchId = data.currentMatch?.id;
                const phaseChanged = prevPhase && newPhase && prevPhase !== newPhase && prevMatchId === newMatchId;

                // If phase changed, update the battle UI without full re-render
                if (phaseChanged && GameState.screen === 'battle') {
                    console.log(`Phase changed: ${prevPhase} -> ${newPhase}`);
                    handlePhaseChange(data.currentMatch);
                }

                // Detect match completion during polling
                const matchCompleted = data.currentMatch?.status === 'completed' &&
                                       prevMatchId === newMatchId &&
                                       GameState.screen === 'battle';
                if (matchCompleted) {
                    console.log('Match completed during polling');
                    handleMatchCompletedDuringPolling(data.currentMatch);
                }

                // Detect new match started (different match ID)
                const newMatchStarted = prevMatchId && newMatchId && prevMatchId !== newMatchId;
                if (newMatchStarted && (GameState.screen === 'battle' || GameState.screen === 'matchup')) {
                    console.log('New match started, showing matchup screen');
                    // Check if we're in this new match
                    const inMatch = data.currentMatch.east.email === GameState.user?.email ||
                                   data.currentMatch.west.email === GameState.user?.email;
                    if (inMatch && data.currentMatch.status === 'active') {
                        setState({ screen: 'matchup', match: data.currentMatch });
                    }
                }

                // Sync current user's record from server
                if (GameState.user && data.players) {
                    const serverUser = data.players.find(p => p.email === GameState.user.email);
                    if (serverUser) {
                        GameState.user.wins = serverUser.wins;
                        GameState.user.losses = serverUser.losses;
                    }
                }

                // Update timer if match is active
                if (data.timerRemaining !== null && data.currentMatch?.status === 'active') {
                    updateTimer(Math.ceil(data.timerRemaining));
                }

                // Handle timer expiration - server auto-resolved the phase
                if (data.timerExpired && GameState.screen === 'battle') {
                    handleTimerExpired(data.currentMatch);
                }

                // Check for tournament winner
                if (data.tournamentWinner && !GameState.tournamentWinner) {
                    // Someone won the tournament!
                    GameState.tournamentWinner = data.tournamentWinner;
                    GameState.winsToQualify = data.winsToQualify || 5;

                    // Show in activity feed first
                    if (typeof addActivityEntry === 'function') {
                        const isYou = data.tournamentWinner.email === GameState.user?.email;
                        if (isYou) {
                            addActivityEntry(`<strong>CONGRATULATIONS!</strong> You are the TOURNAMENT CHAMPION!`, 'winner');
                        } else {
                            addActivityEntry(`<strong>${data.tournamentWinner.rikishiName}</strong> has won the tournament!`, 'winner');
                        }
                    }

                    // Transition to champion screen after brief delay
                    setTimeout(() => {
                        setState({ screen: 'champion' });
                    }, 1500);
                    return;
                }

                // Check if we need to transition screens (this will call setState with screen change if needed)
                checkMatchState(data.currentMatch);

                // Update lobby player list if on lobby screen (non-destructive DOM update)
                if (GameState.screen === 'lobby' && typeof renderPlayerList === 'function') {
                    renderPlayerList();
                }
            }
        } catch (e) {
            console.error('Polling error:', e);
            // If session is invalid, clear it and go to home
            if (e.message === 'Invalid session') {
                stopPolling();
                clearSession();
                setState({ screen: 'home' });
            }
        }
    }, 2000);
}

/**
 * Stop polling
 */
function stopPolling() {
    if (GameState.pollIntervalId) {
        clearInterval(GameState.pollIntervalId);
        GameState.pollIntervalId = null;
    }
}

/**
 * Check match state and transition screens if needed
 */
function checkMatchState(match) {
    if (!match) return;

    // Determine our side
    if (GameState.user) {
        if (match.east.email === GameState.user.email) {
            GameState.mySide = 'east';
        } else if (match.west.email === GameState.user.email) {
            GameState.mySide = 'west';
        } else {
            GameState.mySide = 'spectator';
        }
    }

    // Handle AI vs AI match
    if (match.isAIvsAI && match.status === 'completed') {
        if (GameState.screen === 'battle' || GameState.screen === 'lobby') {
            showAIMatchResult(match);
        }
        return;
    }

    // Transition to matchup if match started and we're in lobby
    if (match.status === 'active' && GameState.screen === 'lobby') {
        if (GameState.mySide !== 'spectator') {
            setState({ screen: 'matchup' });
        }
    }

    // Match completion is now handled by submitChoice() in app.js
    // Results are shown in the activity feed and next match auto-starts
}

/**
 * Handle match completion detected during polling
 */
function handleMatchCompletedDuringPolling(match) {
    if (!match) return;

    // Stop timer beats
    if (typeof SoundManager !== 'undefined') {
        SoundManager.stopTimerBeats();
        SoundManager.playVictory();
    }

    const winner = match[match.winner];
    const loser = match[match.winner === 'east' ? 'west' : 'east'];

    // Show result in activity feed
    if (typeof addActivityEntry === 'function') {
        addActivityEntry(`<strong>${winner?.rikishiName}</strong> defeats ${loser?.rikishiName}!`, 'winner');
    }

    // Update user's record
    if (winner?.email === GameState.user?.email) {
        GameState.user.wins = (GameState.user.wins || 0) + 1;
    } else if (loser?.email === GameState.user?.email) {
        GameState.user.losses = (GameState.user.losses || 0) + 1;
    }

    // Show bout-winner screen
    setTimeout(() => {
        setState({
            lastCompletedMatch: match,
            screen: 'bout-winner'
        });
    }, 2500);
}

/**
 * Handle phase change detected during polling
 * Updates the battle UI without full re-render
 */
function handlePhaseChange(match) {
    if (!match || GameState.screen !== 'battle') return;

    // IMMEDIATELY update UI - this is critical for sync
    const waitingOverlay = document.getElementById('waiting-overlay');
    const choicePanel = document.getElementById('choice-panel');
    const confirmBtn = document.getElementById('confirm-choice');

    // Hide waiting, show choice panel
    if (waitingOverlay) waitingOverlay.classList.add('hidden');
    if (choicePanel) choicePanel.classList.remove('hidden');

    // Reset UI state
    GameState.ui.selectedChoice = null;
    if (confirmBtn) confirmBtn.disabled = true;

    // Update phase display IMMEDIATELY so player can choose
    if (typeof renderPhase === 'function') {
        renderPhase(match.currentPhase);
    }

    // Stop current timer beats and restart for new phase
    if (typeof SoundManager !== 'undefined') {
        SoundManager.stopTimerBeats();
        SoundManager.startTimerBeats(10);
    }

    // Get the previous phase result to show announcements
    const phaseOrder = ['salt', 'display', 'tachiai', 'technique', 'finish'];
    const currentIdx = phaseOrder.indexOf(match.currentPhase);
    const prevPhase = currentIdx > 0 ? phaseOrder[currentIdx - 1] : null;
    const prevResult = prevPhase ? match.phaseResults[prevPhase] : null;

    // Show previous phase result announcements briefly
    if (prevResult && typeof showPhaseResult === 'function') {
        showPhaseResult(prevResult);

        // Clear announcements after a short delay
        setTimeout(() => {
            const eastAnn = document.getElementById('east-announcement');
            const westAnn = document.getElementById('west-announcement');
            if (eastAnn) eastAnn.textContent = '';
            if (westAnn) westAnn.textContent = '';
        }, 2000);
    }
}

/**
 * Update timer display
 */
function updateTimer(seconds) {
    const prevSeconds = GameState.timer.seconds;
    GameState.timer.seconds = seconds;
    const timerEl = document.querySelector('.timer-value');
    if (timerEl) {
        timerEl.textContent = seconds;
        timerEl.classList.toggle('warning', seconds <= 3);

        // Play warning sound when entering last 3 seconds
        if (seconds <= 3 && prevSeconds > 3 && typeof SoundManager !== 'undefined') {
            SoundManager.playWarning();
        }
    }
}

/**
 * Handle timer expiration - server auto-resolved
 */
function handleTimerExpired(match) {
    if (!match) return;

    // Show timeout message in activity feed
    if (typeof addActivityEntry === 'function') {
        addActivityEntry('<strong>TIME\'S UP!</strong> Random moves selected.', 'warning');
    }

    // If match is still active, the phase was resolved - update UI
    if (match.status === 'active') {
        // Get the previous phase result (most recent)
        const phaseOrder = ['salt', 'display', 'tachiai', 'technique', 'finish'];
        const currentIdx = phaseOrder.indexOf(match.currentPhase);
        const prevPhase = currentIdx > 0 ? phaseOrder[currentIdx - 1] : null;
        const prevResult = prevPhase ? match.phaseResults[prevPhase] : null;

        if (prevResult && typeof showPhaseResult === 'function') {
            showPhaseResult(prevResult);
        }

        // Reset UI for new phase
        setTimeout(() => {
            GameState.ui.selectedChoice = null;
            if (typeof renderPhase === 'function') {
                renderPhase(match.currentPhase);
            }
            document.getElementById('waiting-overlay')?.classList.add('hidden');
            document.getElementById('choice-panel')?.classList.remove('hidden');
            const confirmBtn = document.getElementById('confirm-choice');
            if (confirmBtn) confirmBtn.disabled = true;

            // Clear announcements
            const eastAnn = document.getElementById('east-announcement');
            const westAnn = document.getElementById('west-announcement');
            if (eastAnn) eastAnn.textContent = '';
            if (westAnn) westAnn.textContent = '';
        }, 2500);
    } else if (match.status === 'completed') {
        // Match is over - show bout-winner screen
        const winner = match[match.winner];
        const loser = match[match.winner === 'east' ? 'west' : 'east'];

        if (typeof addActivityEntry === 'function') {
            addActivityEntry(`<strong>${winner?.rikishiName}</strong> defeats ${loser?.rikishiName}!`, 'winner');
        }

        // Update user's record
        if (winner?.email === GameState.user?.email) {
            GameState.user.wins = (GameState.user.wins || 0) + 1;
        } else if (loser?.email === GameState.user?.email) {
            GameState.user.losses = (GameState.user.losses || 0) + 1;
        }

        // Show bout-winner screen
        setTimeout(() => {
            setState({
                lastCompletedMatch: match,
                screen: 'bout-winner'
            });
        }, 2000);
    }
}

/**
 * Show AI match result in activity feed
 */
function showAIMatchResult(match) {
    if (typeof displayAIMatchResult === 'function') {
        displayAIMatchResult(match);
    }
}

/**
 * Show loading overlay
 */
function showLoading(show = true) {
    // Update state without re-rendering
    GameState.ui.loading = show;
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
    }
}

/**
 * Show error toast
 */
function showError(message) {
    // Update state without re-rendering
    GameState.ui.error = message;
    const toast = document.getElementById('error-toast');
    if (toast) {
        toast.querySelector('.error-message').textContent = message;
        toast.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 5000);
    }
}

/**
 * Clear error
 */
function clearError() {
    setState({ ui: { ...GameState.ui, error: null } });
    const toast = document.getElementById('error-toast');
    if (toast) {
        toast.classList.add('hidden');
    }
}
