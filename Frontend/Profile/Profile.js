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
let savebtn = document.querySelector("#btn-save-edit");


const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "host") {
    window.location.href = "/Frontend/auth.html";
}

editbtn.addEventListener("click", function () {
    form.style.display = 'Block'
    profileDetails.style.display = 'none'
});
document.querySelector("#btn-cancel-edit").addEventListener("click", function () {
    form.style.display = 'none'
    profileDetails.style.display = 'Block'
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        let uptname = document.querySelector("#edit-full-name").value;
        let uptnum = document.querySelector("#edit-mobile-number").value;

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

        const data = await response.json()
        form.reset();
        form.style.display = 'none';
        profileDetails.style.display = 'Block';

        await USerProfile();

    } catch (error) {
        console.error;
    }

});


const USerProfile = async () => {

    try {
        let token = localStorage.getItem("token");
        if (!token) {
            showAlert("lg-alert", "Please login first", "error");
            window.location.href = "/Frontend/auth.html";
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

        document.querySelector("#edit-full-name").value = data.user.name || "" ;
        document.querySelector("#edit-email-address").value = data.user.email || "" ;
        document.querySelector("#edit-user-role").value = data.user.role || "" ;

    } catch (error) {
        console.error;
    }
}

USerProfile();

