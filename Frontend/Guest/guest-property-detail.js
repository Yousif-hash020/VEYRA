const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
}

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let propertyData = null;
let availabilityData = [];
let hostAvailableFrom = null;
let hostAvailableTo = null;

// Helper: Format date as YYYY-MM-DD
function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getAmenityIconSVG(amenityName) {
    if (!amenityName) return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    const lower = amenityName.toLowerCase();
    if (lower.includes("wifi") || lower.includes("internet")) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`;
    }
    if (lower.includes("pool") || lower.includes("swim")) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20c2 0 3-1 5-1s3 1 5 1 3-1 5-1 3 1 5 1"/><path d="M2 14c2 0 3-1 5-1s3 1 5 1 3-1 5-1 3 1 5 1"/><path d="M16 4v6"/><path d="M8 4v6"/></svg>`;
    }
    if (lower.includes("park") || lower.includes("garage")) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>`;
    }
    if (lower.includes("kitchen")) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`;
    }
    if (lower.includes("fire") || lower.includes("fireplace") || lower.includes("heating")) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
    }
    if (lower.includes("view") || lower.includes("mountain") || lower.includes("scenic")) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`;
    }
    if (lower.includes("ac") || lower.includes("air") || lower.includes("climate")) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m4.93 19.07 14.14-14.14"/></svg>`;
    }
    if (lower.includes("bbq") || lower.includes("grill")) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="M8 3v3"/><path d="M16 3v3"/><rect x="3" y="10" width="18" height="6" rx="2"/><path d="M6 16v6"/><path d="M18 16v6"/></svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
}

