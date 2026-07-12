(function () {
    function getCurrentPage() {
        return document.body.dataset.page || '';
    }

    function isActive(pageName) {
        return getCurrentPage() === pageName ? 'active' : '';
    }
    function renderLayoutBodyGlobalThemeScript() {
        const placeholder = document.getElementById('layout-body-global-theme-script');
        if (!placeholder) return;

        placeholder.outerHTML = `
                  <script src="/dist/js/tabler-theme.min.js" ></script>
        `;
    }
    function renderLayoutBodyNavbar() {
        const sidebar = document.getElementById('layout-body-navbar');
        if (!sidebar) return;

        sidebar.outerHTML = `
        <div class="sticky-top">
       <header class="navbar navbar-expand-md sticky-top d-print-none">
        <div class="container-xl">
          <!-- BEGIN NAVBAR TOGGLER -->
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbar-menu"
            aria-controls="navbar-menu"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
          <!-- END NAVBAR TOGGLER -->
          <!-- BEGIN NAVBAR LOGO -->
          <div class="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
            <a href="/" aria-label="Tabler"
              >
             پنل دانشجویان کورس کوچینگ کد 10
            </a>
          </div>
          <!-- END NAVBAR LOGO -->
          <div class="navbar-nav flex-row order-md-last">
            <div class="nav-item d-none d-md-flex me-3">
              <div class="btn-list">
          
             
              </div>
            </div>
            <div class="d-none d-md-flex">
            
              <div class="nav-item dropdown d-none d-md-flex">
               
                <div class="dropdown-menu dropdown-menu-arrow dropdown-menu-end dropdown-menu-card">
                  <div class="card">
                    <div class="card-header d-flex">
                      <h3 class="card-title">Notifications</h3>
                      <div class="btn-close ms-auto" data-bs-dismiss="dropdown"></div>
                    </div>
                    <div class="list-group list-group-flush list-group-hoverable">
                      <div class="list-group-item">
                        <div class="row align-items-center">
                          <div class="col-auto"><span class="status-dot status-dot-animated bg-red d-block"></span></div>
                          <div class="col text-truncate">
                            <a href="#" class="text-body d-block">Example 1</a>
                            <div class="d-block text-secondary text-truncate mt-n1">Change deprecated html tags to text decoration classes (#29604)</div>
                          </div>
                          <div class="col-auto">
                            <a href="#" class="list-group-item-actions">
                              <!-- Download SVG icon from http://tabler.io/icons/icon/star -->
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="icon text-muted icon-2"
                              >
                                <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                      <div class="list-group-item">
                        <div class="row align-items-center">
                          <div class="col-auto"><span class="status-dot d-block"></span></div>
                          <div class="col text-truncate">
                            <a href="#" class="text-body d-block">Example 2</a>
                            <div class="d-block text-secondary text-truncate mt-n1">justify-content:between ⇒ justify-content:space-between (#29734)</div>
                          </div>
                          <div class="col-auto">
                            <a href="#" class="list-group-item-actions show">
                              <!-- Download SVG icon from http://tabler.io/icons/icon/star -->
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="icon text-yellow icon-2"
                              >
                                <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                      <div class="list-group-item">
                        <div class="row align-items-center">
                          <div class="col-auto"><span class="status-dot d-block"></span></div>
                          <div class="col text-truncate">
                            <a href="#" class="text-body d-block">Example 3</a>
                            <div class="d-block text-secondary text-truncate mt-n1">Update change-version.js (#29736)</div>
                          </div>
                          <div class="col-auto">
                            <a href="#" class="list-group-item-actions">
                              <!-- Download SVG icon from http://tabler.io/icons/icon/star -->
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="icon text-muted icon-2"
                              >
                                <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                      <div class="list-group-item">
                        <div class="row align-items-center">
                          <div class="col-auto"><span class="status-dot status-dot-animated bg-green d-block"></span></div>
                          <div class="col text-truncate">
                            <a href="#" class="text-body d-block">Example 4</a>
                            <div class="d-block text-secondary text-truncate mt-n1">Regenerate package-lock.json (#29730)</div>
                          </div>
                          <div class="col-auto">
                            <a href="#" class="list-group-item-actions">
                              <!-- Download SVG icon from http://tabler.io/icons/icon/star -->
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="icon text-muted icon-2"
                              >
                                <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="card-body">
                      <div class="row">
                        <div class="col">
                          <a href="#" class="btn btn-2 w-100"> Archive all </a>
                        </div>
                        <div class="col">
                          <a href="#" class="btn btn-2 w-100"> Mark all as read </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
             
            </div>
           
          </div>
        </div>
      </header>
      <header class="navbar-expand-md">
        <div class="collapse navbar-collapse" id="navbar-menu">
          <div class="navbar">
            <div class="container-xl">
              <div class="row flex-column flex-md-row flex-fill align-items-center">
                <div class="col">
                  <!-- BEGIN NAVBAR MENU -->
                  <ul class="navbar-nav">
                    <li class="nav-item ${isActive('dashboard')}">
                      <a class="nav-link" href="/">
                        <span class="nav-link-icon d-md-none d-lg-inline-block"
                          ><!-- Download SVG icon from http://tabler.io/icons/icon/home -->
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="icon icon-1"
                          >
                            <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
                            <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
                            <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" /></svg
                        ></span>
                        <span class="nav-link-title"> خانه </span>
                      </a>
                    </li>
                    <li class="nav-item ${isActive('participant-list')}">
                      <a
                        class="nav-link"
                        href="/pages/participant/list.html"
                      >
                        <span class="nav-link-icon d-md-none d-lg-inline-block"
                          ><!-- Download SVG icon from http://tabler.io/icons/icon/package -->
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="icon icon-1"
                          >
                            <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
                            <path d="M12 12l8 -4.5" />
                            <path d="M12 12l0 9" />
                            <path d="M12 12l-8 -4.5" />
                            <path d="M16 5.25l-8 4.5" /></svg
                        ></span>
                        <span class="nav-link-title"> لیست شرکت کنندگان </span>
                      </a>
                  
                    </li>
                    <li class="nav-item" ${isActive('participant-form')}>
                      <a
                        class="nav-link"
                        href="/pages/participant/form.html"
                   
                      >
                        <span class="nav-link-icon d-md-none d-lg-inline-block"
                          ><!-- Download SVG icon from http://tabler.io/icons/icon/checkbox -->
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="icon icon-1"
                          >
                            <path d="M9 11l3 3l8 -8" />
                            <path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9" /></svg
                        ></span>
                        <span class="nav-link-title"> درج شرکت کننده </span>
                      </a>
                     
                    </li>
                    <li class="nav-item">
                      <a
                        class="nav-link"
                        href="#"
                       
                      >
                        <span class="nav-link-icon d-md-none d-lg-inline-block"
                          ><!-- Download SVG icon from http://tabler.io/icons/icon/star -->
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="icon icon-1"
                          >
                            <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg
                        ></span>
                        <span class="nav-link-title"> سایر افراد و شرکت ها </span>
                      </a>
                     
                    </li>
                    <li class="nav-item">
                      <a
                        class="nav-link"
                        href="#"
                        
                      >
                        <span class="nav-link-icon d-md-none d-lg-inline-block"
                          ><!-- Download SVG icon from http://tabler.io/icons/icon/layout-2 -->
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="icon icon-1"
                          >
                            <path d="M4 4m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
                            <path d="M4 13m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
                            <path d="M14 4m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
                            <path d="M14 15m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /></svg
                        ></span>
                        <span class="nav-link-title"> خلاصه درس ها </span>
                      </a>
                     
                    </li>
                    <li class="nav-item">
                      <a
                        class="nav-link"
                        href="#"
                        
                      >
                        <span class="nav-link-icon d-md-none d-lg-inline-block"
                          ><!-- Download SVG icon from http://tabler.io/icons/icon/puzzle -->
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="icon icon-1"
                          >
                            <path
                              d="M4 7h3a1 1 0 0 0 1 -1v-1a2 2 0 0 1 4 0v1a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1a2 2 0 0 1 0 4h-1a1 1 0 0 0 -1 1v3a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-1a2 2 0 0 0 -4 0v1a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h1a2 2 0 0 0 0 -4h-1a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1"
                            /></svg
                        ></span>
                        <span class="nav-link-title"> آرشیو فایل </span>
                      </a>
                    
                    </li>
                    <li class="nav-item">
                      <a
                        class="nav-link"
                        href="#"
                        
                      >
                        <span class="nav-link-icon d-md-none d-lg-inline-block"
                          ><!-- Download SVG icon from http://tabler.io/icons/icon/gift -->
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="icon icon-1"
                          >
                            <path d="M3 8m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" />
                            <path d="M12 8l0 13" />
                            <path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" />
                            <path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5" /></svg
                        ></span>
                        <span class="nav-link-title"> دورهمی ها </span>
                      </a>
                    
                    </li>
                    
                  </ul>
                  <!-- END NAVBAR MENU -->
                </div>
               
              </div>
            </div>
          </div>
        </div>
      </header>
         </div> 
            
    `;
    }

    function renderLayoutBodyPageHeader() {
        const placeholder = document.getElementById('layout-body-page-header');
        if (!placeholder) return;
        const {
                title = '',
                pretitle = ''
        } = placeholder.dataset;
        placeholder.outerHTML = `
                    <div class="page-header d-print-none" aria-label="Page header">
                <div class="container-xl">
                    <div class="row g-2 align-items-center">
                        <div class="col">
                            <!-- Page pre-title -->
                            
                            <h2 class="page-title">${title}</h2>
                        </div>
                        <!-- Page title actions -->
                        <div class="col-auto ms-auto d-print-none">
                            <div class="btn-list">
                              
                               
                               
                            </div>
                            <!-- BEGIN MODAL -->
                            <!-- END MODAL -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderLayoutBodyToastContainer() {
        const placeholder = document.getElementById('layout-body-toast-container');
        if (!placeholder) return;
     
        placeholder.outerHTML = `
                  <div id="toast-container"
         class="toast-container position-fixed bottom-0 start-0 p-3"
         aria-live="polite"
         aria-atomic="false"></div>

        `;
    }
    function renderLayoutBodyLoader() {
        const placeholder = document.getElementById('layout-body-loader');
        if (!placeholder) return;

        placeholder.outerHTML = `
                     <div id="page-loader"
         class="page-loader d-none"
         role="status"
         aria-live="polite"
         aria-busy="true"
         aria-hidden="true">
        <div class="page page-center">
            <div class="container container-slim py-4">
                <div class="text-center">

                    <div class="mb-4">
                        <span class="avatar avatar-xl bg-primary-lt">
                            <span class="spinner-border text-primary"
                                  role="status"
                                  aria-hidden="true"></span>
                        </span>
                    </div>

                    <h3 id="page-loader-title" class="mb-2">
                        لطفاً صبر کنید
                    </h3>

                    <div id="page-loader-message" class="text-secondary mb-3">
                        در حال پردازش درخواست...
                    </div>

                    <div class="progress progress-sm mb-3">
                        <div class="progress-bar progress-bar-indeterminate"></div>
                    </div>

                    <div id="page-loader-hint"
                         class="text-secondary small d-none">
                        اگر این عملیات کمی زمان برد، لطفاً صفحه را نبندید.
                    </div>

                </div>
            </div>
        </div>
    </div>


        `;
    }
    function renderLayoutBodyFooter() {
        const footer = document.getElementById('layout-body-footer');
        if (!footer) return;

        footer.outerHTML = `
                  <footer class="footer footer-transparent d-print-none">
                <div class="container-xl">
                    <div class="row text-center align-items-center flex-row-reverse">
                        <div class="col-lg-auto ms-lg-auto">
                           
                        </div>
                        <div class="col-12 col-lg-auto mt-3 mt-lg-0">
                         
                        </div>
                    </div>
                </div>
            </footer>
    `;
    }

    function renderLayoutBodyGlobalMandatoryScript() {
        const footer = document.getElementById('layout-body-global-mandatory-script');
        if (!footer) return;

        footer.outerHTML = `
                 <script src="/dist/js/tabler.min.js" defer></script>
    `;
    }
    function initLayoutBody() {
        renderLayoutBodyGlobalThemeScript();
        renderLayoutBodyNavbar();
        renderLayoutBodyPageHeader();
        renderLayoutBodyToastContainer();
        renderLayoutBodyLoader();
        renderLayoutBodyFooter();
        renderLayoutBodyGlobalMandatoryScript();
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initLayoutBody, { once: true });
    } else {
        initLayoutBody();
    }
    document.addEventListener('DOMContentLoaded', initLayoutBody);
})();
