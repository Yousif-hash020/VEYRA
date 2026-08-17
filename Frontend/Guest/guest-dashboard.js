requireGuestSession();
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

// ── Central State Management ──────────────────────────────────────────────
const searchState = {
    destination: "",
    checkIn: "",
    checkOut: "",
    guests: "",
    propertyType: "",
    price: "",
    bedrooms: "",
    amenity: "",
    rating: "",
    sortBy: "recommended"
};

let savedWishlistIds = new Set();
let isDynamicOptionsPopulated = false;

const cardTypes = [
    "card-tall",
    "card-medium",
    "card-compact"
];

let isWishlistLoaded = false;
const fetchWishlist = async () => {
    if (isWishlistLoaded) return;
    try {
        const response = await guestFetch(`http://localhost:5000/api/guest/wishlist`, {
            method: "GET"
        });
        if (!response) return;
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
            savedWishlistIds = new Set(
                data.data.filter((item) => item && item._id).map((item) => item._id.toString())
            );
            isWishlistLoaded = true;
        }
    } catch (err) {
        console.error("Wishlist fetch error:", err);
    }
};

// ── Veyra Toast Notification ────────────────────────────────────────────────
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

// ── Custom Dropdown System Engine ──────────────────────────────────────────
function closeAllDropdowns() {
    document.querySelectorAll(".custom-dropdown-menu").forEach(menu => menu.classList.remove("open"));
    document.querySelectorAll(".dropdown-trigger-btn, .search-select-btn").forEach(btn => {
        btn.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".custom-dropdown").forEach(wrap => wrap.classList.remove("open"));
    document.querySelectorAll(".discovery-head, .discovery-meta, .discovery-section").forEach(el => el.classList.remove("has-open-dropdown"));
}

function initCustomDropdowns() {
    const dropdownWraps = document.querySelectorAll(".custom-dropdown");

    dropdownWraps.forEach(wrap => {
        const btn = wrap.querySelector(".dropdown-trigger-btn, .search-select-btn");
        const menu = wrap.querySelector(".custom-dropdown-menu");

        if (btn && menu) {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = menu.classList.contains("open");
                closeAllDropdowns();
                if (!isOpen) {
                    menu.classList.add("open");
                    btn.classList.add("open");
                    wrap.classList.add("open");
                    btn.setAttribute("aria-expanded", "true");
                    const parentHead = wrap.closest(".discovery-head, .discovery-meta, .discovery-section");
                    if (parentHead) parentHead.classList.add("has-open-dropdown");
                }
            });
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".custom-dropdown")) {
            closeAllDropdowns();
        }
    });

    bindCustomDropdownOptions("sort-dropdown-wrap", "sortBy", "Recommended", "sort-label");
    bindCustomDropdownOptions("search-guests-dropdown-wrap", "guests", "Add guests", "search-guests-label");
    bindCustomDropdownOptions("filter-type-wrap", "propertyType", "Property Type", "filter-type-label");
    bindCustomDropdownOptions("filter-price-wrap", "price", "Price Range", "filter-price-label");
    bindCustomDropdownOptions("filter-beds-wrap", "bedrooms", "Bedrooms", "filter-beds-label");
    bindCustomDropdownOptions("filter-amenities-wrap", "amenity", "Amenities", "filter-amenities-label");
    bindCustomDropdownOptions("filter-rating-wrap", "rating", "Rating", "filter-rating-label");
}

function bindCustomDropdownOptions(wrapId, stateKey, defaultLabel, labelElemId) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    const btn = wrap.querySelector(".dropdown-trigger-btn, .search-select-btn");
    const labelSpan = document.getElementById(labelElemId);
    const options = wrap.querySelectorAll(".dropdown-option-item");

    options.forEach(opt => {
        opt.onclick = (e) => {
            e.stopPropagation();
            const val = opt.getAttribute("data-value") || "";
            const text = opt.textContent.trim();

            searchState[stateKey] = val;

            options.forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");

            if (labelSpan) {
                labelSpan.textContent = val ? text : defaultLabel;
            }

            if (btn && btn.classList.contains("dropdown-trigger-btn")) {
                if (val && val !== "recommended") {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            }

            closeAllDropdowns();
            GetRooms();
        };
    });
}