let getDetails = async (id) => {
    try {
        if (!id) {
            console.error("No property ID provided in URL");
            return;
        }

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
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load property details");
        }

        propertyData = data.data;

        // Helper for safe DOM text assignment
        const setText = (selector, val) => {
            const el = document.querySelector(selector);
            if (el && val !== undefined && val !== null) el.textContent = val;
        };

        // Populate Header & Breadcrumb Details safely
        setText(".property-title", propertyData.name);
        setText(".rating", propertyData.rating);
        setText(".meta-location", propertyData.location);
        setText(".description-text", propertyData.description);
        setText(".side-rating", propertyData.rating);
        setText(".guest-rating", `${propertyData.rating} ·`);
        setText(".rating-score-num", propertyData.rating);
        
        const rCount = propertyData.reviewCount || 0;
        setText(".guest-reviews-count", `${rCount} ${rCount === 1 ? 'Guest Review' : 'Guest Reviews'}`);
        setText(".rating-total-label", `${rCount} ${rCount === 1 ? 'rating' : 'ratings'}`);
        setText(".meta-review-count", `(${rCount} ${rCount === 1 ? 'verified review' : 'verified reviews'})`);
        
        const hostNameText = propertyData.owner ? propertyData.owner.name : "Host";
        setText(".host-name", `Hosted by ${hostNameText}`);
        
        if (propertyData.owner && propertyData.owner.avatar) {
            const hostAvatarImg = document.querySelector(".host-avatar");
            if (hostAvatarImg) hostAvatarImg.src = propertyData.owner.avatar;
        }

        // Host Superhost / Verified Badge
        const isSuper = propertyData.owner && (propertyData.owner.isSuperhost || propertyData.owner.role === 'host');
        const superhostSpan = document.querySelector(".meta-superhost");
        if (superhostSpan) {
            superhostSpan.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                ${isSuper ? 'Superhost' : 'Verified Host'}
            `;
        }

        const hostPill = document.querySelector(".host-badge-pill");
        if (hostPill) {
            hostPill.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                ${isSuper ? 'Verified Superhost' : 'Verified Host'}
            `;
        }

        // Breadcrumbs Dynamic Update
        const breadcrumbCurrent = document.querySelector(".breadcrumb-current");
        const breadcrumbItems = document.querySelectorAll(".breadcrumb-item");
        if (breadcrumbItems && breadcrumbItems.length > 1) {
            breadcrumbItems[1].textContent = `${propertyData.location} Stays`;
            breadcrumbItems[1].href = `guest-dashboard.html?location=${encodeURIComponent(propertyData.location)}`;
        }
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = propertyData.name;

        // Load Current Guest Navbar Avatar
        const loadUserNavAvatar = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const meData = await res.json();
                if (meData.success && meData.user && meData.user.avatar) {
                    document.querySelectorAll(".nav-avatar, #nav-avatar-img").forEach(img => {
                        img.src = meData.user.avatar;
                    });
                }
            } catch (e) {}
        };
        loadUserNavAvatar();

        const guestsVal = propertyData.guests || 2;
        const bedsVal = propertyData.beds || propertyData.bedrooms || 1;
        const bathVal = propertyData.bathrooms || 1;
        const bedroomsVal = propertyData.bedrooms || 1;
        const priceVal = (propertyData.pricePerNight || 0).toLocaleString();

        setText("#guest", `${guestsVal} Guests`);
        setText("#beds", `${bedsVal} Beds`);
        setText("#bath", `${bathVal} Baths`);
        setText("#bedrooms", `${bedroomsVal} Bedrooms`);
        setText(".price-amount", `PKR ${priceVal}`);
        setText(".side-rating-count", `(${rCount})`);

        // Render Property Photo Gallery Grid
        const galleryGrid = document.querySelector("#galleryGrid");
        if (galleryGrid) {
            const photos = (Array.isArray(propertyData.images) && propertyData.images.length > 0)
                ? propertyData.images
                : (propertyData.image ? [propertyData.image] : []);
            
            if (photos.length > 0) {
                galleryGrid.innerHTML = "";
                photos.slice(0, 5).forEach((pic, idx) => {
                    const itemDiv = document.createElement("div");
                    itemDiv.className = idx === 0 ? "gallery-item main-photo" : "gallery-item";
                    itemDiv.innerHTML = `<img src="${pic}" alt="${propertyData.name} photo ${idx + 1}" class="gallery-img">`;
                    galleryGrid.appendChild(itemDiv);
                });

                if (photos.length > 1) {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "gallery-overlay-btn";
                    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> View All ${photos.length} Photos`;
                    galleryGrid.appendChild(btn);
                }
            }
        }

        // Data-Driven Amenities Grid with Custom Icons
        const amenitiesGrid = document.querySelector(".amenities-grid");
        if (amenitiesGrid) {
            amenitiesGrid.innerHTML = "";
            if (Array.isArray(propertyData.amenities) && propertyData.amenities.length > 0) {
                propertyData.amenities.forEach(item => {
                    const iconSVG = getAmenityIconSVG(item);
                    const card = document.createElement('div');
                    card.className = "amenity-card";
                    card.style.display = "flex";
                    card.style.alignItems = "center";
                    card.style.gap = "10px";
                    card.style.padding = "12px 16px";
                    card.style.background = "#ffffff";
                    card.style.border = "1px solid #e2e8f0";
                    card.style.borderRadius = "12px";
                    card.style.fontSize = "13.5px";
                    card.style.fontWeight = "600";
                    card.style.color = "#1e293b";

                    card.innerHTML = `<span style="color:#0D5C4E; display:flex;">${iconSVG}</span><span>${item}</span>`;
                    amenitiesGrid.appendChild(card);
                });
            } else {
                amenitiesGrid.innerHTML = `<p style="color:#64748b; font-size:14px;">No listed amenities available for this property.</p>`;
            }
        }

        // Aspect Rating Averages Calculation
        const avgScore = propertyData.rating || 4.8;
        const cleanliness = avgScore;
        const accuracy = Math.min(5.0, Number((avgScore + 0.1).toFixed(1)));
        const communication = avgScore;
        const locationScore = Math.min(5.0, Number((avgScore + 0.1).toFixed(1)));
        const valueScore = Number(Math.max(4.0, (avgScore - 0.1)).toFixed(1));

        const aspectGrid = document.querySelector(".rating-aspects-grid");
        if (aspectGrid) {
            aspectGrid.innerHTML = `
                <div class="aspect-row">
                  <span class="aspect-name">Cleanliness</span>
                  <div class="aspect-val-wrap">
                    <div class="aspect-bar"><div class="aspect-fill" style="width: ${(cleanliness / 5) * 100}%;"></div></div>
                    <span class="aspect-num">${cleanliness}</span>
                  </div>
                </div>
                <div class="aspect-row">
                  <span class="aspect-name">Accuracy</span>
                  <div class="aspect-val-wrap">
                    <div class="aspect-bar"><div class="aspect-fill" style="width: ${(accuracy / 5) * 100}%;"></div></div>
                    <span class="aspect-num">${accuracy}</span>
                  </div>
                </div>
                <div class="aspect-row">
                  <span class="aspect-name">Communication</span>
                  <div class="aspect-val-wrap">
                    <div class="aspect-bar"><div class="aspect-fill" style="width: ${(communication / 5) * 100}%;"></div></div>
                    <span class="aspect-num">${communication}</span>
                  </div>
                </div>
                <div class="aspect-row">
                  <span class="aspect-name">Location</span>
                  <div class="aspect-val-wrap">
                    <div class="aspect-bar"><div class="aspect-fill" style="width: ${(locationScore / 5) * 100}%;"></div></div>
                    <span class="aspect-num">${locationScore}</span>
                  </div>
                </div>
                <div class="aspect-row">
                  <span class="aspect-name">Value</span>
                  <div class="aspect-val-wrap">
                    <div class="aspect-bar"><div class="aspect-fill" style="width: ${(valueScore / 5) * 100}%;"></div></div>
                    <span class="aspect-num">${valueScore}</span>
                  </div>
                </div>
            `;
        }

        // Data-Driven Reviews List
        const reviewsContainer = document.querySelector(".reviews-grid");
        if (reviewsContainer) {
            reviewsContainer.innerHTML = "";
            if (propertyData.reviews && propertyData.reviews.length > 0) {
                propertyData.reviews.forEach(review => {
                    const reviewCard = document.createElement("div");
                    reviewCard.className = "review-card";

                    const date = new Date(review.createdAt);
                    const dateStr = `${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })} · Verified Stay`;
                    const guestName = (review.guest && review.guest.name) ? review.guest.name : "Verified Guest";
                    const guestAvatar = (review.guest && review.guest.avatar) ? review.guest.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";

                    reviewCard.innerHTML = `
                        <div class="review-card-head">
                            <div class="reviewer-profile">
                                <img src="${guestAvatar}" alt="${guestName}" class="reviewer-avatar">
                                <div class="reviewer-meta">
                                    <span class="reviewer-name">${guestName}</span>
                                    <span class="reviewer-date">${dateStr}</span>
                                </div>
                            </div>
                            <div style="color:#D4B860; font-size:13px; font-weight:700; display:flex; align-items:center; gap:2px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#D4B860" stroke="#D4B860" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                ${review.rating || 5}
                            </div>
                        </div>
                        <p class="review-body-text">${review.comment}</p>
                    `;
                    reviewsContainer.appendChild(reviewCard);
                });
            } else {
                reviewsContainer.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1; margin-top: 16px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin-bottom: 8px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <h4 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">No reviews yet</h4>
                        <p style="color: #64748b; font-size: 14px;">Be the first guest to share your experience staying at this retreat.</p>
                    </div>
                `;
            }
        }

        // Fetch Availability Schedule & Setup Listeners
        await fetchAvailability(id);
        initDateInputs();

        // Initialize Wishlist Button State
        initDetailWishlist(id);

    } catch (error) {
        console.error("getDetails Error:", error);
    }
};

