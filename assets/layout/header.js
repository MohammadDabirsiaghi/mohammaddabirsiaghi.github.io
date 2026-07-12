"use strict";
(function () {
    

    function renderLayoutHeaderTitle() {
        const title =
            document.documentElement.dataset.pageTitle ||
            document.body?.dataset.pageTitle ||
            "پنل کوچ";

        document.title = title;
    }
    function renderLayoutHeaderFavIcon() {

        upsertHeadElement('link[rel="icon"]', "link", {
            rel: "icon",
            href: '/favicon.ico',
            type: "image/x-icon"
        });

        upsertHeadElement('link[rel="shortcut icon"]', "link", {
            rel: "shortcut icon",
            href: '/favicon.ico',
            type: "image/x-icon"
        });
       
    }
    function renderLayoutHeaderMeta() {
        const staticMetas = [
            { name: "msapplication-TileColor", content:"#066fd1" },
            { name: "theme-color", content:"#066fd1" },
            { name: "apple-mobile-web-app-status-bar-style", content:"black-translucent" },
            { name: "apple-mobile-web-app-capable", content:"yes" },
            { name: "mobile-web-app-capable", content:"yes" },
            { name: "HandheldFriendly", content:"True" },
            { name: "MobileOptimized", content:"320" },
            { name: "description", content:"" },
            { name: "canonical", content:"" },
            { name: "twitter:image:src", content:"" },
            { name: "twitter:site", content:"" },
            { name: "twitter:card", content:"" },
            { name: "twitter:title", content:"" },
            { name: "twitter:description", content:"" }
        ];

        staticMetas.forEach(metaData => {
            upsertHeadElement(`meta[name="${metaData.name}"]`, "meta", metaData);
        }); 
    }


    function renderLayoutHeaderGlobalMandatoryStyles() {

        upsertHeadElement('link[href="/dist/css/tabler.rtl.min.css"]', "link", {
            rel: "stylesheet",
            href: "/dist/css/tabler.rtl.min.css"
        });

        upsertHeadElement('link[href="/assets/css/site.css"]', "link", {
            rel: "stylesheet",
            href: "/assets/css/site.css"
        });
    }
    function renderLayoutHeaderGlobalFont() {
        upsertHeadElement('link[href="/fonts/vazirmatn/Vazirmatn-font-face.css"]', "link", {
            rel: "stylesheet",
            href: "/fonts/vazirmatn/Vazirmatn-font-face.css"
        });
    }
    function upsertHeadElement(selector, tagName, attributes) {
        let element = document.head.querySelector(selector);
        if (!element) {
            element = document.createElement(tagName);
            document.head.appendChild(element);
        }
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }



    function initLayoutHeader() {
        renderLayoutHeaderTitle();
         renderLayoutHeaderFavIcon();
        renderLayoutHeaderMeta();
        renderLayoutHeaderGlobalMandatoryStyles();
        renderLayoutHeaderGlobalFont();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initLayoutHeader, { once: true });
    } else {
        initLayoutHeader();
    }
})();
