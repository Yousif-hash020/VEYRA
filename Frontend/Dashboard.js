document.addEventListener('DOMContentLoaded', () => {
    // Modal Elements
    const modalCreate = document.getElementById('modal-create');
    const modalView = document.getElementById('modal-view');
    const modalUpdate = document.getElementById('modal-update');
    const modalDelete = document.getElementById('modal-delete');

    // Forms
    const createForm = document.getElementById('form-create-listing');
    const updateForm = document.getElementById('form-update-listing');
    const table = document.querySelector('.listings-table');


    let activeRow = null;

    function openModal(modal) {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }


    document.querySelectorAll('.btn-trigger-create, a[href="#modal-create"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(modalCreate);
        });
    });

    document.addEventListener('click', (e) => {
        if (
            e.target.classList.contains('modal-overlay') ||
            e.target.closest('.modal-close') ||
            e.target.closest('.btn-close-modal')
        ) {
            document.querySelectorAll('.modal-overlay.active').forEach(closeModal);
        }
    });

});

const form = document.querySelector("#form-create-listing");

const name = document.querySelector("#name");
const propertyType = document.querySelector("#propertyType");
const status = document.querySelector("#status");
const locationinp = document.querySelector("#location");
const pricePerNight = document.querySelector("#pricePerNight");
const guests = document.querySelector("#guests");
const bedrooms = document.querySelector("#bedrooms");
const beds = document.querySelector("#beds");
const bathrooms = document.querySelector("#bathrooms");
const image = document.querySelector("#image");
const amenities = document.querySelector("#amenities");
const description = document.querySelector("#description");


let Stats = async () => {
    try {

        let total = document.querySelector("#total-listings");
        let ava = document.querySelector("#Available");
        let booked = document.querySelector("#Booked");
        let unava = document.querySelector("#Unavailable");

        const response = await fetch("http://localhost:5000/api/rooms");

        const data = await response.json();

        const avail = data.data.filter(function (listing) {
            return listing.status === "Available";
        }).length;

        const unavailable = data.data.filter(function (listing) {
            return listing.status === "Unavailable";
        }).length;

        const bookedCount = data.data.filter(function (listing) {
            return listing.status === "Booked";
        }).length;

        total.textContent = data.data.length;
        ava.textContent = avail;
        booked.textContent = bookedCount;
        unava.textContent = unavailable;

    } catch (error) {
        console.error(error);
    }
};

