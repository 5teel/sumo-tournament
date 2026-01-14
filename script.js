// ==========================================
// SUMO TOURNAMENT - MAIN GAME SCRIPT
// ==========================================

let participants = [];
let wrestlers = [];
let selectedWrestlers = {};
let characterBuilds = {};
let matches = [];
let currentMatchIndex = 0;
let currentParticipantBuilding = null;

// Game state
let enteredParticipants = [];
let currentRound = 1;
let currentBoutIndex = 0;

// Battle state
let currentBattle = null;
let battlePhase = 0;
const PHASES = ['salt', 'display', 'tachiai', 'technique', 'finish'];

// January 2026 Hatsu Basho - Top 12 Ranked Rikishi
const wrestlerData = [
    { id: 1, name: "Hoshoryu", rank: "Yokozuna (East)", image: "hoshoryu.jpg" },
    { id: 2, name: "Onosato", rank: "Yokozuna (West)", image: "onosato.jpg" },
    { id: 3, name: "Kotozakura", rank: "Ozeki (East)", image: "kotozakura.jpg" },
    { id: 4, name: "Aonishiki", rank: "Ozeki (West)", image: "aonishiki.jpg" },
    { id: 5, name: "Kirishima", rank: "Sekiwake (East)", image: "kirishima.jpg" },
    { id: 6, name: "Takayasu", rank: "Sekiwake (West)", image: "takayasu.jpg" },
    { id: 7, name: "Oho", rank: "Komusubi (East)", image: "oho.jpg" },
    { id: 8, name: "Wakamotoharu", rank: "Komusubi (West)", image: "wakamotoharu.jpg" },
    { id: 9, name: "Ichiyamamoto", rank: "Maegashira 1 (East)", image: "ichiyamamoto.jpg" },
    { id: 10, name: "Yoshinofuji", rank: "Maegashira 1 (West)", image: "yoshinofuji.jpg" },
    { id: 11, name: "Ura", rank: "Maegashira 2 (East)", image: "ura.jpg" },
    { id: 12, name: "Shodai", rank: "Maegashira 2 (West)", image: "shodai.jpg" }
];

const signatureMoves = [
    { id: 1, name: "Yorikiri", japanese: "寄り切り", description: "Force out while holding belt", bonus: "weight", bonusAmount: 2 },
    { id: 2, name: "Oshidashi", japanese: "押し出し", description: "Push out without belt grip", bonus: "weight", bonusAmount: 2 },
    { id: 3, name: "Hatakikomi", japanese: "叩き込み", description: "Slap down technique", bonus: "speed", bonusAmount: 2 },
    { id: 4, name: "Uwatenage", japanese: "上手投げ", description: "Overarm throw", bonus: "technique", bonusAmount: 2 },
    { id: 5, name: "Tsukiotoshi", japanese: "突き落とし", description: "Thrust down", bonus: "height", bonusAmount: 2 },
    { id: 6, name: "Kotenage", japanese: "小手投げ", description: "Arm lock throw", bonus: "technique", bonusAmount: 2 },
    { id: 7, name: "Hikiotoshi", japanese: "引き落とし", description: "Pull down technique", bonus: "speed", bonusAmount: 2 },
    { id: 8, name: "Sukuinage", japanese: "掬い投げ", description: "Scoop throw", bonus: "height", bonusAmount: 2 }
];

// Character Builder State
let currentStats = { height: 5, weight: 5, speed: 5, technique: 5 };
let pointsRemaining = 10;
let selectedMove = null;
const MAX_STAT = 10;
const MIN_STAT = 1;

const placeholderImage = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='35' r='20' fill='%23999'/><ellipse cx='50' cy='80' rx='30' ry='25' fill='%23999'/></svg>";

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Form and buttons
    document.getElementById('registration-form').addEventListener('submit', handleRegistration);
    document.getElementById('confirm-selection').addEventListener('click', confirmSelection);
    document.getElementById('confirm-character').addEventListener('click', confirmCharacter);

    // Tournament buttons
    document.getElementById('enter-dohyo-btn').addEventListener('click', enterDohyo);
    document.getElementById('start-matches-btn').addEventListener('click', startMatches);
    document.getElementById('next-bout-btn').addEventListener('click', nextBout);
    document.getElementById('new-tournament-btn').addEventListener('click', resetTournament);

    // Battle buttons
    document.getElementById('next-phase-btn').addEventListener('click', proceedToNextPhase);
    document.getElementById('execute-finish-btn').addEventListener('click', executeFinishingMove);

    // Test mode buttons
    document.getElementById('test-mode-btn').addEventListener('click', startTestMode);
    document.getElementById('test-battle-btn').addEventListener('click', skipToBattle);

    // Stat buttons
    document.querySelectorAll('.stat-btn').forEach(btn => {
        btn.addEventListener('click', handleStatChange);
    });

    wrestlers = wrestlerData;
});

// ==========================================
// REGISTRATION PAGE FUNCTIONS
// ==========================================
let registerSelectedWrestler = null;
let registerStats = { height: 5, weight: 5, speed: 5, technique: 5 };
let registerPointsRemaining = 10;

function showRegistrationPage() {
    showSection('register');
    initRegisterWrestlerGrid();
    initRegisterSignatureMoves();
    resetRegistration();
}

function resetRegistration() {
    registerSelectedWrestler = null;
    registerStats = { height: 5, weight: 5, speed: 5, technique: 5 };
    registerPointsRemaining = 10;

    document.getElementById('player-email').value = '';
    document.getElementById('player-name').value = '';
    document.getElementById('rikishi-name').value = '';

    updateRegisterStatsDisplay();
    showRegisterStep(1);
}

function initRegisterWrestlerGrid() {
    const grid = document.getElementById('register-wrestler-grid');
    if (!grid) return;

    grid.innerHTML = '';
    wrestlerData.forEach(wrestler => {
        const savedImage = ImageManager.getWrestlerImage(wrestler.id);
        const card = document.createElement('div');
        card.className = 'register-wrestler-card';
        card.dataset.wrestlerId = wrestler.id;
        card.innerHTML = `
            <img src="${savedImage || placeholderImage}" alt="${wrestler.name}" onerror="this.onerror=null; this.src='${placeholderImage}'">
            <div class="name">${wrestler.name}</div>
            <div class="rank">${wrestler.rank}</div>
        `;
        card.addEventListener('click', () => selectRegisterWrestler(wrestler, card));
        grid.appendChild(card);
    });
}

function initRegisterSignatureMoves() {
    const select = document.getElementById('register-signature-move');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Your Finishing Move --</option>';
    signatureMoves.forEach(move => {
        const option = document.createElement('option');
        option.value = move.id;
        option.textContent = `${move.name} (${move.japanese}) - ${move.description}`;
        select.appendChild(option);
    });
}

function selectRegisterWrestler(wrestler, cardElement) {
    document.querySelectorAll('.register-wrestler-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');
    registerSelectedWrestler = wrestler;
    document.getElementById('step2-next').disabled = false;
}

function showRegisterStep(step) {
    document.querySelectorAll('.register-step').forEach(s => s.classList.remove('active'));
    const stepEl = document.getElementById(`register-step-${step}`);
    if (stepEl) stepEl.classList.add('active');
    if (step === 'complete') {
        document.getElementById('register-complete').classList.add('active');
    }
}

function goToStep1() {
    showRegisterStep(1);
}

function goToStep2() {
    const email = document.getElementById('player-email').value.trim();
    const name = document.getElementById('player-name').value.trim();

    if (!email || !name) {
        alert('Please enter your email and name');
        return;
    }

    showRegisterStep(2);
}

function goToStep3() {
    if (!registerSelectedWrestler) {
        alert('Please select a wrestler');
        return;
    }

    const savedImage = ImageManager.getWrestlerImage(registerSelectedWrestler.id);
    const rikishiName = document.getElementById('rikishi-name').value.trim() || registerSelectedWrestler.name;

    document.getElementById('register-wrestler-image').src = savedImage || placeholderImage;
    document.getElementById('register-wrestler-name').textContent = rikishiName;
    document.getElementById('register-wrestler-rank').textContent = registerSelectedWrestler.rank;

    showRegisterStep(3);
}

