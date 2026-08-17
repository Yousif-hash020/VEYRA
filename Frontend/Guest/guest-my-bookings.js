requireGuestSession();
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

let allBookings = [];
let currentFilter = "all";

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

    const iconSvg = type === "error" || type === "remove"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
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

let getMyBookings = async () => {
    try {
        const response = await guestFetch("http://localhost:5000/api/guest/bookings", {
            method: "GET"
        });
        if (!response) return;

        const data = await response.json();
        if (!response.ok || !data.success) {
            console.error("Failed to load guest bookings:", data.message);
            showVeyraToast("Failed to load your reservations.", "error");
            return;
        }

        allBookings = data.data || [];
        renderBookings();
        updateTabCounts();
    } catch (err) {
        console.error("getMyBookings Error:", err);
    } finally {
        if (typeof hideVeyraLoader === "function") hideVeyraLoader();
    }
};

function renderBookings() {
    const listContainer = document.querySelector(".bookings-list");
    if (!listContainer) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let filtered = allBookings;
    if (currentFilter === "upcoming") {
        filtered = allBookings.filter(b => {
            if (b.status === "Canceled" || b.status === "Cancelled" || b.status === "Completed") return false;
            if (b.status === "Confirmed" || b.status === "Pending") {
                if (!b.checkOut) return true;
                return new Date(b.checkOut) >= now;
            }
            return false;
        });
    } else if (currentFilter === "completed") {
        filtered = allBookings.filter(b => {
            if (b.status === "Completed") return true;
            if (b.status === "Confirmed" && b.checkOut && new Date(b.checkOut) < now) return true;
            return false;
        });
    } else if (currentFilter === "canceled") {
        filtered = allBookings.filter(b => b.status === "Canceled" || b.status === "Cancelled");
    }

    listContainer.innerHTML = "";

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 64px 24px; background: #ffffff; border-radius: 16px; border: 1.5px dashed #cbd5e1; margin: 20px 0;">
                <div style="width: 56px; height: 56px; border-radius: 50%; background: #f8fafc; border: 1px solid #e2e8f0; display: inline-flex; align-items: center; justify-content: center; color: #94a3b8; margin-bottom: 16px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <h3 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">No bookings yet</h3>
                <p style="font-size: 14px; color: #64748b; margin-bottom: 20px; max-width: 360px; margin-left: auto; margin-right: auto; line-height: 1.5;">Your upcoming stays will appear here once you make a reservation.</p>
                <a href="guest-dashboard.html" style="display: inline-flex; align-items: center; gap: 8px; padding: 11px 26px; background: #0D5C4E; color: #ffffff; border-radius: 9999px; font-weight: 600; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(13, 92, 78, 0.2);">Explore Stays</a>
            </div>
        `;
        return;
    }

    filtered.forEach(booking => {
        const card = document.createElement("div");
        card.className = "booking-item-card";

        const room = booking.room || {};
        const roomId = room._id ? room._id.toString() : "";
        const isRoomAvailable = Boolean(roomId);
        const cInDate = new Date(booking.checkIn);
        const cOutDate = new Date(booking.checkOut);

        const checkInFmt = !isNaN(cInDate.getTime()) ? cInDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";
        const checkOutFmt = !isNaN(cOutDate.getTime()) ? cOutDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";

        let calculatedNights = booking.nights;
        if (!calculatedNights && !isNaN(cInDate.getTime()) && !isNaN(cOutDate.getTime())) {
            calculatedNights = Math.max(1, Math.ceil((cOutDate.getTime() - cInDate.getTime()) / (1000 * 3600 * 24)));
        }
        calculatedNights = calculatedNights || 1;

        const isPastStay = booking.status === "Completed" || (booking.status === "Confirmed" && !isNaN(cOutDate.getTime()) && cOutDate < now);

        let statusPillClass = "upcoming";
        let statusText = "Confirmed Stay";

        if (booking.status === "Canceled" || booking.status === "Cancelled") {
            statusPillClass = "canceled";
            statusText = "Canceled";
        } else if (isPastStay) {
            statusPillClass = "completed";
            statusText = "Completed";
        } else if (booking.status === "Pending") {
            statusPillClass = "upcoming";
            statusText = "Pending Host Approval";
        } else {
            statusPillClass = "upcoming";
            statusText = "Confirmed Stay";
        }

        const fallbackImg = GUEST_PROPERTY_FALLBACK_IMG;
        const roomImg = (Array.isArray(room.images) && room.images.length > 0 && typeof room.images[0] === 'string')
            ? room.images[0]
            : (room.image || fallbackImg);
        const roomName = isRoomAvailable ? (room.name || "Property Retreat") : "Property No Longer Available";
        const roomLoc = isRoomAvailable ? (room.location || "Pakistan") : "Listing removed by host";

        let actionBtnsHTML = "";
        const viewPropertyLink = isRoomAvailable
            ? `guest-property-detail.html?id=${roomId}`
            : "guest-dashboard.html";
        const viewPropertyLabel = isRoomAvailable ? "View Property" : "Explore Stays";

        if (booking.status === "Confirmed" || booking.status === "Pending") {
            actionBtnsHTML = `
                <button type="button" class="btn-secondary cancel-booking-btn" data-id="${booking._id}" style="color: #e11d48; border-color: #fecdd3;">Cancel Booking</button>
                <a href="${viewPropertyLink}" class="btn-primary">${viewPropertyLabel}</a>
            `;
        } else if (booking.status === "Completed") {
            actionBtnsHTML = `
                <a href="${viewPropertyLink}" class="btn-primary">${isRoomAvailable ? "Book Again" : "Explore Stays"}</a>
            `;
        } else {
            actionBtnsHTML = `
                <a href="${viewPropertyLink}" class="btn-secondary">${viewPropertyLabel}</a>
            `;
        }

        const bookingRefCode = booking.referenceCode || (booking._id ? `#VEY-${booking._id.slice(-6).toUpperCase()}` : '#VEY-000000');

        card.innerHTML = `
            <div class="booking-card-img-wrap">
              <img src="${roomImg}" alt="${roomName}" class="booking-card-img" onerror="this.onerror=null;this.src='${fallbackImg}';">
            </div>

            <div class="booking-card-body">
              <div class="booking-card-top">
                <div class="booking-card-title-group">
                  <h2 class="booking-prop-name">${escapeHtml(roomName)}</h2>
                  <span class="booking-prop-loc">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${escapeHtml(roomLoc)}
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
                  <span class="cell-val">${calculatedNights} Night${calculatedNights > 1 ? 's' : ''}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-lbl">Guests</span>
                  <span class="cell-val">${booking.guests || 1} Guest${(booking.guests || 1) > 1 ? 's' : ''}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-lbl">Total Price</span>
                  <span class="cell-val">PKR ${booking.totalPrice ? Number(booking.totalPrice).toLocaleString() : '0'}</span>
                </div>
              </div>

              <div class="booking-card-actions">
                <span class="ref-code-lbl">Ref: ${bookingRefCode}</span>
                <div class="action-btns-group">
                  ${actionBtnsHTML}
                </div>
              </div>
            </div>
        `;

        listContainer.appendChild(card);
    });

    // Attach listener to cancel buttons with toast confirmation
    document.querySelectorAll(".cancel-booking-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const bookingId = e.currentTarget.dataset.id;
            if (!bookingId) return;

            if (!confirm("Are you sure you want to cancel this booking reservation?")) {
                return;
            }

            try {
                const response = await guestFetch(`http://localhost:5000/api/guest/bookings/${bookingId}/cancel`, {
                    method: "PATCH"
                });
                if (!response) return;

                const resData = await response.json();
                if (!response.ok || !resData.success) {
                    showVeyraToast(resData.message || "Failed to cancel booking.", "error");
                    return;
                }

                showVeyraToast("Booking canceled successfully.", "success");
                await getMyBookings();
            } catch (err) {
                console.error("Cancel Error:", err);
                showVeyraToast("Server error occurred while canceling booking.", "error");
            }
        });
    });
}

function updateTabCounts() {
    const tabBtns = document.querySelectorAll(".bookings-tabs .tab-btn");
    if (!tabBtns || tabBtns.length < 4) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const totalCount = allBookings.length;
    const upcomingCount = allBookings.filter(b => {
        if (b.status === "Canceled" || b.status === "Cancelled" || b.status === "Completed") return false;
        if (b.status === "Confirmed" || b.status === "Pending") {
            if (!b.checkOut) return true;
            return new Date(b.checkOut) >= now;
        }
        return false;
    }).length;

    const completedCount = allBookings.filter(b => {
        if (b.status === "Completed") return true;
        if (b.status === "Confirmed" && b.checkOut && new Date(b.checkOut) < now) return true;
        return false;
    }).length;

    const canceledCount = allBookings.filter(b => b.status === "Canceled" || b.status === "Cancelled").length;

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

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    getMyBookings();
    loadUserAvatar();
});