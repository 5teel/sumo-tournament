/**
 * SUMO TOURNAMENT V2 - Sound Manager
 * Background Taiko drum loop with Web Audio API
 */

const SoundManager = {
    audioContext: null,
    isEnabled: true,
    masterGain: null,

    // Background music
    bgMusic: null,
    bgMusicLoaded: false,
    bgMusicPlaying: false,

    /**
     * Initialize the audio context (must be called after user interaction)
     */
    init() {
        if (this.audioContext) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.7;

            // Load background music
            this._loadBackgroundMusic();

            console.log('Sound system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.isEnabled = false;
        }
    },

    /**
     * Load the background music file
     */
    _loadBackgroundMusic() {
        if (this.bgMusicLoaded) return;

        this.bgMusic = new Audio('audio/taiko-loop.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.5;

        this.bgMusic.addEventListener('canplaythrough', () => {
            this.bgMusicLoaded = true;
            console.log('Background music loaded');
        });

        this.bgMusic.addEventListener('error', (e) => {
            console.warn('Failed to load background music:', e);
        });

        // Preload
        this.bgMusic.load();
    },

    /**
     * Resume audio context if suspended (required by browsers)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    },

    /**
     * Start background music
     */
    startBackgroundMusic() {
        if (!this.isEnabled || !this.bgMusic) return;

        if (this.bgMusicPlaying) return;

        this.bgMusic.currentTime = 0;
        this.bgMusic.play().then(() => {
            this.bgMusicPlaying = true;
            console.log('Background music started');
        }).catch(e => {
            console.warn('Failed to play background music:', e);
        });
    },

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        if (!this.bgMusic) return;

        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        this.bgMusicPlaying = false;
    },

    /**
     * Pause background music (keeps position)
     */
    pauseBackgroundMusic() {
        if (!this.bgMusic) return;

        this.bgMusic.pause();
        this.bgMusicPlaying = false;
    },

    /**
     * Resume background music from current position
     */
    resumeBackgroundMusic() {
        if (!this.isEnabled || !this.bgMusic || this.bgMusicPlaying) return;

        this.bgMusic.play().then(() => {
            this.bgMusicPlaying = true;
        }).catch(e => {
            console.warn('Failed to resume background music:', e);
        });
    },

    /**
     * Set background music volume
     * @param {number} volume - 0 to 1
     */
    setMusicVolume(volume) {
        if (this.bgMusic) {
            this.bgMusic.volume = Math.max(0, Math.min(1, volume));
        }
    },

    /**
     * Play intro - starts background music
     */
    playIntro() {
        if (!this.isEnabled) return;
        this.init();
        this.resume();
        this.startBackgroundMusic();
    },

    /**
     * Play battle start - ensure music is playing
     */
    playBattleStart() {
        if (!this.isEnabled) return;
        this.init();
        this.resume();

        if (!this.bgMusicPlaying) {
            this.startBackgroundMusic();
        }
    },

    /**
     * Start timer countdown beats - music continues
     * @param {number} seconds - seconds remaining
     */
    startTimerBeats(seconds) {
        if (!this.isEnabled) return;
        this.init();
        this.resume();

        // Ensure music is playing during battle
        if (!this.bgMusicPlaying) {
            this.startBackgroundMusic();
        }
    },

    /**
     * Stop timer beats - music continues
     */
    stopTimerBeats() {
        // Music continues, nothing to stop
    },

    /**
     * Play warning sound (last 3 seconds) - handled by music tempo
     */
    playWarning() {
        // Music handles the tension
    },

    /**
     * Play phase result sound
     * @param {boolean} isWinner - did the player win this phase
     */
    playPhaseResult(isWinner) {
        // Music continues
    },

    /**
     * Play match victory fanfare - boost music briefly
     */
    playVictory() {
        if (!this.isEnabled) return;

        // Temporarily boost volume for victory
        if (this.bgMusic) {
            const originalVolume = this.bgMusic.volume;
            this.bgMusic.volume = Math.min(1, originalVolume + 0.2);

            setTimeout(() => {
                this.bgMusic.volume = originalVolume;
            }, 2000);
        }
    },

    /**
     * Play tournament champion celebration
     */
    playChampion() {
        if (!this.isEnabled) return;

        // Boost volume for champion screen
        if (this.bgMusic) {
            this.bgMusic.volume = 0.8;
        }
    },

    /**
     * Play choice selection click - subtle audio feedback
     */
    playSelect() {
        if (!this.isEnabled || !this.audioContext) return;
        this.init();
        this.resume();

        // Quick click sound using Web Audio
        const ctx = this.audioContext;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.1);
    },

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) {
            this.stopBackgroundMusic();
        } else {
            this.startBackgroundMusic();
        }
        return this.isEnabled;
    },

    /**
     * Set master volume
     * @param {number} volume - 0 to 1
     */
    setVolume(volume) {
        const v = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = v;
        }
        if (this.bgMusic) {
            this.bgMusic.volume = v * 0.7; // Music slightly lower than effects
        }
    }
};

// Auto-initialize on first user interaction
document.addEventListener('click', () => {
    SoundManager.init();
    SoundManager.resume();
}, { once: true });

// Setup sound control UI
document.addEventListener('DOMContentLoaded', () => {
    const muteBtn = document.getElementById('sound-mute-btn');
    const soundIcon = document.getElementById('sound-icon');
    const volumeSlider = document.getElementById('sound-slider');

    if (muteBtn && soundIcon && volumeSlider) {
        // Mute button click
        muteBtn.addEventListener('click', () => {
            const isEnabled = SoundManager.toggle();
            muteBtn.classList.toggle('muted', !isEnabled);
            // Speaker icon: 🔊 (on) or 🔇 (muted)
            soundIcon.innerHTML = isEnabled ? '&#128266;' : '&#128263;';
            volumeSlider.disabled = !isEnabled;
        });

        // Volume slider change
        volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value, 10) / 100;
            SoundManager.setMusicVolume(volume);

            // Update icon based on volume level
            if (SoundManager.isEnabled) {
                if (volume === 0) {
                    soundIcon.innerHTML = '&#128264;'; // Speaker with no waves
                } else if (volume < 0.5) {
                    soundIcon.innerHTML = '&#128265;'; // Speaker with one wave
                } else {
                    soundIcon.innerHTML = '&#128266;'; // Speaker with waves
                }
            }
        });

        // Set initial volume
        SoundManager.setMusicVolume(0.5);
    }
});
