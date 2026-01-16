/**
 * SUMO TOURNAMENT V2 - Phase Definitions & Resolution
 */

const PHASES = {
    salt: {
        name: 'Salt Ritual',
        description: 'Purify the ring and prepare your spirit',
        choices: [
            { id: 'little', label: 'Little Salt', icon: '🧂', effect: { stat: 'focus', value: 2 }, description: 'Careful, measured throw' },
            { id: 'lots', label: 'Lots of Salt', icon: '🧂🧂', effect: { stat: 'spirit', value: 2 }, description: 'Grand, dramatic throw' }
        ],
        hasWinner: false
    },
    display: {
        name: 'Intimidation Display',
        description: 'Show your opponent your fighting spirit',
        choices: [
            { id: 'mawashi', label: 'Slap Mawashi', icon: '👋', effect: { stat: 'intimidation', value: 2 }, description: 'Aggressive belt slap' },
            { id: 'aura', label: 'Powerful Aura', icon: '✨', effect: { stat: 'crowdSupport', value: 2 }, description: 'Calm, confident stance' }
        ],
        hasWinner: false
    },
    tachiai: {
        name: 'Tachiai!',
        description: 'The explosive initial charge',
        choices: [
            { id: 'hard', label: 'Hard Charge', icon: '💥', description: 'Full power collision' },
            { id: 'soft', label: 'Soft Absorb', icon: '🛡️', description: 'Absorb and redirect' },
            { id: 'henka', label: 'Henka', icon: '↪️', description: 'Sidestep dodge' }
        ],
        hasWinner: true
    },
    technique: {
        name: 'Attack!',
        description: 'Execute your fighting technique',
        choices: [
            { id: 'grip', label: 'Belt Grip', icon: '🤝', effect: { stat: 'throwPower', value: 2 }, description: 'Grab the mawashi' },
            { id: 'tsuppari', label: 'Tsuppari', icon: '✋', effect: { stat: 'strikePower', value: 2 }, description: 'Rapid palm strikes' },
            { id: 'push', label: 'Push Attack', icon: '➡️', effect: { stat: 'pushPower', value: 2 }, description: 'Drive forward' },
            { id: 'pull', label: 'Pull Down', icon: '⬅️', effect: { stat: 'balance', value: 2 }, description: 'Off-balance opponent' }
        ],
        hasWinner: true
    },
    finish: {
        name: 'Finishing Move!',
        description: 'Execute your winning technique',
        choices: [
            { id: 'yorikiri', label: 'Yorikiri', icon: '🔄', description: 'Force out while gripping belt' },
            { id: 'oshidashi', label: 'Oshidashi', icon: '💨', description: 'Push out with thrusts' },
            { id: 'uwatenage', label: 'Uwatenage', icon: '🌀', description: 'Overarm throw' },
            { id: 'hatakikomi', label: 'Hatakikomi', icon: '⬇️', description: 'Slap down' }
        ],
        hasWinner: true
    }
};

// Tachiai matchups: [attacker wins against]
const TACHIAI_MATCHUPS = {
    hard: ['henka'],      // Hard charge beats henka sidestep
    soft: ['hard'],       // Soft absorb beats hard charge
    henka: ['soft']       // Henka beats soft absorb
};

// Technique matchups
const TECHNIQUE_MATCHUPS = {
    grip: ['push'],       // Grip beats push (can't push if grabbed)
    tsuppari: ['grip'],   // Tsuppari beats grip (can't grab with strikes incoming)
    push: ['pull'],       // Push beats pull (forward momentum)
    pull: ['tsuppari']    // Pull beats tsuppari (use their momentum)
};

// Finish move effectiveness based on accumulated stats
const FINISH_STAT_BONUSES = {
    yorikiri: ['throwPower', 'pushPower'],
    oshidashi: ['pushPower', 'strikePower'],
    uwatenage: ['throwPower', 'balance'],
    hatakikomi: ['balance', 'strikePower']
};

/**
 * Resolve a phase and return the result
 */
function resolvePhase(match, phaseName) {
    const phase = PHASES[phaseName];
    const eastChoice = match.east.choice;
    const westChoice = match.west.choice;

    const result = {
        phase: phaseName,
        phaseName: phase.name,
        eastChoice,
        westChoice,
        winner: null,
        eastAnnouncement: '',
        westAnnouncement: ''
    };

    // Apply stat effects
    const eastChoiceData = phase.choices.find(c => c.id === eastChoice);
    const westChoiceData = phase.choices.find(c => c.id === westChoice);

    if (eastChoiceData?.effect) {
        match.battleStats.east[eastChoiceData.effect.stat] += eastChoiceData.effect.value;
    }
    if (westChoiceData?.effect) {
        match.battleStats.west[westChoiceData.effect.stat] += westChoiceData.effect.value;
    }

    // Generate announcements
    result.eastAnnouncement = generateAnnouncement(phaseName, eastChoice, 'east', match.east);
    result.westAnnouncement = generateAnnouncement(phaseName, westChoice, 'west', match.west);

    // Resolve winner for competitive phases
    if (phase.hasWinner) {
        if (phaseName === 'tachiai') {
            result.winner = resolveTachiai(eastChoice, westChoice, match);
        } else if (phaseName === 'technique') {
            result.winner = resolveTechnique(eastChoice, westChoice, match);
        } else if (phaseName === 'finish') {
            result.winner = resolveFinish(eastChoice, westChoice, match);
        }

        // Award momentum to winner
        if (result.winner) {
            match.battleStats[result.winner].momentum += 2;
        }
    }

    return result;
}

