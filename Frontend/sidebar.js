/**
 * VEYRA Sidebar & Navigation System
 * Handles responsive drawer navigation, active state detection, and logout functionality.
 */

function initSidebar() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const logoutBtn = document.querySelector('.logout-item');

    // 1. Detect Current Page & Apply Active Navigation State
    const currentPath = window.location.pathname.toLowerCase();
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (!href) return;

        item.classList.remove('active');

        if (currentPath.includes('profile') && href.toLowerCase().includes('profile')) {
            item.classList.add('active');
        } else if ((currentPath.includes('dashboard') || currentPath.endsWith('/') || currentPath.endsWith('/frontend/')) && href.toLowerCase().includes('dashboard')) {
            item.classList.add('active');
        }
    });

    // 2. Mobile Drawer & Overlay Controls
    function openSidebar() {
        sidebar?.classList.add('open');
        sidebarBackdrop?.classList.add('active');
        document.body.classList.add('sidebar-open');
    }

    function closeSidebar() {
        sidebar?.classList.remove('open');
        sidebarBackdrop?.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }

    function toggleSidebar() {
        if (sidebar?.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSidebar();
        });
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeSidebar);
    }

    // Close when clicking outside sidebar on mobile/tablet
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992) {
            if (sidebar?.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !hamburgerBtn?.contains(e.target)) {
                closeSidebar();
            }
        }
    });

    // Close sidebar drawer when clicking navigation link
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                closeSidebar();
            }
        });
    });

    // Reset drawer state on window resize to desktop width
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            closeSidebar();
        }
    });

    // 3. Logout Button Event Handling
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const token = localStorage.getItem("token");
            let isSuccess = true;
            let logoutMessage = "Logged out successfully!";

            try {
                const response = await fetch("http://localhost:5000/api/auth/logout", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const data = await response.json();
                    console.error("Logout failed:", data);
                    isSuccess = false;
                    logoutMessage = data.message || "Logout completed with warnings.";
                }
            } catch (error) {
                console.error("Logout error:", error);
            }

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            showLogoutToast(logoutMessage, isSuccess);

            setTimeout(() => {
                window.location.href = "/Frontend/auth.html";
            }, 1000);
        });
    }
}

function showLogoutToast(message, isSuccess) {
    let toast = document.getElementById("veyra-logout-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "veyra-logout-toast";
        toast.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 999999;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 22px;
            border-radius: 12px;
            font-family: 'Inter', -apple-system, sans-serif;
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
            background: ${isSuccess ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)'};
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            transform: translateY(-20px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
        `;

        const iconSvg = isSuccess
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

        toast.innerHTML = `${iconSvg}<span>${message}</span>`;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = "translateY(0)";
            toast.style.opacity = "1";
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
} else {
    initSidebar();
}