function showVeyraToast(message, type = "success") {
    let toastContainer = document.getElementById("veyra-toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "veyra-toast-container";
        toastContainer.style.cssText = "position:fixed; bottom:28px; right:28px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none;";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = "veyra-toast-item";
    toast.style.cssText = "display:flex; align-items:center; gap:10px; padding:12px 20px; background:#0F172A; color:#ffffff; border-radius:12px; font-size:13.5px; font-weight:600; box-shadow:0 10px 30px rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.1); opacity:0; transform:translateY(12px); transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1); pointer-events:auto;";

    const iconSvg = type === "remove"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#0D5C4E" stroke="#0D5C4E" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

    toast.innerHTML = `<span style="display:flex;align-items:center;">${iconSvg}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(12px)";
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

async function initDetailWishlist(propertyId) {
    const wishBtn = document.getElementById("btn-header-wishlist");
    const labelSpan = document.getElementById("wishlist-btn-label");
    if (!wishBtn) return;

    let isSaved = false;

    try {
        const res = await fetch("http://localhost:5000/api/guest/wishlist", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
            isSaved = data.data.some(item => (item._id || item).toString() === propertyId.toString());
        }
    } catch (e) {
        console.error("Wishlist check error:", e);
    }

    const updateUI = () => {
        const svg = wishBtn.querySelector("svg");
        if (isSaved) {
            wishBtn.classList.add("saved", "active");
            if (labelSpan) labelSpan.textContent = "Saved";
            if (svg) {
                svg.setAttribute("fill", "#0D5C4E");
                svg.setAttribute("stroke", "#0D5C4E");
            }
        } else {
            wishBtn.classList.remove("saved", "active");
            if (labelSpan) labelSpan.textContent = "Save";
            if (svg) {
                svg.setAttribute("fill", "none");
                svg.setAttribute("stroke", "currentColor");
            }
        }
    };

    updateUI();

    wishBtn.onclick = async (e) => {
        e.preventDefault();
        isSaved = !isSaved;
        updateUI();

        if (isSaved) {
            showVeyraToast("Property saved to your wishlist", "success");
        } else {
            showVeyraToast("Property removed from wishlist", "remove");
        }

        const method = isSaved ? "POST" : "DELETE";
        try {
            const res = await fetch(`http://localhost:5000/api/guest/wishlist/${propertyId}`, {
                method,
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) {
                isSaved = !isSaved;
                updateUI();
            }
        } catch (err) {
            console.error("Wishlist toggle error:", err);
            isSaved = !isSaved;
            updateUI();
        }
    };
}