/**
 * Resolve Tachiai (rock-paper-scissors style)
 */
function resolveTachiai(eastChoice, westChoice, match) {
    if (eastChoice === westChoice) {
        // Tie - use stats to break
        const eastTotal = match.battleStats.east.spirit + match.battleStats.east.focus;
        const westTotal = match.battleStats.west.spirit + match.battleStats.west.focus;
        if (eastTotal > westTotal) return 'east';
        if (westTotal > eastTotal) return 'west';
        return Math.random() > 0.5 ? 'east' : 'west';
    }

    if (TACHIAI_MATCHUPS[eastChoice]?.includes(westChoice)) {
        return 'east';
    }
    if (TACHIAI_MATCHUPS[westChoice]?.includes(eastChoice)) {
        return 'west';
    }

    return null;
}

/**
 * Resolve Technique phase
 */
function resolveTechnique(eastChoice, westChoice, match) {
    if (eastChoice === westChoice) {
        // Tie - use accumulated stats
        const eastTotal = Object.values(match.battleStats.east).reduce((a, b) => a + b, 0);
        const westTotal = Object.values(match.battleStats.west).reduce((a, b) => a + b, 0);
        if (eastTotal > westTotal) return 'east';
        if (westTotal > eastTotal) return 'west';
        return Math.random() > 0.5 ? 'east' : 'west';
    }

    if (TECHNIQUE_MATCHUPS[eastChoice]?.includes(westChoice)) {
        return 'east';
    }
    if (TECHNIQUE_MATCHUPS[westChoice]?.includes(eastChoice)) {
        return 'west';
    }

    return null;
}

/**
 * Resolve Finish phase - final calculation
 */
function resolveFinish(eastChoice, westChoice, match) {
    // Calculate total power for each side
    let eastPower = 0;
    let westPower = 0;

    // Base stats from wrestler
    eastPower += (match.east.stats?.technique || 5) * 2;
    westPower += (match.west.stats?.technique || 5) * 2;

    // Accumulated battle stats
    const eastStats = match.battleStats.east;
    const westStats = match.battleStats.west;

    eastPower += eastStats.momentum * 3;
    westPower += westStats.momentum * 3;

    // Bonus for relevant stats to chosen move
    const eastBonusStats = FINISH_STAT_BONUSES[eastChoice] || [];
    const westBonusStats = FINISH_STAT_BONUSES[westChoice] || [];

    eastBonusStats.forEach(stat => {
        eastPower += (eastStats[stat] || 0) * 2;
    });
    westBonusStats.forEach(stat => {
        westPower += (westStats[stat] || 0) * 2;
    });

    // Signature move bonus
    if (match.east.signatureMove === eastChoice) {
        eastPower += 5;
    }
    if (match.west.signatureMove === westChoice) {
        westPower += 5;
    }

    // Add some randomness (10% variance)
    eastPower += Math.random() * eastPower * 0.1;
    westPower += Math.random() * westPower * 0.1;

    return eastPower >= westPower ? 'east' : 'west';
}

/**
 * Generate Pokemon-style announcement
 */
function generateAnnouncement(phase, choice, side, player) {
    const name = player.rikishiName || 'The wrestler';

    const announcements = {
        salt: {
            little: `${name} throws a precise handful of salt!`,
            lots: `${name} hurls a mighty cloud of salt into the air!`
        },
        display: {
            mawashi: `${name} slaps their belt with thunderous force!`,
            aura: `${name} radiates an intimidating aura of calm!`
        },
        tachiai: {
            hard: `${name} explodes forward with a devastating charge!`,
            soft: `${name} absorbs the impact with perfect technique!`,
            henka: `${name} sidesteps with lightning reflexes!`
        },
        technique: {
            grip: `${name} secures a powerful grip on the belt!`,
            tsuppari: `${name} unleashes a flurry of palm strikes!`,
            push: `${name} drives forward with tremendous force!`,
            pull: `${name} pulls their opponent off balance!`
        },
        finish: {
            yorikiri: `${name} forces their opponent out with yorikiri!`,
            oshidashi: `${name} pushes out with oshidashi!`,
            uwatenage: `${name} executes a spectacular uwatenage throw!`,
            hatakikomi: `${name} slaps down with hatakikomi!`
        }
    };

    return announcements[phase]?.[choice] || `${name} makes their move!`;
}

/**
 * Determine overall match winner based on phase results
 */
function determineMatchWinner(match) {
    // Count phase wins
    let eastWins = 0;
    let westWins = 0;

    for (const phase in match.phaseResults) {
        const result = match.phaseResults[phase];
        if (result.winner === 'east') eastWins++;
        if (result.winner === 'west') westWins++;
    }

    // If someone won more competitive phases, they win
    if (eastWins > westWins) return 'east';
    if (westWins > eastWins) return 'west';

    // Tie-breaker: total accumulated stats
    const eastTotal = Object.values(match.battleStats.east).reduce((a, b) => a + b, 0);
    const westTotal = Object.values(match.battleStats.west).reduce((a, b) => a + b, 0);

    if (eastTotal > westTotal) return 'east';
    if (westTotal > eastTotal) return 'west';

    // Ultimate tie-breaker: random
    return Math.random() > 0.5 ? 'east' : 'west';
}

module.exports = {
    PHASES,
    resolvePhase,
    determineMatchWinner,
    generateAnnouncement
};
