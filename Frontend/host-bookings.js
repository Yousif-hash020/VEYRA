const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "host") {
    window.location.href = "/Frontend/auth.html";
}

let hostBookingsList = [];

let loadHostBookingsPage = async () => {
    try {
        const response = await fetch("http://localhost:5000/api/host/bookings", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch host bookings");
            return;
        }

        const resData = await response.json();
        hostBookingsList = resData.data || [];

        renderHostStats();
        renderHostTable(hostBookingsList);
    } catch (err) {
        console.error("loadHostBookingsPage Error:", err);
    }
};

function renderHostStats() {
    const totalEl = document.getElementById("stat-total-bookings");
    const confirmedEl = document.getElementById("stat-confirmed-bookings");
    const completedEl = document.getElementById("stat-completed-bookings");
    const canceledEl = document.getElementById("stat-canceled-bookings");

    const total = hostBookingsList.length;
    const confirmed = hostBookingsList.filter(b => b.status === "Confirmed").length;
    const completed = hostBookingsList.filter(b => b.status === "Completed").length;
    const canceled = hostBookingsList.filter(b => b.status === "Canceled").length;

    if (totalEl) totalEl.textContent = total;
    if (confirmedEl) confirmedEl.textContent = confirmed;
    if (completedEl) completedEl.textContent = completed;
    if (canceledEl) canceledEl.textContent = canceled;
}

function renderHostTable(bookings) {
    const tbody = document.getElementById("host-bookings-page-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #64748b; padding: 32px;">
                    No guest reservations found for your properties.
                </td>
            </tr>
        `;
        return;
    }

    bookings.forEach(booking => {
        const tr = document.createElement("tr");

        const checkInFmt = new Date(booking.checkIn).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });
        const checkOutFmt = new Date(booking.checkOut).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });

        const guestName = booking.guest ? booking.guest.name : "Guest";
        const roomName = booking.room ? booking.room.name : "Property";

        let statusBadgeClass = "badge badge-active";
        if (booking.status === "Confirmed") statusBadgeClass = "badge badge-active";
        else if (booking.status === "Completed") statusBadgeClass = "badge badge-pending";
        else if (booking.status === "Canceled") statusBadgeClass = "badge badge-inactive";

        tr.innerHTML = `
            <td><span class="property-meta" style="font-weight:600;">#${booking.referenceCode || booking._id.slice(-6).toUpperCase()}</span></td>
            <td><span class="property-title">${roomName}</span></td>
            <td><span class="location-text">${guestName}</span></td>
            <td><strong style="color: #0D5C4E;">${checkInFmt}</strong></td>
            <td><strong style="color: #e11d48;">${checkOutFmt}</strong></td>
            <td>${booking.nights} night(s)</td>
            <td><span class="price-text">PKR ${booking.totalPrice ? booking.totalPrice.toLocaleString() : '0'}</span></td>
            <td><span class="${statusBadgeClass}">${booking.status}</span></td>
        `;

        tbody.appendChild(tr);
    });
}

const getUserInfo = async () => {
    let userName = document.querySelector('.user-name');
    let userRole = document.querySelector('.user-role');

    if (!userName || !userRole) return;

    try {
        const response = await fetch("http://localhost:5000/api/auth/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success && data.user) {
            userName.textContent = data.user.name;
            userName.style.textTransform = 'capitalize';
            userRole.textContent = data.user.role;
            userRole.style.textTransform = 'capitalize';
        }
    } catch (e) {
        console.error("getUserInfo Error:", e);
    }
};

// Search Filter Listener
document.addEventListener("DOMContentLoaded", () => {
    getUserInfo();
    loadHostBookingsPage();

    const searchInput = document.getElementById("search-bookings-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                renderHostTable(hostBookingsList);
                return;
            }

            const filtered = hostBookingsList.filter(b => {
                const guestName = (b.guest && b.guest.name) ? b.guest.name.toLowerCase() : "";
                const roomName = (b.room && b.room.name) ? b.room.name.toLowerCase() : "";
                const refCode = b.referenceCode ? b.referenceCode.toLowerCase() : "";
                return guestName.includes(query) || roomName.includes(query) || refCode.includes(query);
            });

            renderHostTable(filtered);
        });
    }
});
