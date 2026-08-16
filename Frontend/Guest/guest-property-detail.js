

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
}

const params = new URLSearchParams(window.location.search);

const id = params.get("id");

let getDetails = async (id) => {
    try {
        const response = await fetch(
            `http://localhost:5000/api/guest/properties/${id}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log(data);

        document.querySelector(".property-title").textContent = data.data.name;
        document.querySelector(".rating").textContent = data.data.rating;
        document.querySelector(".meta-location").textContent = data.data.location;
        document.querySelector(".description-text").textContent = data.data.description;
        document.querySelector(".meta-review-count").textContent = `(${data.data.reviewCount}   verified reviews)`;
        document.querySelector(".host-name").textContent = `Hosted by ${data.data.owner.name}`;
        document.querySelector("#guest").textContent = `${data.data.guests} Guests`;
        document.querySelector("#beds").textContent = `${data.data.beds} Beds`;
        document.querySelector("#bath").textContent = `${data.data.bedrooms} Baths`;
        document.querySelector("#bedrooms").textContent = `${data.data.bathrooms} Bedrooms`;

          data.data.amenities.forEach(element => {
            const amenitiescard = document.createElement('div');
            amenitiescard.classList.add("amenity-card");
            amenitiescard.textContent = element;

            document.querySelector(".amenities-grid").appendChild(amenitiescard);
        });


      
    } catch (error) {
        console.error(error, "Error");
    }
};


console.log("Property ID:", id);

getDetails(id);