function adjustRegisterStat(stat, delta) {
    const newValue = registerStats[stat] + delta;
    const newPoints = registerPointsRemaining - delta;

    if (newValue < 1 || newValue > 10) return;
    if (newPoints < 0 || newPoints > 20) return;

    registerStats[stat] = newValue;
    registerPointsRemaining = newPoints;
    updateRegisterStatsDisplay();
}

function updateRegisterStatsDisplay() {
    document.getElementById('register-points').textContent = registerPointsRemaining;
    document.getElementById('register-stat-height').textContent = registerStats.height;
    document.getElementById('register-stat-weight').textContent = registerStats.weight;
    document.getElementById('register-stat-speed').textContent = registerStats.speed;
    document.getElementById('register-stat-technique').textContent = registerStats.technique;
}

function completeRegistration() {
    const moveSelect = document.getElementById('register-signature-move');
    if (!moveSelect.value) {
        alert('Please select a signature move');
        return;
    }

    const email = document.getElementById('player-email').value.trim();
    const playerName = document.getElementById('player-name').value.trim();
    const rikishiName = document.getElementById('rikishi-name').value.trim() || registerSelectedWrestler.name;
    const selectedMove = signatureMoves.find(m => m.id === parseInt(moveSelect.value));

    // Create participant
    const participantId = Date.now();
    const participant = { id: participantId, name: playerName, email: email };

    participants.push(participant);
    selectedWrestlers[participantId] = registerSelectedWrestler.id;
    customWrestlerNames[participantId] = rikishiName;
    characterBuilds[participantId] = {
        stats: { ...registerStats },
        move: selectedMove
    };

    // Show success
    const savedImage = ImageManager.getWrestlerImage(registerSelectedWrestler.id);
    document.getElementById('success-wrestler-image').src = savedImage || placeholderImage;
    document.getElementById('success-rikishi-name').textContent = rikishiName;
    document.getElementById('success-wrestler-rank').textContent = registerSelectedWrestler.rank;

    showRegisterStep('complete');

    console.log('Registration complete:', {
        participant,
        wrestler: registerSelectedWrestler.name,
        rikishiName,
        stats: registerStats,
        move: selectedMove.name
    });
}

function goToTournament() {
    showSection('tournament');
    showTournamentView('registration');
    updateParticipantList();
}

// ==========================================
// TEST MODE FUNCTIONS
// ==========================================
function startTestMode() {
    console.log('Starting Test Mode...');

    // Create test participants
    participants = [
        { id: 1001, name: 'Player 1 (You)', email: 'player1@test.com' },
        { id: 1002, name: 'CPU Opponent', email: 'cpu@test.com' }
    ];

    // Assign wrestlers
    selectedWrestlers = {
        1001: 1, // Hoshoryu for Player 1
        1002: 3  // Kotozakura for CPU
    };

    // Create character builds
    characterBuilds = {
        1001: {
            stats: { height: 7, weight: 8, speed: 5, technique: 5 },
            move: signatureMoves[0] // Yorikiri
        },
        1002: {
            stats: { height: 6, weight: 7, speed: 6, technique: 6 },
            move: signatureMoves[3] // Uwatenage
        }
    };

    updateParticipantList();

    // Go to lobby
    initializeLobby();

    console.log('Test Mode initialized - starting from Lobby');
}

function skipToBattle() {
    console.log('Skipping directly to Battle...');

    // Create test participants
    participants = [
        { id: 1001, name: 'Player 1 (You)', email: 'player1@test.com' },
        { id: 1002, name: 'CPU Opponent', email: 'cpu@test.com' }
    ];

    // Assign wrestlers
    selectedWrestlers = {
        1001: 1, // Hoshoryu
        1002: 3  // Kotozakura
    };

    // Create character builds with different stat distributions
    characterBuilds = {
        1001: {
            stats: { height: 7, weight: 8, speed: 5, technique: 5 },
            move: signatureMoves[0] // Yorikiri - belt grip move
        },
        1002: {
            stats: { height: 6, weight: 7, speed: 6, technique: 6 },
            move: signatureMoves[3] // Uwatenage - overarm throw
        }
    };

    // Set up single match
    matches = [{
        east: {
            participant: participants[0],
            wrestler: wrestlers.find(w => w.id === 1),
            build: characterBuilds[1001]
        },
        west: {
            participant: participants[1],
            wrestler: wrestlers.find(w => w.id === 3),
            build: characterBuilds[1002]
        },
        winner: null,
        winningMove: null
    }];

    currentBoutIndex = 0;
    enteredParticipants = [1001, 1002];

    // Jump straight to battle
    initializeBattle();

    console.log('Test Mode initialized - Battle started');
    console.log('East: Hoshoryu (Yorikiri) - H:7 W:8 S:5 T:5');
    console.log('West: Kotozakura (Uwatenage) - H:6 W:7 S:6 T:6');
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');

    if (sectionId === 'tournament' && participants.length > 0) {
        showTournamentView('selection');
        displayWrestlers();
    }
}

function showTournamentView(viewName) {
    document.querySelectorAll('.tournament-view').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) targetView.classList.add('active');
}

// ==========================================
// REGISTRATION
// ==========================================
function handleRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('participant-name').value;
    const email = document.getElementById('participant-email').value;

    if (name && email) {
        participants.push({ id: Date.now(), name, email });
        updateParticipantList();
        document.getElementById('registration-form').reset();

        if (participants.length >= 2) {
            alert(`Welcome ${name}! When all participants are registered, wrestler selection will begin.`);
        }
    }
}

function updateParticipantList() {
    const list = document.getElementById('participant-list');
    list.innerHTML = '';
    participants.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p.name;
        list.appendChild(li);
    });
}

// ==========================================
// WRESTLER SELECTION
// ==========================================
function displayWrestlers() {
    const grid = document.getElementById('wrestler-grid');
    grid.innerHTML = '';

    wrestlers.forEach(wrestler => {
        const card = document.createElement('div');
        card.className = 'wrestler-card';
        card.dataset.wrestlerId = wrestler.id;

        const alreadySelected = Object.values(selectedWrestlers).includes(wrestler.id);
        if (alreadySelected) {
            card.style.opacity = '0.5';
            card.style.cursor = 'not-allowed';
        }

        card.innerHTML = `
            <img src="images/${wrestler.image}" alt="${wrestler.name}" class="wrestler-image"
                onerror="this.onerror=null; this.style.background='#ddd'; this.src='${placeholderImage}'">
            <div class="wrestler-name">${wrestler.name}</div>
            <div class="wrestler-rank">${wrestler.rank}</div>
        `;

        if (!alreadySelected) {
            card.addEventListener('click', () => selectWrestler(wrestler.id));
        }
        grid.appendChild(card);
    });
}

function selectWrestler(wrestlerId) {
    const currentParticipantIndex = Object.keys(selectedWrestlers).length;
    if (currentParticipantIndex >= participants.length) return;

    document.querySelectorAll('.wrestler-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.wrestlerId == wrestlerId);
    });

    const currentParticipant = participants[currentParticipantIndex];
    selectedWrestlers[currentParticipant.id] = wrestlerId;
    document.getElementById('confirm-selection').disabled = false;
}

function confirmSelection() {
    const currentParticipantIndex = Object.keys(selectedWrestlers).length - 1;
    const currentParticipant = participants[currentParticipantIndex];
    const selectedWrestler = wrestlers.find(w => w.id === selectedWrestlers[currentParticipant.id]);

    currentParticipantBuilding = currentParticipant;
    showCharacterBuilder(currentParticipant, selectedWrestler);
}