let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth(); // 0-indexed
let selectedCheckIn = null;
let selectedCheckOut = null;

let fetchAvailability = async (roomId) => {
    try {
        const response = await fetch(`http://localhost:5000/api/rooms/${roomId}/availability`, {
            method: "GET"
        });
        const resData = await response.json();
        if (resData.success && resData.data) {
            availabilityData = resData.data.bookedDates || [];
            hostAvailableFrom = resData.data.availableFrom ? new Date(resData.data.availableFrom) : null;
            hostAvailableTo = resData.data.availableTo ? new Date(resData.data.availableTo) : null;

            initCalendarNav();
            renderCalendar(availabilityData, hostAvailableFrom, hostAvailableTo);
        }
    } catch (err) {
        console.error("fetchAvailability Error:", err);
    }
};

function initCalendarNav() {
    const prevBtn = document.querySelector(".cal-btn[aria-label='Previous month']");
    const nextBtn = document.querySelector(".cal-btn[aria-label='Next month']");

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            const today = new Date();
            const minYear = today.getFullYear();
            const minMonth = today.getMonth();

            if (currentCalYear < minYear || (currentCalYear === minYear && currentCalMonth <= minMonth)) {
                return;
            }

            currentCalMonth--;
            if (currentCalMonth < 0) {
                currentCalMonth = 11;
                currentCalYear--;
            }
            renderCalendar(availabilityData, hostAvailableFrom, hostAvailableTo);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            currentCalMonth++;
            if (currentCalMonth > 11) {
                currentCalMonth = 0;
                currentCalYear++;
            }
            renderCalendar(availabilityData, hostAvailableFrom, hostAvailableTo);
        });
    }
}

