
const API_BASE = "http://localhost:5000/api/auth/me";
const token = localStorage.getItem("token");
const localUser = JSON.parse(localStorage.getItem("user") || "{}");

// Auth Guard: Ensure token exists and user is a host
if (!token || !localUser || localUser.role !== "host") {
    window.location.href = "/Frontend/auth.html";
}

// Helper to set text content cleanly
const setText = (selector, text, fallback = "Not Provided") => {
    const el = document.querySelector(selector);
    if (el) {
        el.textContent = (text && String(text).trim()) ? String(text).trim() : fallback;
    }
};

// Helper to set input value
const setVal = (selector, val) => {
    const el = document.querySelector(selector);
    if (el) {
        el.value = val || "";
    }
};

// Load & Render User Profile from Database
async function loadProfile() {
    try {
        const response = await fetch(API_BASE, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success || !data.user) {
            console.error("Failed to load user profile:", data.message);
            return;
        }

        const u = data.user;

        // Update Names
        setText("#display-user-name", u.name, "Host");
        setText("#info-full-name", u.name, "Not provided");
        setText(".user-name", u.name, "Host");
        setText(".profile-name-topbar", u.name, "Host");

        // Update Roles
        setText("#display-badge-role", u.role, "host");
        setText("#info-user-role", u.role, "host");
        setText("#account-type-value", u.role, "host");
        setText(".user-role", u.role, "host");
        setText(".profile-role-topbar", u.role, "host");

        // Update Emails
        setText("#display-user-email", u.email, "Not provided");
        setText("#info-email-address", u.email, "Not provided");

        // Update Phone, City, Bio
        setText("#info-mobile-number", u.phone, "Not provided");
        setText("#info-user-city", u.city, "Not provided");
        setText("#header-user-city", u.city, "Not provided");
        setText("#info-user-bio", u.bio, "Not provided");
        setText("#header-user-bio", u.bio, "Not provided");

        // Update Avatars
        const avatarSrc = (u.avatar && u.avatar.trim()) ? u.avatar.trim() : "images/avatar.png";
        document.querySelectorAll("#display-avatar-img, .profile-avatar-topbar").forEach(img => {
            img.src = avatarSrc;
        });

        // Pre-fill Edit Form Inputs
        setVal("#edit-full-name", u.name);
        setVal("#edit-email-address", u.email);
        setVal("#edit-user-role", u.role);
        setVal("#edit-mobile-number", u.phone);
        setVal("#edit-city", u.city);
        setVal("#edit-avatar-url", u.avatar);
        setVal("#edit-bio", u.bio);

    } catch (err) {
        console.error("Error loading profile:", err);
    } finally {
        if (typeof hideVeyraLoader === "function") hideVeyraLoader();
    }
}

// Edit Mode Toggle
const editBtn = document.querySelector("#btn-edit-profile");
const cancelBtn = document.querySelector("#btn-cancel-edit");
const form = document.querySelector("#profile-edit-form");
const displayView = document.querySelector("#profile-display-mode");

if (editBtn) {
    editBtn.addEventListener("click", () => {
        if (form) form.style.display = "block";
        if (displayView) displayView.style.display = "none";
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
        if (form) form.style.display = "none";
        if (displayView) displayView.style.display = "block";
    });
}

// Profile Form Submit (Save Changes to Database)
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.querySelector("#edit-full-name")?.value || "",
            phone: document.querySelector("#edit-mobile-number")?.value || "",
            city: document.querySelector("#edit-city")?.value || "",
            avatar: document.querySelector("#edit-avatar-url")?.value || "",
            bio: document.querySelector("#edit-bio")?.value || ""
        };

        try {
            const res = await fetch(API_BASE, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success && data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            form.style.display = "none";
            if (displayView) displayView.style.display = "block";

            // Reload & re-render profile directly from DB
            await loadProfile();
        } catch (err) {
            console.error("Error updating profile:", err);
        }
    });
}

function compressHostAvatar(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = 300;
                canvas.height = 300;
                const ctx = canvas.getContext("2d");
                const minSide = Math.min(img.width, img.height);
                const sx = (img.width - minSide) / 2;
                const sy = (img.height - minSide) / 2;
                ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 300, 300);
                resolve(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
    });
}

// Change Photo Buttons (File Upload & FileReader Base64 conversion)
const hostFileInput = document.querySelector("#host-avatar-file-input");
const photoBtns = [document.querySelector("#btn-change-photo"), document.querySelector("#btn-camera-photo")];

photoBtns.forEach(btn => {
    if (btn && hostFileInput) {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            hostFileInput.click();
        });
    }
});

if (hostFileInput) {
    hostFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const base64Avatar = await compressHostAvatar(file);
            if (!base64Avatar) return;

            const res = await fetch(API_BASE, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ avatar: base64Avatar })
            });

            const data = await res.json();
            if (data.success && data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }
            await loadProfile();
        } catch (err) {
            console.error("Error updating avatar:", err);
        }
        hostFileInput.value = "";
    });
}

// Initial Load
loadProfile();