// ==========================================
// CHARACTER BUILDER
// ==========================================
function showCharacterBuilder(participant, wrestler) {
    currentStats = { height: 5, weight: 5, speed: 5, technique: 5 };
    pointsRemaining = 10;
    selectedMove = null;

    const builderImg = document.getElementById('builder-wrestler-image');
    builderImg.onerror = function() { this.onerror = null; this.src = placeholderImage; };
    builderImg.src = `images/${wrestler.image}`;

    document.getElementById('builder-wrestler-name').textContent = `${participant.name}'s ${wrestler.name}`;
    document.getElementById('builder-wrestler-rank').textContent = wrestler.rank;

    updateStatDisplays();
    displayMoves();
    showTournamentView('character-builder');
}

function handleStatChange(e) {
    const stat = e.target.dataset.stat;
    const isPlus = e.target.classList.contains('plus');

    if (isPlus && pointsRemaining > 0 && currentStats[stat] < MAX_STAT) {
        currentStats[stat]++;
        pointsRemaining--;
    } else if (!isPlus && currentStats[stat] > MIN_STAT) {
        currentStats[stat]--;
        pointsRemaining++;
    }

    updateStatDisplays();
    checkConfirmButton();
}

function updateStatDisplays() {
    document.getElementById('points-left').textContent = pointsRemaining;

    ['height', 'weight', 'speed', 'technique'].forEach(stat => {
        document.getElementById(`${stat}-value`).textContent = currentStats[stat];
        document.getElementById(`${stat}-fill`).style.width = `${(currentStats[stat] / MAX_STAT) * 100}%`;
    });

    document.querySelectorAll('.stat-btn.plus').forEach(btn => {
        btn.disabled = pointsRemaining <= 0 || currentStats[btn.dataset.stat] >= MAX_STAT;
    });
    document.querySelectorAll('.stat-btn.minus').forEach(btn => {
        btn.disabled = currentStats[btn.dataset.stat] <= MIN_STAT;
    });
}

function displayMoves() {
    const grid = document.getElementById('move-grid');
    grid.innerHTML = '';

    signatureMoves.forEach(move => {
        const card = document.createElement('div');
        card.className = 'move-card';
        card.dataset.moveId = move.id;
        card.innerHTML = `
            <div class="move-name">${move.name}</div>
            <div class="move-japanese">${move.japanese}</div>
            <div class="move-description">${move.description}</div>
            <div class="move-bonus">+${move.bonusAmount} ${move.bonus.charAt(0).toUpperCase() + move.bonus.slice(1)}</div>
        `;
        card.addEventListener('click', () => selectMove(move.id));
        grid.appendChild(card);
    });
}

function selectMove(moveId) {
    selectedMove = signatureMoves.find(m => m.id === moveId);
    document.querySelectorAll('.move-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.moveId == moveId);
    });
    checkConfirmButton();
}

function checkConfirmButton() {
    document.getElementById('confirm-character').disabled = !selectedMove;
}

function confirmCharacter() {
    if (!currentParticipantBuilding || !selectedMove) return;

    characterBuilds[currentParticipantBuilding.id] = {
        stats: { ...currentStats },
        move: selectedMove
    };

    const wrestler = wrestlers.find(w => w.id === selectedWrestlers[currentParticipantBuilding.id]);
    alert(`${currentParticipantBuilding.name} has built ${wrestler.name}!\n\nSignature Move: ${selectedMove.name}`);

    document.getElementById('confirm-selection').disabled = true;

    if (Object.keys(characterBuilds).length < participants.length) {
        displayWrestlers();
        showTournamentView('selection');
    } else {
        initializeLobby();
    }
}

// ==========================================
// LOBBY
// ==========================================
function initializeLobby() {
    enteredParticipants = [];

    document.getElementById('entered-count').textContent = '0';
    document.getElementById('total-count').textContent = participants.length;

    const indicatorContainer = document.getElementById('entered-wrestlers');
    indicatorContainer.innerHTML = '';
    participants.forEach(() => {
        const indicator = document.createElement('div');
        indicator.className = 'entered-indicator';
        indicatorContainer.appendChild(indicator);
    });

    document.getElementById('enter-dohyo-btn').style.display = 'block';
    showTournamentView('lobby');
}

function enterDohyo() {
    const nextParticipant = participants.find(p => !enteredParticipants.includes(p.id));
    if (!nextParticipant) return;

    enteredParticipants.push(nextParticipant.id);

    const indicators = document.querySelectorAll('.entered-indicator');
    const index = enteredParticipants.length - 1;
    const wrestler = wrestlers.find(w => w.id === selectedWrestlers[nextParticipant.id]);

    indicators[index].classList.add('filled');
    indicators[index].innerHTML = `<img src="images/${wrestler.image}" alt="${wrestler.name}" onerror="this.onerror=null; this.src='${placeholderImage}'">`;

    document.getElementById('entered-count').textContent = enteredParticipants.length;
    showEntrance(nextParticipant);
}

function showEntrance(participant) {
    const wrestler = wrestlers.find(w => w.id === selectedWrestlers[participant.id]);
    const build = characterBuilds[participant.id];

    const entranceImg = document.getElementById('entrance-wrestler-image');
    entranceImg.onerror = function() { this.onerror = null; this.src = placeholderImage; };
    entranceImg.src = `images/${wrestler.image}`;

    document.getElementById('entrance-announcement').textContent = 'has entered the dohyo';
    document.getElementById('entrance-wrestler-name').textContent = wrestler.name;
    document.getElementById('entrance-rank').textContent = `${wrestler.rank} • Selected by ${participant.name}`;

    ['height', 'weight', 'speed', 'technique'].forEach(stat => {
        document.getElementById(`entrance-${stat}`).style.width = `${(build.stats[stat] / MAX_STAT) * 100}%`;
        document.getElementById(`entrance-${stat}-num`).textContent = build.stats[stat];
    });

    document.getElementById('entrance-move-name').textContent = build.move.name;
    document.getElementById('entrance-move-japanese').textContent = build.move.japanese;

    showTournamentView('entrance');

    setTimeout(() => {
        if (enteredParticipants.length < participants.length) {
            showTournamentView('lobby');
        } else {
            generateMatchups();
        }
    }, 4000);
}

// ==========================================
// MATCHUPS
// ==========================================
function generateMatchups() {
    matches = [];
    const participantIds = Object.keys(selectedWrestlers);

    for (let i = 0; i < participantIds.length - 1; i++) {
        for (let j = i + 1; j < participantIds.length; j++) {
            const p1 = participants.find(p => p.id == participantIds[i]);
            const p2 = participants.find(p => p.id == participantIds[j]);

            matches.push({
                east: {
                    participant: p1,
                    wrestler: wrestlers.find(w => w.id === selectedWrestlers[p1.id]),
                    build: characterBuilds[p1.id]
                },
                west: {
                    participant: p2,
                    wrestler: wrestlers.find(w => w.id === selectedWrestlers[p2.id]),
                    build: characterBuilds[p2.id]
                },
                winner: null,
                winningMove: null
            });
        }
    }

    matches.sort(() => Math.random() - 0.5);
    currentRound = 1;
    currentBoutIndex = 0;

    displayMatchups();
}

function displayMatchups() {
    document.getElementById('round-number').textContent = `Round ${currentRound}`;

    const list = document.getElementById('matchup-list');
    list.innerHTML = '';

    const remainingMatches = matches.filter(m => !m.winner);

    remainingMatches.forEach((match) => {
        const row = document.createElement('div');
        row.className = 'matchup-row';
        row.innerHTML = `
            <div class="matchup-wrestler east">
                <img src="images/${match.east.wrestler.image}" alt="${match.east.wrestler.name}" class="matchup-wrestler-image"
                    onerror="this.onerror=null; this.src='${placeholderImage}'">
                <div class="matchup-wrestler-info">
                    <div class="matchup-wrestler-name">${match.east.wrestler.name}</div>
                    <div class="matchup-participant-name">${match.east.participant.name}</div>
                </div>
            </div>
            <div class="matchup-vs">VS</div>
            <div class="matchup-wrestler west">
                <img src="images/${match.west.wrestler.image}" alt="${match.west.wrestler.name}" class="matchup-wrestler-image"
                    onerror="this.onerror=null; this.src='${placeholderImage}'">
                <div class="matchup-wrestler-info">
                    <div class="matchup-wrestler-name">${match.west.wrestler.name}</div>
                    <div class="matchup-participant-name">${match.west.participant.name}</div>
                </div>
            </div>
        `;
        list.appendChild(row);
    });

    document.getElementById('start-matches-btn').style.display = remainingMatches.length > 0 ? 'block' : 'none';
    showTournamentView('matchup');
}