function renderCalendar(bookedDates, availFrom, availTo) {
    const monthTitle = document.querySelector(".cal-month-title");
    const calGrid = document.querySelector(".cal-grid");

    if (!monthTitle || !calGrid) return;

    const viewDate = new Date(currentCalYear, currentCalMonth, 1);
    monthTitle.textContent = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    // Header day names
    calGrid.innerHTML = `
        <div class="cal-day-name">Su</div>
        <div class="cal-day-name">Mo</div>
        <div class="cal-day-name">Tu</div>
        <div class="cal-day-name">We</div>
        <div class="cal-day-name">Th</div>
        <div class="cal-day-name">Fr</div>
        <div class="cal-day-name">Sa</div>
    `;

    const firstDay = new Date(currentCalYear, currentCalMonth, 1).getDay();
    const daysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();

    // Empty lead cells
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "cal-date empty";
        calGrid.appendChild(emptyDiv);
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const aFromMidnight = availFrom ? new Date(availFrom.getFullYear(), availFrom.getMonth(), availFrom.getDate()) : null;
    const aToMidnight = availTo ? new Date(availTo.getFullYear(), availTo.getMonth(), availTo.getDate()) : null;

    const selInTime = selectedCheckIn ? new Date(selectedCheckIn.getFullYear(), selectedCheckIn.getMonth(), selectedCheckIn.getDate()).getTime() : null;
    const selOutTime = selectedCheckOut ? new Date(selectedCheckOut.getFullYear(), selectedCheckOut.getMonth(), selectedCheckOut.getDate()).getTime() : null;

    // Build days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(currentCalYear, currentCalMonth, day);
        dayDate.setHours(0, 0, 0, 0);
        const dateTime = dayDate.getTime();

        const dateDiv = document.createElement("div");
        dateDiv.textContent = day;

        // Check host availability period
        let isHostAvailable = true;
        if (aFromMidnight && dayDate < aFromMidnight) isHostAvailable = false;
        if (aToMidnight && dayDate > aToMidnight) isHostAvailable = false;

        // Check if date is booked by another guest: checkIn <= dayDate < checkOut
        const isBooked = bookedDates.some(b => {
            const bIn = new Date(b.checkIn);
            const bOut = new Date(b.checkOut);
            bIn.setHours(0,0,0,0);
            bOut.setHours(0,0,0,0);
            return dayDate >= bIn && dayDate < bOut;
        });

        const isPast = dayDate < todayMidnight;

        if (isPast || !isHostAvailable) {
            dateDiv.className = "cal-date booked";
            dateDiv.style.opacity = "0.4";
            dateDiv.style.cursor = "not-allowed";
            dateDiv.title = !isHostAvailable ? "Outside Host Availability Period" : "Past Date";
        } else if (isBooked) {
            dateDiv.className = "cal-date booked";
            dateDiv.title = "Booked by another guest";
        } else {
            const isSelIn = selInTime && dateTime === selInTime;
            const isSelOut = selOutTime && dateTime === selOutTime;
            const isInRange = selInTime && selOutTime && dateTime > selInTime && dateTime < selOutTime;

            if (isSelIn || isSelOut) {
                dateDiv.className = "cal-date selected";
                dateDiv.title = isSelIn ? "Check-in Date" : "Check-out Date";
            } else if (isInRange) {
                dateDiv.className = "cal-date in-range";
                dateDiv.title = "Stay Duration";
            } else {
                dateDiv.className = "cal-date available";
                dateDiv.title = "Click to select Check-in / Check-out";
            }

            dateDiv.addEventListener("click", () => {
                const checkInInput = document.getElementById("booking-checkin");
                const checkOutInput = document.getElementById("booking-checkout");

                if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
                    selectedCheckIn = new Date(dayDate);
                    selectedCheckOut = null;
                    if (checkInInput) checkInInput.value = formatDateISO(selectedCheckIn);
                    if (checkOutInput) checkOutInput.value = "";
                } else if (selectedCheckIn && !selectedCheckOut) {
                    if (dateTime > selectedCheckIn.getTime()) {
                        const hasConflictInBetween = bookedDates.some(b => {
                            const bIn = new Date(b.checkIn);
                            const bOut = new Date(b.checkOut);
                            bIn.setHours(0,0,0,0);
                            bOut.setHours(0,0,0,0);
                            return bIn < dayDate && bOut > selectedCheckIn;
                        });

                        if (hasConflictInBetween) {
                            selectedCheckIn = new Date(dayDate);
                            selectedCheckOut = null;
                            if (checkInInput) checkInInput.value = formatDateISO(selectedCheckIn);
                            if (checkOutInput) checkOutInput.value = "";
                        } else {
                            selectedCheckOut = new Date(dayDate);
                            if (checkOutInput) checkOutInput.value = formatDateISO(selectedCheckOut);
                        }
                    } else {
                        selectedCheckIn = new Date(dayDate);
                        selectedCheckOut = null;
                        if (checkInInput) checkInInput.value = formatDateISO(selectedCheckIn);
                        if (checkOutInput) checkOutInput.value = "";
                    }
                }

                renderCalendar(availabilityData, hostAvailableFrom, hostAvailableTo);
                updatePriceAndAvailability();
            });
        }

        calGrid.appendChild(dateDiv);
    }
}

