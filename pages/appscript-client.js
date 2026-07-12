(function (global) {
    'use strict';

    function createAppScriptClient(config) {
        const settings = Object.assign(
            {
                baseUrl: '',
                jsonpTimeoutMs: 15000
            },
            config || {}
        );

        if (!settings.baseUrl) {
            throw new Error('Apps Script baseUrl is required.');
        }

        settings.baseUrl = settings.baseUrl.replace(/\/+$/, '');

        return {
            post: post,
            get: get
        };

        async function post(action, payload, options) {
            const body = Object.assign({}, payload || {}, {
                action: action
            });

            await fetch(settings.baseUrl, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(body)
            });

            return {
                ok: true,
                status: 'pending',
                requestId: (options && options.requestId) || body.requestId || null
            };
        }

        async function get(action, params) {
            const res = await jsonpRequest(
                Object.assign({}, params || {}, {
                    action: action,
                    _: Date.now()
                })
            );

            return normalizeResponse(res);
        }

        function jsonpRequest(params) {
            return new Promise(function (resolve, reject) {
                const callbackName =
                    '__jsonp_' + Date.now() + '_' + Math.random().toString(36).slice(2);

                const script = document.createElement('script');
                let done = false;
                let timeoutId = null;

                function cleanup() {
                    if (timeoutId) clearTimeout(timeoutId);
                    if (script.parentNode) script.parentNode.removeChild(script);

                    try {
                        delete global[callbackName];
                    } catch (_) {
                        global[callbackName] = undefined;
                    }
                }

                function finish(fn, value) {
                    if (done) return;
                    done = true;
                    cleanup();
                    fn(value);
                }

                global[callbackName] = function (data) {
                    finish(resolve, data);
                };

                script.async = true;
                script.onerror = function () {
                    finish(reject, new Error('JSONP request failed.'));
                };

                script.src = buildUrl(
                    settings.baseUrl,
                    Object.assign({}, params, {
                        callback: callbackName
                    })
                );

                timeoutId = setTimeout(function () {
                    finish(reject, new Error('JSONP timeout.'));
                }, settings.jsonpTimeoutMs);

                document.head.appendChild(script);
            });
        }
    }

    function normalizeResponse(resp) {
        if (!resp) {
            return {
                ok: false,
                status: 'error',
                message: 'Empty response'
            };
        }

        const data = extractData(resp) || {};
        const rawStatus = String(data.status || resp.status || '').toLowerCase();

        if (
            resp.ok === false ||
            data.ok === false ||
            rawStatus === 'error' ||
            rawStatus === 'failed' ||
            rawStatus === 'failure'
        ) {
            return {
                ok: false,
                status: 'error',
                message: data.message || resp.message || data.error || 'Request failed.',
                data: data
            };
        }

        if (
            rawStatus === 'done' ||
            rawStatus === 'success' ||
            rawStatus === 'completed' ||
            data.done === true ||
            data.completed === true
        ) {
            return {
                ok: true,
                status: 'done',
                message: data.message || resp.message || '',
                data: data
            };
        }

        if (rawStatus === 'pending') {
            return {
                ok: true,
                status: 'pending',
                message: data.message || resp.message || '',
                data: data
            };
        }

        return {
            ok: true,
            status: 'done',
            message: data.message || resp.message || '',
            data: data
        };
    }

    function extractData(resp) {
        if (!resp) return null;
        if (Object.prototype.hasOwnProperty.call(resp, 'data')) return resp.data;
        if (Object.prototype.hasOwnProperty.call(resp, 'result')) return resp.result;
        return resp;
    }

    function buildUrl(baseUrl, params) {
        const qs = Object.keys(params || {})
            .filter(function (k) {
                return params[k] !== undefined && params[k] !== null && params[k] !== '';
            })
            .map(function (k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent(serialize(params[k]));
            })
            .join('&');

        return baseUrl + (baseUrl.indexOf('?') >= 0 ? '&' : '?') + qs;
    }

    function serialize(v) {
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
    }

    global.AppScriptClient = { create: createAppScriptClient };
})(window);
