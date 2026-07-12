(function (global) {
    function createLocalRequestStore(storageKey, options) {
        const settings = Object.assign({
            ttlMs: 30 * 60 * 1000
        }, options || {});

        function readAll() {
            try {
                return JSON.parse(localStorage.getItem(storageKey) || '{}');
            } catch (error) {
                return {};
            }
        }

        function writeAll(data) {
            localStorage.setItem(storageKey, JSON.stringify(data || {}));
        }

        function isExpired(record) {
            if (!record || !record.updatedAt) {
                return true;
            }

            return Date.now() - Number(record.updatedAt) > settings.ttlMs;
        }

        function cleanupExpired() {
            const all = readAll();
            let changed = false;

            Object.keys(all).forEach(function (key) {
                if (isExpired(all[key])) {
                    delete all[key];
                    changed = true;
                }
            });

            if (changed) {
                writeAll(all);
            }
        }

        return {
            savePending: function (record) {
                cleanupExpired();

                const all = readAll();
                all[record.requestId] = Object.assign({}, record, {
                    updatedAt: Date.now()
                });
                writeAll(all);
            },

            clear: function (requestId) {
                const all = readAll();
                delete all[requestId];
                writeAll(all);
            },

            get: function (requestId) {
                cleanupExpired();

                const all = readAll();
                return all[requestId] || null;
            },

            findByFingerprint: function (fingerprint) {
                cleanupExpired();

                const all = readAll();
                const keys = Object.keys(all);

                for (let i = 0; i < keys.length; i += 1) {
                    const item = all[keys[i]];
                    if (item && item.fingerprint === fingerprint) {
                        return item;
                    }
                }

                return null;
            },

            listPending: function () {
                cleanupExpired();

                const all = readAll();
                return Object.keys(all).map(function (key) {
                    return all[key];
                });
            },

            cleanupExpired: cleanupExpired
        };
    }

    global.RequestStoreFactory = {
        createLocalRequestStore: createLocalRequestStore
    };
})(window);
