"use strict";

(function () {
    const formState = {
        mode: "create",
        participantId: "",
        currentPhotoUrl: "",
        removePhoto: false,
        newPhoto: null,
        dropzone: null
    };

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        const form = getForm();

        if (!form) {
            return;
        }

        const params = new URLSearchParams(
            window.location.search
        );

        formState.participantId =
            params.get("id") ||
            params.get("participantId") ||
            "";

        formState.mode = formState.participantId
            ? "edit"
            : "create";

        syncHiddenFields();
        updateFormMode();
        initPhotoUpload();

        form.addEventListener("submit", handleFormSubmit);

        document
            .getElementById("remove-photo-btn")
            ?.addEventListener("click", removeCurrentPhoto);

        if (formState.mode === "edit") {
            loadParticipantForEdit();
        }
    }

    async function loadParticipantForEdit() {
        showLoader({
            title: "دریافت اطلاعات",
            message: "در حال دریافت اطلاعات شرکت‌کننده..."
        });

        try {
            const result = await window.ApiClient.get({
                action: "getParticipant",
                id: formState.participantId
            });

            const participant = result.data;

            if (!participant) {
                throw new Error(
                    "اطلاعات شرکت‌کننده یافت نشد."
                );
            }

            fillForm(participant);

            formState.participantId = String(
                participant.participantId ||
                formState.participantId
            );

            formState.currentPhotoUrl = String(
                participant.photoUrl || ""
            );

            formState.removePhoto = false;
            formState.newPhoto = null;

            syncHiddenFields();
            showCurrentPhoto(formState.currentPhotoUrl);
        } catch (error) {
            console.error(error);

            notify(
                "error",
                error?.message ||
                "خطا در دریافت اطلاعات شرکت‌کننده."
            );
        } finally {
            hideLoader();
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();

        const form = getForm();
        if (!form) return;

        if (!validateForm(form)) {
            form.classList.add("was-validated");
            return;
        }

        const submitButton = form.querySelector('[type="submit"]');
        setSubmitting(submitButton, true);

        showLoader({
            title: formState.mode === "edit" ? "ویرایش اطلاعات" : "ثبت اطلاعات",
            message: formState.mode === "edit"
                ? "در حال ارسال درخواست و پیگیری نتیجه..."
                : "در حال ارسال درخواست و پیگیری نتیجه..."
        });

        try {
            const payload = await getFormPayload(form);

            // 1) تولید requestId برای ردیابی
            const requestId = window.ApiClient.createRequestId("participant");

            // 2) POST no-cors (فقط ارسال)
            await window.ApiClient.post({
                action: formState.mode === "edit" ? "updateParticipant" : "createParticipant",
                ...payload,
                requestId: requestId
            }, { requestId });

            notify("info", "درخواست ارسال شد. در حال پیگیری نتیجه...");

            // 3) Polling از طریق GET (JSONP)
            const result = await window.ApiClient.poll({
                action: "getRequestStatus",     // اکشن وضعیت در backend
                requestId: requestId,
                intervalMs: 1200,
                maxAttempts: 25
            });

            // اگر هنوز pending ماند
            if (String(result.status || "").toLowerCase() === "pending") {
                notify("info", result.message || "درخواست در حال پردازش است. کمی بعد دوباره صفحه را رفرش کنید.");
                return;
            }

            // done
            const participant = result.data || {};
            toast.success(
               
                result.message ||
                (formState.mode === "edit"
                    ? "اطلاعات با موفقیت ویرایش شد."
                    : "شرکت‌کننده با موفقیت ثبت شد.")
            );

            if (formState.mode === "create") {
                const createdId = String(
                    participant.participantId ||
                    result.participantId ||
                    ""
                );
                resetForm(createdId);
            } else {
                updateStateAfterSave(participant);
            }
        } catch (error) {
            console.error(error);
            notify("error", error?.message || "ذخیره اطلاعات با خطا مواجه شد.");
        } finally {
            setSubmitting(submitButton, false);
            hideLoader();
        }
    }


    async function getFormPayload(form) {
        const formData = new FormData(form);
        const payload = {};

        formData.forEach(function (value, key) {
            if (value instanceof File) {
                return;
            }

            if (Object.prototype.hasOwnProperty.call(
                payload,
                key
            )) {
                payload[key] = []
                    .concat(payload[key], value)
                    .filter(Boolean)
                    .join(", ");
            } else {
                payload[key] = String(value).trim();
            }
        });

        payload.participantId =
            formState.participantId;
        payload.currentPhotoUrl =
            formState.currentPhotoUrl;
        payload.removePhoto =
            formState.removePhoto;

        if (formState.newPhoto) {
            const image = await fileToBase64(
                formState.newPhoto
            );

            payload.photo = {
                name: formState.newPhoto.name,
                mimeType: formState.newPhoto.type,
                data: image
            };
        }

        return payload;
    }

    function fillForm(participant) {
        const form = getForm();

        if (!form) {
            return;
        }

        Object.entries(participant).forEach(function (
            entry
        ) {
            const name = entry[0];
            const value = entry[1];
            const fields = form.querySelectorAll(
                '[name="' + CSS.escape(name) + '"]'
            );

            fields.forEach(function (field) {
                if (
                    field.type === "checkbox" ||
                    field.type === "radio"
                ) {
                    const selectedValues = Array.isArray(value)
                        ? value.map(String)
                        : String(value || "")
                            .split(",")
                            .map(function (item) {
                                return item.trim();
                            });

                    field.checked = selectedValues.includes(
                        String(field.value)
                    );
                    return;
                }

                if (field.type !== "file") {
                    field.value =
                        value === null ||
                            value === undefined
                            ? ""
                            : value;
                }
            });
        });

        form.classList.remove("was-validated");
    }

    function validateForm(form) {
        const mobileField = form.querySelector(
            '[name="mobile1"]'
        );

        if (mobileField) {
            const mobile = normalizeDigits(
                mobileField.value
            ).replace(/\s|-/g, "");

            mobileField.value = mobile;

            if (mobile && !/^09\d{9}$/.test(mobile)) {
                mobileField.setCustomValidity(
                    "شماره موبایل معتبر نیست."
                );
            } else {
                mobileField.setCustomValidity("");
            }
        }

        return form.checkValidity();
    }

    function initPhotoUpload() {
        const fileInput =
            document.getElementById("participant-photo");

        if (!fileInput) {
            return;
        }

        fileInput.addEventListener("change", function () {
            const file = fileInput.files?.[0] || null;

            if (!file) {
                formState.newPhoto = null;
                return;
            }

            if (!file.type.startsWith("image/")) {
                fileInput.value = "";
                formState.newPhoto = null;

                notify(
                    "warning",
                    "لطفاً یک فایل تصویری انتخاب کنید."
                );
                return;
            }

            formState.newPhoto = file;
            formState.removePhoto = false;
            syncHiddenFields();
            hideCurrentPhoto();

            showNewPhotoPreview(file);
        });

        if (
            window.Dropzone &&
            document.getElementById(
                "participant-photo-dropzone"
            )
        ) {
            initDropzone();
        }
    }

    function initDropzone() {
        const dropzoneElement = document.getElementById(
            "participant-photo-dropzone"
        );

        if (!dropzoneElement || formState.dropzone) {
            return;
        }

        window.Dropzone.autoDiscover = false;

        formState.dropzone = new window.Dropzone(
            dropzoneElement,
            {
                url: "/",
                autoProcessQueue: false,
                maxFiles: 1,
                acceptedFiles: "image/*",
                addRemoveLinks: true,
                dictDefaultMessage:
                    "تصویر را اینجا رها کنید یا کلیک کنید"
            }
        );

        formState.dropzone.on(
            "addedfile",
            function (file) {
                if (this.files.length > 1) {
                    this.removeFile(this.files[0]);
                }

                formState.newPhoto = file;
                formState.removePhoto = false;
                syncHiddenFields();
                hideCurrentPhoto();
            }
        );

        formState.dropzone.on(
            "removedfile",
            function (file) {
                if (formState.newPhoto === file) {
                    formState.newPhoto = null;
                }

                if (
                    formState.currentPhotoUrl &&
                    !formState.removePhoto
                ) {
                    showCurrentPhoto(
                        formState.currentPhotoUrl
                    );
                }
            }
        );
    }

    function removeCurrentPhoto() {
        formState.currentPhotoUrl = "";
        formState.removePhoto = true;
        formState.newPhoto = null;

        formState.dropzone?.removeAllFiles(true);

        const fileInput =
            document.getElementById("participant-photo");

        if (fileInput) {
            fileInput.value = "";
        }

        syncHiddenFields();
        hideCurrentPhoto();
        clearNewPhotoPreview();
    }

    function showCurrentPhoto(photoUrl) {
        const wrapper =
            document.getElementById(
                "current-photo-wrapper"
            );
        const image =
            document.getElementById("current-photo");

        if (!wrapper || !image || !photoUrl) {
            hideCurrentPhoto();
            return;
        }

        image.src = photoUrl;
        wrapper.classList.remove("d-none");
    }

    function hideCurrentPhoto() {
        const wrapper =
            document.getElementById(
                "current-photo-wrapper"
            );
        const image =
            document.getElementById("current-photo");

        wrapper?.classList.add("d-none");

        if (image) {
            image.removeAttribute("src");
        }
    }

    function showNewPhotoPreview(file) {
        const wrapper =
            document.getElementById("new-photo-wrapper");
        const image =
            document.getElementById("new-photo-preview");

        if (!wrapper || !image) {
            return;
        }

        clearNewPhotoPreview();

        const objectUrl = URL.createObjectURL(file);

        image.dataset.objectUrl = objectUrl;
        image.src = objectUrl;
        wrapper.classList.remove("d-none");
    }

    function clearNewPhotoPreview() {
        const wrapper =
            document.getElementById("new-photo-wrapper");
        const image =
            document.getElementById("new-photo-preview");

        if (image?.dataset.objectUrl) {
            URL.revokeObjectURL(
                image.dataset.objectUrl
            );

            delete image.dataset.objectUrl;
        }

        if (image) {
            image.removeAttribute("src");
        }

        wrapper?.classList.add("d-none");
    }

    function updateStateAfterSave(participant) {
        if (participant.participantId) {
            formState.participantId = String(
                participant.participantId
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(
                participant,
                "photoUrl"
            )
        ) {
            formState.currentPhotoUrl = String(
                participant.photoUrl || ""
            );
        } else if (formState.removePhoto) {
            formState.currentPhotoUrl = "";
        }

        formState.removePhoto = false;
        formState.newPhoto = null;

        formState.dropzone?.removeAllFiles(true);

        const fileInput =
            document.getElementById("participant-photo");

        if (fileInput) {
            fileInput.value = "";
        }

        syncHiddenFields();
        clearNewPhotoPreview();
        showCurrentPhoto(formState.currentPhotoUrl);
    }

    function resetForm(createdId) {
        const form = getForm();

        if (!form) {
            return;
        }

        form.reset();
        form.classList.remove("was-validated");

        formState.newPhoto = null;
        formState.currentPhotoUrl = "";
        formState.removePhoto = false;

        formState.dropzone?.removeAllFiles(true);

        clearNewPhotoPreview();
        hideCurrentPhoto();

        if (createdId) {
            formState.mode = "edit";
            formState.participantId = createdId;

            const url = new URL(window.location.href);
            url.searchParams.set("id", createdId);
            window.history.replaceState({}, "", url);
        } else {
            formState.mode = "create";
            formState.participantId = "";
        }

        syncHiddenFields();
        updateFormMode();
    }

    function syncHiddenFields() {
        setFieldValue(
            "participantId",
            formState.participantId
        );

        setFieldValue(
            "currentPhotoUrl",
            formState.currentPhotoUrl
        );

        setFieldValue(
            "removePhoto",
            formState.removePhoto ? "true" : "false"
        );
    }

    function updateFormMode() {
        const title =
            document.getElementById("form-card-title");
        const submitText =
            document.getElementById("submit-btn-text");

        if (title) {
            title.textContent =
                formState.mode === "edit"
                    ? "ویرایش شرکت‌کننده"
                    : "ثبت شرکت‌کننده جدید";
        }

        if (submitText) {
            submitText.textContent =
                formState.mode === "edit"
                    ? "ذخیره تغییرات"
                    : "ثبت شرکت‌کننده";
        }
    }

    function setFieldValue(id, value) {
        const field = document.getElementById(id);

        if (field) {
            field.value = value;
        }
    }

    function setSubmitting(button, isSubmitting) {
        if (!button) {
            return;
        }

        button.disabled = isSubmitting;
        button.setAttribute(
            "aria-busy",
            isSubmitting ? "true" : "false"
        );
    }

    function getForm() {
        return (
            document.getElementById("participant-form") ||
            document.querySelector(
                'form[data-participant-form]'
            )
        );
    }

    function fileToBase64(file) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();

            reader.onload = function () {
                const result = String(
                    reader.result || ""
                );

                resolve(
                    result.includes(",")
                        ? result.split(",")[1]
                        : result
                );
            };

            reader.onerror = function () {
                reject(
                    new Error(
                        "خواندن فایل تصویر ناموفق بود."
                    )
                );
            };

            reader.readAsDataURL(file);
        });
    }

    function normalizeDigits(value) {
        return String(value || "")
            .replace(/[۰-۹]/g, function (digit) {
                return String(
                    "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
                );
            })
            .replace(/[٠-٩]/g, function (digit) {
                return String(
                    "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
                );
            });
    }

    function showLoader(options) {
        if (
            typeof window.showPageLoader === "function"
        ) {
            window.showPageLoader(options);
        }
    }

    function hideLoader() {
        if (
            typeof window.hidePageLoader === "function"
        ) {
            window.hidePageLoader();
        }
    }

    function notify(type, message) {
        if (
            window.toast &&
            typeof window.toast[type] === "function"
        ) {
            window.toast[type](message);
            return;
        }

        console[type === "error" ? "error" : "log"](
            message
        );
    }
})();
