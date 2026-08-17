let token = localStorage.getItem("token");
let user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "host") {
    window.location.href = "/Frontend/auth.html";
}

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
const amenities = document.querySelector("#amenities");
const description = document.querySelector("#description");

let createListingImages = [];
let updateListingImages = [];

function renderImagesPreview(containerId, counterId, imagesArray, onRemove) {
    const container = document.getElementById(containerId);
    const counter = document.getElementById(counterId);
    if (!container || !counter) return;

    counter.textContent = `${imagesArray.length} / 15 pictures loaded (Min 5 required)`;
    if (imagesArray.length < 5) {
        counter.style.color = "#e11d48";
    } else if (imagesArray.length > 15) {
        counter.style.color = "#e11d48";
        counter.textContent += " — Exceeds max 15 limit!";
    } else {
        counter.style.color = "#0D5C4E";
    }

    container.innerHTML = "";
    imagesArray.forEach((imgSrc, idx) => {
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.width = "75px";
        wrapper.style.height = "75px";
        wrapper.style.borderRadius = "8px";
        wrapper.style.overflow = "hidden";
        wrapper.style.border = idx === 0 ? "2px solid #0D5C4E" : "1px solid #cbd5e1";

        const img = document.createElement("img");
        img.src = imgSrc;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";

        if (idx === 0) {
            const badge = document.createElement("span");
            badge.textContent = "Cover";
            badge.style.position = "absolute";
            badge.style.bottom = "0";
            badge.style.left = "0";
            badge.style.right = "0";
            badge.style.background = "rgba(13, 92, 78, 0.9)";
            badge.style.color = "#fff";
            badge.style.fontSize = "10px";
            badge.style.fontWeight = "bold";
            badge.style.textAlign = "center";
            badge.style.padding = "2px 0";
            wrapper.appendChild(badge);
        }

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.innerHTML = "&times;";
        delBtn.style.position = "absolute";
        delBtn.style.top = "2px";
        delBtn.style.right = "2px";
        delBtn.style.background = "rgba(225, 29, 72, 0.9)";
        delBtn.style.color = "#fff";
        delBtn.style.border = "none";
        delBtn.style.borderRadius = "50%";
        delBtn.style.width = "20px";
        delBtn.style.height = "20px";
        delBtn.style.cursor = "pointer";
        delBtn.style.fontSize = "13px";
        delBtn.style.lineHeight = "18px";

        delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            imagesArray.splice(idx, 1);
            onRemove();
        });

        wrapper.appendChild(img);
        wrapper.appendChild(delBtn);
        container.appendChild(wrapper);
    });
}

function compressImageFile(file, maxWidth = 1200, maxHeight = 900, quality = 0.75) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
                resolve(compressedDataUrl);
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
    });
}

async function handleFilesSelected(files, targetArray, counterId, containerId, onComplete) {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    for (const file of fileList) {
        if (targetArray.length >= 15) break;
        try {
            const compressed = await compressImageFile(file, 1200, 900, 0.75);
            if (compressed) targetArray.push(compressed);
        } catch (err) {
            console.error("Image processing error:", err);
        }
    }
    onComplete();
}

document.addEventListener("DOMContentLoaded", () => {
    const createFileInput = document.getElementById("create-images-input");
    if (createFileInput) {
        createFileInput.addEventListener("change", (e) => {
            handleFilesSelected(e.target.files, createListingImages, "create-images-counter", "create-images-preview", () => {
                renderImagesPreview("create-images-preview", "create-images-counter", createListingImages, () => { });
            });
            createFileInput.value = "";
        });
    }

    const updateFileInput = document.getElementById("update-images-input");
    if (updateFileInput) {
        updateFileInput.addEventListener("change", (e) => {
            handleFilesSelected(e.target.files, updateListingImages, "update-images-counter", "update-images-preview", () => {
                renderImagesPreview("update-images-preview", "update-images-counter", updateListingImages, () => { });
            });
            updateFileInput.value = "";
        });
    }
});

