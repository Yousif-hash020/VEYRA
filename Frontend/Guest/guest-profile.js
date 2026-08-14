let guestName = document.querySelector(".user-name-title");
let guestEmail = document.querySelector(".user-email-subtitle");
let form = document.querySelector(".form-grid-2");
let formName = document.querySelector("#first-name");
let phone = document.querySelector("#phone-num");
let cnic = document.querySelector("#cnic-id");
let city = document.querySelector("#user-city");
let bio = document.querySelector("#bio-text");
let savebtn = document.querySelector(".save-btn");


const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
}


let getProfile = async () => {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/auth/me ",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();
        if (guestName) {
            guestName.textContent = data.user.name;
            guestName.style.textTransform = 'capitalize';
        }
        if (guestEmail) {
            guestEmail.textContent = data.user.email;
        };
    } catch (error) {
        console.error(error)
    }
};

let updateProfile = async () => {
    try {

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const response = await fetch("http://localhost:5000/api/guest/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formName.value,
                    phone: phone.value,
                    cnic: cnic.value,
                    city: city.value,
                    bio: bio.value
                })

            });
            const data = await response.json();
            console.log(data);
            await getProfile();
            form.reset();
        });



    } catch (error) {
        console.error(error);
    }
}

savebtn.addEventListener("click", async () => {
    await updateProfile();
})
getProfile();