// Dynamically generate filter options from actual backend property data
function populateDynamicFiltersFromProperties(rooms) {
    if (isDynamicOptionsPopulated || !rooms || rooms.length === 0) return;

    const typesSet = new Set();
    const amenitiesSet = new Set();

    rooms.forEach(room => {
        if (room.propertyType && room.propertyType.trim()) {
            typesSet.add(room.propertyType.trim());
        }
        if (Array.isArray(room.amenities)) {
            room.amenities.forEach(a => {
                if (a && a.trim()) amenitiesSet.add(a.trim());
            });
        }
    });

    // Populate Property Types Menu
    const typeMenu = document.getElementById("filter-type-menu");
    if (typeMenu && typesSet.size > 0) {
        let html = `<div class="dropdown-option-item ${!searchState.propertyType ? 'selected' : ''}" data-value="">All Property Types</div>`;
        Array.from(typesSet).sort().forEach(t => {
            const isSel = searchState.propertyType.toLowerCase() === t.toLowerCase();
            html += `<div class="dropdown-option-item ${isSel ? 'selected' : ''}" data-value="${t}">${t}</div>`;
        });
        typeMenu.innerHTML = html;
        bindCustomDropdownOptions("filter-type-wrap", "propertyType", "Property Type", "filter-type-label");
    }

    // Populate Amenities Menu
    const amenityMenu = document.getElementById("filter-amenities-menu");
    if (amenityMenu && amenitiesSet.size > 0) {
        let html = `<div class="dropdown-option-item ${!searchState.amenity ? 'selected' : ''}" data-value="">All Amenities</div>`;
        Array.from(amenitiesSet).sort().forEach(a => {
            const isSel = searchState.amenity.toLowerCase() === a.toLowerCase();
            html += `<div class="dropdown-option-item ${isSel ? 'selected' : ''}" data-value="${a}">${a}</div>`;
        });
        amenityMenu.innerHTML = html;
        bindCustomDropdownOptions("filter-amenities-wrap", "amenity", "Amenities", "filter-amenities-label");
    }

    isDynamicOptionsPopulated = true;
}

// ── Loading Skeleton Cards ─────────────────────────────────────────────────
const showSkeletons = () => {
    const masonryGrid = document.querySelector("#masonry-grid");
    if (!masonryGrid) return;
    masonryGrid.innerHTML = "";

    for (let i = 0; i < 6; i++) {
        const card = document.createElement("div");
        card.className = "prop-card skeleton";
        card.innerHTML = `
            <div class="skeleton-img"></div>
            <div class="skeleton-text-1"></div>
            <div class="skeleton-text-2"></div>
        `;
        masonryGrid.appendChild(card);
    }
};