function startMatches() {
    currentBoutIndex = matches.findIndex(m => !m.winner);
    if (currentBoutIndex === -1) {
        showResults();
        return;
    }
    initializeBattle();
}

// ==========================================
// MULTI-PHASE BATTLE SYSTEM
// ==========================================
function initializeBattle() {
    const match = matches[currentBoutIndex];

    // Initialize battle state
    currentBattle = {
        match: match,
        phase: 0,
        eastStats: {
            spirit: 0, focus: 0, intimidation: 0, crowdSupport: 0,
            momentum: 0, positioning: 0, throwPower: 0, strikePower: 0,
            pushPower: 0, balance: 0
        },
        westStats: {
            spirit: 0, focus: 0, intimidation: 0, crowdSupport: 0,
            momentum: 0, positioning: 0, throwPower: 0, strikePower: 0,
            pushPower: 0, balance: 0
        },
        eastChoices: {},
        westChoices: {},
        currentChoice: null,
        currentSide: 'east' // Which side is currently choosing
    };

    const boutNumber = matches.filter((m, i) => i < currentBoutIndex && m.winner).length + 1;
    document.getElementById('bout-number').textContent = `Bout ${boutNumber} of ${matches.length}`;

    // Setup status bar
    setupStatusBar();
    updateBattleStatsDisplay();

    // Start with first phase
    battlePhase = 0;
    showBattlePhase(PHASES[battlePhase]);

    showTournamentView('battle');
}

function setupStatusBar() {
    const match = currentBattle.match;

    const eastImg = document.getElementById('status-east-image');
    eastImg.onerror = function() { this.onerror = null; this.src = placeholderImage; };
    eastImg.src = `images/${match.east.wrestler.image}`;
    document.getElementById('status-east-name').textContent = match.east.wrestler.name;
    document.getElementById('status-east-player').textContent = match.east.participant.name;

    const westImg = document.getElementById('status-west-image');
    westImg.onerror = function() { this.onerror = null; this.src = placeholderImage; };
    westImg.src = `images/${match.west.wrestler.image}`;
    document.getElementById('status-west-name').textContent = match.west.wrestler.name;
    document.getElementById('status-west-player').textContent = match.west.participant.name;

    document.getElementById('status-east-choice').textContent = 'Choosing...';
    document.getElementById('status-west-choice').textContent = 'Choosing...';
}

function updateBattleStatsDisplay() {
    const east = currentBattle.eastStats;
    const west = currentBattle.westStats;

    document.getElementById('east-spirit').textContent = east.spirit;
    document.getElementById('east-focus').textContent = east.focus;
    document.getElementById('east-intimidation').textContent = east.intimidation;
    document.getElementById('east-crowd').textContent = east.crowdSupport;
    document.getElementById('east-momentum').textContent = east.momentum;

    document.getElementById('west-spirit').textContent = west.spirit;
    document.getElementById('west-focus').textContent = west.focus;
    document.getElementById('west-intimidation').textContent = west.intimidation;
    document.getElementById('west-crowd').textContent = west.crowdSupport;
    document.getElementById('west-momentum').textContent = west.momentum;
}

function showBattlePhase(phaseName) {
    // Hide all panels
    document.querySelectorAll('.phase-panel').forEach(p => p.style.display = 'none');

    // Update phase indicator
    const phaseLabels = {
        salt: 'Preparation',
        display: 'Intimidation',
        tachiai: 'Tachiai',
        technique: 'Battle',
        finish: 'Finishing Move'
    };
    document.getElementById('phase-indicator').textContent = phaseLabels[phaseName];

    // Reset choices
    currentBattle.currentChoice = null;
    document.getElementById('status-east-choice').textContent = 'Choosing...';
    document.getElementById('status-east-choice').classList.remove('ready');
    document.getElementById('status-west-choice').textContent = 'Choosing...';
    document.getElementById('status-west-choice').classList.remove('ready');

    // Show the right panel
    const panel = document.getElementById(`phase-${phaseName}`);
    if (panel) {
        panel.style.display = 'block';

        // Setup choice cards
        const cards = panel.querySelectorAll('.choice-card');
        cards.forEach(card => {
            card.classList.remove('selected');
            card.onclick = () => selectChoice(card.dataset.choice, phaseName);
        });

        // Reset confirm button
        const confirmBtn = panel.querySelector('.confirm-choice-btn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.onclick = () => confirmPhaseChoice(phaseName);
        }
    }
}

function selectChoice(choice, phaseName) {
    currentBattle.currentChoice = choice;

    const panel = document.getElementById(`phase-${phaseName}`);
    panel.querySelectorAll('.choice-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.choice === choice);
    });

    panel.querySelector('.confirm-choice-btn').disabled = false;
}

function confirmPhaseChoice(phaseName) {
    const choice = currentBattle.currentChoice;
    const currentSide = currentBattle.currentSide;

    // Store choice
    currentBattle[`${currentSide}Choices`][phaseName] = choice;

    // Update status
    document.getElementById(`status-${currentSide}-choice`).textContent = 'Ready!';
    document.getElementById(`status-${currentSide}-choice`).classList.add('ready');

    if (currentSide === 'east') {
        // Switch to west
        currentBattle.currentSide = 'west';
        currentBattle.currentChoice = null;

        // Reset cards
        const panel = document.getElementById(`phase-${phaseName}`);
        panel.querySelectorAll('.choice-card').forEach(card => card.classList.remove('selected'));
        panel.querySelector('.confirm-choice-btn').disabled = true;
    } else {
        // Both sides chosen - resolve phase
        resolvePhase(phaseName);
    }
}

