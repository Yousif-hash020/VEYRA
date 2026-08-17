const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
}

let editbtn, editform, displayform, btncancel, btnsave, formname, bio, phone, city, cnic;
let heroName, heroEmail, heroCity, heroBio;
let disName, disEmail, disPhone, disCnic, disCity, disBio;

function showVeyraToast(message, type = "success") {
    let toastContainer = document.getElementById("veyra-toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "veyra-toast-container";
        toastContainer.style.cssText = "position:fixed; bottom:28px; right:28px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none;";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = "veyra-toast-item";
    toast.style.cssText = "display:flex; align-items:center; gap:10px; padding:12px 20px; background:#0F172A; color:#ffffff; border-radius:12px; font-size:13.5px; font-weight:600; box-shadow:0 10px 30px rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.1); opacity:0; transform:translateY(12px); transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1); pointer-events:auto;";

    const iconSvg = type === "error" || type === "remove"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#0D5C4E" stroke="#0D5C4E" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

    toast.innerHTML = `<span style="display:flex;align-items:center;">${iconSvg}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(12px)";
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

function initProfileDOMElements() {
    editbtn = document.querySelector("#btn-edit-personal");
    editform = document.querySelector("#personal-edit-form");
    displayform = document.querySelector("#personal-display-view");
    btncancel = document.querySelector("#btn-cancel-personal");
    btnsave = document.querySelector("#btn-save-personal");
    formname = document.querySelector("#first-name");
    bio = document.querySelector("#bio-text");
    phone = document.querySelector("#phone-num");
    city = document.querySelector("#user-city");
    cnic = document.querySelector("#cnic-id");

    heroName = document.querySelector("#hero-user-name");
    heroEmail = document.querySelector("#hero-user-email");
    heroCity = document.querySelector("#hero-city-text");
    heroBio = document.querySelector("#hero-user-bio");

    disName = document.querySelector("#disp-full-name");
    disEmail = document.querySelector("#disp-email-addr");
    disPhone = document.querySelector("#disp-phone-num");
    disCnic = document.querySelector("#disp-cnic-id");
    disCity = document.querySelector("#disp-user-city");
    disBio = document.querySelector("#disp-bio-text");

    if (editbtn && editform && displayform) {
        editbtn.addEventListener("click", function () {
            editform.style.display = 'block';
            displayform.style.display = 'none';
        });
    }

    if (btncancel && editform && displayform) {
        btncancel.addEventListener("click", (e) => {
            e.preventDefault();
            editform.style.display = 'none';
            displayform.style.display = 'block';
        });
    }
}

let getUser = async () => {
    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/me",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            }
        );

        const data = await response.json();
        if (!response.ok || !data.success || !data.user) {
            console.error("Fetch profile failed:", data.message);
            return;
        }

        const userData = data.user;
        localStorage.setItem("user", JSON.stringify(userData));

        if (userData.avatar) {
            updateAvatarImages(userData.avatar);
        }

        const rawBio = userData.bio || "";
        const cleanBio = (rawBio && !rawBio.includes("formname") && !rawBio.includes("data.user")) ? rawBio : "";

        if (heroName) heroName.textContent = userData.name || "Guest Member";
        if (heroEmail) heroEmail.textContent = userData.email || "";
        if (heroCity) heroCity.textContent = userData.city || "Pakistan";
        if (heroBio) heroBio.textContent = cleanBio || "Passionate travel explorer.";

        if (disName) disName.textContent = userData.name || "Not provided";
        if (disEmail) disEmail.textContent = userData.email || "Not provided";
        if (disPhone) disPhone.textContent = userData.phone || "Not provided";
        if (disCnic) disCnic.textContent = userData.cnic || "Not provided";
        if (disCity) disCity.textContent = userData.city || "Not provided";
        if (disBio) disBio.textContent = cleanBio || "Not provided";

        if (formname) formname.value = userData.name || "";
        if (phone) phone.value = userData.phone || "";
        if (cnic) cnic.value = userData.cnic || "";
        if (city) city.value = userData.city || "";
        if (bio) bio.value = cleanBio;

        // Fill Read-only email field in edit form
        const emailInput = document.querySelector("#email-addr");
        if (emailInput) emailInput.value = userData.email || "";

    } catch (error) {
        console.error("Error fetching profile:", error);
    } finally {
        if (typeof hideVeyraLoader === "function") hideVeyraLoader();
    }
};

let loadProfileStats = async () => {
    try {
        const [bookingsRes, wishlistRes] = await Promise.allSettled([
            fetch("http://localhost:5000/api/guest/bookings", { headers: { "Authorization": `Bearer ${token}` } }),
            fetch("http://localhost:5000/api/guest/wishlist", { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (bookingsRes.status === "fulfilled" && bookingsRes.value.ok) {
            const bData = await bookingsRes.value.json();
            if (bData.success && Array.isArray(bData.data)) {
                const completed = bData.data.filter(b => b.status === "Completed").length;
                const upcoming = bData.data.filter(b => b.status === "Confirmed" || b.status === "Pending").length;
                
                const compEl = document.querySelector("#stat-completed-stays");
                const upEl = document.querySelector("#stat-upcoming-stays");
                if (compEl) compEl.textContent = completed;
                if (upEl) upEl.textContent = upcoming;
            }
        }

        if (wishlistRes.status === "fulfilled" && wishlistRes.value.ok) {
            const wData = await wishlistRes.value.json();
            if (wData.success && Array.isArray(wData.data)) {
                const savedEl = document.querySelector("#stat-saved-places");
                if (savedEl) savedEl.textContent = wData.data.length;
            }
        }
    } catch (e) {
        console.error("loadProfileStats error:", e);
    }
};

let updateUser = async () => {
    try {
        const response = await fetch(
            "http://localhost:5000/api/guest/profile",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formname ? formname.value : "",
                    phone: phone ? phone.value : "",
                    cnic: cnic ? cnic.value : "",
                    city: city ? city.value : "",
                    bio: bio ? bio.value : ""
                })
            }
        );

        const data = await response.json();
        if (!response.ok || !data.success) {
            showVeyraToast(data.message || "Unable to update profile. Please try again.", "error");
            return false;
        }

        if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            if (data.user.avatar) updateAvatarImages(data.user.avatar);
        }

        showVeyraToast("Profile updated successfully", "success");
        return true;
    } catch (error) {
        console.error("Error updating profile:", error);
        showVeyraToast("Network error updating profile.", "error");
        return false;
    }
};

function compressAvatarFile(file) {
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

function initAvatarUploader() {
    const btnChangeAvatar = document.querySelector("#btn-change-avatar");
    const avatarFileInput = document.querySelector("#guest-avatar-file-input");

    if (btnChangeAvatar && avatarFileInput) {
        btnChangeAvatar.addEventListener("click", (e) => {
            e.preventDefault();
            avatarFileInput.click();
        });

        avatarFileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const base64Avatar = await compressAvatarFile(file);
                if (!base64Avatar) return;

                const response = await fetch("http://localhost:5000/api/guest/profile", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ avatar: base64Avatar })
                });

                const data = await response.json();
                if (data.success && data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    updateAvatarImages(data.user.avatar);
                    showVeyraToast("Profile picture updated", "success");
                }
            } catch (err) {
                console.error("Avatar update error:", err);
                showVeyraToast("Failed to update profile picture.", "error");
            }
            avatarFileInput.value = "";
        });
    }
}

function updateAvatarImages(avatarUrl) {
    if (!avatarUrl) return;
    document.querySelectorAll("#hero-avatar-img, #nav-avatar-img, .nav-avatar, .user-avatar, .profile-main-avatar").forEach(img => {
        img.src = avatarUrl;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initProfileDOMElements();
    initAvatarUploader();

    if (btnsave) {
        btnsave.addEventListener("click", async (e) => {
            e.preventDefault();
            const ok = await updateUser();
            if (ok) {
                await getUser();
                if (editform) editform.style.display = 'none';
                if (displayform) displayform.style.display = 'block';
            }
        });
    }

    getUser();
    loadProfileStats();
});