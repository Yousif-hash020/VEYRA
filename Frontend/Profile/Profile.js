let nav_name = document.querySelector(".user-name");
let nav_role = document.querySelector(".user-role");
let main_role = document.querySelector("#display-badge-role");
let main_name = document.querySelector("#display-user-name");
let main_email = document.querySelector("#display-user-email");
let infoName = document.querySelector("#info-full-name");
let infoEmail = document.querySelector("#info-email-address");
let infoRole = document.querySelector("#info-user-role");
let editbtn = document.querySelector("#btn-edit-profile");
let form = document.querySelector("#profile-edit-form");
let profileDetails = document.querySelector("#profile-display-mode");

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "host") {
    window.location.href = "/Frontend/auth.html";
}

if (editbtn) {
    editbtn.addEventListener("click", function () {
        form.style.display = 'Block';
        profileDetails.style.display = 'none';
    });
}

const cancelBtn = document.querySelector("#btn-cancel-edit");
if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
        form.style.display = 'none';
        profileDetails.style.display = 'Block';
    });
}

const photoBtns = [document.querySelector("#btn-change-photo"), document.querySelector("#btn-camera-photo")];
photoBtns.forEach(btn => {
    if (btn) {
        btn.addEventListener("click", () => {
            const avatarInput = document.querySelector("#edit-avatar-url");
            const currentUrl = avatarInput ? avatarInput.value : "";
            const newUrl = prompt("Enter Profile Picture Image URL:", currentUrl || "");
            if (newUrl !== null && newUrl.trim() !== "") {
                const cleanUrl = newUrl.trim();
                if (avatarInput) avatarInput.value = cleanUrl;
                
                const displayImg = document.querySelector("#display-avatar-img");
                if (displayImg) displayImg.src = cleanUrl;
                const topbarImg = document.querySelector(".profile-avatar-topbar");
                if (topbarImg) topbarImg.src = cleanUrl;

                const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                localStorage.setItem("user", JSON.stringify({ ...storedUser, avatar: cleanUrl }));
            }
        });
    }
});

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            let uptname = document.querySelector("#edit-full-name") ? document.querySelector("#edit-full-name").value : "";
            let uptnum = document.querySelector("#edit-mobile-number") ? document.querySelector("#edit-mobile-number").value : "";
            let uptcity = document.querySelector("#edit-city") ? document.querySelector("#edit-city").value : "";
            let uptavatar = document.querySelector("#edit-avatar-url") ? document.querySelector("#edit-avatar-url").value : "";
            let uptbio = document.querySelector("#edit-bio") ? document.querySelector("#edit-bio").value : "";

            const response = await fetch("http://localhost:5000/api/auth/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: uptname
                })
            });

            const data = await response.json();
            
            // Persist full profile updates locally
            const updatedUser = {
                ...(data.user || user),
                phone: uptnum,
                city: uptcity,
                avatar: uptavatar,
                bio: uptbio
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            form.style.display = 'none';
            profileDetails.style.display = 'Block';

            await USerProfile();

        } catch (error) {
            console.error(error);
        }
    });
}

const USerProfile = async () => {
    try {
        let token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/Frontend/auth.html";
            return;
        }
        const response = await fetch("http://localhost:5000/api/auth/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json();
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const currentUser = { ...data.user, ...storedUser };

        if (nav_name) {
            nav_name.textContent = currentUser.name;
            nav_name.style.textTransform = "capitalize";
        }
        if (main_name) {
            main_name.textContent = currentUser.name;
            main_name.style.textTransform = "capitalize";
        }
        if (infoName) {
            infoName.textContent = currentUser.name;
            infoName.style.textTransform = "capitalize";
        }
        if (nav_role) {
            nav_role.textContent = currentUser.role;
            nav_role.style.textTransform = "capitalize";
        }
        if (main_role) {
            main_role.textContent = currentUser.role;
            main_role.style.textTransform = "capitalize";
        }
        if (infoRole) {
            infoRole.textContent = currentUser.role;
            infoRole.style.textTransform = "capitalize";
        }
        if (main_email) main_email.textContent = currentUser.email;
        if (infoEmail) infoEmail.textContent = currentUser.email;

        const accTypeValue = document.querySelector("#account-type-value");
        if (accTypeValue) {
            accTypeValue.textContent = currentUser.role;
            accTypeValue.style.textTransform = 'capitalize';
        }

        // Clean fallback checker helper
        const hasVal = (v) => v && typeof v === 'string' && v.trim() !== '' && v !== 'undefined' && v !== 'null';

        const mobileEl = document.querySelector("#info-mobile-number");
        if (mobileEl) mobileEl.textContent = hasVal(currentUser.phone) ? currentUser.phone.trim() : (hasVal(currentUser.mobile) ? currentUser.mobile.trim() : "Not provided");

        const cityEl = document.querySelector("#info-user-city");
        if (cityEl) cityEl.textContent = hasVal(currentUser.city) ? currentUser.city.trim() : "Not provided";

        const headerCityEl = document.querySelector("#header-user-city");
        if (headerCityEl) headerCityEl.textContent = hasVal(currentUser.city) ? currentUser.city.trim() : "Not provided";

        const bioEl = document.querySelector("#info-user-bio");
        if (bioEl) bioEl.textContent = hasVal(currentUser.bio) ? currentUser.bio.trim() : "Not provided";

        const headerBioEl = document.querySelector("#header-user-bio");
        if (headerBioEl) headerBioEl.textContent = hasVal(currentUser.bio) ? currentUser.bio.trim() : "Not provided";

        const avatarUrlEl = document.querySelector("#info-avatar-url");
        if (avatarUrlEl) avatarUrlEl.textContent = hasVal(currentUser.avatar) ? currentUser.avatar.trim() : "";

        if (hasVal(currentUser.avatar)) {
            const displayImg = document.querySelector("#display-avatar-img");
            if (displayImg) displayImg.src = currentUser.avatar.trim();
            const topbarImg = document.querySelector(".profile-avatar-topbar");
            if (topbarImg) topbarImg.src = currentUser.avatar.trim();
        }

        // Pre-populate Edit Form
        if (document.querySelector("#edit-full-name")) document.querySelector("#edit-full-name").value = currentUser.name || "";
        if (document.querySelector("#edit-email-address")) document.querySelector("#edit-email-address").value = currentUser.email || "";
        if (document.querySelector("#edit-user-role")) document.querySelector("#edit-user-role").value = currentUser.role || "";
        if (document.querySelector("#edit-mobile-number")) document.querySelector("#edit-mobile-number").value = currentUser.phone || currentUser.mobile || "";
        if (document.querySelector("#edit-city")) document.querySelector("#edit-city").value = currentUser.city || "";
        if (document.querySelector("#edit-avatar-url")) document.querySelector("#edit-avatar-url").value = currentUser.avatar || "";
        if (document.querySelector("#edit-bio")) document.querySelector("#edit-bio").value = currentUser.bio || "";

    } catch (error) {
        console.error(error);
    }
};

USerProfile();