function resolvePhase(phaseName) {
    const eastChoice = currentBattle.eastChoices[phaseName];
    const westChoice = currentBattle.westChoices[phaseName];
    const config = BATTLE_CONFIG;

    let resultTitle = '';
    let eastLabel = '';
    let westLabel = '';
    let outcome = '';
    let outcomeClass = '';
    let narrative = '';

    switch (phaseName) {
        case 'salt':
            // Salt throwing - no winner, just stat gains
            if (eastChoice === 'little') {
                currentBattle.eastStats.focus += config.saltThrow.little.focus;
            } else {
                currentBattle.eastStats.spirit += config.saltThrow.lot.spirit;
            }
            if (westChoice === 'little') {
                currentBattle.westStats.focus += config.saltThrow.little.focus;
            } else {
                currentBattle.westStats.spirit += config.saltThrow.lot.spirit;
            }

            resultTitle = 'Salt Throwing Complete';
            eastLabel = eastChoice === 'little' ? 'Little Salt (+Focus)' : 'Lots of Salt (+Spirit)';
            westLabel = westChoice === 'little' ? 'Little Salt (+Focus)' : 'Lots of Salt (+Spirit)';
            outcome = '⚖️';
            outcomeClass = 'draw';
            narrative = 'The dohyo is purified. Both rikishi are ready.';
            break;

        case 'display':
            // Display - no winner, just stat gains
            if (eastChoice === 'mawashi') {
                currentBattle.eastStats.intimidation += config.display.mawashi.intimidation;
            } else {
                currentBattle.eastStats.crowdSupport += config.display.auraPose.crowdSupport;
            }
            if (westChoice === 'mawashi') {
                currentBattle.westStats.intimidation += config.display.mawashi.intimidation;
            } else {
                currentBattle.westStats.crowdSupport += config.display.auraPose.crowdSupport;
            }

            resultTitle = 'Intimidation Display Complete';
            eastLabel = eastChoice === 'mawashi' ? 'Slapped Mawashi (+Intimidation)' : 'Aura Pose (+Crowd)';
            westLabel = westChoice === 'mawashi' ? 'Slapped Mawashi (+Intimidation)' : 'Aura Pose (+Crowd)';
            outcome = '⚖️';
            outcomeClass = 'draw';
            narrative = 'The psychological battle intensifies!';
            break;

        case 'tachiai':
            // Tachiai - there's a winner
            const tKey = `${eastChoice}_vs_${westChoice}`;
            const tMatchup = config.tachiai.matchups[tKey] || [0.5, 0.5];
            const tRoll = Math.random();
            const eastWins = tRoll < tMatchup[0];

            // Apply henka penalties
            if (eastChoice === 'henka') {
                currentBattle.eastStats.crowdSupport += config.tachiai.henkaPenalty.crowdSupport;
                currentBattle.eastStats.spirit += config.tachiai.henkaPenalty.spirit;
            }
            if (westChoice === 'henka') {
                currentBattle.westStats.crowdSupport += config.tachiai.henkaPenalty.crowdSupport;
                currentBattle.westStats.spirit += config.tachiai.henkaPenalty.spirit;
            }

            // Winner bonus
            if (eastWins) {
                currentBattle.eastStats.momentum += config.tachiai.winBonus.momentum;
                currentBattle.eastStats.positioning += config.tachiai.winBonus.positioning;
            } else {
                currentBattle.westStats.momentum += config.tachiai.winBonus.momentum;
                currentBattle.westStats.positioning += config.tachiai.winBonus.positioning;
            }

            resultTitle = 'The Tachiai!';
            eastLabel = config.tachiai.labels[eastChoice];
            westLabel = config.tachiai.labels[westChoice];
            outcome = eastWins ? '← EAST' : 'WEST →';
            outcomeClass = eastWins ? 'east-wins' : 'west-wins';
            narrative = eastWins
                ? `${currentBattle.match.east.wrestler.name} wins the initial clash!`
                : `${currentBattle.match.west.wrestler.name} gains the advantage!`;
            break;

        case 'technique':
            // Battle technique - there's a winner
            const bKey = `${eastChoice}_vs_${westChoice}`;
            const bMatchup = config.battleTechnique.matchups[bKey] || [0.5, 0.5];
            const bRoll = Math.random();
            const eastWinsTech = bRoll < bMatchup[0];

            // Apply technique bonuses
            const eastTechBonus = config.battleTechnique.techniqueBonus[eastChoice];
            const westTechBonus = config.battleTechnique.techniqueBonus[westChoice];

            Object.keys(eastTechBonus).forEach(stat => {
                currentBattle.eastStats[stat] += eastTechBonus[stat];
            });
            Object.keys(westTechBonus).forEach(stat => {
                currentBattle.westStats[stat] += westTechBonus[stat];
            });

            // Winner gets extra momentum
            if (eastWinsTech) {
                currentBattle.eastStats.momentum += 2;
            } else {
                currentBattle.westStats.momentum += 2;
            }

            resultTitle = 'Battle Technique!';
            eastLabel = config.battleTechnique.labels[eastChoice];
            westLabel = config.battleTechnique.labels[westChoice];
            outcome = eastWinsTech ? '← EAST' : 'WEST →';
            outcomeClass = eastWinsTech ? 'east-wins' : 'west-wins';
            narrative = eastWinsTech
                ? `${currentBattle.match.east.wrestler.name} establishes control!`
                : `${currentBattle.match.west.wrestler.name} takes the dominant position!`;
            break;
    }

    // Update stats display
    updateBattleStatsDisplay();

    // Show result
    document.getElementById('phase-result-title').textContent = resultTitle;
    document.getElementById('result-east-choice').textContent = eastLabel;
    document.getElementById('result-west-choice').textContent = westLabel;
    document.getElementById('result-outcome').textContent = outcome;
    document.getElementById('result-outcome').className = `result-outcome ${outcomeClass}`;
    document.getElementById('result-narrative').textContent = narrative;

    document.querySelectorAll('.phase-panel').forEach(p => p.style.display = 'none');
    document.getElementById('phase-result').style.display = 'block';

    // Reset side for next phase
    currentBattle.currentSide = 'east';
}

function proceedToNextPhase() {
    battlePhase++;

    if (battlePhase >= PHASES.length - 1) {
        // Go to finishing move
        showFinishingPhase();
    } else {
        showBattlePhase(PHASES[battlePhase]);
    }
}

function showFinishingPhase() {
    document.querySelectorAll('.phase-panel').forEach(p => p.style.display = 'none');
    document.getElementById('phase-indicator').textContent = 'Finishing Move';

    const match = currentBattle.match;
    const config = BATTLE_CONFIG.finishingMove;

    // Calculate success chances
    const eastChance = calculateFinishChance('east');
    const westChance = calculateFinishChance('west');

    document.getElementById('finish-east-name').textContent = match.east.wrestler.name;
    document.getElementById('finish-west-name').textContent = match.west.wrestler.name;
    document.getElementById('finish-east-chance').textContent = `${Math.round(eastChance * 100)}%`;
    document.getElementById('finish-west-chance').textContent = `${Math.round(westChance * 100)}%`;

    // Show bonuses
    document.getElementById('finish-east-bonuses').innerHTML = formatBonuses(currentBattle.eastStats);
    document.getElementById('finish-west-bonuses').innerHTML = formatBonuses(currentBattle.westStats);

    document.getElementById('your-signature-move').textContent = match.east.build.move.name;

    document.getElementById('phase-finish').style.display = 'block';
}

function calculateFinishChance(side) {
    const stats = currentBattle[`${side}Stats`];
    const match = currentBattle.match;
    const config = BATTLE_CONFIG.finishingMove;
    const wrestler = side === 'east' ? match.east : match.west;

    let chance = config.baseSuccessRate;

    // Add stat bonuses
    Object.keys(config.statMultipliers).forEach(stat => {
        if (stats[stat]) {
            chance += stats[stat] * config.statMultipliers[stat];
        }
    });

    // Signature move affinity
    const technique = currentBattle[`${side}Choices`].technique;
    const moveName = wrestler.build.move.name;
    const affinity = BATTLE_CONFIG.finishingMoveCategories.moveAffinities[moveName];
    if (affinity && affinity.bestWith === technique) {
        chance += affinity.bonus;
    }

    // Character stats bonus
    const charStats = wrestler.build.stats;
    chance += charStats.technique * 0.01;
    chance += charStats.speed * 0.005;

    return Math.min(0.95, Math.max(0.05, chance));
}

function formatBonuses(stats) {
    const bonuses = [];
    if (stats.spirit > 0) bonuses.push(`Spirit +${stats.spirit}`);
    if (stats.focus > 0) bonuses.push(`Focus +${stats.focus}`);
    if (stats.momentum > 0) bonuses.push(`Momentum +${stats.momentum}`);
    if (stats.intimidation > 0) bonuses.push(`Intimidation +${stats.intimidation}`);
    return bonuses.join(' | ') || 'No bonuses';
}

function executeFinishingMove() {
    document.getElementById('execute-finish-btn').disabled = true;

    const match = currentBattle.match;
    const eastChance = calculateFinishChance('east');
    const westChance = calculateFinishChance('west');

    // Normalize to determine winner
    const total = eastChance + westChance;
    const eastNorm = eastChance / total;
    const roll = Math.random();

    const eastWins = roll < eastNorm;
    const winner = eastWins ? match.east : match.west;
    const winningMove = winner.build.move;

    match.winner = winner;
    match.winningMove = winningMove.name;

    // Show final result
    setTimeout(() => {
        document.getElementById('phase-finish').style.display = 'none';

        document.getElementById('winner-announcement').textContent = `${winner.wrestler.name} WINS!`;
        document.getElementById('winning-move-display').textContent = `by ${winningMove.name} (${winningMove.japanese})`;

        // Create battle summary
        const summary = document.getElementById('battle-summary');
        summary.innerHTML = `
            <div class="summary-title">Battle Summary</div>
            <div class="summary-item"><span>Winner:</span><span>${winner.participant.name}</span></div>
            <div class="summary-item"><span>East Final Chance:</span><span>${Math.round(eastChance * 100)}%</span></div>
            <div class="summary-item"><span>West Final Chance:</span><span>${Math.round(westChance * 100)}%</span></div>
            <div class="summary-item"><span>Deciding Move:</span><span>${winningMove.name}</span></div>
        `;

        document.getElementById('battle-result').style.display = 'block';
    }, 1500);
}

