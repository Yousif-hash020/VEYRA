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
        main_name.textContent = data.user.name;
        infoName.textContent = data.user.name;
        nav_role.textContent = data.user.role;
        main_role.textContent = data.user.role;
        infoRole.textContent = data.user.role;
        document.querySelector("#account-type-value").textContent = data.user.role
        main_email.textContent = data.user.email;
        infoEmail.textContent = data.user.email;

    } catch (error) {
        console.error;
    }
}

USerProfile();