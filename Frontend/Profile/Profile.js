let nav_name = document.querySelector(".user-name");
let nav_role = document.querySelector(".user-role");
let main_role = document.querySelector("#display-badge-role");
let main_name = document.querySelector("#display-user-name");
let main_email = document.querySelector("#display-user-email");
let infoName = document.querySelector("#info-full-name");
let infoEmail = document.querySelector("#info-email-address");
let infoRole = document.querySelector("#info-user-role");


const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "host") {
    window.location.href = "/Frontend/auth.html";
}

const USerProfile = async () => {

    try {
        let token = localStorage.getItem("token");
        if (!token) {
            showAlert("lg-alert", "Please login first", "error");
            window.location.href = "/Frontend/Profile/Profile.html";
            return
        }

        const response = await fetch("http://localhost:5000/api/auth/me",
            {
                method: "GET",
                headers:
                {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        const data = await response.json();
        nav_name.textContent = data.user.name;
        nav_name.style.textTransform = "capitalize"
        main_name.textContent = data.user.name;
        main_name.style.textTransform = "capitalize"
        infoName.textContent = data.user.name;
        infoName.style.textTransform = "capitalize"
        nav_role.textContent = data.user.role;
        nav_role.style.textTransform = "capitalize"
        main_role.textContent = data.user.role;
        main_role.style.textTransform = "capitalize"
        infoRole.textContent = data.user.role;
        infoRole.style.textTransform = "capitalize"
        main_email.textContent = data.user.email;
        document.querySelector("#account-type-value").textContent = data.user.role
        document.querySelector("#account-type-value").style.textTransform = 'capitalize'
        infoEmail.textContent = data.user.email;

    } catch (error) {
        console.error;
    }
}

USerProfile();

// Sidebar Drawer Mobile Interaction
function initSidebarDrawer() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

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

    // Close when clicking outside on mobile/tablet
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992) {
            if (sidebar?.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !hamburgerBtn?.contains(e.target)) {
                closeSidebar();
            }
        }
    });

    // Close sidebar when clicking navigation link
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                closeSidebar();
            }
        });
    });

    // Reset drawer state on resize to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            closeSidebar();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarDrawer);
} else {
    initSidebarDrawer();
}

// Standard Logout Handler
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

let logoutbtn = document.querySelector(".logout-item");
if (logoutbtn) {
    logoutbtn.addEventListener("click", async (e) => {
        e.preventDefault();

        let token = localStorage.getItem("token");
        let isSuccess = true;
        let logoutMessage = "Logged out successfully!";

        try {
            const response = await fetch("http://localhost:5000/api/auth/logout", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
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