function nextBout() {
    const nextIndex = matches.findIndex((m, i) => i > currentBoutIndex && !m.winner);

    if (nextIndex === -1) {
        const remaining = matches.filter(m => !m.winner);
        if (remaining.length === 0) {
            showResults();
        } else {
            currentRound++;
            displayMatchups();
        }
    } else {
        currentBoutIndex = nextIndex;
        document.getElementById('battle-result').style.display = 'none';
        initializeBattle();
    }
}

// ==========================================
// RESULTS
// ==========================================
function showResults() {
    const standings = {};

    participants.forEach(p => {
        standings[p.id] = {
            participant: p,
            wrestler: wrestlers.find(w => w.id === selectedWrestlers[p.id]),
            build: characterBuilds[p.id],
            wins: 0,
            losses: 0
        };
    });

    matches.forEach(match => {
        if (match.winner) {
            standings[match.winner.participant.id].wins++;
            const loser = match.winner === match.east ? match.west : match.east;
            standings[loser.participant.id].losses++;
        }
    });

    const sortedStandings = Object.values(standings).sort((a, b) => b.wins - a.wins || a.losses - b.losses);

    const container = document.getElementById('final-standings');
    container.innerHTML = '';

    sortedStandings.forEach((standing, index) => {
        const medals = ['gold', 'silver', 'bronze'];
        const medalClass = index < 3 ? medals[index] : 'normal';
        const rankDisplay = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;

        const item = document.createElement('div');
        item.className = `standing-item ${medalClass}`;
        item.innerHTML = `
            <div class="standing-rank">${rankDisplay}</div>
            <img src="images/${standing.wrestler.image}" alt="${standing.wrestler.name}" class="standing-image"
                onerror="this.onerror=null; this.src='${placeholderImage}'">
            <div class="standing-info">
                <div class="standing-name">${standing.participant.name}</div>
                <div class="standing-wrestler">${standing.wrestler.name} (${standing.wrestler.rank})</div>
                <div class="standing-move">Signature: ${standing.build.move.name}</div>
            </div>
            <div class="standing-record">${standing.wins}W - ${standing.losses}L</div>
        `;
        container.appendChild(item);
    });

    showTournamentView('results');
}

function resetTournament() {
    participants = [];
    selectedWrestlers = {};
    characterBuilds = {};
    matches = [];
    enteredParticipants = [];
    currentMatchIndex = 0;
    currentBoutIndex = 0;
    currentRound = 1;
    currentBattle = null;
    battlePhase = 0;
    customWrestlerNames = {};
    tournamentWins = {};

    updateParticipantList();
    showTournamentView('registration');
}

// ==========================================
// ADDITIONAL STATE
// ==========================================
let customWrestlerNames = {}; // participantId -> custom name
let tournamentWins = {}; // participantId -> number of wins towards Emperor's Cup
let winsNeededForCup = 3; // Default: 3 wins needed

// ==========================================
// IMAGE MANAGER INTEGRATION
// ==========================================
function initImageManager() {
    // Generate wrestler image slots
    const wrestlerGrid = document.getElementById('wrestler-images-grid');
    if (wrestlerGrid) {
        wrestlerGrid.innerHTML = '';
        wrestlerData.forEach(wrestler => {
            const slot = document.createElement('div');
            slot.className = 'image-slot';
            slot.dataset.category = 'wrestlers';
            slot.dataset.key = wrestler.id;

            const savedImage = ImageManager.getWrestlerImage(wrestler.id);
            slot.innerHTML = `
                <img id="img-wrestler-${wrestler.id}" src="${savedImage || placeholderImage}" alt="${wrestler.name}">
                <span>${wrestler.name}</span>
            `;
            wrestlerGrid.appendChild(slot);

            // Make clickable for upload
            slot.addEventListener('click', () => {
                const input = ImageManager.createUploadHandler(
                    slot.querySelector('img'),
                    'wrestlers',
                    wrestler.id,
                    (dataUrl) => {
                        console.log(`Uploaded image for ${wrestler.name}`);
                    }
                );
                input.click();
            });
            slot.style.cursor = 'pointer';
        });
    }

    // Setup celebration image slots
    const celebrationSlots = document.querySelectorAll('.image-slot[data-category="celebration"]');
    celebrationSlots.forEach(slot => {
        const key = slot.dataset.key;
        const img = slot.querySelector('img');
        const savedImage = ImageManager.getCelebrationImage(key);

        if (savedImage) {
            img.src = savedImage;
        } else {
            img.src = placeholderImage;
        }

        slot.addEventListener('click', () => {
            const input = ImageManager.createUploadHandler(
                img,
                'celebration',
                key,
                (dataUrl) => {
                    console.log(`Uploaded celebration image: ${key}`);
                    // Also update the celebration view images if they exist
                    updateCelebrationImages();
                }
            );
            input.click();
        });
        slot.style.cursor = 'pointer';
    });
}

function updateCelebrationImages() {
    const cupImg = document.getElementById('celebration-cup-img');
    const snapperImg = document.getElementById('celebration-snapper-img');
    const paradeImg = document.getElementById('celebration-parade-img');

    if (cupImg) cupImg.src = ImageManager.getCelebrationImage('emperorsCup') || placeholderImage;
    if (snapperImg) snapperImg.src = ImageManager.getCelebrationImage('giantSnapper') || placeholderImage;
    if (paradeImg) paradeImg.src = ImageManager.getCelebrationImage('limousine') || placeholderImage;
}

function openImageManager() {
    initImageManager();
    document.getElementById('image-manager-modal').style.display = 'flex';
}

function closeImageManager() {
    document.getElementById('image-manager-modal').style.display = 'none';
}

// ==========================================
// CUSTOM WRESTLER NAMES
// ==========================================
function getDisplayName(participantId, wrestler) {
    return customWrestlerNames[participantId] || wrestler.name;
}

function setupAvatarUpload() {
    const container = document.getElementById('avatar-upload-container');
    const img = document.getElementById('builder-wrestler-image');

    if (container && img && currentParticipantBuilding) {
        const wrestlerId = selectedWrestlers[currentParticipantBuilding.id];

        container.style.cursor = 'pointer';
        container.onclick = () => {
            const input = ImageManager.createUploadHandler(
                img,
                'wrestlers',
                wrestlerId,
                (dataUrl) => {
                    console.log('Avatar uploaded for wrestler:', wrestlerId);
                }
            );
            input.click();
        };

        // Load existing image if available
        const savedImage = ImageManager.getWrestlerImage(wrestlerId);
        if (savedImage) {
            img.src = savedImage;
        }
    }
}

// ==========================================
// SEATED WRESTLERS DISPLAY
// ==========================================
function updateSeatedWrestlers() {
    const container = document.getElementById('seated-wrestlers');
    if (!container) return;

    container.innerHTML = '';

    // Get current bout participants
    const currentMatch = matches[currentBoutIndex];
    if (!currentMatch) return;

    const currentParticipantIds = [
        currentMatch.east.participant.id,
        currentMatch.west.participant.id
    ];

    // Find remaining matches and upcoming participants
    const upcomingParticipants = new Set();
    matches.forEach((match, idx) => {
        if (idx > currentBoutIndex && !match.winner) {
            upcomingParticipants.add(match.east.participant.id);
            upcomingParticipants.add(match.west.participant.id);
        }
    });

    // Get next match participants
    const nextMatch = matches.find((m, idx) => idx > currentBoutIndex && !m.winner);
    const nextUpIds = nextMatch ? [nextMatch.east.participant.id, nextMatch.west.participant.id] : [];

    // Create seated wrestler elements
    participants.forEach(p => {
        if (currentParticipantIds.includes(p.id)) return; // Skip current fighters

        const wrestler = wrestlers.find(w => w.id === selectedWrestlers[p.id]);
        if (!wrestler) return;

        const seated = document.createElement('div');
        seated.className = 'seated-wrestler';
        if (nextUpIds.includes(p.id)) {
            seated.classList.add('next-up');
        }

        const displayName = getDisplayName(p.id, wrestler);
        const savedImage = ImageManager.getWrestlerImage(wrestler.id);

        seated.innerHTML = `
            <img src="${savedImage || placeholderImage}" alt="${displayName}" onerror="this.onerror=null; this.src='${placeholderImage}'">
            <span class="seated-name">${displayName}</span>
            ${nextUpIds.includes(p.id) ? '<span class="next-badge">NEXT</span>' : ''}
        `;

        container.appendChild(seated);
    });
}