let upDate = async (id, updatedData) => {
    try {
        const response = await fetch(`http://localhost:5000/api/rooms/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedData)
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("field to update data :", data);
            return
        }
        console.log("update succeesul");

        await Stats();
    } catch (error) {
        console.error(error)
    }
}
let getItem = async () => {
    try {
        const response = await fetch("http://localhost:5000/api/rooms", {
            method: "GET"
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Api Error : ", errorData);
            return
        }

        const data = await response.json();
        const tbody = document.querySelector(".listings-table tbody");
        if (tbody) {
            tbody.innerHTML = "";
        }
        data.data.forEach((listing) => {

            const tr = document.createElement("tr");

            const propertyTd = document.createElement("td");

            const propertyCell = document.createElement("div");
            propertyCell.className = "property-cell";

            const img = document.createElement("img");
            img.src = listing.image;
            img.alt = listing.name;
            img.className = "property-thumb";

            const propertyDetails = document.createElement("div");
            propertyDetails.className = "property-details";

            const propertyTitle = document.createElement("span");
            propertyTitle.className = "property-title";
            propertyTitle.textContent = listing.name;

            const propertyMeta = document.createElement("span");
            propertyMeta.className = "property-meta";
            propertyMeta.textContent = `ID #${listing._id.slice(-6).toUpperCase()}`;

            propertyDetails.appendChild(propertyTitle);
            propertyDetails.appendChild(propertyMeta);

            propertyCell.appendChild(img);
            propertyCell.appendChild(propertyDetails);

            propertyTd.appendChild(propertyCell);


            // Type
            const typeTd = document.createElement("td");

            const typePill = document.createElement("span");
            typePill.className = "type-pill";
            typePill.textContent = listing.propertyType;

            typeTd.appendChild(typePill);


            // Location
            const locationTd = document.createElement("td");

            const locationText = document.createElement("span");
            locationText.className = "location-text";
            locationText.textContent = listing.location;

            locationTd.appendChild(locationText);


            // Price
            const priceTd = document.createElement("td");

            const priceText = document.createElement("span");
            priceText.className = "price-text";
            priceText.textContent = `$${listing.pricePerNight}`;

            priceTd.appendChild(priceText);


            // Guests
            const guestsTd = document.createElement("td");
            guestsTd.textContent = `${listing.guests} Guests`;


            // Bedrooms
            const bedroomsTd = document.createElement("td");
            bedroomsTd.textContent = `${listing.bedrooms} Beds`;


            // Status
            const statusTd = document.createElement("td");

            const statusBadge = document.createElement("span");

            if (listing.status === "Available") {
                statusBadge.className = "badge badge-active";
            } else if (listing.status === "Booked") {
                statusBadge.className = "badge badge-pending";
            } else {
                statusBadge.className = "badge badge-inactive";
            }

            statusBadge.textContent = listing.status;

            statusTd.appendChild(statusBadge);


            // Actions
            const actionsTd = document.createElement("td");
            actionsTd.className = "text-right";

            const rowActions = document.createElement("div");
            rowActions.className = "row-actions";


            // View
            const viewBtn = document.createElement("a");
            viewBtn.href = "#modal-view";
            viewBtn.className = "action-btn action-view";
            viewBtn.dataset.tooltip = "View Property";

            const viewSvg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

            viewSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            viewSvg.setAttribute("viewBox", "0 0 24 24");
            viewSvg.setAttribute("fill", "none");
            viewSvg.setAttribute("stroke", "currentColor");
            viewSvg.setAttribute("stroke-width", "2");
            viewSvg.setAttribute("stroke-linecap", "round");
            viewSvg.setAttribute("stroke-linejoin", "round");

            const viewPath = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );

            viewPath.setAttribute(
                "d",
                "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            );

            const viewCircle = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            );

            viewCircle.setAttribute("cx", "12");
            viewCircle.setAttribute("cy", "12");
            viewCircle.setAttribute("r", "3");

            viewSvg.appendChild(viewPath);
            viewSvg.appendChild(viewCircle);

            viewBtn.appendChild(viewSvg);

            viewBtn.addEventListener("click", async(e)=>{
                e.preventDefault();
                window.location.href = "details.html"

            })


            // Update
            const updateBtn = document.createElement("a");
            updateBtn.href = "#";
            updateBtn.className = "action-btn action-edit";
            updateBtn.dataset.tooltip = "Update Property";

            const updateSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            updateSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            updateSvg.setAttribute("viewBox", "0 0 24 24");
            updateSvg.setAttribute("fill", "none");
            updateSvg.setAttribute("stroke", "currentColor");
            updateSvg.setAttribute("stroke-width", "2");
            updateSvg.setAttribute("stroke-linecap", "round");
            updateSvg.setAttribute("stroke-linejoin", "round");

            const updatePath1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            updatePath1.setAttribute("d", "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7");
            const updatePath2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
            updatePath2.setAttribute("d", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z");
            updateSvg.appendChild(updatePath1);
            updateSvg.appendChild(updatePath2);
            updateBtn.appendChild(updateSvg);

            updateBtn.addEventListener("click", (e) => {
                e.preventDefault();
                // Pre-fill all update form fields
                document.getElementById("update-id").value = listing._id;
                document.getElementById("update-name").value = listing.name || "";
                document.getElementById("update-propertyType").value = listing.propertyType || "Apartment";
                document.getElementById("update-status").value = listing.status || "Available";
                document.getElementById("update-location").value = listing.location || "";
                document.getElementById("update-pricePerNight").value = listing.pricePerNight || "";
                document.getElementById("update-guests").value = listing.guests || "";
                document.getElementById("update-bedrooms").value = listing.bedrooms || "";
                document.getElementById("update-beds").value = listing.beds || "";
                document.getElementById("update-bathrooms").value = listing.bathrooms || "";
                document.getElementById("update-image").value = listing.image || "";
                // amenities is stored as array — join back to comma-separated string
                document.getElementById("update-amenities").value = Array.isArray(listing.amenities)
                    ? listing.amenities.join(", ")
                    : (listing.amenities || "");
                document.getElementById("update-description").value = listing.description || "";

                // Open the update modal
                const modalUpdate = document.getElementById("modal-update");
                if (modalUpdate) {
                    modalUpdate.classList.add("active");
                    document.body.style.overflow = "hidden";
                }
            });


            // Delete
            const deleteBtn = document.createElement("a");
            deleteBtn.href = "#modal-delete";
            deleteBtn.className = "action-btn action-delete";
            deleteBtn.dataset.tooltip = "Delete Property";

            const deleteSvg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

            deleteSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            deleteSvg.setAttribute("viewBox", "0 0 24 24");
            deleteSvg.setAttribute("fill", "none");
            deleteSvg.setAttribute("stroke", "currentColor");
            deleteSvg.setAttribute("stroke-width", "2");
            deleteSvg.setAttribute("stroke-linecap", "round");
            deleteSvg.setAttribute("stroke-linejoin", "round");

            const deletePolyline = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "polyline"
            );

            deletePolyline.setAttribute("points", "3 6 5 6 21 6");

            const deletePath = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );

            deletePath.setAttribute(
                "d",
                "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            );

            const deleteLine1 = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

            deleteLine1.setAttribute("x1", "10");
            deleteLine1.setAttribute("y1", "11");
            deleteLine1.setAttribute("x2", "10");
            deleteLine1.setAttribute("y2", "17");

            const deleteLine2 = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

            deleteLine2.setAttribute("x1", "14");
            deleteLine2.setAttribute("y1", "11");
            deleteLine2.setAttribute("x2", "14");
            deleteLine2.setAttribute("y2", "17");

            deleteSvg.appendChild(deletePolyline);
            deleteSvg.appendChild(deletePath);
            deleteSvg.appendChild(deleteLine1);
            deleteSvg.appendChild(deleteLine2);

            deleteBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                await Delete(listing._id);
            });

            deleteBtn.appendChild(deleteSvg);


            rowActions.appendChild(viewBtn);
            rowActions.appendChild(updateBtn);
            rowActions.appendChild(deleteBtn);

            actionsTd.appendChild(rowActions);


            // Final row
            tr.appendChild(propertyTd);
            tr.appendChild(typeTd);
            tr.appendChild(locationTd);
            tr.appendChild(priceTd);
            tr.appendChild(guestsTd);
            tr.appendChild(bedroomsTd);
            tr.appendChild(statusTd);
            tr.appendChild(actionsTd);

            tbody.appendChild(tr);
        });

        await Stats();

    } catch (error) {
        console.error("Network / server request failed:", error);
    }


}

