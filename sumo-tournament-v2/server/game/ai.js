/**
 * SUMO TOURNAMENT V2 - AI Logic
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Create a CPU player using real wrestler data
 */
function createCPUPlayer(index, usedWrestlers, WRESTLERS, SIGNATURE_MOVES) {
    // Find an unused wrestler
    let wrestler = null;
    for (const w of WRESTLERS) {
        if (!usedWrestlers.has(w.id)) {
            wrestler = w;
            break;
        }
    }

    // Fallback if all wrestlers used
    if (!wrestler) {
        wrestler = WRESTLERS[index % WRESTLERS.length];
    }

    // Generate balanced stats (total = 20)
    const stats = generateCPUStats(wrestler);

    // Pick signature move based on wrestler style
    const signatureMove = wrestler.signatureMove ||
        SIGNATURE_MOVES[Math.floor(Math.random() * SIGNATURE_MOVES.length)];

    return {
        id: uuidv4(),
        email: `cpu_${index}_${Date.now()}@cpu.local`,
        playerName: `CPU ${wrestler.name}`,
        rikishiName: wrestler.name,
        wrestlerId: wrestler.id,
        stats,
        signatureMove,
        wins: 0,
        losses: 0,
        isCPU: true,
        createdAt: Date.now()
    };
}

/**
 * Generate balanced stats for CPU based on wrestler attributes
 */
function generateCPUStats(wrestler) {
    // Default balanced stats
    const stats = {
        height: 5,
        weight: 5,
        speed: 5,
        technique: 5
    };

    // Adjust based on wrestler style if defined
    if (wrestler.style === 'power') {
        stats.weight = 7;
        stats.technique = 3;
    } else if (wrestler.style === 'technical') {
        stats.technique = 7;
        stats.weight = 3;
    } else if (wrestler.style === 'speed') {
        stats.speed = 7;
        stats.height = 3;
    }

    return stats;
}

/**
 * Get CPU choice for a phase
 */
function getCPUChoice(phase, match, side, PHASES) {
    const phaseData = PHASES[phase];
    if (!phaseData) return null;

    const choices = phaseData.choices.map(c => c.id);
    const cpu = match[side];
    const opponent = match[side === 'east' ? 'west' : 'east'];

    // Smart AI logic based on phase
    switch (phase) {
        case 'salt':
            // Prefer lots of salt for spirit boost
            return Math.random() > 0.4 ? 'lots' : 'little';

        case 'display':
            // Choose based on current stats
            if (match.battleStats[side].spirit > match.battleStats[side].focus) {
                return 'aura'; // Already have spirit, get crowd support
            }
            return Math.random() > 0.5 ? 'mawashi' : 'aura';

        case 'tachiai':
            return chooseTachiaiSmart(match, side);

        case 'technique':
            return chooseTechniqueSmart(match, side);

        case 'finish':
            // Prefer signature move for bonus
            if (cpu.signatureMove && choices.includes(cpu.signatureMove)) {
                return cpu.signatureMove;
            }
            // Otherwise pick based on accumulated stats
            return chooseFinishSmart(match, side);

        default:
            // Random fallback
            return choices[Math.floor(Math.random() * choices.length)];
    }
}

/**
 * Smart Tachiai choice
 */
function chooseTachiaiSmart(match, side) {
    const myStats = match.battleStats[side];
    const oppStats = match.battleStats[side === 'east' ? 'west' : 'east'];

    // If we have more spirit/focus, go for hard charge
    const myTotal = myStats.spirit + myStats.focus;
    const oppTotal = oppStats.spirit + oppStats.focus;

    if (myTotal > oppTotal + 2) {
        return 'hard'; // Confident, go aggressive
    } else if (oppTotal > myTotal + 2) {
        return 'soft'; // Defensive against stronger opponent
    } else {
        // Even match - mix it up
        const rand = Math.random();
        if (rand < 0.4) return 'hard';
        if (rand < 0.7) return 'soft';
        return 'henka';
    }
}

/**
 * Smart Technique choice
 */
function chooseTechniqueSmart(match, side) {
    const wrestler = match[side];
    const myStats = match.battleStats[side];

    // Favor techniques that match wrestler style
    if (wrestler.stats?.technique > 6) {
        return Math.random() > 0.3 ? 'grip' : 'pull';
    }
    if (wrestler.stats?.weight > 6) {
        return Math.random() > 0.3 ? 'push' : 'grip';
    }
    if (wrestler.stats?.speed > 6) {
        return Math.random() > 0.3 ? 'tsuppari' : 'pull';
    }

    // Counter based on momentum
    if (myStats.momentum > 0) {
        return 'push'; // Keep pressure
    } else {
        return 'pull'; // Try to reset
    }
}

