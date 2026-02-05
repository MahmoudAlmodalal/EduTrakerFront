/**
 * Session Manager - Handles automatic session extension with limits
 *
 * Rules:
 * - Each session lasts 30 minutes
 * - User can extend 2 times (total 90 minutes max)
 * - After 2 extensions, force logout
 * - Extension happens on page refresh or activity
 */

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_EXTENSIONS = 2;
const SESSION_STORAGE_KEY = 'session_info';

export class SessionManager {
    /**
     * Initialize a new session (on login)
     */
    static initSession() {
        const sessionInfo = {
            startTime: Date.now(),
            lastExtension: Date.now(),
            extensionCount: 0,
            maxExtensions: MAX_EXTENSIONS
        };
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionInfo));
        return sessionInfo;
    }

    /**
     * Get current session info
     */
    static getSessionInfo() {
        const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to parse session info:', e);
            return null;
        }
    }

    /**
     * Check if session is valid and can be extended
     * @returns {Object} { isValid: boolean, shouldExtend: boolean, reason: string }
     */
    static checkSession() {
        const sessionInfo = this.getSessionInfo();

        // No session info - need to login
        if (!sessionInfo) {
            return { isValid: false, shouldExtend: false, reason: 'No session found' };
        }

        const now = Date.now();
        const timeSinceLastExtension = now - sessionInfo.lastExtension;
        const totalSessionTime = now - sessionInfo.startTime;

        // Check if session has expired
        if (timeSinceLastExtension > SESSION_DURATION) {
            // Check if we can extend
            if (sessionInfo.extensionCount < MAX_EXTENSIONS) {
                return {
                    isValid: true,
                    shouldExtend: true,
                    reason: 'Session expired but can extend',
                    extensionsLeft: MAX_EXTENSIONS - sessionInfo.extensionCount
                };
            } else {
                return {
                    isValid: false,
                    shouldExtend: false,
                    reason: 'Maximum extensions reached (2), force logout required'
                };
            }
        }

        // Session is still valid
        const timeRemaining = SESSION_DURATION - timeSinceLastExtension;
        return {
            isValid: true,
            shouldExtend: false,
            reason: 'Session is still valid',
            timeRemaining,
            extensionsLeft: MAX_EXTENSIONS - sessionInfo.extensionCount
        };
    }

    /**
     * Extend the current session
     * @returns {Object} { success: boolean, newSessionInfo: Object, reason: string }
     */
    static extendSession() {
        const sessionInfo = this.getSessionInfo();

        if (!sessionInfo) {
            return { success: false, reason: 'No session to extend' };
        }

        if (sessionInfo.extensionCount >= MAX_EXTENSIONS) {
            return {
                success: false,
                reason: `Maximum extensions (${MAX_EXTENSIONS}) reached. Please login again.`
            };
        }

        // Extend the session
        const newSessionInfo = {
            ...sessionInfo,
            lastExtension: Date.now(),
            extensionCount: sessionInfo.extensionCount + 1
        };

        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSessionInfo));

        console.log(`Session extended (${newSessionInfo.extensionCount}/${MAX_EXTENSIONS})`);

        return {
            success: true,
            newSessionInfo,
            extensionsLeft: MAX_EXTENSIONS - newSessionInfo.extensionCount,
            reason: `Session extended. ${MAX_EXTENSIONS - newSessionInfo.extensionCount} extensions remaining.`
        };
    }

    /**
     * Clear session info (on logout)
     */
    static clearSession() {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }

    /**
     * Get session statistics
     */
    static getSessionStats() {
        const sessionInfo = this.getSessionInfo();
        if (!sessionInfo) return null;

        const now = Date.now();
        const totalTime = now - sessionInfo.startTime;
        const timeSinceLastExtension = now - sessionInfo.lastExtension;
        const timeRemaining = Math.max(0, SESSION_DURATION - timeSinceLastExtension);

        return {
            totalSessionTime: totalTime,
            timeRemainingInCurrentPeriod: timeRemaining,
            extensionCount: sessionInfo.extensionCount,
            extensionsLeft: MAX_EXTENSIONS - sessionInfo.extensionCount,
            canExtend: sessionInfo.extensionCount < MAX_EXTENSIONS,
            startTime: new Date(sessionInfo.startTime).toLocaleString(),
            lastExtension: new Date(sessionInfo.lastExtension).toLocaleString()
        };
    }

    /**
     * Format time remaining in human readable format
     */
    static formatTimeRemaining(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
}

export default SessionManager;
