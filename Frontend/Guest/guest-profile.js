const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
}

let editbtn, editform, displayform, btncancel, btnsave, formname, bio, phone, city, cnic;
let heroName, heroEmail, heroCity, heroBio;
let disName, disEmail, disPhone, disCnic, disCity, disBio;

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
        if (!response.ok) {
            console.error("Fetch profile failed:", data.message);
            return;
        }

        if (data.success && data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));

            if (data.user.avatar) {
                updateAvatarImages(data.user.avatar);
            }

            if (heroName) heroName.textContent = data.user.name;
            if (heroEmail) heroEmail.textContent = data.user.email;
            if (heroCity) heroCity.textContent = data.user.city || "Pakistan";
            if (heroBio) heroBio.textContent = data.user.bio || "Guest Member";

            if (disName) disName.textContent = data.user.name;
            if (disEmail) disEmail.textContent = data.user.email;
            if (disPhone) disPhone.textContent = data.user.phone || "Not provided";
            if (disCnic) disCnic.textContent = data.user.cnic || "Not provided";
            if (disCity) disCity.textContent = data.user.city || "Not provided";
            if (disBio) disBio.textContent = data.user.bio || "Not provided";

            if (formname) formname.value = data.user.name || "";
            if (phone) phone.value = data.user.phone || "";
            if (cnic) cnic.value = data.user.cnic || "";
            if (city) city.value = data.user.city || "";
            if (bio) bio.value = data.user.bio || "";
        }

    } catch (error) {
        console.error("Error fetching profile:", error);
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
                    name: formname.value,
                    phone: phone.value,
                    cnic: cnic.value,
                    city: city.value,
                    bio: bio.value
                })
            }
        );

        const data = await response.json();
        if (!response.ok) {
            console.error("Update failed:", data.message);
            return;
        }

        if (data.success && data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            if (data.user.avatar) updateAvatarImages(data.user.avatar);
        }

    } catch (error) {
        console.error("Error updating profile:", error);
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
                }
            } catch (err) {
                console.error("Avatar update error:", err);
            }
            avatarFileInput.value = "";
        });
    }
}

function updateAvatarImages(avatarUrl) {
    if (!avatarUrl) return;
    document.querySelectorAll("#hero-avatar-img, #nav-avatar-img, .nav-avatar, .user-avatar").forEach(img => {
        img.src = avatarUrl;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initProfileDOMElements();
    initAvatarUploader();

    if (btnsave) {
        btnsave.addEventListener("click", async (e) => {
            e.preventDefault();
            await updateUser();
            await getUser();
            if (editform) editform.style.display = 'none';
            if (displayform) displayform.style.display = 'block';
        });
    }

    getUser();
});