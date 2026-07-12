(function (global) {
    'use strict';

    function createParticipantApi(deps) {
        const client = deps.client;
        const actions = Object.assign(
            {
                submit: 'saveParticipant',
                getStatus: 'getRequestStatus',
                getById: 'getParticipant',
                list: 'listParticipants'
            },
            deps.actions || {}
        );

        if (!client) {
            throw new Error('client is required.');
        }

        return {
            capabilities: {
                returnsImmediateResult: false,
                supportsStatusPolling: true
            },
            submitParticipant: submitParticipant,
            getRequestStatus: getRequestStatus,
            getParticipant: getParticipant,
            listParticipants: listParticipants
        };

        async function submitParticipant(payload, options) {
            const requestId = (options && options.requestId) || payload.requestId;
            if (!requestId) {
                throw new Error('requestId is required.');
            }

            return client.post(
                actions.submit,
                Object.assign({}, payload, {
                    requestId: requestId
                }),
                { requestId: requestId }
            );
        }

        async function getRequestStatus(requestId) {
            if (!requestId) {
                throw new Error('requestId is required.');
            }

            const res = await client.get(actions.getStatus, { requestId: requestId });

            return Object.assign({}, res, {
                requestId: requestId,
                status: normalizeStatus(res),
                message: res.message || ''
            });
        }

        async function getParticipant(participantId) {
            if (!participantId) {
                throw new Error('participantId is required.');
            }

            const res = await client.get(actions.getById, {
                participantId: participantId
            });

            if (!res.ok) {
                throw new Error(res.message || 'خطا در دریافت اطلاعات شرکت‌کننده.');
            }

            return res.data;
        }

        async function listParticipants(params) {
            const res = await client.get(actions.list, params || {});

            if (!res.ok) {
                throw new Error(res.message || 'خطا در دریافت لیست شرکت‌کنندگان.');
            }

            return res.data;
        }
    }

    function normalizeStatus(res) {
        const raw = String((res && res.status) || '').toLowerCase();

        if (raw === 'error' || raw === 'failed' || raw === 'failure') {
            return 'error';
        }

        if (raw === 'done' || raw === 'success' || raw === 'completed') {
            return 'done';
        }

        return 'pending';
    }

    global.ParticipantApi = { create: createParticipantApi };
})(window);
