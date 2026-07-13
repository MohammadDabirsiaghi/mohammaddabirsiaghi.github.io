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


    // --- ۲. لودر هوشمند تصاویر ---
    const lazyImageLoader = {
        observer: null,
        init() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '100px 0px', threshold: 0.01 });
        },
        observe(img) { if (this.observer) this.observer.observe(img); },
        async loadImage(img) {
            const fileId = img.getAttribute('data-file-id');
            const updatedAt = img.getAttribute('data-updated-at') || 'v1';
            if (!fileId) return;

            const cacheKey = `photo_${fileId}_${updatedAt}`;
            const cachedData = await ImageCacheService.get(cacheKey);

            if (cachedData) {
                img.style.backgroundImage = `url("${cachedData}")`;
                img.classList.remove('image-loading-placeholder');
                img.textContent = "";
                return;
            }

            try {
                // استفاده از ApiClient برای حفظ ساختار پروژه شما
                const result = await window.ApiClient.get({
                    action: "getPhotoBase64",
                    fileId: fileId
                });

                if (result.ok && result.data.dataUrl) {
                    const dataUrl = result.data.dataUrl;
                    img.style.backgroundImage = `url("${dataUrl}")`;
                    img.classList.remove('image-loading-placeholder');
                    img.textContent = "";
                    await ImageCacheService.set(cacheKey, dataUrl);
                }
            } catch (e) {
                console.error("Lazy load failed", e);
            }
        }
    };


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

        lazyImageLoader.init();

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
            renderFilterOptions(data.filterOptions);
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
    function renderFilterOptions(options) {
        fillSelectOptions(
            ["province-filter", "participant-province-filter"],
            options.provinces || [],
            "همه استان‌ها"
        );

        fillSelectOptions(
            ["city-filter", "participant-city-filter"],
            options.cities || [],
            "همه شهرها"
        );

        fillSelectOptions(
            ["export-project-filter", "participant-export-filter"],
            options.exportProjects || [],
            "همه پروژه‌های صادرات"
        );

        fillSelectOptions(
            ["import-project-filter", "participant-import-filter"],
            options.importProjects || [],
            "همه پروژه‌های واردات"
        );
    }
    function fillSelectOptions(selectIds, items, placeholder) {
        const select = findElementByIds(selectIds);
        if (!select) return;

        // ذخیره مقدار انتخاب‌شده فعلی کاربر
        const currentValue = String(select.value || "").trim();
        const fragment = document.createDocumentFragment();

        // افزودن گزینه پیش‌فرض (مثل "همه استان‌ها")
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = placeholder;
        fragment.appendChild(defaultOption);

        // افزودن گزینه‌های داینامیک دریافتی از سرور
        items.forEach(function (item) {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            fragment.appendChild(option);
        });

        // جایگزینی محتوای قدیمی با گزینه‌های جدید به صورت بهینه
        select.replaceChildren(fragment);

        // بررسی اینکه آیا مقدار قبلی انتخاب‌شده هنوز در لیست جدید وجود دارد یا خیر
        const exists = Array.from(select.options).some(opt => opt.value === currentValue);
        select.value = exists ? currentValue : "";
    }

    /**
     * پیدا کردن عنصر در سند بر اساس فهرستی از شناسه‌ها (ID)
     */
    function findElementByIds(ids) {
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el) return el;
        }
        return null;
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

        avatar.className = "avatar avatar-2xl";

        // اگر تصویر داشت، لودر تنبل را فعال می‌کنیم
        if (participant.photoFileId) {
     
            avatar.classList.add('image-loading-placeholder');
            avatar.setAttribute('data-file-id', participant.photoFileId);
            avatar.setAttribute('data-updated-at', participant.updatedAt || 'v1');
            lazyImageLoader.observe(avatar);
        } else {
            avatar.textContent = getInitials(participant.fullName);
            avatar.style.backgroundColor = "#f0f2f5";
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
