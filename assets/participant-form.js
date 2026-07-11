const API_URL =
    'https://script.google.com/macros/s/AKfycbz2KzFmxU6uAJeRbRNCSUI4MbfySrXqY_8IH6CvLQH0AmRm4-yqr6Ejfe6uXtaTIkBR/exec';

let base64FileData = '';
let uploadedFileName = '';
let uploadedFileType = '';
let currentParticipantId = '';
let currentImageUrl = '';
function initDropzoneUpload() {
    if (!window.Dropzone) {
        return;
    }

    const dropzoneElement = document.getElementById('photo-dropzone');
    if (!dropzoneElement) {
        return;
    }

    Dropzone.autoDiscover = false;

    window.myDropzone = new Dropzone('#photo-dropzone', {
        url: '#',
        autoProcessQueue: false,
        maxFiles: 1,
        acceptedFiles: 'image/jpeg,image/png,image/webp',
        addRemoveLinks: true,
        dictDefaultMessage: 'عکس را اینجا رها کنید یا انتخاب کنید'
    });

    window.myDropzone.on('addedfile', function (file) {
        if (window.myDropzone.files.length > 1) {
            window.myDropzone.removeFile(window.myDropzone.files[0]);
        }

        prepareImageFile(file).catch(function (error) {
            console.error(error);
            showAlert(
                error.message || 'خطا در خواندن فایل تصویر.',
                'danger'
            );
        });
    });

    window.myDropzone.on('removedfile', function () {
        base64FileData = '';
        uploadedFileName = '';
        uploadedFileType = '';
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('participant-form');

    initDropzoneUpload();

    if (!form) {
        console.error('فرم participant-form پیدا نشد.');
        return;
    }

    form.addEventListener('submit', handleFormSubmit);
});

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('participant-form');
    initDropzoneUpload();
    if (!form) {
        console.error('فرم participant-form پیدا نشد.');
        return;
    }

    form.addEventListener('submit', handleFormSubmit);
});

/**
 * تولید شناسه یکتا برای پیگیری درخواست
 */
function generateRequestId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID === 'function'
    ) {
        return window.crypto.randomUUID();
    }

    return (
        'req_' +
        Date.now() +
        '_' +
        Math.random().toString(36).slice(2, 11)
    );
}

/**
 * ارسال POST به‌صورت no-cors
 */
async function sendPostNoCors(payload) {
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        return {
            ok: true,
            message: 'اطلاعات ارسال شد و در حال پردازش است.'
        };
    } catch (error) {
        throw new Error(
            'خطا در ارسال اطلاعات: ' +
            (error.message || 'خطای شبکه')
        );
    }
}

/**
 * اجرای درخواست JSONP
 */
function jsonpRequest(parameters, timeoutMs = 15000) {
    return new Promise(function (resolve, reject) {
        const callbackName =
            'jsonp_cb_' +
            Date.now() +
            '_' +
            Math.floor(Math.random() * 1000000);

        const query = new URLSearchParams();

        Object.keys(parameters).forEach(function (key) {
            const value = parameters[key];

            if (value !== undefined && value !== null) {
                query.set(key, String(value));
            }
        });

        query.set('callback', callbackName);
        query.set('_', String(Date.now()));

        const script = document.createElement('script');
        let completed = false;

        const timeoutId = window.setTimeout(function () {
            cleanup();

            reject(
                new Error(
                    'پاسخ‌دهی سرور بیش از حد طول کشید. لطفاً دوباره تلاش کنید.'
                )
            );
        }, timeoutMs);

        function cleanup() {
            if (completed) {
                return;
            }

            completed = true;
            window.clearTimeout(timeoutId);

            try {
                delete window[callbackName];
            } catch (error) {
                window[callbackName] = undefined;
            }

            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }

        window[callbackName] = function (data) {
            cleanup();
            resolve(data);
        };

        script.onerror = function () {
            cleanup();

            reject(
                new Error(
                    'دریافت پاسخ از Google Apps Script ناموفق بود.'
                )
            );
        };

        script.async = true;
        script.src = API_URL + '?' + query.toString();

        document.head.appendChild(script);
    });
}

/**
 * استعلام وضعیت فقط با JSONP
 */
function fetchStatus(requestId) {
    return jsonpRequest({
        action: 'status',
        requestId: requestId
    });
}

/**
 * استعلام مکرر تا دریافت نتیجه نهایی
 */
async function pollRequestResult(
    requestId,
    maxRetries = 10,
    delayMs = 2000
) {
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
        try {
            const response = await fetchStatus(requestId);

            if (response && response.found === true) {
                return response;
            }

            lastError = null;
        } catch (error) {
            lastError = error;
            console.error(
                'خطا در استعلام وضعیت درخواست:',
                error
            );
        }

        if (attempt < maxRetries - 1) {
            await sleep(delayMs);
        }
    }

    if (lastError) {
        throw new Error(
            'دریافت نتیجه از سرور ناموفق بود: ' +
            lastError.message
        );
    }

    throw new Error(
        'نتیجه درخواست در زمان تعیین‌شده آماده نشد. لطفاً مجدداً تلاش کنید.'
    );
}

