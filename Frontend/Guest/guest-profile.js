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
    if (data && data.user) {
      if (guestName) {
        guestName.textContent = data.user.name;
        guestName.style.textTransform = 'capitalize';
      }
      if (guestEmail) {
        guestEmail.textContent = data.user.email;
      }

      const heroCity = document.querySelector("#hero-city-text");
      const heroBio = document.querySelector("#hero-user-bio");
      if (heroCity) heroCity.textContent = data.user.city || "Islamabad, Pakistan";
      if (heroBio) heroBio.textContent = data.user.bio || "No travel bio added yet.";

      const dispName = document.querySelector("#disp-full-name");
      const dispEmail = document.querySelector("#disp-email-addr");
      const dispPhone = document.querySelector("#disp-phone-num");
      const dispCnic = document.querySelector("#disp-cnic-id");
      const dispCity = document.querySelector("#disp-user-city");
      const dispBio = document.querySelector("#disp-bio-text");

      if (dispName) dispName.textContent = data.user.name || "Not provided";
      if (dispEmail) dispEmail.textContent = data.user.email || "Not provided";
      if (dispPhone) dispPhone.textContent = data.user.phone || "Not provided";
      if (dispCnic) dispCnic.textContent = data.user.cnic || "Not provided";
      if (dispCity) dispCity.textContent = data.user.city || "Not provided";
      if (dispBio) dispBio.textContent = data.user.bio || "No travel bio added yet.";
    }
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

      // Close personal edit form after save
      const personalDisplayView = document.getElementById("personal-display-view");
      const personalEditForm = document.getElementById("personal-edit-form");
      if (personalEditForm) personalEditForm.style.display = "none";
      if (personalDisplayView) personalDisplayView.style.display = "block";
    });

  } catch (error) {
    console.error(error);
  }
}

savebtn.addEventListener("click", async () => {
  await updateProfile();
})
getProfile();

// ── Form Toggle Event Listeners ──────────────────────────────────────────────

// Personal Information Toggle
const btnEditPersonal = document.getElementById("btn-edit-personal");
const btnCancelPersonal = document.getElementById("btn-cancel-personal");
const personalDisplayView = document.getElementById("personal-display-view");
const personalEditForm = document.getElementById("personal-edit-form");

if (btnEditPersonal && personalDisplayView && personalEditForm) {
  btnEditPersonal.addEventListener("click", () => {
    personalDisplayView.style.display = "none";
    personalEditForm.style.display = "flex";
  });
}

if (btnCancelPersonal && personalDisplayView && personalEditForm) {
  btnCancelPersonal.addEventListener("click", () => {
    personalEditForm.style.display = "none";
    personalDisplayView.style.display = "block";
  });
}

// Travel Preferences Toggle
const btnEditPreferences = document.getElementById("btn-edit-preferences");
const btnCancelPreferences = document.getElementById("btn-cancel-preferences");
const preferencesDisplayView = document.getElementById("preferences-display-view");
const preferencesEditForm = document.getElementById("preferences-edit-form");

if (btnEditPreferences && preferencesDisplayView && preferencesEditForm) {
  btnEditPreferences.addEventListener("click", () => {
    preferencesDisplayView.style.display = "none";
    preferencesEditForm.style.display = "flex";
  });
}

if (btnCancelPreferences && preferencesDisplayView && preferencesEditForm) {
  btnCancelPreferences.addEventListener("click", () => {
    preferencesEditForm.style.display = "none";
    preferencesDisplayView.style.display = "block";
  });
}

// Security Password Toggle
const btnEditSecurity = document.getElementById("btn-edit-security");
const btnCancelSecurity = document.getElementById("btn-cancel-security");
const securityDisplayView = document.getElementById("security-display-view");
const securityEditForm = document.getElementById("security-edit-form");

if (btnEditSecurity && securityDisplayView && securityEditForm) {
  btnEditSecurity.addEventListener("click", () => {
    securityDisplayView.style.display = "none";
    securityEditForm.style.display = "flex";
  });
}

if (btnCancelSecurity && securityDisplayView && securityEditForm) {
  btnCancelSecurity.addEventListener("click", () => {
    securityEditForm.style.display = "none";
    securityDisplayView.style.display = "block";
  });
}