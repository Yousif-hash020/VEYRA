let editbtn = document.querySelector("#btn-edit-personal");
let editform = document.querySelector("#personal-edit-form");
let displayform = document.querySelector("#personal-display-view");
let btncancel = document.querySelector("#btn-cancel-personal");
let btnsave = document.querySelector("#btn-save-personal");
let formname = document.querySelector("#first-name");
let bio = document.querySelector("#bio-text");
let phone = document.querySelector("#phone-num");
let city = document.querySelector("#user-city");
let cnic = document.querySelector("#cnic-id");

let heroName = document.querySelector("#hero-user-name");
let heroEmail = document.querySelector("#hero-user-email");
let heroCity = document.querySelector("#hero-city-text");
let heroBio = document.querySelector("#hero-user-bio");

let disName = document.querySelector("#disp-full-name");
let disEmail = document.querySelector("#disp-email-addr");
let disPhone = document.querySelector("#disp-phone-num");
let disCnic = document.querySelector("#disp-cnic-id");
let disCity = document.querySelector("#disp-user-city");
let disBio = document.querySelector("#disp-bio-text");


editbtn.addEventListener("click", function () {
    editform.style.display = 'block';
    displayform.style.display = 'none'
});

btncancel.addEventListener("click", (e) => {
    e.preventDefault();
    editform.style.display = 'none';
    displayform.style.display = 'block'
})

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
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

        console.log(data);

        if (!response.ok) {
            console.error("Update failed:", data.message);
            return;
        }

        if (response.ok) {
            if (heroName && heroEmail && heroCity &&heroBio ) {

                heroName.textContent = data.user.name;
                heroEmail.textContent = data.user.email;
                heroCity.textContent = data.user.city;
                heroBio.textContent = data.user.bio
            };

            if(disName && disEmail && disPhone && disCnic && disCity && disBio){
                disName.textContent = data.user.name;
                disEmail.textContent = data.user.email;
                disPhone.textContent = data.user.phone;
                disCnic.textContent = data.user.cnic;
                disCity.textContent = data.user.city;
                disBio.textContent = data.user.bio;
            }
        }

    } catch (error) {
        console.error("Error updating profile:", error);
    }
}



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

        console.log(data);

        if (!response.ok) {
            console.error("Update failed:", data.message);
            return;
        }

    } catch (error) {
        console.error("Error updating profile:", error);
    }
};


btnsave.addEventListener("click", async (e) => {
    e.preventDefault();
    await updateUser();
    await getUser()
    editform.style.display = 'none'
    displayform.style.display = 'block'
});

getUser();