let view = async (id) => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`http://localhost:5000/api/rooms/${id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch listing");
        }

        return data;

    } catch (error) {
        throw error;
    }
};

function updateStatsFromListings(listingsData) {
    let total = document.querySelector("#total-listings");
    let ava = document.querySelector("#Available");
    let booked = document.querySelector("#Booked");
    let unava = document.querySelector("#Unavailable");

    if (!total || !ava || !booked || !unava || !Array.isArray(listingsData)) return;

    let availCount = 0;
    let bookedCount = 0;
    let unavailCount = 0;

    listingsData.forEach(listing => {
        if (listing.status === "Available") availCount++;
        else if (listing.status === "Booked") bookedCount++;
        else if (listing.status === "Unavailable") unavailCount++;
    });

    total.textContent = listingsData.length;
    ava.textContent = availCount;
    booked.textContent = bookedCount;
    unava.textContent = unavailCount;
}



let upDate = async (id, updatedData) => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `http://localhost:5000/api/rooms/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            }
        );

        const data = await response.json();
        if (!response.ok) {
            console.error("Failed to update property:", data);
            return;
        }
    } catch (error) {
        console.error("upDate error:", error);
    }
};

let getItem = async () => {
    try {

        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/Frontend/auth.html";
            return;
        }

        const response = await fetch(
            "http://localhost:5000/api/host/properties",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            return;
        }

        const data = await response.json();
        const listings = data.data || [];
        updateStatsFromListings(listings);

        const tbody = document.querySelector(".listings-table tbody");
        if (tbody) {
            tbody.innerHTML = "";
        }
        listings.forEach((listing) => {

            const tr = document.createElement("tr");

            const propertyTd = document.createElement("td");

            const propertyCell = document.createElement("div");
            propertyCell.className = "property-cell";

            const img = document.createElement("img");
            img.src = (listing.images && listing.images.length > 0) ? listing.images[0] : listing.image;
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
            priceText.textContent = `PKR ${Number(listing.pricePerNight || 0).toLocaleString()}`;

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

            viewBtn.addEventListener("click", async (e) => {
                e.preventDefault();

                try {

                    // Modal
                    const modalView = document.getElementById("modal-view");

                    if (!modalView) {
                        throw new Error("View modal not found");
                    }

                    // Open modal
                    modalView.classList.add("active");
                    document.body.style.overflow = "hidden";


                    // Get listing by ID
                    const result = await view(listing._id);

                    const room = result.data;




                    // Status
                    document.querySelector("#badge").textContent =
                        `${room.status} Listing`;

                    // Image & Gallery
                    const mainCover = (room.images && room.images.length > 0) ? room.images[0] : room.image;
                    document.querySelector(".view-hero-image").src = mainCover;

                    const galleryContainer = document.querySelector("#view-gallery");
                    if (galleryContainer) {
                        galleryContainer.innerHTML = "";
                        const photoList = (room.images && room.images.length > 0) ? room.images : (room.image ? [room.image] : []);
                        photoList.forEach(imgUrl => {
                            const gImg = document.createElement("img");
                            gImg.src = imgUrl;
                            gImg.style.width = "85px";
                            gImg.style.height = "65px";
                            gImg.style.borderRadius = "6px";
                            gImg.style.objectFit = "cover";
                            gImg.style.border = "1px solid #e2e8f0";
                            galleryContainer.appendChild(gImg);
                        });
                    }


                    // Property type
                    document.querySelector(".view-property-type").textContent =
                        room.propertyType;


                    // Property name
                    document.querySelector(".view-title").textContent =
                        room.name;


                    // Location
                    document.querySelector(".view-location-text").textContent =
                        room.location;


                    // Price
                    document.querySelector(".view-price-amount").textContent =
                        `PKR ${Number(room.pricePerNight || 0).toLocaleString()}`;


                    // Guests
                    document.querySelector("#Guests").textContent =
                        `${room.guests} Guests`;


                    // Beds
                    document.querySelector("#Beds").textContent =
                        `${room.beds} Beds`;


                    // Bedrooms
                    document.querySelector(".bedrooms").textContent =
                        `${room.bedrooms} Bedrooms`;


                    // Bathrooms
                    document.querySelector(".bathrooms").textContent =
                        `${room.bathrooms} Bathrooms`;


                    // Description
                    document.querySelector("#view-description").textContent =
                        room.description;

                    // Amenities
                    const amenitiesContainer =
                        document.querySelector("#view-amenities");

                    amenitiesContainer.innerHTML = "";

                    room.amenities.forEach(function (amenity) {

                        const div = document.createElement("div");

                        div.className = "spec-pill";

                        div.textContent = amenity;

                        amenitiesContainer.appendChild(div);

                    });

                } catch (error) {

                    console.error("Failed to load listing:", error);

                }
            });


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

                updateListingImages = (Array.isArray(listing.images) && listing.images.length > 0)
                    ? [...listing.images]
                    : (listing.image ? Array(5).fill(listing.image) : []);

                renderImagesPreview("update-images-preview", "update-images-counter", updateListingImages, () => {
                    renderImagesPreview("update-images-preview", "update-images-counter", updateListingImages, () => { });
                });
                // amenities is stored as array — join back to comma-separated string
                document.getElementById("update-amenities").value = Array.isArray(listing.amenities)
                    ? listing.amenities.join(", ")
                    : (listing.amenities || "");
                document.getElementById("update-description").value = listing.description || "";
                document.getElementById("update-availableFrom").value = listing.availableFrom ? new Date(listing.availableFrom).toISOString().split('T')[0] : "";
                document.getElementById("update-availableTo").value = listing.availableTo ? new Date(listing.availableTo).toISOString().split('T')[0] : "";

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

    } catch (error) {
        console.error("Network / server request failed:", error);
    } finally {
        if (typeof hideVeyraLoader === "function") hideVeyraLoader();
    }
};


let Delete = async (id) => {
    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            `http://localhost:5000/api/rooms/${id}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Delete Error:", errorData);
            return;
        }

        await response.json();

        await getItem();

    } catch (error) {
        console.error("Delete request failed:", error);
    }
};

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const availFromVal = document.getElementById("availableFrom") ? document.getElementById("availableFrom").value : "";
    const availToVal = document.getElementById("availableTo") ? document.getElementById("availableTo").value : "";

    if (createListingImages.length < 5 || createListingImages.length > 15) {
        alert(`Please select between 5 and 15 property pictures from your device. Currently loaded: ${createListingImages.length}`);
        return;
    }

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
        images: createListingImages,
        image: createListingImages[0],
        amenities: amenities.value,
        description: description.value,
        ...(availFromVal && { availableFrom: availFromVal }),
        ...(availToVal && { availableTo: availToVal })
    };

    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            "http://localhost:5000/api/rooms",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify(listing)
            }
        );

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
        createListingImages = [];
        renderImagesPreview("create-images-preview", "create-images-counter", createListingImages, () => { });
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

        const upAvailFromVal = document.getElementById("update-availableFrom") ? document.getElementById("update-availableFrom").value : "";
        const upAvailToVal = document.getElementById("update-availableTo") ? document.getElementById("update-availableTo").value : "";

        if (updateListingImages.length < 5 || updateListingImages.length > 15) {
            alert(`Please select between 5 and 15 property pictures. Currently loaded: ${updateListingImages.length}`);
            return;
        }

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
            images: updateListingImages,
            image: updateListingImages[0],
            amenities: document.getElementById("update-amenities").value,
            description: document.getElementById("update-description").value,
            availableFrom: upAvailFromVal || null,
            availableTo: upAvailToVal || null,
        };

        await upDate(id, updatedData);

        const modalUpdate = document.getElementById("modal-update");
        if (modalUpdate) {
            modalUpdate.classList.remove("active");
            document.body.style.overflow = "";
        }
        await getItem();
    });
};


const getUser = async () => {
    let userName = document.querySelector('.user-name');
    let userRole = document.querySelector('.user-role');

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:5000/api/auth/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success && data.user) {
            if (userName) {
                userName.textContent = data.user.name;
                userName.style.textTransform = 'capitalize';
            }
            if (userRole) {
                userRole.textContent = data.user.role;
                userRole.style.textTransform = 'capitalize';
            }
            if (data.user.avatar) {
                document.querySelectorAll('.user-avatar, #user-avatar-img, .profile-avatar-topbar').forEach(img => {
                    img.src = data.user.avatar;
                });
            }
            localStorage.setItem("user", JSON.stringify(data.user));
        }
    } catch (e) {
        console.error("getUser error:", e);
    }
}

getUser();
getItem();

