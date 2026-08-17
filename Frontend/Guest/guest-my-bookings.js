const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
}

let allBookings = [];
let currentFilter = "all";

let getMyBookings = async () => {
    try {
        const response = await fetch("http://localhost:5000/api/guest/bookings", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            console.error("Failed to load guest bookings:", data.message);
            return;
        }

        allBookings = data.data || [];
        renderBookings();
        updateTabCounts();
    } catch (err) {
        console.error("getMyBookings Error:", err);
    }
};

function renderBookings() {
    const listContainer = document.querySelector(".bookings-list");
    if (!listContainer) return;

    let filtered = allBookings;
    if (currentFilter === "upcoming") {
        filtered = allBookings.filter(b => b.status === "Confirmed");
    } else if (currentFilter === "completed") {
        filtered = allBookings.filter(b => b.status === "Completed");
    } else if (currentFilter === "canceled") {
        filtered = allBookings.filter(b => b.status === "Canceled");
    }

    listContainer.innerHTML = "";

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 48px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin-bottom: 12px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <h3 style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">No Bookings Found</h3>
                <p style="font-size: 14px; color: #64748b; margin-bottom: 16px;">You don't have any ${currentFilter !== 'all' ? currentFilter : ''} reservations at the moment.</p>
                <a href="guest-dashboard.html" class="btn-primary" style="display: inline-flex; align-items: center; padding: 10px 20px; background: #0D5C4E; color: white; border-radius: 8px; font-weight: 600; text-decoration: none;">Explore Stays</a>
            </div>
        `;
        return;
    }

    filtered.forEach(booking => {
        const card = document.createElement("div");
        card.className = "booking-item-card";

        const room = booking.room || {};
        const checkInFmt = new Date(booking.checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const checkOutFmt = new Date(booking.checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

        let statusPillClass = "upcoming";
        let statusText = "Confirmed Stay";

        if (booking.status === "Completed") {
            statusPillClass = "completed";
            statusText = "Completed";
        } else if (booking.status === "Canceled") {
            statusPillClass = "canceled";
            statusText = "Canceled";
        }

        const roomImg = room.image || "../images/luxury_mountain_cabin.png";
        const roomName = room.name || "Property Stay";
        const roomLoc = room.location || "Pakistan";

        let actionBtnsHTML = "";
        if (booking.status === "Confirmed") {
            actionBtnsHTML = `
                <button type="button" class="btn-secondary cancel-booking-btn" data-id="${booking._id}" style="color: #e11d48; border-color: #fecdd3;">Cancel Stay</button>
                <a href="guest-property-detail.html?id=${room._id || ''}" class="btn-primary">View Property</a>
            `;
        } else if (booking.status === "Completed") {
            actionBtnsHTML = `
                <a href="guest-property-detail.html?id=${room._id || ''}" class="btn-primary">Book Again</a>
            `;
        } else {
            actionBtnsHTML = `
                <a href="guest-property-detail.html?id=${room._id || ''}" class="btn-secondary">Re-book Dates</a>
            `;
        }

        card.innerHTML = `
            <div class="booking-card-img-wrap">
              <img src="${roomImg}" alt="${roomName}" class="booking-card-img">
            </div>

            <div class="booking-card-body">
              <div class="booking-card-top">
                <div class="booking-card-title-group">
                  <h2 class="booking-prop-name">${roomName}</h2>
                  <span class="booking-prop-loc">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${roomLoc}
                  </span>
                </div>

                <span class="status-pill ${statusPillClass}">
                  <span class="status-dot"></span>
                  ${statusText}
                </span>
              </div>

              <div class="booking-details-grid">
                <div class="detail-cell">
                  <span class="cell-lbl">Stay Dates</span>
                  <span class="cell-val">${checkInFmt} – ${checkOutFmt}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-lbl">Duration</span>
                  <span class="cell-val">${booking.nights} Night${booking.nights > 1 ? 's' : ''}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-lbl">Guests</span>
                  <span class="cell-val">${booking.guests} Guest${booking.guests > 1 ? 's' : ''}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-lbl">Total Paid</span>
                  <span class="cell-val">PKR ${booking.totalPrice ? booking.totalPrice.toLocaleString() : '0'}</span>
                </div>
              </div>

              <div class="booking-card-actions">
                <span class="ref-code-lbl">Ref: #${booking.referenceCode || booking._id.slice(-6).toUpperCase()}</span>
                <div class="action-btns-group">
                  ${actionBtnsHTML}
                </div>
              </div>
            </div>
        `;

        listContainer.appendChild(card);
    });

    // Attach listener to cancel buttons
    document.querySelectorAll(".cancel-booking-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const bookingId = e.target.dataset.id;
            if (!bookingId) return;

            if (!confirm("Are you sure you want to cancel this booking reservation?")) {
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/api/guest/bookings/${bookingId}/cancel`, {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                const resData = await response.json();
                if (!response.ok || !resData.success) {
                    alert(resData.message || "Failed to cancel booking.");
                    return;
                }

                alert("Booking canceled successfully.");
                await getMyBookings();
            } catch (err) {
                console.error("Cancel Error:", err);
                alert("Server error occurred while canceling booking.");
            }
        });
    });
}

function updateTabCounts() {
    const tabBtns = document.querySelectorAll(".bookings-tabs .tab-btn");
    if (!tabBtns || tabBtns.length < 4) return;

    const totalCount = allBookings.length;
    const upcomingCount = allBookings.filter(b => b.status === "Confirmed").length;
    const completedCount = allBookings.filter(b => b.status === "Completed").length;
    const canceledCount = allBookings.filter(b => b.status === "Canceled").length;

    tabBtns[0].textContent = `All Stays (${totalCount})`;
    tabBtns[1].textContent = `Upcoming (${upcomingCount})`;
    tabBtns[2].textContent = `Completed (${completedCount})`;
    tabBtns[3].textContent = `Canceled (${canceledCount})`;
}

function initTabs() {
    const tabBtns = document.querySelectorAll(".bookings-tabs .tab-btn");
    tabBtns.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            if (index === 0) currentFilter = "all";
            else if (index === 1) currentFilter = "upcoming";
            else if (index === 2) currentFilter = "completed";
            else if (index === 3) currentFilter = "canceled";

            renderBookings();
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    getMyBookings();
});