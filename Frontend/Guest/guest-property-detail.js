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

        // Populate DOM details
        document.querySelector(".property-title").textContent = propertyData.name;
        document.querySelector(".rating").textContent = propertyData.rating;
        document.querySelector(".meta-location").textContent = propertyData.location;
        document.querySelector(".description-text").textContent = propertyData.description;
        document.querySelector(".side-rating").textContent = propertyData.rating;
        document.querySelector(".guest-rating").textContent = propertyData.rating;
        document.querySelector(".rating-score-num").textContent = propertyData.rating;
        document.querySelector(".guest-reviews-count").textContent = `(${propertyData.reviewCount} Guest Reviews)`;
        document.querySelector(".rating-total-label").textContent = `(${propertyData.reviewCount} ratings)`;
        document.querySelector(".meta-review-count").textContent = `(${propertyData.reviewCount} verified reviews)`;
        document.querySelector(".host-name").textContent = `Hosted by ${propertyData.owner ? propertyData.owner.name : "Host"}`;
        document.querySelector("#guest").textContent = `${propertyData.guests} Guests`;
        document.querySelector("#beds").textContent = `${propertyData.beds} Beds`;
        document.querySelector("#bath").textContent = `${propertyData.bedrooms} Baths`;
        document.querySelector("#bedrooms").textContent = `${propertyData.bathrooms} Bedrooms`;
        document.querySelector(".price-amount").textContent = `PKR ${propertyData.pricePerNight.toLocaleString()}`;
        document.querySelector(".side-rating-count").textContent = `(${propertyData.reviewCount})`;

        // Amenities
        const amenitiesGrid = document.querySelector(".amenities-grid");
        amenitiesGrid.innerHTML = "";
        propertyData.amenities.forEach(element => {
            const amenitiescard = document.createElement('div');
            amenitiescard.classList.add("amenity-card");
            amenitiescard.textContent = element;
            amenitiesGrid.appendChild(amenitiescard);
        });

        // Reviews
        const reviewsContainer = document.querySelector(".reviews-grid");
        reviewsContainer.innerHTML = "";
        if (propertyData.reviews && propertyData.reviews.length > 0) {
            propertyData.reviews.forEach(review => {
                const reviewCard = document.createElement("div");
                reviewCard.className = "review-card";

                const reviewCardHead = document.createElement("div");
                reviewCardHead.className = "review-card-head";

                const reviewerProfile = document.createElement("div");
                reviewerProfile.className = "reviewer-profile";

                const reviewerAvatar = document.createElement("img");
                reviewerAvatar.src = (review.guest && review.guest.avatar) ? review.guest.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";
                reviewerAvatar.alt = `Reviewer ${review.guest ? review.guest.name : "Guest"}`;
                reviewerAvatar.className = "reviewer-avatar";

                const reviewerMeta = document.createElement("div");
                reviewerMeta.className = "reviewer-meta";

                const reviewerName = document.createElement("span");
                reviewerName.className = "reviewer-name";
                reviewerName.textContent = review.guest ? review.guest.name : "Guest";

                const reviewerDate = document.createElement("span");
                reviewerDate.className = "reviewer-date";

                const date = new Date(review.createdAt);
                reviewerDate.textContent = `${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })} · Verified Stay`;

                const reviewBodyText = document.createElement("p");
                reviewBodyText.className = "review-body-text";
                reviewBodyText.textContent = review.comment;

                reviewerMeta.appendChild(reviewerName);
                reviewerMeta.appendChild(reviewerDate);
                reviewerProfile.appendChild(reviewerAvatar);
                reviewerProfile.appendChild(reviewerMeta);
                reviewCardHead.appendChild(reviewerProfile);
                reviewCard.appendChild(reviewCardHead);
                reviewCard.appendChild(reviewBodyText);
                reviewsContainer.appendChild(reviewCard);
            });
        } else {
            reviewsContainer.innerHTML = `<p style="color:#64748b; font-size:14px;">No guest reviews submitted yet.</p>`;
        }

        // Fetch Availability Schedule (including host availableFrom / availableTo dates and confirmed bookings)
        await fetchAvailability(id);
        
        // Setup Date Inputs & Listeners
        initDateInputs();

    } catch (error) {
        console.error("getDetails Error:", error);
    }
};

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

getDetails(id);