// ==========================================
// LIVE STANDINGS
// ==========================================
function calculateStandings() {
    const standings = {};

    participants.forEach(p => {
        standings[p.id] = {
            participant: p,
            wrestler: wrestlers.find(w => w.id === selectedWrestlers[p.id]),
            build: characterBuilds[p.id],
            wins: 0,
            losses: 0,
            tournamentWins: tournamentWins[p.id] || 0
        };
    });

    matches.forEach(match => {
        if (match.winner) {
            standings[match.winner.participant.id].wins++;
            const loser = match.winner === match.east ? match.west : match.east;
            standings[loser.participant.id].losses++;
        }
    });

    return Object.values(standings).sort((a, b) => {
        // First by tournament wins, then by match wins
        if (b.tournamentWins !== a.tournamentWins) return b.tournamentWins - a.tournamentWins;
        return b.wins - a.wins || a.losses - b.losses;
    });
}

function showLiveStandings() {
    const container = document.getElementById('live-standings');
    const upcomingList = document.getElementById('upcoming-bouts-list');

    if (!container) return;

    const standings = calculateStandings();
    container.innerHTML = '';

    standings.forEach((standing, idx) => {
        const wrestler = standing.wrestler;
        const displayName = getDisplayName(standing.participant.id, wrestler);
        const savedImage = ImageManager.getWrestlerImage(wrestler.id);

        const row = document.createElement('div');
        row.className = 'standings-row';
        row.innerHTML = `
            <div class="standings-rank">${idx + 1}</div>
            <img src="${savedImage || placeholderImage}" alt="${displayName}" class="standings-avatar" onerror="this.onerror=null; this.src='${placeholderImage}'">
            <div class="standings-info">
                <span class="standings-name">${displayName}</span>
                <span class="standings-player">${standing.participant.name}</span>
            </div>
            <div class="standings-record">
                <span class="wins">${standing.wins}W</span> - <span class="losses">${standing.losses}L</span>
            </div>
            <div class="standings-cups">${'🏆'.repeat(standing.tournamentWins)}</div>
        `;
        container.appendChild(row);
    });

    // Show upcoming bouts
    if (upcomingList) {
        upcomingList.innerHTML = '';
        const upcoming = matches.filter((m, idx) => idx > currentBoutIndex && !m.winner).slice(0, 3);

        upcoming.forEach(match => {
            const eastName = getDisplayName(match.east.participant.id, match.east.wrestler);
            const westName = getDisplayName(match.west.participant.id, match.west.wrestler);

            const bout = document.createElement('div');
            bout.className = 'upcoming-bout';
            bout.innerHTML = `<span>${eastName}</span> vs <span>${westName}</span>`;
            upcomingList.appendChild(bout);
        });

        if (upcoming.length === 0) {
            upcomingList.innerHTML = '<p>No more bouts remaining</p>';
        }
    }

    showTournamentView('standings');
}

function continueFromStandings() {
    // Check if anyone has won enough for the Emperor's Cup
    const standings = calculateStandings();
    const leader = standings[0];

    if (winsNeededForCup > 0 && leader.tournamentWins >= winsNeededForCup) {
        showVictoryCelebration(leader);
        return;
    }

    // Otherwise continue with next bout
    const nextIndex = matches.findIndex((m, i) => !m.winner);
    if (nextIndex === -1) {
        // All matches done, show results or celebration
        const winner = standings[0];
        if (winner.wins > 0) {
            showVictoryCelebration(winner);
        } else {
            showResults();
        }
    } else {
        currentBoutIndex = nextIndex;
        initializeBattle();
    }
}

// ==========================================
// VICTORY CELEBRATION
// ==========================================
function showVictoryCelebration(winner) {
    updateCelebrationImages();

    const wrestler = winner.wrestler;
    const displayName = getDisplayName(winner.participant.id, wrestler);
    const savedImage = ImageManager.getWrestlerImage(wrestler.id);

    const championAvatar = document.getElementById('champion-avatar');
    if (championAvatar) {
        championAvatar.src = savedImage || placeholderImage;
        championAvatar.onerror = function() { this.onerror = null; this.src = placeholderImage; };
    }

    document.getElementById('champion-name').textContent = displayName;
    document.getElementById('champion-record').textContent = `${winner.wins} Wins - ${winner.losses} Losses`;
    document.getElementById('champion-move').textContent = `Signature Move: ${winner.build.move.name} (${winner.build.move.japanese})`;

    // Setup uploadable celebration scenes
    setupCelebrationSceneUploads();

    showTournamentView('celebration');
}

function setupCelebrationSceneUploads() {
    const scenes = document.querySelectorAll('.uploadable-scene');
    scenes.forEach(scene => {
        const sceneKey = scene.dataset.scene;
        const img = scene.querySelector('img');

        scene.style.cursor = 'pointer';
        scene.onclick = () => {
            const input = ImageManager.createUploadHandler(
                img,
                'celebration',
                sceneKey,
                (dataUrl) => {
                    console.log('Celebration scene uploaded:', sceneKey);
                }
            );
            input.click();
        };
    });
}

function finishCelebration() {
    showResults();
}

// ==========================================
// TOURNAMENT SETTINGS
// ==========================================
function loadTournamentSettings() {
    const roundsSelect = document.getElementById('rounds-to-win');
    if (roundsSelect) {
        winsNeededForCup = parseInt(roundsSelect.value) || 3;
    }
}

// ==========================================
// ADMIN PAGE FUNCTIONS
// ==========================================
function showAdminAvatarsPage() {
    populateAdminWrestlerGrid();
    showTournamentView('admin-avatars');
}

function showAdminScenesPage() {
    populateAdminScenesGrid();
    showTournamentView('admin-scenes');
}

function populateAdminWrestlerGrid() {
    const grid = document.getElementById('admin-wrestler-grid');
    if (!grid) return;

    grid.innerHTML = '';

    wrestlerData.forEach(wrestler => {
        const savedImage = ImageManager.getWrestlerImage(wrestler.id);
        const hasImage = !!savedImage;

        const card = document.createElement('div');
        card.className = `admin-wrestler-card ${hasImage ? 'has-image' : ''}`;
        card.innerHTML = `
            <img src="${savedImage || placeholderImage}" alt="${wrestler.name}" class="wrestler-avatar" onerror="this.onerror=null; this.src='${placeholderImage}'">
            <h4>${wrestler.name}</h4>
            <div class="wrestler-rank">${wrestler.rank}</div>
            <span class="upload-status ${hasImage ? 'uploaded' : 'pending'}">${hasImage ? 'Uploaded' : 'Click to Upload'}</span>
        `;

        card.addEventListener('click', () => {
            uploadWrestlerAvatar(wrestler.id, card);
        });

        grid.appendChild(card);
    });
}

function uploadWrestlerAvatar(wrestlerId, cardElement) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500000) {
            alert('Image too large! Please use an image under 500KB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;

            ImageManager.resizeImage(dataUrl, 170, 300, (resizedUrl) => {
                ImageManager.setWrestlerImage(wrestlerId, resizedUrl);

                // Update the card
                const img = cardElement.querySelector('.wrestler-avatar');
                img.src = resizedUrl;
                cardElement.classList.add('has-image');
                cardElement.querySelector('.upload-status').textContent = 'Uploaded';
                cardElement.querySelector('.upload-status').className = 'upload-status uploaded';

                console.log(`Avatar uploaded for wrestler ID: ${wrestlerId}`);
            });
        };
        reader.readAsDataURL(file);
    });

    input.click();
}