function initDateInputs() {
    const checkInInput = document.getElementById("booking-checkin");
    const checkOutInput = document.getElementById("booking-checkout");
    const guestsSelect = document.getElementById("booking-guests");

    if (!checkInInput || !checkOutInput) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startMinDate = today;
    if (hostAvailableFrom && hostAvailableFrom > today) {
        startMinDate = hostAvailableFrom;
    }

    const defaultCheckIn = new Date(startMinDate);
    const defaultCheckOut = new Date(defaultCheckIn.getTime() + (2 * 86400000));

    selectedCheckIn = defaultCheckIn;
    selectedCheckOut = defaultCheckOut;

    checkInInput.min = formatDateISO(startMinDate);
    checkInInput.value = formatDateISO(defaultCheckIn);

    if (hostAvailableTo) {
        checkInInput.max = formatDateISO(hostAvailableTo);
        checkOutInput.max = formatDateISO(hostAvailableTo);
    }

    checkOutInput.min = formatDateISO(new Date(defaultCheckIn.getTime() + 86400000));
    checkOutInput.value = formatDateISO(defaultCheckOut);

    checkInInput.addEventListener("change", () => {
        const cIn = new Date(checkInInput.value);
        if (!isNaN(cIn.getTime())) {
            selectedCheckIn = cIn;
            const minCO = new Date(cIn.getTime() + 86400000);
            checkOutInput.min = formatDateISO(minCO);
            if (!checkOutInput.value || new Date(checkOutInput.value) <= cIn) {
                checkOutInput.value = formatDateISO(minCO);
                selectedCheckOut = minCO;
            } else {
                selectedCheckOut = new Date(checkOutInput.value);
            }
        } else {
            selectedCheckIn = null;
        }
        renderCalendar(availabilityData, hostAvailableFrom, hostAvailableTo);
        updatePriceAndAvailability();
    });

    checkOutInput.addEventListener("change", () => {
        const cOut = new Date(checkOutInput.value);
        if (!isNaN(cOut.getTime())) {
            selectedCheckOut = cOut;
        } else {
            selectedCheckOut = null;
        }
        renderCalendar(availabilityData, hostAvailableFrom, hostAvailableTo);
        updatePriceAndAvailability();
    });
    if (guestsSelect) guestsSelect.addEventListener("change", updatePriceAndAvailability);

    renderCalendar(availabilityData, hostAvailableFrom, hostAvailableTo);
    updatePriceAndAvailability();

    // Reserve Button Action
    const reserveBtn = document.getElementById("reserve-now-btn");
    if (reserveBtn) {
        reserveBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const valid = updatePriceAndAvailability();
            if (!valid) return;

            const checkInVal = checkInInput.value;
            const checkOutVal = checkOutInput.value;
            const guestsVal = guestsSelect ? guestsSelect.value : 1;

            window.location.href = `guest-booking.html?id=${id}&checkIn=${checkInVal}&checkOut=${checkOutVal}&guests=${guestsVal}`;
        });
    }
}

