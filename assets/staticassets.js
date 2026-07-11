(function () {

    function renderGlobalMandatoryStyles() {
        const placeholder = document.getElementById('layout-global-mandatory-styles');
        if (!placeholder) return;
       
        placeholder.outerHTML = `
                   <link href="/dist/css/tabler.rtl.min.css" rel="stylesheet" integrity="sha384-oBsMN4t4hqHp2yPeHCvYqwzbzTIQj7tW4JvGHxhmk14iAV8n8UWc8nl5PjfN0Cmp" />
        `;
    }


    function initLayout() {
        renderGlobalMandatoryStyles();
    }

    document.addEventListener('DOMContentLoaded', initLayout);
})();