/**
 * Smart Finish choice
 */
function chooseFinishSmart(match, side) {
    const myStats = match.battleStats[side];

    // Choose finish that benefits from our accumulated stats
    if (myStats.throwPower >= myStats.pushPower) {
        return myStats.balance > myStats.pushPower ? 'uwatenage' : 'yorikiri';
    } else {
        return myStats.strikePower > myStats.balance ? 'oshidashi' : 'hatakikomi';
    }
}

/**
 * Resolve AI vs AI match instantly
 */
function resolveAIvsAI(match, PHASES) {
    const phaseOrder = ['salt', 'display', 'tachiai', 'technique', 'finish'];
    const phaseResults = {};

    for (const phase of phaseOrder) {
        // Get AI choices
        match.east.choice = getCPUChoice(phase, match, 'east', PHASES);
        match.west.choice = getCPUChoice(phase, match, 'west', PHASES);

        // Resolve phase
        const phaseData = PHASES[phase];
        const result = {
            phase,
            phaseName: phaseData.name,
            eastChoice: match.east.choice,
            westChoice: match.west.choice,
            winner: null
        };

        // Apply effects
        const eastChoiceData = phaseData.choices.find(c => c.id === match.east.choice);
        const westChoiceData = phaseData.choices.find(c => c.id === match.west.choice);

        if (eastChoiceData?.effect) {
            match.battleStats.east[eastChoiceData.effect.stat] += eastChoiceData.effect.value;
        }
        if (westChoiceData?.effect) {
            match.battleStats.west[westChoiceData.effect.stat] += westChoiceData.effect.value;
        }

        // Determine phase winner for competitive phases
        if (phaseData.hasWinner) {
            result.winner = resolvePhaseWinner(phase, match);
            if (result.winner) {
                match.battleStats[result.winner].momentum += 2;
            }
        }

        phaseResults[phase] = result;

        // Clear choices for next phase
        match.east.choice = null;
        match.west.choice = null;
    }

    // Determine overall winner
    let eastWins = 0;
    let westWins = 0;

    for (const phase in phaseResults) {
        if (phaseResults[phase].winner === 'east') eastWins++;
        if (phaseResults[phase].winner === 'west') westWins++;
    }

    let winner;
    if (eastWins > westWins) {
        winner = 'east';
    } else if (westWins > eastWins) {
        winner = 'west';
    } else {
        // Tie-breaker
        const eastTotal = Object.values(match.battleStats.east).reduce((a, b) => a + b, 0);
        const westTotal = Object.values(match.battleStats.west).reduce((a, b) => a + b, 0);
        winner = eastTotal >= westTotal ? 'east' : 'west';
    }

    return {
        winner,
        phaseResults,
        winningMove: phaseResults.finish?.eastChoice || phaseResults.finish?.westChoice
    };
}

/**
 * Simple phase winner resolution for AI vs AI
 */
function resolvePhaseWinner(phase, match) {
    const eastChoice = match.east.choice;
    const westChoice = match.west.choice;

    if (phase === 'tachiai') {
        const matchups = {
            hard: ['henka'],
            soft: ['hard'],
            henka: ['soft']
        };

        if (eastChoice === westChoice) {
            return Math.random() > 0.5 ? 'east' : 'west';
        }
        if (matchups[eastChoice]?.includes(westChoice)) return 'east';
        if (matchups[westChoice]?.includes(eastChoice)) return 'west';
        return null;
    }

    if (phase === 'technique') {
        const matchups = {
            grip: ['push'],
            tsuppari: ['grip'],
            push: ['pull'],
            pull: ['tsuppari']
        };

        if (eastChoice === westChoice) {
            return Math.random() > 0.5 ? 'east' : 'west';
        }
        if (matchups[eastChoice]?.includes(westChoice)) return 'east';
        if (matchups[westChoice]?.includes(eastChoice)) return 'west';
        return null;
    }

    if (phase === 'finish') {
        // Calculate power for each side
        let eastPower = match.battleStats.east.momentum * 3;
        let westPower = match.battleStats.west.momentum * 3;

        // Signature move bonus
        if (match.east.signatureMove === eastChoice) eastPower += 5;
        if (match.west.signatureMove === westChoice) westPower += 5;

        // Add randomness
        eastPower += Math.random() * 5;
        westPower += Math.random() * 5;

        return eastPower >= westPower ? 'east' : 'west';
    }

    return null;
}

module.exports = {
    createCPUPlayer,
    getCPUChoice,
    resolveAIvsAI
};
