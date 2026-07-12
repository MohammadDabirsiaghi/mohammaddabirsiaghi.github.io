"use strict";

(function () {
    const state = {
        filters: {
            search: "",
            province: "",
            city: "",
            exportProject: "",
            importProject: ""
        },
        pagination: {
            page: 1,
            pageSize: 20
        },
        requestId: 0
    };

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        document
            .getElementById("search-participants")
            ?.addEventListener("click", handleFilters);

        document
            .getElementById("reset-participants-filters")
            ?.addEventListener("click", resetFilters);

        document
            .getElementById("participants-filters")
            ?.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    handleFilters();
                }
            });


        // ثبت رویداد کلیک صفحه‌بندی بدون نیاز به onclick روی دکمه‌ها (Event Delegation)
        document
            .getElementById("pagination")
            ?.addEventListener("click", handlePaginationClick);


        loadParticipants(1);
    }

    function handleFilters() {
        state.filters = {
            search: getInputValue([
                "filter-full-name",
                "participant-name-filter"
            ]),
            province: getInputValue([
                "participant-province-filter",
                "province-filter"
            ]),
            city: getInputValue([
                "participant-city-filter",
                "city-filter"
            ]),
            exportProject: getInputValue([
                "participant-export-filter",
                "export-project-filter"
            ]),
            importProject: getInputValue([
                "participant-import-filter",
                "import-project-filter"
            ])
        };

        loadParticipants(1);
    }

    function resetFilters() {
        const filters =
            document.getElementById("participants-filters");

        filters
            ?.querySelectorAll("input, select, textarea")
            .forEach(function (field) {
                if (
                    field.type === "checkbox" ||
                    field.type === "radio"
                ) {
                    field.checked = false;
                } else {
                    field.value = "";
                }
            });

        state.filters = {
            search: "",
            province: "",
            city: "",
            exportProject: "",
            importProject: ""
        };

        loadParticipants(1);
    }

    async function loadParticipants(page = 1, pageSize = 20) {
        currentPage = page;
        currentPageSize = pageSize;

        const requestId = ++state.requestId;

        showLoader({
            title: "دریافت شرکت‌کنندگان",
            message: hasActiveFilter()
                ? "در حال جست‌وجوی شرکت‌کنندگان..."
                : "در حال دریافت فهرست شرکت‌کنندگان..."
        });

        try {
            const result = await window.ApiClient.get({
                action: "getParticipants",
                search: state.filters.search,
                province: state.filters.province,
                city: state.filters.city,
                exportProject: state.filters.exportProject,
                importProject: state.filters.importProject,
                page: page,
                pageSize: pageSize
            });

            if (requestId !== state.requestId) {
                return;
            }

        
            const data = result.data || {};
            const participants = data.items || [];
            renderParticipants(participants);
            renderPagination(data.pagination || {});
            updateResultCount(participants.length);
        } catch (error) {
            if (requestId !== state.requestId) {
                return;
            }

            console.error(error);

            renderParticipants([]);
            updateResultCount(0);

            notify(
                "error",
                error?.message ||
                "خطا در دریافت فهرست شرکت‌کنندگان."
            );
        } finally {
            if (requestId === state.requestId) {
                hideLoader();
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
                createParticipantItem(participant)
            );
        });

        container.appendChild(fragment);
    }
    let currentPage = 1;
    let currentPageSize = 20;


    function renderPagination(pagination) {
        const container = document.getElementById("pagination");
        if (!container) return;

        const page = Number(pagination.page || 1);
        const totalPages = Number(pagination.totalPages || 1);

        if (totalPages <= 1) {
            container.innerHTML = "";
            return;
        }

        const maxButtons = 5;
        let start = Math.max(1, page - Math.floor(maxButtons / 2));
        let end = start + maxButtons - 1;

        if (end > totalPages) {
            end = totalPages;
            start = Math.max(1, end - maxButtons + 1);
        }

        const parts = [];

        // دکمه قبلی
        parts.push(`
            <button type="button" class="btn btn-outline-secondary btn-sm"
                ${pagination.hasPrev ? "" : "disabled"}
                data-page="${page - 1}">
                قبلی
            </button>
        `);

        // صفحه اول و سه نقطه
        if (start > 1) {
            parts.push(`
                <button type="button" class="btn btn-outline-secondary btn-sm" data-page="1">1</button>
            `);
            if (start > 2) {
                parts.push(`<span class="px-2 align-self-center text-muted">...</span>`);
            }
        }

        // دکمه‌های شماره صفحات
        for (let i = start; i <= end; i++) {
            parts.push(`
                <button type="button" 
                    class="btn btn-sm ${i === page ? 'btn-primary active' : 'btn-outline-secondary'}"
                    data-page="${i}">
                    ${i}
                </button>
            `);
        }

        // سه نقطه و صفحه آخر
        if (end < totalPages) {
            if (end < totalPages - 1) {
                parts.push(`<span class="px-2 align-self-center text-muted">...</span>`);
            }
            parts.push(`
                <button type="button" class="btn btn-outline-secondary btn-sm" data-page="${totalPages}">${totalPages}</button>
            `);
        }

        // دکمه بعدی
        parts.push(`
            <button type="button" class="btn btn-outline-secondary btn-sm"
                ${pagination.hasNext ? "" : "disabled"}
                data-page="${page + 1}">
                بعدی
            </button>
        `);

        container.innerHTML = parts.join("");
    }

    // هندلر کلیک روی دکمه‌های Pagination با استفاده از خصیصه data-page
    function handlePaginationClick(event) {
        const button = event.target.closest("button[data-page]");
        if (!button || button.disabled) {
            return;
        }

        const targetPage = Number(button.getAttribute("data-page"));
        if (targetPage > 0) {
            loadParticipants(targetPage, state.pagination.currentPageSize);
        }
    }

    function createParticipantItem(participant) {
        const item = document.createElement("div");
        const avatar = document.createElement("span");
        const content = document.createElement("div");
        const name = document.createElement("div");
        const details = document.createElement("div");
        const actions = document.createElement("div");
        const editLink = document.createElement("a");

        item.className =
            "list-group-item d-flex align-items-center gap-3";

        avatar.className = "avatar";

        if (participant.photoUrl) {
            avatar.style.backgroundImage = `url("${participant.photoUrl}")`;
        } else {
            avatar.textContent = getInitials(
                participant.fullName
            );
        }

        content.className = "flex-fill";
        name.className = "fw-bold";
        details.className = "text-secondary small";
        actions.className = "ms-auto";
        editLink.className =
            "btn btn-sm btn-outline-primary";

        name.textContent =
            participant.fullName || "بدون نام";

        details.textContent = [
            participant.mobile1,
            participant.province,
            participant.city
        ]
            .filter(Boolean)
            .join(" - ");

        editLink.textContent = "ویرایش";
        editLink.href =
            "/pages/participant/form.html?id=" +
            encodeURIComponent(
                participant.id || ""
            );

        content.append(name, details);
        actions.appendChild(editLink);
        item.append(avatar, content, actions);

        return item;
    }

    function updateResultCount(total) {
        const resultCount =
            document.getElementById(
                "participants-result-count"
            );

        if (resultCount) {
            resultCount.textContent =
                Number(total || 0) + " نتیجه";
        }
    }

    function getInputValue(ids) {
        for (const id of ids) {
            const element = document.getElementById(id);

            if (element) {
                return String(element.value || "").trim();
            }
        }

        return "";
    }

    function hasActiveFilter() {
        return Object.values(state.filters).some(Boolean);
    }

    function getInitials(fullName) {
        return String(fullName || "?")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(function (part) {
                return part.charAt(0);
            })
            .join("");
    }

    function showLoader(options) {
        if (typeof window.showPageLoader === "function") {
            window.showPageLoader(options);
        }
    }

    function hideLoader() {
        if (typeof window.hidePageLoader === "function") {
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

        console[type === "error" ? "error" : "log"](message);
    }
})();
