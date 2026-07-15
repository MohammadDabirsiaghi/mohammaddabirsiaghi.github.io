"use strict";

(function () {
    function getApiUrl() {
        const apiUrl = window.APP_CONFIG?.API_URL;

        if (!apiUrl) {
            throw new Error("آدرس API در config.js تنظیم نشده است.");
        }

        return apiUrl;
    }

    function createRequestId(prefix) {
        const p = prefix || "req";
        return (
            p +
            "_" +
            Date.now() +
            "_" +
            Math.random().toString(36).slice(2, 10)
        );
    }

    // POST در حالت no-cors => پاسخ opaque است => نه status قابل اتکاست نه json
    async function post(payload, options) {
        options = options || {};
        const requestId =
            options.requestId ||
            payload?.requestId ||
            createRequestId("req");

        const body = JSON.stringify({
            ...payload,
            requestId: requestId
        });

        try {
            await fetch(getApiUrl(), {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: body
            });

            // فقط تایید ارسال (نه موفقیت پردازش)
            return {
                ok: true,
                pending: true,
                requestId: requestId,
                message: "درخواست ارسال شد. در حال پیگیری نتیجه..."
            };
        } catch (e) {
            throw new Error("ارسال درخواست ناموفق بود. اتصال اینترنت را بررسی کنید.");
        }
    }

    function get(params) {
        return new Promise(function (resolve, reject) {
            const callbackName =
                "__apiCallback_" +
                Date.now() +
                "_" +
                Math.random().toString(36).slice(2);

            const script = document.createElement("script");
            const query = new URLSearchParams({
                ...params,
                callback: callbackName
            });

            let timeoutId;

            function cleanup() {
                clearTimeout(timeoutId);
                script.remove();

                try {
                    delete window[callbackName];
                } catch {
                    window[callbackName] = undefined;
                }
            }

            window[callbackName] = function (result) {
                cleanup();

                if (!result?.ok) {
                    reject(new Error(result?.message || "عملیات ناموفق بود."));
                    return;
                }

                resolve(result);
            };

            script.onerror = function () {
                cleanup();
                reject(new Error("ارتباط با سرور برقرار نشد."));
            };

            timeoutId = setTimeout(function () {
                cleanup();
                reject(new Error("زمان دریافت پاسخ از سرور تمام شد."));
            }, 30000);

            script.src = getApiUrl() + "?" + query.toString();
            document.body.appendChild(script);
        });
    }

    /**
     * Polling با JSONP GET
     * انتظار داریم backend اکشنی مثل getRequestStatus داشته باشد و یکی از این‌ها را برگرداند:
     * { ok:true, status:'pending'|'done'|'error', message, data }
     */
    async function poll(params) {
        debugger;
        const requestId = params?.requestId;
        const action = params?.action || "getRequestStatus";
        const intervalMs = Number(params?.intervalMs || 1200);
        const maxAttempts = Number(params?.maxAttempts || 25);

        if (!requestId) {
            throw new Error("requestId برای polling الزامی است.");
        }

        let attempt = 0;

        while (attempt < maxAttempts) {
            attempt += 1;

            const res = await get({
                action: action,
                requestId: requestId
            });

            const payload = res?.data || {};
            const status = String(payload.status || "").toLowerCase();

            if (status === "done") {
                if (payload.result && payload.result.ok === false) {
                    throw new Error(payload.result.message || "پردازش درخواست ناموفق بود.");
                }

                return payload.result || payload;
            }

            if (status === "error") {
                throw new Error(payload.message || "پردازش درخواست با خطا مواجه شد.");
            }
            if (status === "failed") {
                throw new Error(payload.result.message || "پردازش درخواست با خطا مواجه شد.");
            }
            if (status === "not_found") {
                throw new Error("وضعیت درخواست پیدا نشد یا منقضی شده است.");
            }

            if (status === "invalid") {
                throw new Error("داده ذخیره‌شده وضعیت درخواست نامعتبر است.");
            }

            // pending یا حالت نامشخص => ادامه polling
            await new Promise((r) => setTimeout(r, intervalMs));
        }

        // تایم‌اوت polling
        return {
            ok: true,
            status: "pending",
            requestId: requestId,
            message: "درخواست هنوز در حال پردازش است."
        };
    }

    window.ApiClient = Object.freeze({
        get: get,
        post: post,
        poll: poll,
        createRequestId: createRequestId
    });
})();
