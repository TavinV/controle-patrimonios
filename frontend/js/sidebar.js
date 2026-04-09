// Shared hamburger sidebar logic for admin pages

(function () {
    const BREAKPOINT = 768;

    function isMobile() {
        return window.innerWidth <= BREAKPOINT;
    }

    function applyMobileState() {
        const topbar  = document.getElementById('mobile-topbar');
        const sidebar = document.querySelector('.sidebar');
        if (!topbar || !sidebar) return;

        if (isMobile()) {
            topbar.style.display = 'flex';
            // Ensure sidebar starts closed on mobile
            sidebar.classList.remove('open');
            document.getElementById('sidebar-overlay').classList.remove('open');
        } else {
            topbar.style.display = 'none';
            sidebar.classList.remove('open');
            document.getElementById('sidebar-overlay').classList.remove('open');
        }
    }

    window.toggleSidebar = function () {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const icon    = document.getElementById('hamburger-icon');
        const isOpen  = sidebar.classList.toggle('open');
        overlay.classList.toggle('open', isOpen);
        icon.className = isOpen ? 'fas fa-xmark' : 'fas fa-bars';
    };

    window.closeSidebar = function () {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const icon    = document.getElementById('hamburger-icon');
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        if (icon) icon.className = 'fas fa-bars';
    };

    // Close sidebar when a nav link is clicked on mobile
    document.addEventListener('DOMContentLoaded', () => {
        applyMobileState();
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', () => { if (isMobile()) closeSidebar(); });
        });
    });

    window.addEventListener('resize', applyMobileState);
})();