// ── Main Property Discovery Search & Filter Function ───────────────────────
let GetRooms = async () => {
    const masonryGrid = document.querySelector("#masonry-grid");
    const resultsCountEl = document.querySelector(".results-count");

    showSkeletons();

    try {
        await fetchWishlist();

        const queryParams = new URLSearchParams();
        if (searchState.destination) queryParams.append("location", searchState.destination);
        if (searchState.checkIn) queryParams.append("checkIn", searchState.checkIn);
        if (searchState.checkOut) queryParams.append("checkOut", searchState.checkOut);
        if (searchState.guests) queryParams.append("guests", searchState.guests);
        if (searchState.propertyType) queryParams.append("propertyType", searchState.propertyType);
        if (searchState.price) queryParams.append("price", searchState.price);
        if (searchState.bedrooms) queryParams.append("bedrooms", searchState.bedrooms);
        if (searchState.amenity) queryParams.append("amenity", searchState.amenity);
        if (searchState.rating) queryParams.append("rating", searchState.rating);
        if (searchState.sortBy) queryParams.append("sortBy", searchState.sortBy);

        const response = await guestFetch(`http://localhost:5000/api/guest/properties?${queryParams.toString()}`, {
            method: "GET"
        });
        if (!response) return;

        const data = await response.json();

        if (!response.ok || !data.success) {
            if (masonryGrid) {
                masonryGrid.innerHTML = `
                    <div class="dashboard-empty-container">
                        <div class="dashboard-empty-icon" style="background: rgba(254, 226, 226, 0.7); color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                        <h3 class="dashboard-empty-title">Unable to Load Properties</h3>
                        <p class="dashboard-empty-desc">Please check your server connection and try again.</p>
                        <button type="button" id="retry-fetch-btn" class="btn-clear-all-filters" style="background: linear-gradient(135deg, var(--em-700) 0%, var(--em-800) 100%);">
                            Retry Connection
                        </button>
                    </div>
                `;
                const retryBtn = document.querySelector("#retry-fetch-btn");
                if (retryBtn) {
                    retryBtn.addEventListener("click", GetRooms);
                }
            }
            return;
        }

        const rooms = data.data || [];

        populateDynamicFiltersFromProperties(rooms);

        if (resultsCountEl) {
            const count = rooms.length;
            resultsCountEl.textContent = `${count} ${count === 1 ? 'property' : 'properties'} found`;
        }

        if (!masonryGrid) return;
        masonryGrid.innerHTML = "";

        if (rooms.length === 0) {
            const dest = searchState.destination ? searchState.destination.trim() : "";
            const descText = dest
                ? `No stays found in "${dest}". Try another destination or clear your filters.`
                : `Try adjusting your dates or filters to discover more properties.`;

            masonryGrid.innerHTML = `
                <div class="dashboard-empty-container">
                    <div class="dashboard-empty-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    </div>
                    <h3 class="dashboard-empty-title">No Stays Found</h3>
                    <p class="dashboard-empty-desc">${descText}</p>
                    <button type="button" id="reset-filters-btn" class="btn-clear-all-filters">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Clear All Filters
                    </button>
                </div>
            `;
            const resetBtn = document.querySelector("#reset-filters-btn");
            if (resetBtn) {
                resetBtn.addEventListener("click", clearAllFilters);
            }
            return;
        }

        rooms.forEach((room, index) => {
            const card = document.createElement("a");
            const cardType = cardTypes[index % cardTypes.length];
            card.className = `prop-card ${cardType}`;
            card.href = `guest-property-detail.html?id=${room._id}`;
            card.setAttribute("aria-label", `${room.name}, ${room.location} — PKR ${room.pricePerNight} per night`);

            const imgWrap = document.createElement("div");
            imgWrap.className = "prop-img-wrap";

            const img = document.createElement("img");
            img.src = (room.images && room.images.length > 0) ? room.images[0] : (room.image || GUEST_PROPERTY_FALLBACK_IMG);
            img.alt = room.name;
            img.className = "prop-img";
            img.width = 600;
            img.height = cardType === "card-tall" ? 800 : 480;
            img.loading = index === 0 ? "eager" : "lazy";
            attachImageFallback(img);

            const availBadge = document.createElement("span");
            availBadge.className = "avail-badge available";
            availBadge.innerHTML = `<span class="avail-dot" aria-hidden="true"></span>${room.status || "Available"}`;

            const propBadge = document.createElement("span");
            propBadge.className = "prop-badge";
            propBadge.textContent = room.propertyType || "Stay";

            const overlay = document.createElement("div");
            overlay.className = "prop-overlay";

            const overlayTop = document.createElement("div");
            overlayTop.className = "overlay-top";

            const wishBtn = document.createElement("button");
            wishBtn.className = "wish-btn";
            if (savedWishlistIds.has(room._id.toString())) {
                wishBtn.classList.add("saved", "active");
            }
            wishBtn.type = "button";
            wishBtn.setAttribute("title", "Save to Wishlist");

            const heartSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            heartSvg.setAttribute("width", "16");
            heartSvg.setAttribute("height", "16");
            heartSvg.setAttribute("viewBox", "0 0 24 24");
            heartSvg.setAttribute("fill", "currentColor");
            heartSvg.setAttribute("stroke", "currentColor");
            heartSvg.setAttribute("stroke-width", "1.5");
            const heartPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            heartPath.setAttribute("d", "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z");
            heartSvg.appendChild(heartPath);
            wishBtn.appendChild(heartSvg);

            wishBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isSaved = wishBtn.classList.contains("saved") || wishBtn.classList.contains("active");
                const method = isSaved ? "DELETE" : "POST";

                if (isSaved) {
                    wishBtn.classList.remove("saved", "active");
                    savedWishlistIds.delete(room._id.toString());
                    showVeyraToast("Property removed from wishlist", "remove");
                } else {
                    wishBtn.classList.add("saved", "active");
                    savedWishlistIds.add(room._id.toString());
                    showVeyraToast("Property saved to your wishlist", "success");
                }

                try {
                    const res = await guestFetch(`http://localhost:5000/api/guest/wishlist/${room._id}`, {
                        method
                    });
                    if (!res || !res.ok) {
                        if (isSaved) {
                            wishBtn.classList.add("saved", "active");
                            savedWishlistIds.add(room._id.toString());
                        } else {
                            wishBtn.classList.remove("saved", "active");
                            savedWishlistIds.delete(room._id.toString());
                        }
                    }
                } catch (err) {
                    console.error("Wishlist error:", err);
                }
            });

            const overlayBottom = document.createElement("div");
            overlayBottom.className = "overlay-bottom";

            const overlayRating = document.createElement("div");
            overlayRating.className = "overlay-rating";
            overlayRating.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#D4B860" stroke="#D4B860" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${room.rating || 4.8}`;

            const overlayPrice = document.createElement("div");
            overlayPrice.className = "overlay-price";
            overlayPrice.innerHTML = `PKR ${Number(room.pricePerNight).toLocaleString()}<span class="price-per">/night</span>`;

            overlayTop.appendChild(wishBtn);
            overlayBottom.appendChild(overlayRating);
            overlayBottom.appendChild(overlayPrice);
            overlay.appendChild(overlayTop);
            overlay.appendChild(overlayBottom);

            const propFoot = document.createElement("div");
            propFoot.className = "prop-foot";
            propFoot.innerHTML = `
                <div class="prop-foot-main">
                    <h3 class="prop-name">${escapeHtml(room.name)}</h3>
                    <span class="prop-location">
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${escapeHtml(room.location)}
                    </span>
                </div>
                <div class="prop-foot-right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#C4A040" stroke="#C4A040" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    ${room.rating || 4.8}
                </div>
            `;

            imgWrap.appendChild(img);
            imgWrap.appendChild(availBadge);
            imgWrap.appendChild(propBadge);
            imgWrap.appendChild(overlay);

            card.appendChild(imgWrap);
            card.appendChild(propFoot);

            masonryGrid.appendChild(card);
        });

    } catch (error) {
        console.error("GetRooms error:", error);
    } finally {
        if (typeof hideVeyraLoader === "function") hideVeyraLoader();
    }
};

