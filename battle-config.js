/**
 * SUMO BATTLE CONFIGURATION - ADMIN BALANCE SHEET
 * ================================================
 * Modify these values to adjust game balance.
 * All percentages are expressed as decimals (0.5 = 50%)
 *
 * For matchups: [attacker_win_chance, defender_win_chance]
 * The system will use the first player's perspective
 */

const BATTLE_CONFIG = {

    // ==========================================
    // PHASE 1: SALT THROWING
    // ==========================================
    saltThrow: {
        little: {
            focus: 2,        // Points added to Focus stat
            spirit: 0
        },
        lot: {
            focus: 0,
            spirit: 2        // Points added to Spirit stat
        }
    },

    // ==========================================
    // PHASE 2: DISPLAY/INTIMIDATION
    // ==========================================
    display: {
        mawashi: {
            intimidation: 2,  // Points added to Intimidation
            crowdSupport: 0
        },
        auraPose: {
            intimidation: 0,
            crowdSupport: 2   // Points added to Crowd Support
        }
    },

    // ==========================================
    // PHASE 3: TACHIAI (Initial Clash)
    // ==========================================
    // Format: { [move1_vs_move2]: [move1_win%, move2_win%] }
    // Special: Henka vs Hard has special 30/70 rule
    tachiai: {
        moves: ['hard', 'soft', 'henka'],
        labels: {
            hard: 'Hard Tachiai',
            soft: 'Soft Tachiai',
            henka: 'Henka (Sidestep)'
        },
        descriptions: {
            hard: 'Powerful forward charge. Strong vs Henka.',
            soft: 'Measured initial clash. Balanced approach.',
            henka: 'Shameful sidestep. Risky but can surprise.'
        },
        // Matchup matrix: [row_player_win%, col_player_win%]
        matchups: {
            // Hard vs...
            'hard_vs_hard': [0.50, 0.50],
            'hard_vs_soft': [0.55, 0.45],
            'hard_vs_henka': [0.70, 0.30],  // Hard punishes Henka

            // Soft vs...
            'soft_vs_hard': [0.45, 0.55],
            'soft_vs_soft': [0.50, 0.50],
            'soft_vs_henka': [0.40, 0.60],  // Henka works better vs Soft

            // Henka vs...
            'henka_vs_hard': [0.30, 0.70],  // Shameful and usually fails
            'henka_vs_soft': [0.60, 0.40],
            'henka_vs_henka': [0.50, 0.50]  // Both sidestep awkwardly
        },
        // Stat bonuses for winning tachiai
        winBonus: {
            momentum: 3,      // Winner gets momentum bonus
            positioning: 2
        },
        // Henka shame penalty (applied even if Henka wins)
        henkaPenalty: {
            crowdSupport: -1,
            spirit: -1
        }
    },

    // ==========================================
    // PHASE 4: BATTLE TECHNIQUE
    // ==========================================
    battleTechnique: {
        moves: ['grip', 'tsuppari', 'push', 'pull'],
        labels: {
            grip: 'Belt Grip (Mawashi)',
            tsuppari: 'Tsuppari (Thrusts)',
            push: 'Oshi (Pushing)',
            pull: 'Hiki (Pulling)'
        },
        descriptions: {
            grip: 'Secure the belt for throws. Good vs Thrusts.',
            tsuppari: 'Rapid palm thrusts. Good vs Pulling.',
            push: 'Steady forward pressure. Good vs Pulling.',
            pull: 'Redirect momentum. Good vs Pushing.'
        },
        // Matchup matrix
        matchups: {
            // Grip vs...
            'grip_vs_grip': [0.50, 0.50],
            'grip_vs_tsuppari': [0.60, 0.40],
            'grip_vs_push': [0.45, 0.55],
            'grip_vs_pull': [0.55, 0.45],

            // Tsuppari vs...
            'tsuppari_vs_grip': [0.40, 0.60],
            'tsuppari_vs_tsuppari': [0.50, 0.50],
            'tsuppari_vs_push': [0.55, 0.45],
            'tsuppari_vs_pull': [0.60, 0.40],

            // Push vs...
            'push_vs_grip': [0.55, 0.45],
            'push_vs_tsuppari': [0.45, 0.55],
            'push_vs_push': [0.50, 0.50],
            'push_vs_pull': [0.40, 0.60],

            // Pull vs...
            'pull_vs_grip': [0.45, 0.55],
            'pull_vs_tsuppari': [0.40, 0.60],
            'pull_vs_push': [0.60, 0.40],
            'pull_vs_pull': [0.50, 0.50]
        },
        // Technique bonuses for the next phase
        techniqueBonus: {
            grip: { throwPower: 2 },
            tsuppari: { strikePower: 2 },
            push: { pushPower: 2 },
            pull: { balance: 2 }
        }
    },

    // ==========================================
    // PHASE 5: FINISHING MOVE
    // ==========================================
    finishingMove: {
        // Base success rate before modifiers
        baseSuccessRate: 0.50,

        // How much each stat point affects success rate
        statMultipliers: {
            spirit: 0.02,         // Each point = +2% success
            focus: 0.025,         // Each point = +2.5% success
            intimidation: 0.015,  // Each point = +1.5% success
            crowdSupport: 0.01,   // Each point = +1% success
            momentum: 0.03,       // Each point = +3% success
            positioning: 0.02,    // Each point = +2% success
            throwPower: 0.02,
            strikePower: 0.02,
            pushPower: 0.02,
            balance: 0.015
        },

        // Signature move bonus (selected during character creation)
        signatureMoveBonus: 0.15,  // +15% when using signature move

        // Randomness factor (0 = pure stats, 1 = pure random)
        randomnessFactor: 0.20
    },

    // ==========================================
    // MOVE CATEGORIES FOR FINISHING
    // ==========================================
    finishingMoveCategories: {
        // Maps signature moves to what technique they pair well with
        moveAffinities: {
            'Yorikiri': { bestWith: 'grip', bonus: 0.10 },
            'Oshidashi': { bestWith: 'push', bonus: 0.10 },
            'Hatakikomi': { bestWith: 'pull', bonus: 0.10 },
            'Uwatenage': { bestWith: 'grip', bonus: 0.10 },
            'Tsukiotoshi': { bestWith: 'tsuppari', bonus: 0.10 },
            'Kotenage': { bestWith: 'grip', bonus: 0.10 },
            'Hikiotoshi': { bestWith: 'pull', bonus: 0.10 },
            'Sukuinage': { bestWith: 'grip', bonus: 0.10 }
        }
    },

    // ==========================================
    // UI TIMING SETTINGS (milliseconds)
    // ==========================================
    timing: {
        phaseTransitionDelay: 1500,
        resultRevealDelay: 2000,
        moveSelectionTimeout: 30000  // 30 seconds to pick
    }
};

// Make it globally available
window.BATTLE_CONFIG = BATTLE_CONFIG;