let Delete = async (id) => {
    try {
        const response = await fetch(`http://localhost:5000/api/rooms/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Delete Error:", errorData);
            return;
        }

        const data = await response.json();
        console.log("Room deleted:", data);
        await getItem();
        await Stats();
    } catch (error) {
        console.error("Delete request failed:", error);
    }

}


form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const listing = {
        name: name.value,
        propertyType: propertyType.value,
        status: status.value,
        location: locationinp.value,
        pricePerNight: Number(pricePerNight.value),
        guests: Number(guests.value),
        bedrooms: Number(bedrooms.value),
        beds: Number(beds.value),
        bathrooms: Number(bathrooms.value),
        image: image.value,
        amenities: amenities.value,
        description: description.value
    };

    try {
        const response = await fetch("http://localhost:5000/api/rooms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(listing)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            return;
        }

        const data = await response.json();

        const modalCreate = document.getElementById('modal-create');
        if (modalCreate) {
            modalCreate.classList.remove('active');
            document.body.style.overflow = '';
        }
        await getItem();
        form.reset();
    } catch (error) {
        console.error("Network / server request failed:", error);
    }

});


const updateForm = document.getElementById("form-update-listing");
if (updateForm) {
    updateForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("update-id").value;
        if (!id) return;

        const updatedData = {
            name: document.getElementById("update-name").value,
            propertyType: document.getElementById("update-propertyType").value,
            status: document.getElementById("update-status").value,
            location: document.getElementById("update-location").value,
            pricePerNight: Number(document.getElementById("update-pricePerNight").value),
            guests: Number(document.getElementById("update-guests").value),
            bedrooms: Number(document.getElementById("update-bedrooms").value),
            beds: Number(document.getElementById("update-beds").value),
            bathrooms: Number(document.getElementById("update-bathrooms").value),
            image: document.getElementById("update-image").value,
            amenities: document.getElementById("update-amenities").value,
            description: document.getElementById("update-description").value,
        };

        await upDate(id, updatedData);

        const modalUpdate = document.getElementById("modal-update");
        if (modalUpdate) {
            modalUpdate.classList.remove("active");
            document.body.style.overflow = "";
        }
        await getItem();
        await Stats();
    });
}

Stats();
getItem();
