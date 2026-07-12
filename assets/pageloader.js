const PAGE_LOADER_DEFAULTS = {
    title: "لطفاً صبر کنید",
    message: "در حال پردازش درخواست...",
    hint: "اگر این عملیات کمی زمان برد، لطفاً صفحه را نبندید."
};

function getPageLoaderElements() {
    return {
        loader: document.getElementById("page-loader"),
        titleElement: document.getElementById("page-loader-title"),
        messageElement: document.getElementById("page-loader-message"),
        hintElement: document.getElementById("page-loader-hint")
    };
}

function showPageLoader(options = {}) {
    const { loader, titleElement, messageElement, hintElement } = getPageLoaderElements();

    const settings = {
        ...PAGE_LOADER_DEFAULTS,
        ...options
    };

    if (titleElement) {
        titleElement.textContent = settings.title;
    }

    if (messageElement) {
        messageElement.textContent = settings.message;
    }

    if (hintElement) {
        hintElement.textContent = settings.hint;
        hintElement.classList.remove("d-none");
    }

    if (loader) {
        loader.classList.remove("d-none");
        loader.setAttribute("aria-hidden", "false");
        loader.setAttribute("aria-busy", "true");
    }

    document.body.classList.add("page-is-loading");
}

function hidePageLoader() {
    const { loader, hintElement } = getPageLoaderElements();

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
    const { titleElement, messageElement, hintElement } = getPageLoaderElements();

    if (typeof options.title === "string" && titleElement) {
        titleElement.textContent = options.title;
    }

    if (typeof options.message === "string" && messageElement) {
        messageElement.textContent = options.message;
    }

    if (typeof options.hint === "string" && hintElement) {
        hintElement.textContent = options.hint;
    }
}