/**
 * مدیریت ارسال فرم
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    if (
        typeof validateForm === 'function' &&
        !validateForm()
    ) {
        return;
    }

    const form = event.currentTarget;
    const requestId = generateRequestId();

    setSubmittingState(true);
    showAlert(
        'در حال آماده‌سازی و ارسال اطلاعات...',
        'info'
    );

    const payload = {
        requestId: requestId,
        id: currentParticipantId || '',

        fullName: getInputValue('fullName'),
        mobile: getInputValue('mobile1'),
        province: getInputValue('province'),
        city: getInputValue('city'),

        email: getInputValue('email'),
        website: getInputValue('website'),
        linkedin: getInputValue('linkedin'),
        instagram: getInputValue('instagram'),

        introduction: getInputValue('introduction'),
        projects: getInputValue('projects'),
        needs: getInputValue('needs'),
        help: getInputValue('help'),

        currentImageUrl: currentImageUrl || '',
        imageBase64: base64FileData || '',
        imageName: uploadedFileName || '',
        imageType: uploadedFileType || ''
    };

    try {
        await sendPostNoCors(payload);

        showAlert(
            'اطلاعات ارسال شد؛ در حال دریافت نتیجه نهایی...',
            'warning'
        );

        const result = await pollRequestResult(requestId);

        if (!result.ok) {
            throw new Error(
                result.message ||
                'ثبت اطلاعات در سرور ناموفق بود.'
            );
        }

        currentParticipantId =
            result.participantId || currentParticipantId;

        currentImageUrl =
            result.imageUrl || currentImageUrl;

        showAlert(
            result.message ||
            'اطلاعات با موفقیت ثبت شد.',
            'success'
        );

        resetForm(form);
    } catch (error) {
        console.error(error);

        showAlert(
            error.message ||
            'در ارتباط با سرور خطایی رخ داد.',
            'danger'
        );
    } finally {
        setSubmittingState(false);
    }
}

/**
 * تغییر وضعیت دکمه ارسال
 */
function setSubmittingState(isSubmitting) {
    const submitButton =
        document.getElementById('submit-btn') ||
        document.getElementById('submitBtn');

    if (!submitButton) {
        return;
    }

    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting
        ? 'در حال ارسال و ثبت اطلاعات...'
        : 'ثبت اطلاعات';
}

/**
 * نمایش پیام فرم
 */
function showAlert(message, type) {
    const alertContainer =
        document.getElementById('form-message') ||
        document.getElementById('alertContainer');

    if (!alertContainer) {
        return;
    }

    alertContainer.className = 'alert alert-' + type;
    alertContainer.textContent = message;
    alertContainer.classList.remove('d-none');
}

/**
 * ریست کردن فرم بعد از ثبت موفق
 */
function resetForm(formElement) {
    const form =
        formElement ||
        document.getElementById('participant-form');

    if (form) {
        form.reset();
        form.classList.remove('was-validated');
    }

    base64FileData = '';
    uploadedFileName = '';
    uploadedFileType = '';
    currentParticipantId = '';
    currentImageUrl = '';

    if (
        window.myDropzone &&
        typeof window.myDropzone.removeAllFiles === 'function'
    ) {
        window.myDropzone.removeAllFiles(true);
    }
}

/**
 * خواندن امن مقدار فیلد
 */
function getInputValue(elementId) {
    const element = document.getElementById(elementId);

    if (!element) {
        return '';
    }

    return String(element.value || '').trim();
}

/**
 * تبدیل فایل تصویر به Base64
 *
 * این تابع را در رویداد addedfile مربوط به Dropzone فراخوانی کن.
 */
function prepareImageFile(file) {
    return new Promise(function (resolve, reject) {
        if (!file) {
            reject(new Error('فایل تصویر انتخاب نشده است.'));
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {
            base64FileData = String(reader.result || '');
            uploadedFileName = file.name || 'avatar.jpg';
            uploadedFileType = file.type || 'image/jpeg';

            resolve(base64FileData);
        };

        reader.onerror = function () {
            reject(
                new Error('خواندن فایل تصویر ناموفق بود.')
            );
        };

        reader.readAsDataURL(file);
    });
}

/**
 * دریافت اطلاعات شرکت‌کننده برای حالت ویرایش
 */
async function loadParticipantForEdit(participantId) {
    const normalizedId = String(participantId || '').trim();

    if (!normalizedId) {
        return;
    }

    try {
        showAlert(
            'در حال دریافت اطلاعات شرکت‌کننده...',
            'info'
        );

        const response = await jsonpRequest({
            action: 'participant',
            id: normalizedId
        });

        if (!response || !response.ok || !response.data) {
            throw new Error(
                response && response.message
                    ? response.message
                    : 'اطلاعات شرکت‌کننده دریافت نشد.'
            );
        }

        const participant = response.data;

        currentParticipantId = participant.id || '';
        currentImageUrl = participant.imageUrl || '';

        setInputValue('fullName', participant.fullName);
        setInputValue('mobile1', participant.mobile);
        setInputValue('province', participant.province);
        setInputValue('city', participant.city);
        setInputValue('email', participant.email);
        setInputValue('website', participant.website);
        setInputValue('linkedin', participant.linkedin);
        setInputValue('instagram', participant.instagram);
        setInputValue(
            'introduction',
            participant.introduction
        );
        setInputValue('projects', participant.projects);
        setInputValue('needs', participant.needs);
        setInputValue('help', participant.help);

        showAlert(
            'اطلاعات برای ویرایش بارگذاری شد.',
            'info'
        );
    } catch (error) {
        console.error(error);

        showAlert(
            error.message ||
            'دریافت اطلاعات شرکت‌کننده ناموفق بود.',
            'danger'
        );
    }
}

/**
 * قرار دادن مقدار در فیلد در صورت وجود
 */
function setInputValue(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.value = value || '';
    }
}

/**
 * مکث Promise
 */
function sleep(milliseconds) {
    return new Promise(function (resolve) {
        window.setTimeout(resolve, milliseconds);
    });
}
