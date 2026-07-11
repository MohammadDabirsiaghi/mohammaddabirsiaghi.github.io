"use strict";

(function () {
    function getApiUrl() {
        const apiUrl = window.APP_CONFIG?.API_URL;

        if (!apiUrl) {
            throw new Error("آدرس API در config.js تنظیم نشده است.");
        }

        return apiUrl;
    }

    async function post(payload) {
        const response = await fetch(getApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(
                "خطای ارتباط با سرور: " + response.status
            );
        }

        const result = await response.json();

        if (!result?.ok) {
            throw new Error(
                result?.message || "عملیات ناموفق بود."
            );
        }

        return result;
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
                    reject(
                        new Error(
                            result?.message ||
                            "عملیات ناموفق بود."
                        )
                    );
                    return;
                }

                resolve(result);
            };

            script.onerror = function () {
                cleanup();
                reject(
                    new Error("ارتباط با سرور برقرار نشد.")
                );
            };

            timeoutId = setTimeout(function () {
                cleanup();
                reject(
                    new Error(
                        "زمان دریافت پاسخ از سرور تمام شد."
                    )
                );
            }, 30000);

            script.src =
                getApiUrl() + "?" + query.toString();

            document.body.appendChild(script);
        });
    }

    window.ApiClient = Object.freeze({
        get: get,
        post: post
    });
})();
