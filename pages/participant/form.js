"use strict";

(function () {

    // --- ۱. سرویس کش تصاویر (IndexedDB) ---
    const ImageCacheService = {
        dbName: 'AppAssetsCache',
        storeName: 'images',
        version: 1,

        initDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.version);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName);
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },

        async get(key) {
            try {
                const db = await this.initDB();
                return new Promise((resolve) => {
                    const transaction = db.transaction(this.storeName, 'readonly');
                    const store = transaction.objectStore(this.storeName);
                    const request = store.get(key);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => resolve(null);
                });
            } catch (e) { return null; }
        },

        async set(key, value) {
            try {
                const db = await this.initDB();
                const transaction = db.transaction(this.storeName, 'readwrite');
                const store = transaction.objectStore(this.storeName);
                store.put(value, key);
            } catch (e) { }
        }
    };

    const formState = {
        mode: "create",
        id: "",

    };
    const photoState = {
        currentPhotoFileId: "",
        currentPhotoUpdatedAt: "",
        selectedFile: null,
        selectedDataUrl: "",
        removeCurrentPhoto: false
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

        formState.id =
            params.get("id") ||
            params.get("id") ||
            "";

        formState.mode = formState.id
            ? "edit"
            : "create";

        syncHiddenFields();



        updateFormMode();


        //initPhotoUpload();
        initPhotoField();


        form.addEventListener("submit", handleFormSubmit);

        document
            .getElementById("remove-photo-btn")
            ?.addEventListener("click", removeCurrentPhoto);

        if (formState.mode === "edit") {
            loadParticipantForEdit();
        }

        if (formState.mode === "create") {
            resetPhotoState();
            syncPhotoUi();
        }
    }


    function syncPhotoUi() {
        const currentWrapper = document.getElementById("current-photo-wrapper");
        const selectedWrapper = document.getElementById("selected-photo-wrapper");
        const selectedPreviewContainer = document.getElementById("selected-photo-preview-container");

        if (!currentWrapper || !selectedWrapper || !selectedPreviewContainer) return;

        const isEditMode = formState.mode === "edit";
        const hasCurrentPhoto = !!photoState.currentPhotoFileId && !photoState.removeCurrentPhoto;
        const hasSelectedPhoto = !!photoState.selectedDataUrl;

        if (!isEditMode) {
            currentWrapper.classList.add("d-none");
            selectedWrapper.classList.remove("d-none");
            selectedPreviewContainer.classList.toggle("d-none", !hasSelectedPhoto);
            return;
        }

        if (hasCurrentPhoto) {
            currentWrapper.classList.remove("d-none");
            selectedWrapper.classList.add("d-none");
            selectedPreviewContainer.classList.add("d-none");
            return;
        }

        currentWrapper.classList.add("d-none");
        selectedWrapper.classList.remove("d-none");
        selectedPreviewContainer.classList.toggle("d-none", !hasSelectedPhoto);
    }

    function clearSelectedPhoto() {
        const input = document.getElementById("photo");

        photoState.selectedFile = null;
        photoState.selectedDataUrl = "";

        if (input) {
            input.value = "";
        }

        setAvatarImage("selected-photo-preview", "");
        syncPhotoUi();
    }
    function initCreateModePhoto() {
        photoState.currentPhotoFileId = "";
        photoState.currentPhotoUpdatedAt = "";
        photoState.removeCurrentPhoto = false;
        clearSelectedPhoto(false);
        syncPhotoUi();
    }


    function initPhotoField() {
        const input = document.getElementById("photo");
        const removeCurrentBtn = document.getElementById("remove-current-photo-btn");
        const clearSelectedBtn = document.getElementById("clear-selected-photo-btn");

        if (input) {
            input.addEventListener("change", handlePhotoInputChange);
        }

        if (removeCurrentBtn) {
            removeCurrentBtn.addEventListener("click", handleRemoveCurrentPhoto);
        }

        if (clearSelectedBtn) {
            clearSelectedBtn.addEventListener("click", clearSelectedPhoto);
        }

        syncPhotoUi();
    }
    function setAvatarImage(elementId, dataUrl) {
        const el = document.getElementById(elementId);
        if (!el) return;

        if (dataUrl) {
            el.style.backgroundImage = 'url("' + dataUrl + '")';
            el.style.backgroundSize = "cover";
            el.style.backgroundPosition = "center";
            el.style.backgroundRepeat = "no-repeat";
        } else {
            el.style.backgroundImage = "";
            el.style.backgroundSize = "";
            el.style.backgroundPosition = "";
            el.style.backgroundRepeat = "";
        }
    }
    function setPhotoError(message) {
        if (message === "") {

        }
        else {
            toast.warning(message);
        }
    
    }

    function handlePhotoInputChange(event) {
        const file = event.target.files && event.target.files[0];


        if (!file) {
            clearSelectedPhoto();
            return;
        }

        if (!file.type || !file.type.startsWith("image/")) {
            setPhotoError("لطفا یک فایل تصویری معتبر انتخاب کنید.");
            clearSelectedPhoto();
            return;
        }

        const maxSizeBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            setPhotoError("حجم تصویر نباید بیشتر از 5 مگابایت باشد.");
            clearSelectedPhoto();
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {
            photoState.selectedFile = file;
            photoState.selectedDataUrl = String(reader.result || "");
            photoState.removeCurrentPhoto = false;

            setAvatarImage("selected-photo-preview", photoState.selectedDataUrl);
            syncPhotoUi();
        };

        reader.onerror = function () {
            setPhotoError("خواندن فایل تصویر با خطا مواجه شد.");
            clearSelectedPhoto();
        };

        reader.readAsDataURL(file);
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

                toast.warning("لطفاً یک فایل تصویری انتخاب کنید.");

                return;
            }

            formState.newPhoto = file;
            formState.removePhoto = false;
            syncHiddenFields();
            hideCurrentPhoto();

            showNewPhotoPreview(file);
        });


    }

    function showSelectedPhotoPreview(dataUrl) {
        const wrapper = document.getElementById("selected-photo-wrapper");
        const image = document.getElementById("selected-photo-preview");

        if (!wrapper || !image || !dataUrl) return;
        image.style.backgroundImage = `url("${dataUrl}")`;

        wrapper.classList.remove("d-none");
    }


    function resetPhotoState() {
        photoState.currentPhotoFileId = "";
        photoState.currentPhotoUpdatedAt = "";
        photoState.selectedFile = null;
        photoState.selectedDataUrl = "";
        photoState.removeCurrentPhoto = false;

        const input = document.getElementById("photo");
        if (input) {
            input.value = "";
        }

        setAvatarImage("current-photo", "");
        setAvatarImage("selected-photo-preview", "");

        syncPhotoUi();
    }
    function hideCurrentPhoto() {
        const wrapper = document.getElementById("current-photo-wrapper");
        const image = document.getElementById("current-photo");

        if (image) {
            image.removeAttribute("src");
        }

        if (wrapper) {
            wrapper.classList.add("d-none");
        }
    }
    function handleRemoveCurrentPhoto() {
        if (!photoState.currentPhotoFileId) return;

        photoState.removeCurrentPhoto = true;
        photoState.currentPhotoFileId = "";
        photoState.currentPhotoUpdatedAt = "";

        setAvatarImage("current-photo", "");
        syncPhotoUi();
    }
    function showPhotoRemoveAlert() {
        const alert = document.getElementById("photo-remove-alert");

        if (alert) {
            alert.classList.remove("d-none");
        }
    }
    function hidePhotoRemoveAlert() {
        const alert = document.getElementById("photo-remove-alert");

        if (alert) {
            alert.classList.add("d-none");
        }
    }
    function resetPhotoState() {
        photoState.currentPhotoFileId = "";
        photoState.currentPhotoUpdatedAt = "";
        photoState.selectedFile = null;
        photoState.selectedDataUrl = "";
        photoState.removeCurrentPhoto = false;

        hideCurrentPhoto();
        clearSelectedPhoto();
        hidePhotoRemoveAlert();
    }
    async function loadParticipantForEdit() {
        showLoader({
            title: "دریافت اطلاعات",
            message: "در حال دریافت اطلاعات شرکت‌کننده..."
        });

        try {
            const result = await window.ApiClient.get({
                action: "getParticipant",
                id: formState.id
            });

            const participant = result.data;

            if (!participant) {
                toast.error("اطلاعات شرکت‌کننده یافت نشد.");
                return;

            }

            fillForm(participant);

            formState.id = String(
                participant.id ||
                formState.id
            );

            syncHiddenFields();


            await loadPhotoWithCache(participant);


            // showCurrentPhoto(participant);
        } catch (error) {
            toast.error("خطا در دریافت اطلاعات شرکت‌کننده.");

        } finally {
            hideLoader();
        }
    }
    /**
   * منطق اختصاصی لود عکس از کش IndexedDB یا سرور
   * دقیقاً مشابه همان چیزی که در lazyImageLoader لیست داشتید
   */
    async function loadPhotoWithCache(participant) {
        const fileId = participant && participant.photoFileId ? participant.photoFileId : "";
        const updatedAt = participant && participant.updatedAt ? participant.updatedAt : "v1";
        photoState.currentPhotoFileId = fileId;
        photoState.currentPhotoUpdatedAt = updatedAt;
        photoState.selectedFile = null;
        photoState.selectedDataUrl = "";
        photoState.removeCurrentPhoto = false;


        setAvatarImage("selected-photo-preview", "");

        if (!fileId) {
            setAvatarImage("current-photo", "");
            syncPhotoUi();
            return;
        }

        const cacheKey = `photo_${fileId}_${updatedAt}`;

        try {
            // ۱. چک کردن کش
            const cachedData = await ImageCacheService.get(cacheKey);



            if (cachedData) {
                setAvatarImage("current-photo", cachedData);
                syncPhotoUi();
                return;
            }


            // استفاده از ApiClient برای حفظ ساختار پروژه شما
            const result = await window.ApiClient.get({
                action: "getPhotoBase64",
                fileId: fileId
            });

            if (result.ok && result.data.dataUrl) {
                const dataUrl = result.data.dataUrl;
                setAvatarImage("current-photo", dataUrl);
                await ImageCacheService.set(cacheKey, dataUrl);
            }
            else {
                setAvatarImage("current-photo", "");
            }
        } catch (error) {
            console.error("Photo load failed", error);
            setAvatarImage("current-photo", "");
        }
        syncPhotoUi();
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
            debugger;
            // 2) POST no-cors (فقط ارسال)
            await window.ApiClient.post({
                action: formState.mode === "edit" ? "updateParticipant" : "createParticipant",
                ...payload,
                requestId: requestId
            }, { requestId });

            //notify("info", "درخواست ارسال شد. در حال پیگیری نتیجه...");
            debugger;
            // 3) Polling از طریق GET (JSONP)
            const result = await window.ApiClient.poll({
                action: "getRequestStatus",     // اکشن وضعیت در backend
                requestId: requestId,
                intervalMs: 1200,
                maxAttempts: 25
            });

            // اگر هنوز pending ماند
            if (String(result.status || "").toLowerCase() === "pending") {
                toast.info(result.message || "درخواست در حال پردازش است. کمی بعد دوباره صفحه را رفرش کنید.");
               
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
                    participant.id ||
                    result.id ||
                    ""
                );
                resetForm(createdId);
            } else {
                updateStateAfterSave(participant);
            }
        } catch (error) {

            toast.error(error?.message || "ذخیره اطلاعات با خطا مواجه شد.")
           
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

            if (Object.prototype.hasOwnProperty.call(payload, key)) {
                payload[key] = []
                    .concat(payload[key], value)
                    .filter(Boolean)
                    .join(", ");
            } else {
                payload[key] = String(value).trim();
            }
        });

        payload.id = formState.id || "";

        if (photoState.selectedDataUrl) {
            payload.photo = {
                name: photoState.selectedFile?.name || "participant-photo",
                mimeType: photoState.selectedFile?.type || "image/jpeg",
                data: photoState.selectedDataUrl
            };
            payload.removePhoto = false;
        } else if (photoState.removeCurrentPhoto) {
            payload.removePhoto = true;
        } else {
            payload.removePhoto = false;
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
        // const mobileField = form.querySelector(
        //     '[name="mobile1"]'
        // );

        // if (mobileField) {
        //     const mobile = normalizeDigits(
        //         mobileField.value
        //     ).replace(/\s|-/g, "");

        //     mobileField.value = mobile;

        //     if (mobile && !/^09\d{9}$/.test(mobile)) {
        //         mobileField.setCustomValidity(
        //             "شماره موبایل معتبر نیست."
        //         );
        //     } else {
        //         mobileField.setCustomValidity("");
        //     }
        // }

        return form.checkValidity();
    }



    function removeCurrentPhoto() {
        formState.currentPhotoUrl = "";
        formState.removePhoto = true;
        formState.newPhoto = null;



        const fileInput =
            document.getElementById("participant-photo");

        if (fileInput) {
            fileInput.value = "";
        }

        syncHiddenFields();
        hideCurrentPhoto();
        clearNewPhotoPreview();
    }

    function showCurrentPhoto(src) {
        debugger;
        const avatar = document.getElementById('current-photo');
        const currentPhotoWrapper = document.getElementById('current-photo-wrapper');


        avatar.style.backgroundImage = `url("${src}")`;


        currentPhotoWrapper.classList.remove('d-none');

        // const wrapper =
        //     document.getElementById(
        //         "current-photo-wrapper"
        //     );
        // const image =
        //     document.getElementById("current-photo");

        // if (!wrapper || !image || !photoUrl) {
        //     hideCurrentPhoto();
        //     return;
        // }

        // image.src = photoUrl;
        // wrapper.classList.remove("d-none");
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

    async function updateStateAfterSave(participant) {
        if (participant && participant.id) {
            formState.id = String(participant.id);
        }

        photoState.selectedFile = null;
        photoState.selectedDataUrl = "";
        photoState.removeCurrentPhoto = false;

        const fileInput = document.getElementById("photo");
        if (fileInput) {
            fileInput.value = "";
        }

        syncHiddenFields();

        await loadPhotoWithCache(participant || {});
    }


    function resetForm(createdId) {
        const form = getForm();

        if (!form) {
            return;
        }

        form.reset();
        form.classList.remove("was-validated");

        resetPhotoState();

        if (createdId) {
            formState.mode = "edit";
            formState.id = createdId;

            const url = new URL(window.location.href);
            url.searchParams.set("id", createdId);
            window.history.replaceState({}, "", url);
        } else {
            formState.mode = "create";
            formState.id = "";
        }

        syncHiddenFields();
        updateFormMode();
    }


    function syncHiddenFields() {
        setFieldValue(
            "id",
            formState.id
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
            document.title = title.textContent;
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
