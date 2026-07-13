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
        const container = document.getElementById("participants-list");
        const emptyState = document.getElementById("participants-empty");
        if (!container) return;

        container.replaceChildren();

        if (!participants || !participants.length) {
            emptyState?.classList.remove("d-none");
            return;
        }

        emptyState?.classList.add("d-none");

        const fragment = document.createDocumentFragment();
        participants.forEach(p => fragment.appendChild(createParticipantItem(p)));
        container.appendChild(fragment);
    }

    function createParticipantItem(participant) {
        const item = document.createElement("div");
        item.className = "list-group-item participant-item py-3";

        const collapseId = `participant-more-${String(participant.id || Math.random()).replace(/[^a-zA-Z0-9_-]/g, "")}`;

        const card = document.createElement("div");
        card.className = "participant-card";

        const header = document.createElement("div");
        header.className = "participant-header";

        const media = document.createElement("div");
        media.className = "participant-media";

        const avatarWrap = document.createElement("div");
        avatarWrap.className = "participant-avatar-wrap";

        const avatar = document.createElement("span");
        avatar.className = "avatar avatar-2xl participant-avatar";
        avatar.dataset.initials = getInitials(participant.fullName);

        if (participant.photoFileId) {
            avatar.classList.add("image-loading-placeholder");
            avatar.setAttribute("data-file-id", participant.photoFileId);
            avatar.setAttribute("data-updated-at", participant.updatedAt || "v1");
            avatar.setAttribute("aria-label", participant.fullName || "تصویر شرکت کننده");
            lazyImageLoader.observe(avatar);
        } else {
            avatar.textContent = avatar.dataset.initials;
            avatar.classList.add("bg-primary-lt", "text-primary", "fw-bold");
        }

        const actions = document.createElement("div");
        actions.className = "participant-actions";

        const editLink = document.createElement("a");
        editLink.className = "btn btn-sm btn-outline-secondary";
        editLink.href = `/pages/participant/form.html?id=${encodeURIComponent(participant.id || "")}`;
        editLink.title = "ویرایش مشخصات";
        editLink.setAttribute("aria-label", "ویرایش مشخصات");
        editLink.innerHTML = `${pencilIconSvg()}<span class="d-none d-sm-inline ms-1">ویرایش</span>`;
        actions.appendChild(editLink);


        const saveContactBtn = document.createElement("a");
        saveContactBtn.className = "btn btn-sm btn-outline-secondary";
        saveContactBtn.href = `#`;
        saveContactBtn.title = "ذخیره مخاطب";
        saveContactBtn.setAttribute("aria-label", "ذخیره در مخاطبین");
        saveContactBtn.innerHTML = `${contactIconSvg()}<span class="d-none d-sm-inline ms-1">ذخیره مخاطب</span>`;
        actions.appendChild(saveContactBtn);


        avatarWrap.appendChild(avatar);
        avatarWrap.appendChild(actions);

        const identity = document.createElement("div");
        identity.className = "participant-identity min-w-0";

        const name = document.createElement("div");
        name.className = "participant-name";
        name.textContent = participant.fullName || "بدون نام";
        identity.appendChild(name);

        const contactRow = document.createElement("div");
        contactRow.className = "participant-contact";

        if (participant.mobile1) {
            contactRow.appendChild(createMetaLink(`tel:${participant.mobile1}`, participant.mobile1, phoneIconSvg()));
        }

        if (participant.mobile2) {
            contactRow.appendChild(createMetaLink(`tel:${participant.mobile2}`, participant.mobile2, phoneIconSvg(), "participant-mobile-secondary"));
        }

        if (contactRow.children.length > 0) {
            identity.appendChild(contactRow);
        }

        const locationText = [participant.province, participant.city].filter(Boolean).join("، ");
        if (locationText) {
            const location = document.createElement("div");
            location.className = "participant-location";
            location.appendChild(createMetaText(locationText, locationIconSvg()));
            identity.appendChild(location);
        }

        const socialRow = document.createElement("div");
        socialRow.className = "participant-social";

        if (participant.email) {
            socialRow.appendChild(createSocialIcon(`mailto:${participant.email}`, emailIconSvg(), `ایمیل: ${participant.email}`));
        }
        if (participant.website) {
            socialRow.appendChild(createSocialIcon(formatUrl(participant.website), globeIconSvg(), "وب سایت"));
        }
        if (participant.linkedin) {
            socialRow.appendChild(createSocialIcon(formatUrl(participant.linkedin), linkedinIconSvg(), "لینکدین"));
        }
        if (participant.instagram) {
            socialRow.appendChild(createSocialIcon(formatUrl(participant.instagram), instagramIconSvg(), "اینستاگرام"));
        }

        if (socialRow.children.length > 0) {
            identity.appendChild(socialRow);
        }

        media.appendChild(avatarWrap);
        media.appendChild(identity);
        header.appendChild(media);

        const mainBody = document.createElement("div");
        mainBody.className = "participant-main-body";

        if (participant.exportProject) {
            const exportRow = document.createElement("div");
            exportRow.className = "participant-project-row bg-green-lt text-green";
            exportRow.innerHTML = `<strong>پروژه صادرات :</strong> ${escapeHtml(participant.exportProject)}`;
            mainBody.appendChild(exportRow);
        }

        if (participant.importProject) {
            const importRow = document.createElement("div");
            importRow.className = "participant-project-row bg-orange-lt text-orange";
            importRow.innerHTML = `<strong>پروژه واردات :</strong> ${escapeHtml(participant.importProject)}`;
            mainBody.appendChild(importRow);
        }

        const hasMoreInfo = Boolean(
            participant.shortBio ||
            participant.howICanHelp ||
            participant.myNeeds ||
            participant.otherProjects
        );

        let collapseEl = null;
        let toggleBtn = null;

        if (hasMoreInfo) {
            toggleBtn = document.createElement("button");
            toggleBtn.className = "btn btn-sm btn-outline-primary participant-toggle";
            toggleBtn.type = "button";
            toggleBtn.setAttribute("data-bs-toggle", "collapse");
            toggleBtn.setAttribute("data-bs-target", `#${collapseId}`);
            toggleBtn.setAttribute("aria-expanded", "false");
            toggleBtn.setAttribute("aria-controls", collapseId);
            toggleBtn.textContent = "اطلاعات بیشتر";

            collapseEl = document.createElement("div");
            collapseEl.className = "collapse participant-collapse";
            collapseEl.id = collapseId;

            const collapseBody = document.createElement("div");
            collapseBody.className = "participant-collapse-body";

            appendInfoBlock(collapseBody, "معرفی", participant.shortBio);
            appendInfoBlock(collapseBody, "توانمندی‌ها", participant.howICanHelp);
            appendInfoBlock(collapseBody, "نیازها", participant.myNeeds);
            appendInfoBlock(collapseBody, "سایر پروژه‌ها", participant.otherProjects);

            collapseEl.appendChild(collapseBody);
        }

        card.appendChild(header);

        if (mainBody.children.length > 0) {
            card.appendChild(mainBody);
        }

        if (toggleBtn) {
            card.appendChild(toggleBtn);
        }

        if (collapseEl) {
            card.appendChild(collapseEl);
        }

        item.appendChild(card);

        if (collapseEl && toggleBtn) {
            collapseEl.addEventListener("show.bs.collapse", function () {
                toggleBtn.textContent = "مخفی کردن";
                toggleBtn.classList.remove("btn-outline-primary");
                toggleBtn.classList.add("btn-primary");
                toggleBtn.setAttribute("aria-expanded", "true");
            });

            collapseEl.addEventListener("hide.bs.collapse", function () {
                toggleBtn.textContent = "اطلاعات بیشتر";
                toggleBtn.classList.remove("btn-primary");
                toggleBtn.classList.add("btn-outline-primary");
                toggleBtn.setAttribute("aria-expanded", "false");
            });
        }

        return item;
    }
    function contactIconSvg() {
        return `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-sm" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M16 21v-2a4 4 0 0 0 -4 -4h-5a4 4 0 0 0 -4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M19 8l0 6" />
      <path d="M22 11l-6 0" />
    </svg>
  `;
    }

    function appendInfoBlock(container, labelText, value) {
        if (!value) return;

        const block = document.createElement("div");
        block.className = "participant-block";

        const label = document.createElement("div");
        label.className = "participant-block-label";
        label.textContent = labelText;

        const content = document.createElement("div");
        content.className = "participant-block-value";
        content.textContent = value;

        block.appendChild(label);
        block.appendChild(content);
        container.appendChild(block);
    }


    function createBadge(text, classes) {
        const badge = document.createElement("span");
        badge.className = `badge ${classes} participant-badge`;
        badge.textContent = text;
        badge.title = text;
        return badge;
    }

    function formatUrl(url) {
        if (!url) return "#";
        const clean = String(url).trim();
        return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    }

    function createMetaLink(href, text, iconSvg, extraClass) {
        const a = document.createElement("a");
        a.href = href;
        a.className = `participant-meta-link ${extraClass || ""}`.trim();

        const icon = document.createElement("span");
        icon.className = "participant-meta-icon";
        icon.innerHTML = iconSvg;

        const label = document.createElement("span");
        label.className = "participant-meta-text";
        label.textContent = text;

        a.appendChild(icon);
        a.appendChild(label);
        return a;
    }

    function createMetaText(text, iconSvg) {
        const wrapper = document.createElement("span");
        wrapper.className = "participant-meta-text-wrap";

        const icon = document.createElement("span");
        icon.className = "participant-meta-icon";
        icon.innerHTML = iconSvg;

        const label = document.createElement("span");
        label.className = "participant-meta-text";
        label.textContent = text;

        wrapper.appendChild(icon);
        wrapper.appendChild(label);
        return wrapper;
    }

    function createSocialIcon(href, svgContent, title) {
        const a = document.createElement("a");
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "participant-social-link";
        a.title = title;
        a.setAttribute("aria-label", title);
        a.innerHTML = svgContent;
        return a;
    }


    // تابع کمکی ساخت Badge
    function createBadge(text, classes) {
        const badge = document.createElement("span");
        badge.className = `badge ${classes} text-truncate`;
        badge.style.maxWidth = "200px";
        badge.textContent = text;
        badge.title = text;
        return badge;
    }

    // تابع کمکی برای فرمت کردن آدرس وب‌سایت‌ها
    function formatUrl(url) {
        if (!url) return "#";
        let cleanUrl = String(url).trim();
        if (!/^https?:\/\//i.test(cleanUrl)) {
            cleanUrl = "https://" + cleanUrl;
        }
        return cleanUrl;
    }
    function phoneIconSvg() {
        return `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-sm" width="16" height="16" viewBox="0 0 24 24"
         stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -16 -16a2 2 0 0 1 2 -2"></path>
    </svg>
  `;
    }

    function locationIconSvg() {
        return `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-sm" width="16" height="16" viewBox="0 0 24 24"
         stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M12 21l-6 -6a8 8 0 1 1 12 0l-6 6"></path>
      <path d="M12 11a2 2 0 1 0 0 -4a2 2 0 0 0 0 4"></path>
    </svg>
  `;
    }

    function calendarIconSvg() {
        return `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-sm" width="16" height="16" viewBox="0 0 24 24"
         stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
      <path d="M16 3v4"></path>
      <path d="M8 3v4"></path>
      <path d="M4 11h16"></path>
    </svg>
  `;
    }

    function pencilIconSvg() {
        return `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="18" height="18" viewBox="0 0 24 24"
         stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M7 20l3.5 -.5l10 -10a2.121 2.121 0 1 0 -3 -3l-10 10l-.5 3.5"></path>
      <path d="M13.5 6.5l4 4"></path>
    </svg>
  `;
    }
    function createMetaText(text, iconSvg) {
        const wrapper = document.createElement("span");
        wrapper.className = "d-inline-flex align-items-center gap-1 mw-100";

        if (iconSvg) {
            const icon = document.createElement("span");
            icon.className = "d-inline-flex flex-shrink-0";
            icon.innerHTML = iconSvg;
            wrapper.appendChild(icon);
        }

        const value = document.createElement("span");
        value.className = "participant-meta-text";
        value.textContent = text;
        wrapper.appendChild(value);

        return wrapper;
    }
    /**
     * تبدیل امن متون دریافتی برای جلوگیری از آسیب‌پذیری XSS
     */
    function escapeHtml(text) {
        if (text == null) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * دریافت حروف اول نام و نام خانوادگی برای نمایش در آواتار
     */
    function getInitials(fullName) {
        if (!fullName) return "؟";
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2);
        return (parts[0][0] + (parts[parts.length - 1][0] || "")).toUpperCase();
    }

    /**
     * تبدیل تاریخ میلادی یا ایزو سرور به تاریخ شمسی با فرمت شکیل
     */
    function formatPersianDate(dateString) {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(date);
        } catch (e) {
            return dateString;
        }
    }

    // تابع کمکی ساخت لینک شبکه اجتماعی
    function createSocialIcon(href, svgContent, tooltipText) {
        const a = document.createElement("a");
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "text-secondary d-inline-flex align-items-center justify-content-center p-1 rounded hover-bg-light";
        a.title = tooltipText;
        a.innerHTML = svgContent;
        return a;
    }

    // تابع کمکی ساخت متادیتا با لینک تماس
    function createMetaLink(href, text, iconSvg) {
        const a = document.createElement("a");
        a.href = href;
        a.className = "d-inline-flex align-items-center gap-1 text-secondary text-decoration-none me-3";

        if (iconSvg) {
            const iconSpan = document.createElement("span");
            iconSpan.className = "d-inline-flex text-muted";
            iconSpan.innerHTML = iconSvg;
            a.appendChild(iconSpan);
        }

        const textSpan = document.createElement("span");
        textSpan.className = "participant-meta-text";
        textSpan.textContent = text;
        a.appendChild(textSpan);

        return a;
    }
    function emailIconSvg() {
        return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-sm" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>`;
    }

    function globeIconSvg() {
        return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-sm" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" /><path d="M11.5 3a17 17 0 0 0 0 18" /><path d="M12.5 3a17 17 0 0 1 0 18" /></svg>`;
    }

    function linkedinIconSvg() {
        return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-sm text-linkedin" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M8 11l0 5" /><path d="M8 8l0 .01" /><path d="M12 16l0 -5" /><path d="M16 16v-3a2 2 0 0 0 -4 0" /></svg>`;
    }

    function instagramIconSvg() {
        return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-sm text-instagram" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M16.5 7.5l0 .01" /></svg>`;
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