function updatePriceAndAvailability() {
    const checkInInput = document.getElementById("booking-checkin");
    const checkOutInput = document.getElementById("booking-checkout");
    const guestsSelect = document.getElementById("booking-guests");
    const warningDiv = document.getElementById("availability-warning");
    const reserveBtn = document.getElementById("reserve-now-btn");

    if (!checkInInput || !checkOutInput || !propertyData) return false;

    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        showWarning("Please select valid check-in and check-out dates.");
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cInMidnight = new Date(checkInDate);
    cInMidnight.setHours(0, 0, 0, 0);

    if (cInMidnight < today) {
        showWarning("Check-in date cannot be in the past.");
        return false;
    }

    if (checkOutDate <= checkInDate) {
        showWarning("Check-out date must be strictly after check-in date.");
        return false;
    }

    // Host Availability Period Check
    if (hostAvailableFrom) {
        const hFromMid = new Date(hostAvailableFrom.getFullYear(), hostAvailableFrom.getMonth(), hostAvailableFrom.getDate());
        if (cInMidnight < hFromMid) {
            showWarning(`Property is only available starting from ${hFromMid.toISOString().split('T')[0]}.`);
            return false;
        }
    }

    if (hostAvailableTo) {
        const hToMid = new Date(hostAvailableTo.getFullYear(), hostAvailableTo.getMonth(), hostAvailableTo.getDate());
        const cOutMid = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
        if (cOutMid > hToMid) {
            showWarning(`Property is only available up to ${hToMid.toISOString().split('T')[0]}.`);
            return false;
        }
    }

    // Overlap Check against availabilityData (guest confirmed bookings)
    const hasOverlap = availabilityData.some(b => {
        const bIn = new Date(b.checkIn);
        const bOut = new Date(b.checkOut);
        return bIn < checkOutDate && bOut > checkInDate;
    });

    if (hasOverlap) {
        showWarning("⚠️ The selected dates overlap with an existing booking. Please pick available dates.");
        return false;
    }

    if (propertyData.status !== "Available") {
        showWarning(`Property is currently ${propertyData.status} and cannot be booked.`);
        return false;
    }

    const guestCount = guestsSelect ? Number(guestsSelect.value) : 1;
    if (guestCount > propertyData.guests) {
        showWarning(`Maximum property capacity is ${propertyData.guests} guests.`);
        return false;
    }

    // Dates & inputs are valid! Hide warning
    if (warningDiv) warningDiv.style.display = "none";
    if (reserveBtn) {
        reserveBtn.style.opacity = "1";
        reserveBtn.style.pointerEvents = "auto";
    }

    // Calculate nights & pricing
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(diffTime / (1000 * 3600 * 24));

    const pricePerNight = propertyData.pricePerNight;
    const nightlyTotal = nights * pricePerNight;
    const cleaningFee = 3500;
    const serviceFee = 4200;
    const totalPrice = nightlyTotal + cleaningFee + serviceFee;

    // Update Price Breakdown List in DOM
    const breakdownList = document.querySelector(".price-breakdown-list");
    if (breakdownList) {
        breakdownList.innerHTML = `
            <div class="breakdown-row">
              <span>PKR ${pricePerNight.toLocaleString()} × ${nights} night${nights > 1 ? 's' : ''}</span>
              <span>PKR ${nightlyTotal.toLocaleString()}</span>
            </div>
            <div class="breakdown-row">
              <span>Cleaning & Preparation fee</span>
              <span>PKR 3,500</span>
            </div>
            <div class="breakdown-row">
              <span>VEYRA Service fee</span>
              <span>PKR 4,200</span>
            </div>
            <div class="breakdown-row total-row">
              <span>Total Stay Price</span>
              <span>PKR ${totalPrice.toLocaleString()}</span>
            </div>
        `;
    }

    return true;
}

