let activePageRequests = 0;
let pageLoaderHintTimer = null;

const PAGE_LOADER_DEFAULTS = {
    title: "لطفاً صبر کنید",
    message: "در حال پردازش درخواست...",
    hint: "اگر این عملیات کمی زمان برد، لطفاً صفحه را نبندید.",
    hintDelay: 4000
};

function showPageLoader(options = {}) {
    const loader = document.getElementById("page-loader");
    const titleElement = document.getElementById("page-loader-title");
    const messageElement = document.getElementById("page-loader-message");
    const hintElement = document.getElementById("page-loader-hint");

    const settings = {
        ...PAGE_LOADER_DEFAULTS,
        ...options
    };

    activePageRequests += 1;

    if (titleElement) {
        titleElement.textContent = settings.title;
    }

    if (messageElement) {
        messageElement.textContent = settings.message;
    }

    if (hintElement) {
        hintElement.textContent = settings.hint;
        hintElement.classList.add("d-none");
    }

    if (loader) {
        loader.classList.remove("d-none");
        loader.setAttribute("aria-hidden", "false");
        loader.setAttribute("aria-busy", "true");
    }

    document.body.classList.add("page-is-loading");

    clearTimeout(pageLoaderHintTimer);

    pageLoaderHintTimer = setTimeout(function () {
        if (activePageRequests > 0 && hintElement) {
            hintElement.classList.remove("d-none");
        }
    }, settings.hintDelay);
}

function hidePageLoader(force = false) {
    const loader = document.getElementById("page-loader");
    const hintElement = document.getElementById("page-loader-hint");

    if (force) {
        activePageRequests = 0;
    } else {
        activePageRequests = Math.max(0, activePageRequests - 1);
    }

    if (activePageRequests > 0) {
        return;
    }

    clearTimeout(pageLoaderHintTimer);
    pageLoaderHintTimer = null;

    if (hintElement) {
        hintElement.classList.add("d-none");
    }

    if (loader) {
        loader.classList.add("d-none");
        loader.setAttribute("aria-hidden", "true");
        loader.setAttribute("aria-busy", "false");
    }

    document.body.classList.remove("page-is-loading");
}

function updatePageLoader(options = {}) {
    const titleElement = document.getElementById("page-loader-title");
    const messageElement = document.getElementById("page-loader-message");
    const hintElement = document.getElementById("page-loader-hint");

    if (options.title && titleElement) {
        titleElement.textContent = options.title;
    }

    if (options.message && messageElement) {
        messageElement.textContent = options.message;
    }

    if (options.hint && hintElement) {
        hintElement.textContent = options.hint;
    }
}
