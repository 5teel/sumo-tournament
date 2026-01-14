/**
 * IMAGE MANAGER - Handles image uploads and localStorage persistence
 * All images are stored as base64 data URLs in localStorage
 */

const ImageManager = {
    STORAGE_KEY: 'sumo_tournament_images',

    // Default placeholder categories
    placeholders: {
        wrestlers: {}, // wrestler ID -> image data URL
        celebration: {
            emperorsCup: null,
            giantSnapper: null,
            limousine: null,
            champion: null,
            dohyo: null,
            tournament: null
        },
        misc: {
            logo: null
        }
    },

    // Initialize - load saved images from localStorage
    init() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.placeholders = { ...this.placeholders, ...parsed };
                console.log('ImageManager: Loaded saved images from localStorage');
            } catch (e) {
                console.error('ImageManager: Failed to load saved images', e);
            }
        }
        return this;
    },

    // Save current state to localStorage
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.placeholders));
            console.log('ImageManager: Saved images to localStorage');
        } catch (e) {
            console.error('ImageManager: Failed to save images', e);
            if (e.name === 'QuotaExceededError') {
                alert('Storage full! Try using smaller images or clearing some saved images.');
            }
        }
    },

    // Get wrestler image (returns saved or placeholder)
    getWrestlerImage(wrestlerId) {
        return this.placeholders.wrestlers[wrestlerId] || null;
    },

    // Set wrestler image
    setWrestlerImage(wrestlerId, dataUrl) {
        this.placeholders.wrestlers[wrestlerId] = dataUrl;
        this.save();
    },

    // Get celebration image
    getCelebrationImage(type) {
        return this.placeholders.celebration[type] || null;
    },

    // Set celebration image
    setCelebrationImage(type, dataUrl) {
        this.placeholders.celebration[type] = dataUrl;
        this.save();
    },

    // Clear all images
    clearAll() {
        this.placeholders = {
            wrestlers: {},
            celebration: {
                emperorsCup: null,
                giantSnapper: null,
                limousine: null,
                champion: null,
                dohyo: null,
                tournament: null
            },
            misc: {
                logo: null
            }
        };
        this.save();
    },

    // Create upload handler for an image element
    createUploadHandler(imageElement, category, key, onUpload) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Check file size (max 500KB for localStorage)
                if (file.size > 500000) {
                    alert('Image too large! Please use an image under 500KB.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;

                    // Resize image if needed
                    this.resizeImage(dataUrl, 300, 300, (resizedUrl) => {
                        // Save to storage
                        if (category === 'wrestlers') {
                            this.setWrestlerImage(key, resizedUrl);
                        } else if (category === 'celebration') {
                            this.setCelebrationImage(key, resizedUrl);
                        }

                        // Update image element
                        if (imageElement) {
                            imageElement.src = resizedUrl;
                        }

                        // Callback
                        if (onUpload) onUpload(resizedUrl);
                    });
                };
                reader.readAsDataURL(file);
            }
        });

        return input;
    },

    // Resize image to max dimensions while maintaining aspect ratio
    resizeImage(dataUrl, maxWidth, maxHeight, callback) {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            // Create canvas and draw resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to data URL (JPEG for smaller size)
            callback(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = dataUrl;
    },

    // Make an image element uploadable
    makeUploadable(imageElement, category, key, onUpload) {
        const input = this.createUploadHandler(imageElement, category, key, onUpload);
        document.body.appendChild(input);

        // Add upload indicator overlay
        const wrapper = document.createElement('div');
        wrapper.className = 'uploadable-image-wrapper';
        imageElement.parentNode.insertBefore(wrapper, imageElement);
        wrapper.appendChild(imageElement);

        const overlay = document.createElement('div');
        overlay.className = 'upload-overlay';
        overlay.innerHTML = '<span>Click to Upload</span>';
        wrapper.appendChild(overlay);

        wrapper.addEventListener('click', () => input.click());
        wrapper.style.cursor = 'pointer';

        return wrapper;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    ImageManager.init();
});

// Make globally available
window.ImageManager = ImageManager;
