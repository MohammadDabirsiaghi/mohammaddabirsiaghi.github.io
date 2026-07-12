(function (global) {
    'use strict';

    function create(config) {
        if (!config) {
            throw new Error('APP_CONFIG is required.');
        }

        if (config.backend === 'appscript') {
            if (!global.AppScriptClient) {
                throw new Error('AppScriptClient is not loaded.');
            }

            if (!global.ParticipantApi) {
                throw new Error('ParticipantApi is not loaded.');
            }

            const client = global.AppScriptClient.create(config.appScript);

            return global.ParticipantApi.create({
                client: client,
                actions: config.appScript && config.appScript.actions
                    ? {
                        submit: config.appScript.actions.submitParticipant,
                        getStatus: config.appScript.actions.getRequestStatus,
                        getById: config.appScript.actions.getParticipant,
                        list: config.appScript.actions.listParticipants
                    }
                    : {}
            });
        }

        if (config.backend === 'rest') {
            if (!global.RestApiClient) {
                throw new Error('RestApiClient is not loaded.');
            }
            return global.RestApiClient.create(config.rest);
        }

        throw new Error('Unsupported backend: ' + config.backend);
    }

    global.ApiClientFactory = { create: create };
})(window);