function populateAdminScenesGrid() {
    const sceneCards = document.querySelectorAll('.admin-scene-card');

    sceneCards.forEach(card => {
        const sceneKey = card.dataset.scene;
        const img = card.querySelector('.scene-preview img');
        const savedImage = ImageManager.getCelebrationImage(sceneKey);

        if (savedImage) {
            img.src = savedImage;
            card.classList.add('has-image');
        } else {
            img.src = placeholderImage;
            card.classList.remove('has-image');
        }

        // Setup upload button
        const uploadBtn = card.querySelector('.upload-scene-btn');
        uploadBtn.onclick = (e) => {
            e.stopPropagation();
            uploadSceneImage(sceneKey, img, card);
        };
    });
}

function uploadSceneImage(sceneKey, imgElement, cardElement) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500000) {
            alert('Image too large! Please use an image under 500KB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;

            ImageManager.resizeImage(dataUrl, 400, 300, (resizedUrl) => {
                ImageManager.setCelebrationImage(sceneKey, resizedUrl);

                imgElement.src = resizedUrl;
                cardElement.classList.add('has-image');

                console.log(`Scene image uploaded: ${sceneKey}`);
            });
        };
        reader.readAsDataURL(file);
    });

    input.click();
}

function clearAllWrestlerImages() {
    if (confirm('Are you sure you want to clear all wrestler avatar images?')) {
        ImageManager.placeholders.wrestlers = {};
        ImageManager.save();
        populateAdminWrestlerGrid();
    }
}

function clearAllSceneImages() {
    if (confirm('Are you sure you want to clear all scene images?')) {
        ImageManager.placeholders.celebration = {
            emperorsCup: null,
            giantSnapper: null,
            limousine: null,
            champion: null,
            dohyo: null,
            tournament: null
        };
        ImageManager.save();
        populateAdminScenesGrid();
    }
}

// ==========================================
// UPDATED INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize ImageManager
    if (typeof ImageManager !== 'undefined') {
        ImageManager.init();
    }

    // Admin buttons
    const adminImagesBtn = document.getElementById('admin-images-btn');
    if (adminImagesBtn) {
        adminImagesBtn.addEventListener('click', showAdminAvatarsPage);
    }

    const adminScenesBtn = document.getElementById('admin-scenes-btn');
    if (adminScenesBtn) {
        adminScenesBtn.addEventListener('click', showAdminScenesPage);
    }

    // Admin back buttons
    const backFromAvatars = document.getElementById('admin-back-from-avatars');
    if (backFromAvatars) {
        backFromAvatars.addEventListener('click', () => showTournamentView('registration'));
    }

    const backFromScenes = document.getElementById('admin-back-from-scenes');
    if (backFromScenes) {
        backFromScenes.addEventListener('click', () => showTournamentView('registration'));
    }

    // Admin clear buttons
    const clearWrestlersBtn = document.getElementById('admin-clear-wrestlers');
    if (clearWrestlersBtn) {
        clearWrestlersBtn.addEventListener('click', clearAllWrestlerImages);
    }

    const clearScenesBtn = document.getElementById('admin-clear-scenes');
    if (clearScenesBtn) {
        clearScenesBtn.addEventListener('click', clearAllSceneImages);
    }

    // Continue tournament button
    const continueTournamentBtn = document.getElementById('continue-tournament-btn');
    if (continueTournamentBtn) {
        continueTournamentBtn.addEventListener('click', continueFromStandings);
    }

    // Finish celebration button
    const finishCelebrationBtn = document.getElementById('finish-celebration-btn');
    if (finishCelebrationBtn) {
        finishCelebrationBtn.addEventListener('click', finishCelebration);
    }

    // Tournament settings change
    const roundsSelect = document.getElementById('rounds-to-win');
    if (roundsSelect) {
        roundsSelect.addEventListener('change', loadTournamentSettings);
    }
});

// ==========================================
// OVERRIDE FUNCTIONS TO USE NEW FEATURES
// ==========================================

// Override showCharacterBuilder to setup avatar upload
const originalShowCharacterBuilder = showCharacterBuilder;
showCharacterBuilder = function(participant, wrestler) {
    originalShowCharacterBuilder(participant, wrestler);

    // Clear custom name input
    const customNameInput = document.getElementById('custom-wrestler-name');
    if (customNameInput) {
        customNameInput.value = customWrestlerNames[participant.id] || '';
        customNameInput.placeholder = wrestler.name;
    }

    // Setup avatar upload
    setTimeout(setupAvatarUpload, 100);
};

// Override confirmCharacter to save custom name
const originalConfirmCharacter = confirmCharacter;
confirmCharacter = function() {
    if (!currentParticipantBuilding || !selectedMove) return;

    // Save custom name if provided
    const customNameInput = document.getElementById('custom-wrestler-name');
    if (customNameInput && customNameInput.value.trim()) {
        customWrestlerNames[currentParticipantBuilding.id] = customNameInput.value.trim();
    }

    originalConfirmCharacter();
};

// Override initializeBattle to show seated wrestlers
const originalInitializeBattle = initializeBattle;
initializeBattle = function() {
    loadTournamentSettings();
    originalInitializeBattle();
    updateSeatedWrestlers();
};

// Override setupStatusBar to use custom names
const originalSetupStatusBar = setupStatusBar;
setupStatusBar = function() {
    const match = currentBattle.match;

    const eastImg = document.getElementById('status-east-image');
    const eastSavedImage = ImageManager.getWrestlerImage(match.east.wrestler.id);
    eastImg.onerror = function() { this.onerror = null; this.src = placeholderImage; };
    eastImg.src = eastSavedImage || `images/${match.east.wrestler.image}`;

    const eastName = getDisplayName(match.east.participant.id, match.east.wrestler);
    document.getElementById('status-east-name').textContent = eastName;
    document.getElementById('status-east-player').textContent = match.east.participant.name;

    const westImg = document.getElementById('status-west-image');
    const westSavedImage = ImageManager.getWrestlerImage(match.west.wrestler.id);
    westImg.onerror = function() { this.onerror = null; this.src = placeholderImage; };
    westImg.src = westSavedImage || `images/${match.west.wrestler.image}`;

    const westName = getDisplayName(match.west.participant.id, match.west.wrestler);
    document.getElementById('status-west-name').textContent = westName;
    document.getElementById('status-west-player').textContent = match.west.participant.name;

    document.getElementById('status-east-choice').textContent = 'Choosing...';
    document.getElementById('status-west-choice').textContent = 'Choosing...';
};

// Override nextBout to track tournament wins and optionally show standings
const originalNextBout = nextBout;
nextBout = function() {
    // Track tournament win for the winner
    const currentMatch = matches[currentBoutIndex];
    if (currentMatch && currentMatch.winner) {
        const winnerId = currentMatch.winner.participant.id;
        tournamentWins[winnerId] = (tournamentWins[winnerId] || 0) + 1;

        // Check if winner has enough for Emperor's Cup
        if (winsNeededForCup > 0 && tournamentWins[winnerId] >= winsNeededForCup) {
            const standings = calculateStandings();
            const winner = standings.find(s => s.participant.id === winnerId);
            showVictoryCelebration(winner);
            return;
        }
    }

    const nextIndex = matches.findIndex((m, i) => i > currentBoutIndex && !m.winner);

    if (nextIndex === -1) {
        const remaining = matches.filter(m => !m.winner);
        if (remaining.length === 0) {
            // Tournament complete - show celebration for leader
            const standings = calculateStandings();
            if (standings[0].wins > 0) {
                showVictoryCelebration(standings[0]);
            } else {
                showResults();
            }
        } else {
            currentRound++;
            displayMatchups();
        }
    } else {
        currentBoutIndex = nextIndex;
        document.getElementById('battle-result').style.display = 'none';
        initializeBattle();
    }
};
