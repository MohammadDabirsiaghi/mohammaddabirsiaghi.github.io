window.APP_CONFIG = {
    backend: 'appscript', // 'appscript' | 'rest'
    appScript: {
        baseUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
    },
    rest: {
        baseUrl: 'https://yourdomain.com/api'
    },
    participantService: {
        pollIntervalMs: 1500,
        pollTimeoutMs: 20000,
        maxSubmitRetries: 1,
        maxStatusRetries: 2,
        pendingTtlMs: 30 * 60 * 1000,
        storageKey: 'participant_pending_requests'
    }
};