// ── Clear All Filters Function ─────────────────────────────────────────────
function clearAllFilters() {
    searchState.destination = "";
    searchState.checkIn = "";
    searchState.checkOut = "";
    searchState.guests = "";
    searchState.propertyType = "";
    searchState.price = "";
    searchState.bedrooms = "";
    searchState.amenity = "";
    searchState.rating = "";
    searchState.sortBy = "recommended";

    const destInput = document.getElementById("search-dest");
    const checkinInput = document.getElementById("search-checkin");
    const checkoutInput = document.getElementById("search-checkout");
    if (destInput) destInput.value = "";
    if (checkinInput) checkinInput.value = "";
    if (checkoutInput) checkoutInput.value = "";

    const guestsLabel = document.getElementById("search-guests-label");
    const typeLabel = document.getElementById("filter-type-label");
    const priceLabel = document.getElementById("filter-price-label");
    const bedsLabel = document.getElementById("filter-beds-label");
    const amenitiesLabel = document.getElementById("filter-amenities-label");
    const ratingLabel = document.getElementById("filter-rating-label");
    const sortLabel = document.getElementById("sort-label");

    if (guestsLabel) guestsLabel.textContent = "Add guests";
    if (typeLabel) typeLabel.textContent = "Property Type";
    if (priceLabel) priceLabel.textContent = "Price Range";
    if (bedsLabel) bedsLabel.textContent = "Bedrooms";
    if (amenitiesLabel) amenitiesLabel.textContent = "Amenities";
    if (ratingLabel) ratingLabel.textContent = "Rating";
    if (sortLabel) sortLabel.textContent = "Recommended";

    document.querySelectorAll(".dropdown-trigger-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".dropdown-option-item").forEach(opt => opt.classList.remove("selected"));

    document.querySelectorAll(".custom-dropdown-menu").forEach(menu => {
        const firstOpt = menu.querySelector(".dropdown-option-item");
        if (firstOpt) firstOpt.classList.add("selected");
    });

    closeAllDropdowns();
    GetRooms();
}

const loadUserAvatar = async () => {
    try {
        const response = await guestFetch("http://localhost:5000/api/auth/me");
        if (!response) return;
        const data = await response.json();
        if (data.success && data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            if (data.user.avatar) {
                document.querySelectorAll(".nav-avatar, #nav-avatar-img").forEach(img => {
                    img.src = data.user.avatar;
                });
            }
        }
    } catch (e) {
        console.error("loadUserAvatar error:", e);
    }
};

// ── Initialization & Listeners ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    initCustomDropdowns();

    // Read URL search params (e.g. ?location=Nathia%20Gali)
    const urlParams = new URLSearchParams(window.location.search);
    const locParam = urlParams.get("location") || urlParams.get("destination");
    if (locParam) {
        searchState.destination = locParam.trim();
        const destInput = document.getElementById("search-dest");
        if (destInput) destInput.value = locParam.trim();
    }

    const searchForm = document.getElementById("search-bar");
    if (searchForm) {
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const destInput = document.getElementById("search-dest");
            const checkinInput = document.getElementById("search-checkin");
            const checkoutInput = document.getElementById("search-checkout");

            searchState.destination = destInput ? destInput.value.trim() : "";
            searchState.checkIn = checkinInput ? checkinInput.value : "";
            searchState.checkOut = checkoutInput ? checkoutInput.value : "";

            if (searchState.checkIn && searchState.checkOut) {
                if (new Date(searchState.checkOut) <= new Date(searchState.checkIn)) {
                    showVeyraToast("Check-out date must be strictly after check-in date.", "remove");
                    return;
                }
            }

            GetRooms();
        });
    }

    const checkinInput = document.getElementById("search-checkin");
    const checkoutInput = document.getElementById("search-checkout");
    const todayStr = new Date().toISOString().split("T")[0];

    if (checkinInput) {
        checkinInput.min = todayStr;
        checkinInput.addEventListener("change", () => {
            searchState.checkIn = checkinInput.value;
            if (checkoutInput) {
                checkoutInput.min = checkinInput.value || todayStr;
                if (checkoutInput.value && checkoutInput.value < checkinInput.value) {
                    checkoutInput.value = checkinInput.value;
                    searchState.checkOut = checkinInput.value;
                }
            }
            GetRooms();
        });
    }

    if (checkoutInput) {
        checkoutInput.min = todayStr;
        checkoutInput.addEventListener("change", () => {
            searchState.checkOut = checkoutInput.value;
            GetRooms();
        });
    }

    const clearBtn = document.getElementById("clear-filters-btn");
    if (clearBtn) {
        clearBtn.addEventListener("click", clearAllFilters);
    }

    GetRooms();
    loadUserAvatar();
});