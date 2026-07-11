"use strict";

const PARTICIPANTS_API_URL =
    "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

const participantsState = {
    search: "",
    page: 1,
    pageSize: 20,
    totalPages: 0,
    requestId: 0,
    searchTimer: null
};

document.addEventListener("DOMContentLoaded", initParticipantsList);

function initParticipantsList() {
    const searchInput =
        document.getElementById("participants-search");
    const previousButton =
        document.getElementById("participants-prev");
    const nextButton =
        document.getElementById("participants-next");

    searchInput?.addEventListener("input", function (event) {
        clearTimeout(participantsState.searchTimer);

        participantsState.searchTimer = setTimeout(function () {
            participantsState.search = event.target.value.trim();
            participantsState.page = 1;
            loadParticipants();
        }, 400);
    });

    previousButton?.addEventListener("click", function () {
        if (participantsState.page <= 1) {
            return;
        }

        participantsState.page -= 1;
        loadParticipants();
    });

    nextButton?.addEventListener("click", function () {
        if (
            participantsState.page >=
            participantsState.totalPages
        ) {
            return;
        }

        participantsState.page += 1;
        loadParticipants();
    });

    loadParticipants();
}

async function loadParticipants() {
    const currentRequestId = ++participantsState.requestId;

    showPageLoader({
        title: "دریافت شرکت‌کنندگان",
        message: participantsState.search
            ? "در حال جست‌وجوی شرکت‌کنندگان..."
            : "در حال دریافت فهرست شرکت‌کنندگان..."
    });

    try {
        const result = await participantsJsonpRequest({
            action: "getParticipants",
            search: participantsState.search,
            page: participantsState.page,
            pageSize: participantsState.pageSize
        });

        if (currentRequestId !== participantsState.requestId) {
            return;
        }

        if (!result?.ok) {
            throw new Error(
                result?.message ||
                "دریافت فهرست شرکت‌کنندگان ناموفق بود."
            );
        }

        renderParticipants(result.data || []);
        updateParticipantsPagination(
            result.pagination || {}
        );
    } catch (error) {
        if (currentRequestId !== participantsState.requestId) {
            return;
        }

        console.error(error);
        renderParticipants([]);

        toast.error(
            error?.message ||
            "خطا در دریافت فهرست شرکت‌کنندگان."
        );
    } finally {
        if (currentRequestId === participantsState.requestId) {
            hidePageLoader();
        }
    }
}

function renderParticipants(participants) {
    const container =
        document.getElementById("participants-list");
    const emptyState =
        document.getElementById("participants-empty");

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (!participants.length) {
        emptyState?.classList.remove("d-none");
        return;
    }

    emptyState?.classList.add("d-none");

    const fragment = document.createDocumentFragment();

    participants.forEach(function (participant) {
        fragment.appendChild(
            createParticipantListItem(participant)
        );
    });

    container.appendChild(fragment);
}

function createParticipantListItem(participant) {
    const item = document.createElement("div");
    const content = document.createElement("div");
    const name = document.createElement("div");
    const details = document.createElement("div");
    const editLink = document.createElement("a");

    item.className =
        "list-group-item d-flex align-items-center gap-3";
    content.className = "flex-fill";
    name.className = "fw-bold";
    details.className = "text-secondary small";
    editLink.className = "btn btn-sm btn-outline-primary";

    name.textContent =
        participant.fullName || "بدون نام";

    details.textContent = [
        participant.mobile1,
        participant.province,
        participant.city
    ].filter(Boolean).join(" - ");

    editLink.textContent = "ویرایش";
    editLink.href =
        "/participant-form.html?id=" +
        encodeURIComponent(participant.participantId || "");

    content.append(name, details);
    item.append(content, editLink);

    return item;
}

function updateParticipantsPagination(pagination) {
    const previousButton =
        document.getElementById("participants-prev");
    const nextButton =
        document.getElementById("participants-next");
    const status =
        document.getElementById("participants-page-status");

    participantsState.page = pagination.page || 1;
    participantsState.totalPages =
        pagination.totalPages || 0;

    if (previousButton) {
        previousButton.disabled =
            !pagination.hasPreviousPage;
    }

    if (nextButton) {
        nextButton.disabled =
            !pagination.hasNextPage;
    }

    if (status) {
        status.textContent = pagination.total
            ? "صفحه " +
            participantsState.page +
            " از " +
            participantsState.totalPages +
            " - " +
            pagination.total +
            " نفر"
            : "موردی یافت نشد";
    }
}

function participantsJsonpRequest(params) {
    return new Promise(function (resolve, reject) {
        const callbackName =
            "__participantsCallback_" +
            Date.now() +
            "_" +
            Math.random().toString(36).slice(2);

        const script = document.createElement("script");
        const query = new URLSearchParams({
            ...params,
            callback: callbackName
        });

        let timeoutId;

        function cleanup() {
            clearTimeout(timeoutId);
            script.remove();

            try {
                delete window[callbackName];
            } catch {
                window[callbackName] = undefined;
            }
        }

        window[callbackName] = function (result) {
            cleanup();
            resolve(result);
        };

        script.onerror = function () {
            cleanup();
            reject(new Error("ارتباط با سرور برقرار نشد."));
        };

        timeoutId = setTimeout(function () {
            cleanup();
            reject(new Error("زمان دریافت پاسخ از سرور تمام شد."));
        }, 30000);

        script.src =
            PARTICIPANTS_API_URL + "?" + query.toString();

        document.body.appendChild(script);
    });
}
