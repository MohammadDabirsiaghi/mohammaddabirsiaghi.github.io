(function (global) {
    function createParticipantService(apiClient, options) {
        const settings = Object.assign({
            pollIntervalMs: 1500,
            pollTimeoutMs: 20000,
            maxSubmitRetries: 1,
            maxStatusRetries: 2,
            requestStore: null,
            hooks: {}
        }, options || {});

        async function submitParticipant(formData) {
            const payload = normalizeParticipantPayload(formData);
            validateParticipantPayload(payload);

            const fingerprint = AppUtils.buildFingerprint(payload);
            let requestId = payload.requestId || null;

            if (!requestId && settings.requestStore) {
                const existingPending = settings.requestStore.findByFingerprint(fingerprint);
                if (existingPending && existingPending.requestId) {
                    requestId = existingPending.requestId;
                }
            }

            if (!requestId) {
                requestId = AppUtils.generateRequestId();
            }

            payload.requestId = requestId;

            if (settings.requestStore) {
                settings.requestStore.savePending({
                    requestId: requestId,
                    fingerprint: fingerprint,
                    payload: payload
                });
            }

            fireHook('onPending', {
                requestId: requestId,
                payload: payload
            });

            await retryAsync(function () {
                return apiClient.submitParticipant(payload, {
                    requestId: requestId
                });
            }, settings.maxSubmitRetries, 'Submit failed.');

            if (apiClient.capabilities.returnsImmediateResult) {
                if (settings.requestStore) {
                    settings.requestStore.clear(requestId);
                }

                const directResult = {
                    ok: true,
                    requestId: requestId,
                    status: 'done',
                    message: 'Operation completed successfully.'
                };

                fireHook('onSuccess', directResult);
                return directResult;
            }

            if (apiClient.capabilities.supportsStatusPolling) {
                const result = await pollRequestResult(apiClient, requestId, {
                    intervalMs: settings.pollIntervalMs,
                    timeoutMs: settings.pollTimeoutMs,
                    maxStatusRetries: settings.maxStatusRetries
                });

                if (settings.requestStore) {
                    settings.requestStore.clear(requestId);
                }

                const normalized = normalizeSubmitResult(result, requestId);
                fireHook('onSuccess', normalized);
                return normalized;
            }

            return {
                ok: true,
                requestId: requestId,
                status: 'pending',
                message: 'Request accepted.'
            };
        }

        async function resumePendingByFingerprint(formData) {
            if (!settings.requestStore) {
                return null;
            }

            const payload = normalizeParticipantPayload(formData);
            const fingerprint = AppUtils.buildFingerprint(payload);
            const existing = settings.requestStore.findByFingerprint(fingerprint);

            if (!existing || !existing.requestId) {
                return null;
            }

            return resumeRequestById(existing.requestId);
        }

        async function resumeRequestById(requestId) {
            if (!requestId) {
                return null;
            }

            if (!apiClient.capabilities.supportsStatusPolling) {
                return {
                    ok: true,
                    requestId: requestId,
                    status: 'pending'
                };
            }

            fireHook('onPending', { requestId: requestId });

            const result = await pollRequestResult(apiClient, requestId, {
                intervalMs: settings.pollIntervalMs,
                timeoutMs: settings.pollTimeoutMs,
                maxStatusRetries: settings.maxStatusRetries
            });

            if (settings.requestStore) {
                settings.requestStore.clear(requestId);
            }

            const normalized = normalizeSubmitResult(result, requestId);
            fireHook('onSuccess', normalized);
            return normalized;
        }

        async function resumeAllPendingRequests() {
            if (!settings.requestStore) {
                return [];
            }

            const pending = settings.requestStore.listPending();
            const results = [];

            for (let i = 0; i < pending.length; i += 1) {
                const item = pending[i];

                try {
                    const result = await resumeRequestById(item.requestId);
                    results.push({
                        requestId: item.requestId,
                        ok: true,
                        result: result
                    });
                } catch (error) {
                    results.push({
                        requestId: item.requestId,
                        ok: false,
                        error: AppUtils.normalizeApiError(error).message
                    });
                }
            }

            return results;
        }

        async function getParticipant(id) {
            return apiClient.getParticipant(id);
        }

        async function listParticipants(params) {
            return apiClient.listParticipants(params || {});
        }

        async function pollRequestResult(client, requestId, pollOptions) {
            const intervalMs = pollOptions.intervalMs || 1500;
            const timeoutMs = pollOptions.timeoutMs || 20000;
            const maxStatusRetries = pollOptions.maxStatusRetries || 2;
            const startTime = Date.now();
            let consecutiveFailures = 0;

            while (Date.now() - startTime < timeoutMs) {
                try {
                    const result = await client.getRequestStatus(requestId);
                    consecutiveFailures = 0;

                    if (result && result.status === 'done') {
                        return result;
                    }

                    if (result && result.status === 'error') {
                        throw new Error(result.message || 'Request processing failed.');
                    }
                } catch (error) {
                    consecutiveFailures += 1;

                    if (consecutiveFailures > maxStatusRetries) {
                        throw error;
                    }
                }

                await AppUtils.delay(intervalMs);
            }

            throw new Error('Operation timed out while waiting for final result.');
        }

        async function retryAsync(fn, maxRetries, fallbackMessage) {
            let lastError = null;

            for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
                try {
                    return await fn();
                } catch (error) {
                    lastError = error;

                    if (attempt < maxRetries) {
                        await AppUtils.delay(500 * (attempt + 1));
                    }
                }
            }

            const normalized = AppUtils.normalizeApiError(lastError, fallbackMessage);
            fireHook('onError', normalized);
            throw normalized;
        }

        function validateParticipantPayload(payload) {
            if (!payload.fullName) {
                throw new Error('نام و نام خانوادگی الزامی است.');
            }

            if (!payload.mobile) {
                throw new Error('شماره موبایل الزامی است.');
            }

            if (!/^09\d{9}$/.test(payload.mobile)) {
                throw new Error('فرمت شماره موبایل صحیح نیست.');
            }

            if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
                throw new Error('فرمت ایمیل صحیح نیست.');
            }
        }

        function normalizeParticipantPayload(formData) {
            return {
                id: (formData.id || '').trim(),
                fullName: (formData.fullName || '').trim(),
                mobile: normalizeMobile(formData.mobile || ''),
                email: (formData.email || '').trim(),
                province: (formData.province || '').trim(),
                city: (formData.city || '').trim(),
                website: (formData.website || '').trim(),
                linkedin: (formData.linkedin || '').trim(),
                instagram: (formData.instagram || '').trim(),
                introduction: (formData.introduction || '').trim(),
                projects: (formData.projects || '').trim(),
                needs: (formData.needs || '').trim(),
                help: (formData.help || '').trim(),
                imageBase64: formData.imageBase64 || '',
                currentImageUrl: formData.currentImageUrl || '',
                requestId: formData.requestId || ''
            };
        }

        function normalizeMobile(value) {
            return String(value || '')
                .replace(/\s+/g, '')
                .replace(/^\+98/, '0')
                .replace(/^0098/, '0');
        }

        function normalizeSubmitResult(result, requestId) {
            return {
                ok: !!(result && result.ok !== false),
                requestId: requestId,
                status: (result && result.status) || 'done',
                participantId: (result && result.participantId) || '',
                imageUrl: (result && result.imageUrl) || '',
                message: (result && result.message) || 'Operation completed successfully.',
                raw: result || null
            };
        }

        function fireHook(name, payload) {
            const fn = settings.hooks && settings.hooks[name];
            if (typeof fn === 'function') {
                fn(payload);
            }
        }

        return {
            submitParticipant: submitParticipant,
            resumePendingByFingerprint: resumePendingByFingerprint,
            resumeRequestById: resumeRequestById,
            resumeAllPendingRequests: resumeAllPendingRequests,
            getParticipant: getParticipant,
            listParticipants: listParticipants
        };
    }

    global.ParticipantServiceFactory = {
        create: createParticipantService
    };
})(window);
