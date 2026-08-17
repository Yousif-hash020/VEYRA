const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
}

const params = new URLSearchParams(window.location.search);
const roomId = params.get("id");
const checkInParam = params.get("checkIn");
const checkOutParam = params.get("checkOut");
const guestsParam = params.get("guests") || "1";

let roomData = null;

let initCheckout = async () => {
    try {
        if (!roomId || !checkInParam || !checkOutParam) {
            alert("Missing stay dates or property information. Redirecting to explore stays.");
            window.location.href = "guest-dashboard.html";
            return;
        }

        // Fetch User Info
        try {
            const meRes = await fetch("http://localhost:5000/api/auth/me", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const meData = await meRes.json();
            if (meData.success && meData.user) {
                const fullName = meData.user.name || "";
                const nameParts = fullName.split(" ");
                const fName = nameParts[0] || "";
                const lName = nameParts.slice(1).join(" ") || "";

                if (document.getElementById("guest-fname")) document.getElementById("guest-fname").value = fName;
                if (document.getElementById("guest-lname")) document.getElementById("guest-lname").value = lName;
                if (document.getElementById("guest-email")) document.getElementById("guest-email").value = meData.user.email || "";
                if (document.getElementById("guest-phone")) document.getElementById("guest-phone").value = meData.user.phone || "";
                if (document.getElementById("cnic-num")) document.getElementById("cnic-num").value = meData.user.cnic || "";
            }
        } catch (e) {
            console.error("Failed to load user profile:", e);
        }

        // Fetch Property Info
        const propRes = await fetch(`http://localhost:5000/api/guest/properties/${roomId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const propData = await propRes.json();

        if (!propRes.ok || !propData.success) {
            alert(propData.message || "Failed to load property details");
            window.location.href = "guest-dashboard.html";
            return;
        }

        roomData = propData.data;

        // Calculate Nights & Pricing
        const checkInDate = new Date(checkInParam);
        const checkOutDate = new Date(checkOutParam);
        const diffTime = checkOutDate.getTime() - checkInDate.getTime();
        const nights = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)));

        const pricePerNight = roomData.pricePerNight;
        const nightlyTotal = nights * pricePerNight;
        const cleaningFee = 3500;
        const serviceFee = 4200;
        const totalPrice = nightlyTotal + cleaningFee + serviceFee;

        // Render Trip Summary
        const cInFormat = checkInDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const cOutFormat = checkOutDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

        const tripSumGrid = document.querySelector(".trip-summary-grid");
        if (tripSumGrid) {
            tripSumGrid.innerHTML = `
                <div class="trip-sum-item">
                  <span class="trip-sum-label">Dates</span>
                  <span class="trip-sum-val">${cInFormat} – ${cOutFormat}</span>
                  <span class="trip-sum-sub">${nights} Night${nights > 1 ? 's' : ''} stay</span>
                </div>
                <div class="trip-sum-item">
                  <span class="trip-sum-label">Guests</span>
                  <span class="trip-sum-val">${guestsParam} Guest${Number(guestsParam) > 1 ? 's' : ''}</span>
                  <span class="trip-sum-sub">${roomData.propertyType || 'Property'}</span>
                </div>
                <div class="trip-sum-item">
                  <span class="trip-sum-label">Check-in Time</span>
                  <span class="trip-sum-val">2:00 PM – 8:00 PM</span>
                  <span class="trip-sum-sub">Standard Check-in</span>
                </div>
                <div class="trip-sum-item">
                  <span class="trip-sum-label">Check-out Time</span>
                  <span class="trip-sum-val">11:00 AM Sharp</span>
                  <span class="trip-sum-sub">Standard Check-out</span>
                </div>
            `;
        }

        // Render Mini Property Card
        const summaryPropHead = document.querySelector(".summary-prop-head");
        if (summaryPropHead) {
            const mainImg = (Array.isArray(roomData.images) && roomData.images.length > 0)
                ? roomData.images[0]
                : (roomData.image || "../images/luxury_mountain_cabin.png");

            summaryPropHead.innerHTML = `
                <img src="${mainImg}" alt="${roomData.name}" class="summary-prop-img">
                <div class="summary-prop-text">
                  <h3 class="summary-prop-title">${roomData.name}</h3>
                  <span class="summary-prop-loc">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${roomData.location}
                  </span>
                  <div class="summary-prop-rating">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#C4A040" stroke="#C4A040" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    ${roomData.rating || 4.8} (${roomData.reviewCount || 0} reviews)
                  </div>
                </div>
            `;
        }

        // Render Price Breakdown
        const priceBox = document.querySelector(".price-breakdown-box");
        if (priceBox) {
            priceBox.innerHTML = `
                <h4 style="font-size:15px; font-weight:700; color:var(--ch-900);">Price Summary</h4>
                <div class="price-row">
                  <span>PKR ${pricePerNight.toLocaleString()} × ${nights} night${nights > 1 ? 's' : ''}</span>
                  <span>PKR ${nightlyTotal.toLocaleString()}</span>
                </div>
                <div class="price-row">
                  <span>Cleaning & Preparation fee</span>
                  <span>PKR ${cleaningFee.toLocaleString()}</span>
                </div>
                <div class="price-row">
                  <span>VEYRA Service fee</span>
                  <span>PKR ${serviceFee.toLocaleString()}</span>
                </div>
                <div class="price-row total-row">
                  <span>Total Price</span>
                  <span>PKR ${totalPrice.toLocaleString()}</span>
                </div>
            `;
        }

        // Update CTA Button text
        const confirmBtn = document.getElementById("confirm-booking-btn");
        if (confirmBtn) {
            confirmBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Confirm & Pay PKR ${totalPrice.toLocaleString()}
            `;
        }

    } catch (err) {
        console.error("initCheckout Error:", err);
    } finally {
        if (typeof hideVeyraLoader === "function") hideVeyraLoader();
    }
};

// Handle Form Submission / Reservation
document.addEventListener("DOMContentLoaded", () => {
    initCheckout();

    const confirmBtn = document.getElementById("confirm-booking-btn");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            const alertDiv = document.getElementById("booking-error-alert");
            if (alertDiv) alertDiv.style.display = "none";

            const termsCheck = document.getElementById("terms-check");
            if (termsCheck && !termsCheck.checked) {
                if (alertDiv) {
                    alertDiv.textContent = "You must agree to the House Rules & Guest Terms of Service.";
                    alertDiv.style.display = "block";
                }
                return;
            }

            const cnicInput = document.getElementById("cnic-num");
            const specialReqInput = document.getElementById("special-req");

            let selectedPayment = "card";
            if (document.getElementById("pay-wallet") && document.getElementById("pay-wallet").checked) {
                selectedPayment = "wallet";
            } else if (document.getElementById("pay-bank") && document.getElementById("pay-bank").checked) {
                selectedPayment = "bank";
            }

            const payload = {
                roomId: roomId,
                checkIn: checkInParam,
                checkOut: checkOutParam,
                guests: Number(guestsParam),
                cnic: cnicInput ? cnicInput.value.trim() : "",
                specialRequests: specialReqInput ? specialReqInput.value.trim() : "",
                paymentMethod: selectedPayment
            };

            confirmBtn.disabled = true;
            confirmBtn.style.opacity = "0.7";
            confirmBtn.textContent = "Processing Reservation...";

            try {
                const response = await fetch("http://localhost:5000/api/guest/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const resData = await response.json();

                if (!response.ok || !resData.success) {
                    confirmBtn.disabled = false;
                    confirmBtn.style.opacity = "1";
                    confirmBtn.innerHTML = `Confirm & Reserve Stay`;

                    if (alertDiv) {
                        alertDiv.textContent = resData.message || "Failed to complete reservation. Please try again.";
                        alertDiv.style.display = "block";
                    }
                    return;
                }

                // Success! Redirect to My Bookings page
                window.location.href = "guest-my-bookings.html";

            } catch (err) {
                console.error("Booking Error:", err);
                confirmBtn.disabled = false;
                confirmBtn.style.opacity = "1";
                confirmBtn.innerHTML = `Confirm & Reserve Stay`;

                if (alertDiv) {
                    alertDiv.textContent = "Network / server error occurred while processing reservation.";
                    alertDiv.style.display = "block";
                }
            }
        });
    }
});