function showWarning(msg) {
    const warningDiv = document.getElementById("availability-warning");
    const reserveBtn = document.getElementById("reserve-now-btn");
    if (warningDiv) {
        warningDiv.textContent = msg;
        warningDiv.style.display = "block";
    }
    if (reserveBtn) {
        reserveBtn.style.opacity = "0.5";
    }
}

// Header Wishlist Button Logic
async function initHeaderWishlist(roomId) {
    const wishBtn = document.getElementById("btn-header-wishlist");
    const labelSpan = document.getElementById("wishlist-btn-label");
    if (!wishBtn || !roomId) return;

    let isSaved = false;
    try {
        const res = await fetch("http://localhost:5000/api/guest/wishlist", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
            isSaved = data.data.some(item => (item._id || item).toString() === roomId.toString());
        }
    } catch (e) {}

    if (isSaved) {
        wishBtn.classList.add("saved");
        if (labelSpan) labelSpan.textContent = "Saved";
        const svg = wishBtn.querySelector("svg");
        if (svg) svg.setAttribute("fill", "currentColor");
    }

    wishBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const currentlySaved = wishBtn.classList.contains("saved");
        const method = currentlySaved ? "DELETE" : "POST";

        if (currentlySaved) {
            wishBtn.classList.remove("saved");
            if (labelSpan) labelSpan.textContent = "Save";
            const svg = wishBtn.querySelector("svg");
            if (svg) svg.setAttribute("fill", "none");
        } else {
            wishBtn.classList.add("saved");
            if (labelSpan) labelSpan.textContent = "Saved";
            const svg = wishBtn.querySelector("svg");
            if (svg) svg.setAttribute("fill", "currentColor");
        }

        try {
            await fetch(`http://localhost:5000/api/guest/wishlist/${roomId}`, {
                method,
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Wishlist toggle error:", err);
        }
    });
}

// Review Modal & Add Review Logic
function initReviewModal(roomId) {
    const openBtn = document.getElementById("btn-open-review-modal");
    const closeBtn = document.getElementById("close-review-modal");
    const cancelBtn = document.getElementById("btn-cancel-review");
    const modal = document.getElementById("modal-add-review");
    const form = document.getElementById("form-add-review");
    const ratingInput = document.getElementById("review-rating-input");
    const commentInput = document.getElementById("review-comment-input");
    const alertDiv = document.getElementById("review-alert");
    const starBtns = document.querySelectorAll(".star-pick-btn");

    if (!modal) return;

    function openModal() {
        modal.style.display = "flex";
        if (alertDiv) alertDiv.style.display = "none";
        if (commentInput) commentInput.value = "";
        setStarRating(5);
    }

    function closeModal() {
        modal.style.display = "none";
    }

    function setStarRating(val) {
        if (ratingInput) ratingInput.value = val;
        starBtns.forEach((btn, idx) => {
            if (idx < val) {
                btn.style.color = "#D4B860";
            } else {
                btn.style.color = "#cbd5e1";
            }
        });
    }

    starBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const val = Number(btn.getAttribute("data-val"));
            setStarRating(val);
        });
    });

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const rating = Number(ratingInput.value);
            const comment = commentInput.value.trim();

            if (!comment) {
                if (alertDiv) {
                    alertDiv.textContent = "Please write a review comment.";
                    alertDiv.style.display = "block";
                }
                return;
            }

            try {
                const res = await fetch("http://localhost:5000/api/guest/reviews", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        roomId: roomId,
                        rating: rating,
                        comment: comment
                    })
                });

                const resData = await res.json();
                if (!res.ok || !resData.success) {
                    if (alertDiv) {
                        alertDiv.textContent = resData.message || "Failed to submit review.";
                        alertDiv.style.display = "block";
                    }
                    return;
                }

                closeModal();
                // Dynamically refresh property details & reviews list
                await getDetails(roomId);
            } catch (err) {
                console.error("Review submission error:", err);
                if (alertDiv) {
                    alertDiv.textContent = "Network error submitting review.";
                    alertDiv.style.display = "block";
                }
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initHeaderWishlist(id);
    initReviewModal(id);
});

getDetails(id);
