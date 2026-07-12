(function (global) {
    const appConfig = global.APP_CONFIG;
    const requestStore = global.RequestStoreFactory.createLocalRequestStore(
        appConfig.participantService.storageKey,
        { ttlMs: appConfig.participantService.pendingTtlMs }
    );
    const apiClient = global.ApiClientFactory.create(appConfig);

    const participantService = global.ParticipantServiceFactory.create(apiClient, {
        pollIntervalMs: appConfig.participantService.pollIntervalMs,
        pollTimeoutMs: appConfig.participantService.pollTimeoutMs,
        maxSubmitRetries: appConfig.participantService.maxSubmitRetries,
        maxStatusRetries: appConfig.participantService.maxStatusRetries,
        requestStore: requestStore,
        hooks: {
            onPending: function (data) {
                setStatus('در حال پردازش...', 'info');
                if (data && data.requestId) {
                    console.log('Pending request:', data.requestId);
                }
            },
            onSuccess: function (data) {
                setStatus(data.message || 'عملیات با موفقیت انجام شد.', 'success');
            },
            onError: function (error) {
                setStatus((error && error.message) || 'خطا در پردازش درخواست.', 'error');
            }
        }
    });

    async function handleFormSubmit(event) {
        event.preventDefault();

        try {
            setLoading(true);
            clearMessage();

            const formData = readFormData();
            const result = await participantService.submitParticipant(formData);

            showSuccess(result.message || 'ثبت با موفقیت انجام شد.');
            resetForm();
            await loadParticipantList();
        } catch (error) {
            showError((error && error.message) || 'ارسال اطلاعات با خطا مواجه شد.');
        } finally {
            setLoading(false);
        }
    }

    async function loadParticipantList() {
        try {
            const result = await participantService.listParticipants({});
            renderParticipantList(result);
        } catch (error) {
            showError((error && error.message) || 'دریافت لیست با خطا مواجه شد.');
        }
    }

    async function loadParticipantForEdit(id) {
        try {
            setLoading(true);
            clearMessage();

            const result = await participantService.getParticipant(id);
            fillForm(result);
        } catch (error) {
            showError((error && error.message) || 'دریافت اطلاعات شرکت‌کننده با خطا مواجه شد.');
        } finally {
            setLoading(false);
        }
    }

    async function resumePendingOnLoad() {
        try {
            const results = await participantService.resumeAllPendingRequests();

            const successful = results.filter(function (item) {
                return item.ok;
            });

            if (successful.length > 0) {
                showSuccess('درخواست ناتمام قبلی بررسی و تکمیل شد.');
                await loadParticipantList();
            }
        } catch (error) {
            console.warn('Resume pending failed:', error);
        }
    }

    function readFormData() {
        return {
            id: getValue('id'),
            fullName: getValue('fullName'),
            mobile: getValue('mobile'),
            email: getValue('email'),
            province: getValue('province'),
            city: getValue('city'),
            website: getValue('website'),
            linkedin: getValue('linkedin'),
            instagram: getValue('instagram'),
            introduction: getValue('introduction'),
            projects: getValue('projects'),
            needs: getValue('needs'),
            help: getValue('help'),
            currentImageUrl: getValue('currentImageUrl'),
            imageBase64: getValue('imageBase64')
        };
    }

    function fillForm(data) {
        setValue('id', data.id || '');
        setValue('fullName', data.fullName || '');
        setValue('mobile', data.mobile || '');
        setValue('email', data.email || '');
        setValue('province', data.province || '');
        setValue('city', data.city || '');
        setValue('website', data.website || '');
        setValue('linkedin', data.linkedin || '');
        setValue('instagram', data.instagram || '');
        setValue('introduction', data.introduction || '');
        setValue('projects', data.projects || '');
        setValue('needs', data.needs || '');
        setValue('help', data.help || '');
        setValue('currentImageUrl', data.imageUrl || '');
    }

    function renderParticipantList(result) {
        console.log('render list', result);
    }

    function resetForm() {
        const form = document.getElementById('participantForm');
        if (form) {
            form.reset();
        }

        setValue('id', '');
        setValue('currentImageUrl', '');
        setValue('imageBase64', '');
    }

    function setLoading(isLoading) {
        const submitButton = document.querySelector('#participantForm button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = !!isLoading;
        }
    }

    function setStatus(message, type) {
        const el = document.getElementById('statusMessage');
        if (!el) {
            return;
        }

        el.textContent = message || '';
        el.setAttribute('data-type', type || '');
    }

    function showSuccess(message) {
        setStatus(message, 'success');
    }

    function showError(message) {
        setStatus(message, 'error');
    }

    function clearMessage() {
        setStatus('', '');
    }

    function getValue(id) {
        const el = document.getElementById(id);
        return el ? el.value : '';
    }

    function setValue(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
        }
    }

    global.ParticipantUI = {
        handleFormSubmit: handleFormSubmit,
        loadParticipantList: loadParticipantList,
        loadParticipantForEdit: loadParticipantForEdit,
        resumePendingOnLoad: resumePendingOnLoad
    };
})(window);
