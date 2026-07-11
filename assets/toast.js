const TOAST_DEFAULTS = {
    type: "info",
    title: "",
    message: "",
    duration: 5000,
    closable: true
};

const TOAST_TYPES = {
    success: {
        title: "عملیات موفق",
        color: "success",
        icon: "✓"
    },
    error: {
        title: "خطا",
        color: "danger",
        icon: "!"
    },
    warning: {
        title: "هشدار",
        color: "warning",
        icon: "!"
    },
    info: {
        title: "اطلاع‌رسانی",
        color: "azure",
        icon: "i"
    }
};

function showToast(options = {}) {
    const container = document.getElementById("toast-container");

    if (!container) {
        console.warn("Toast container was not found.");
        return null;
    }

    const settings = {
        ...TOAST_DEFAULTS,
        ...options
    };

    const toastType = TOAST_TYPES[settings.type] || TOAST_TYPES.info;
    const title = settings.title || toastType.title;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", settings.type === "error" ? "alert" : "status");
    toast.setAttribute("aria-live", settings.type === "error" ? "assertive" : "polite");
    toast.setAttribute("aria-atomic", "true");

    const header = document.createElement("div");
    header.className = "toast-header";

    const iconWrap = document.createElement("span");
    iconWrap.className =
        "avatar avatar-xs me-2 text-white bg-" + toastType.color;
    iconWrap.textContent = toastType.icon;

    const titleElement = document.createElement("strong");
    titleElement.className = "me-auto";
    titleElement.textContent = title;

    const timeElement = document.createElement("small");
    timeElement.className = "text-secondary";
    timeElement.textContent = "اکنون";

    header.append(iconWrap, titleElement, timeElement);

    if (settings.closable) {
        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "btn-close";
        closeButton.setAttribute("aria-label", "بستن");

        closeButton.addEventListener("click", function () {
            hideToast(toast);
        });

        header.appendChild(closeButton);
    }

    const body = document.createElement("div");
    body.className = "toast-body";

    const bodyLayout = document.createElement("div");
    bodyLayout.className = "d-flex align-items-start";

    const indicator = document.createElement("span");
    indicator.className =
        "status-dot status-dot-animated bg-" + toastType.color + " me-2 mt-1";

    const messageElement = document.createElement("div");
    messageElement.className = "toast-message flex-fill";
    messageElement.textContent = settings.message;

    bodyLayout.append(indicator, messageElement);
    body.appendChild(bodyLayout);

    toast.append(header, body);
    container.appendChild(toast);

    requestAnimationFrame(function () {
        toast.classList.add("show");
    });

    let timer = null;

    if (settings.duration > 0) {
        timer = setTimeout(function () {
            hideToast(toast);
        }, settings.duration);
    }

    toast.addEventListener("mouseenter", function () {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    });

    toast.addEventListener("mouseleave", function () {
        if (settings.duration > 0 && !timer) {
            timer = setTimeout(function () {
                hideToast(toast);
            }, 1500);
        }
    });

    return {
        element: toast,
        hide() {
            hideToast(toast);
        }
    };
}

function hideToast(toastElement) {
    if (!toastElement || toastElement.dataset.hiding === "true") {
        return;
    }

    toastElement.dataset.hiding = "true";
    toastElement.classList.remove("show");
    toastElement.classList.add("hide");

    setTimeout(function () {
        toastElement.remove();
    }, 700);
}
const toast = {
    success(message, title = "عملیات موفق") {
        return showToast({
            type: "success",
            title,
            message,
            duration: 7000
        });
    },

    error(message, title = "خطا") {
        return showToast({
            type: "error",
            title,
            message,
            duration: 10000
        });
    },

    warning(message, title = "هشدار") {
        return showToast({
            type: "warning",
            title,
            message,
            duration: 9000
        });
    },

    info(message, title = "اطلاع‌رسانی") {
        return showToast({
            type: "info",
            title,
            message,
            duration: 8000
        });
    }
};
