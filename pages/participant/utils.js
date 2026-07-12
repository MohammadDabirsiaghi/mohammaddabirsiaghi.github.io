(function (global) {
    function generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    }

    function stableStringify(value) {
        if (value === null || typeof value !== 'object') {
            return JSON.stringify(value);
        }

        if (Array.isArray(value)) {
            return '[' + value.map(stableStringify).join(',') + ']';
        }

        const keys = Object.keys(value).sort();
        const parts = keys.map(function (key) {
            return JSON.stringify(key) + ':' + stableStringify(value[key]);
        });

        return '{' + parts.join(',') + '}';
    }

    function buildFingerprint(payload) {
        const base = {
            id: payload.id || '',
            fullName: payload.fullName || '',
            mobile: payload.mobile || '',
            email: payload.email || '',
            province: payload.province || '',
            city: payload.city || ''
        };

        return stableStringify(base);
    }

    function delay(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function toQueryString(params) {
        const searchParams = new URLSearchParams();

        Object.keys(params || {}).forEach(function (key) {
            const value = params[key];
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value);
            }
        });

        return searchParams.toString();
    }

    function normalizeApiError(error, fallbackMessage) {
        if (!error) {
            return new Error(fallbackMessage || 'Unknown error');
        }

        if (error instanceof Error) {
            return error;
        }

        if (typeof error === 'string') {
            return new Error(error);
        }

        if (error.message) {
            return new Error(error.message);
        }

        return new Error(fallbackMessage || 'Unknown error');
    }

    global.AppUtils = {
        generateRequestId: generateRequestId,
        buildFingerprint: buildFingerprint,
        delay: delay,
        toQueryString: toQueryString,
        normalizeApiError: normalizeApiError
    };
})(window);
