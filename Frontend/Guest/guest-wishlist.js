const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
}

const cardTypes = [
    "card-tall",
    "card-medium",
    "card-compact"
];

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

let loadWishlist = async () => {
    const grid = document.getElementById("wishlist-grid");
    const countBadge = document.getElementById("wishlist-count");

    if (!grid) return;

    // Show skeletons initially
    grid.innerHTML = "";
    for (let i = 0; i < 4; i++) {
        const card = document.createElement("div");
        card.className = "prop-card skeleton";
        card.innerHTML = `
            <div class="skeleton-img"></div>
            <div class="skeleton-text-1"></div>
            <div class="skeleton-text-2"></div>
        `;
        grid.appendChild(card);
    }

    try {
        const response = await fetch("http://localhost:5000/api/guest/wishlist", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 48px 20px; text-align: center; background: #ffffff; border-radius: 18px; border: 1.5px dashed #cbd5e1;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.75" style="margin-bottom: 12px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Unable to load your wishlist</h3>
                    <p style="color: #64748b; font-size: 13.5px; margin-bottom: 16px;">Please check your connection and try again.</p>
                    <button onclick="loadWishlist()" style="padding: 9px 20px; border-radius: 9999px; background: #0D5C4E; color: #ffffff; font-size: 13px; font-weight: 600; border: none; cursor: pointer;">Try Again</button>
                </div>
            `;
            return;
        }

        const rooms = data.data || [];

        if (countBadge) {
            countBadge.textContent = `${rooms.length} ${rooms.length === 1 ? 'saved stay' : 'saved stays'}`;
        }

        grid.innerHTML = "";

        if (rooms.length === 0) {
            grid.innerHTML = `
                <div class="wishlist-empty-container">
                    <div class="wishlist-empty-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                    <h3 class="wishlist-empty-title">Your Wishlist is Empty</h3>
                    <p class="wishlist-empty-desc">Save the stays you love and they'll appear here for easy access.</p>
                    <a href="guest-dashboard.html" class="btn-explore-stays">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                        Explore Stays
                    </a>
                </div>
            `;
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
            img.src = (room.images && room.images.length > 0) ? room.images[0] : room.image;
            img.alt = room.name;
            img.className = "prop-img";
            img.width = 600;
            img.height = cardType === "card-tall" ? 800 : 480;
            img.loading = index === 0 ? "eager" : "lazy";

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
            wishBtn.className = "wish-btn saved active";
            wishBtn.type = "button";
            wishBtn.setAttribute("title", "Remove from Wishlist");

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

                // Show toast notification
                showVeyraToast("Property removed from wishlist", "remove");

                // Remove card immediately from DOM
                card.remove();

                const remainingCards = grid.querySelectorAll(".prop-card").length;
                if (countBadge) {
                    countBadge.textContent = `${remainingCards} ${remainingCards === 1 ? 'saved stay' : 'saved stays'}`;
                }

                if (remainingCards === 0) {
                    grid.innerHTML = `
                        <div class="wishlist-empty-container">
                            <div class="wishlist-empty-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            </div>
                            <h3 class="wishlist-empty-title">Your Wishlist is Empty</h3>
                            <p class="wishlist-empty-desc">Save the stays you love and they'll appear here for easy access.</p>
                            <a href="guest-dashboard.html" class="btn-explore-stays">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                                Explore Stays
                            </a>
                        </div>
                    `;
                }

                try {
                    await fetch(`http://localhost:5000/api/guest/wishlist/${room._id}`, {
                        method: "DELETE",
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                } catch (err) {
                    console.error("Remove from wishlist error:", err);
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
                    <h3 class="prop-name">${room.name}</h3>
                    <span class="prop-location">
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${room.location}
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

            grid.appendChild(card);
        });

    } catch (error) {
        console.error("Wishlist error:", error);
    }
};

const loadUserAvatar = async () => {
    try {
        const response = await fetch("http://localhost:5000/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });
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
    loadWishlist();
    loadUserAvatar();
});
