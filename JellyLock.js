// ==UserScript==
// @name         JellyLock (HotKey Lock)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Pure hotkey playback lock (Ctrl+Shift+F8) that hides player UI/cursor and blocks arrow key seeking
// @match        http://localhost:8096/*
// @match        http://127.0.0.1:8096/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    let isLocked = false;

    // Inject custom CSS rule to force-hide Jellyfin OSD elements and mouse cursor when locked
    const styleEl = document.createElement('style');
    styleEl.id = 'jellylock-style';
    document.head.appendChild(styleEl);

    function updateLockState(locked) {
        isLocked = locked;
        const overlay = getOverlay();
        
        if (isLocked) {
            overlay.style.display = 'block';
            styleEl.innerHTML = `
                body.jellylock-active,
                body.jellylock-active * {
                    cursor: none !important;
                }
                body.jellylock-active .videoOsdBottom,
                body.jellylock-active .videoOsdHeader,
                body.jellylock-active .osdHeader,
                body.jellylock-active .mdl-slider,
                body.jellylock-active .upNextContainer {
                    display: none !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
            `;
            document.body.classList.add('jellylock-active');
            console.log('JellyLock: PLAYBACK LOCKED (UI Hidden & Controls Intercepted)');
        } else {
            overlay.style.display = 'none';
            styleEl.innerHTML = '';
            document.body.classList.remove('jellylock-active');
            console.log('JellyLock: PLAYBACK UNLOCKED');
        }
    }

    // Fullscreen overlay to block accidental mouse clicks when locked
    function getOverlay() {
        let overlay = document.getElementById('jellyfin-lock-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'jellyfin-lock-overlay';
            overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 2147483646; display: none; background: transparent; cursor: none !important;';
            
            overlay.addEventListener('click', function (e) {
                if (isLocked) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
            }, true);
            
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    // Keydown Listener
    window.addEventListener('keydown', function (e) {
        // Toggle Lock State: Ctrl + Shift + F8
        if (e.ctrlKey && e.shiftKey && e.code === 'F8') {
            e.preventDefault();
            e.stopPropagation();
            updateLockState(!isLocked);
            return;
        }

        // Intercept controls when locked
        if (isLocked) {
            const blockedKeys = [
                'Space', 'KeyK', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'MediaPlayPause', 'MediaTrackNext', 'MediaTrackPrevious'
            ];
            
            if (blockedKeys.includes(e.code) || e.key === ' ' || e.key === 'k' || e.key === 'K') {
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        }
    }, true);
})();