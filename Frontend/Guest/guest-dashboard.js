const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
}


let GetRooms = async () => {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/guest/properties",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );
        const data = await response.json();

        const masonryGrid = document.querySelector("#masonry-grid");

        const cardTypes = [
            "card-tall",
            "card-medium",
            "card-compact"
        ];

        data.data.forEach((room, index) => {

            // =========================
            // CARD
            // =========================
            const card = document.createElement("div");

            const cardType = cardTypes[index % cardTypes.length];

            card.className = `prop-card ${cardType}`;


            card.addEventListener("click", () => {
                window.location.href = `guest-property-detail.html?id=${room._id}`;
            });

            card.setAttribute(
                "aria-label",
                `${room.name}, ${room.location} — PKR ${room.pricePerNight} per night`
            );


            // =========================
            // IMAGE WRAPPER
            // =========================
            const imgWrap = document.createElement("div");
            imgWrap.className = "prop-img-wrap";


            // =========================
            // IMAGE
            // =========================
            const img = document.createElement("img");

            img.src = room.image;
            img.alt = room.name;
            img.className = "prop-img";
            img.width = 600;
            img.height = cardType === "card-tall" ? 800 : 480;
            img.loading = index === 0 ? "eager" : "lazy";


            // =========================
            // AVAILABILITY BADGE
            // =========================
            const availBadge = document.createElement("span");
            availBadge.className = "avail-badge available";
            availBadge.setAttribute("aria-label", room.status);

            const availDot = document.createElement("span");
            availDot.className = "avail-dot";
            availDot.setAttribute("aria-hidden", "true");

            availBadge.appendChild(availDot);
            availBadge.appendChild(
                document.createTextNode(room.status || "Available")
            );


            // =========================
            // PROPERTY TYPE BADGE
            // =========================
            const propBadge = document.createElement("span");
            propBadge.className = "prop-badge";
            propBadge.setAttribute(
                "aria-label",
                `Property type: ${room.propertyType}`
            );

            propBadge.textContent = room.propertyType;


            // =========================
            // OVERLAY
            // =========================
            const overlay = document.createElement("div");
            overlay.className = "prop-overlay";
            overlay.setAttribute("aria-hidden", "true");


            // =========================
            // OVERLAY TOP
            // =========================
            const overlayTop = document.createElement("div");
            overlayTop.className = "overlay-top";


            // =========================
            // WISHLIST BUTTON
            // =========================
            const wishBtn = document.createElement("button");
            wishBtn.className = "wish-btn";
            wishBtn.type = "button";
            wishBtn.tabIndex = -1;
            wishBtn.setAttribute("aria-hidden", "true");


            // Heart SVG
            const heartSvg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

            heartSvg.setAttribute("width", "16");
            heartSvg.setAttribute("height", "16");
            heartSvg.setAttribute("viewBox", "0 0 24 24");
            heartSvg.setAttribute("fill", "currentColor");
            heartSvg.setAttribute("stroke", "currentColor");
            heartSvg.setAttribute("stroke-width", "1.5");

            const heartPath = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );

            heartPath.setAttribute(
                "d",
                "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            );

            heartSvg.appendChild(heartPath);
            wishBtn.appendChild(heartSvg);


            // =========================
            // OVERLAY BOTTOM
            // =========================
            const overlayBottom = document.createElement("div");
            overlayBottom.className = "overlay-bottom";


            // =========================
            // RATING
            // =========================
            const overlayRating = document.createElement("div");
            overlayRating.className = "overlay-rating";


            // Star SVG
            const starSvg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

            starSvg.setAttribute("width", "13");
            starSvg.setAttribute("height", "13");
            starSvg.setAttribute("viewBox", "0 0 24 24");
            starSvg.setAttribute("fill", "#D4B860");
            starSvg.setAttribute("stroke", "#D4B860");
            starSvg.setAttribute("stroke-width", "1");

            const starPolygon = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "polygon"
            );

            starPolygon.setAttribute(
                "points",
                "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            );

            starSvg.appendChild(starPolygon);


            // Rating text
            const ratingText = document.createTextNode(
                room.rating || "0"
            );





            // =========================
            // PRICE
            // =========================
            const overlayPrice = document.createElement("div");
            overlayPrice.className = "overlay-price";

            overlayPrice.appendChild(
                document.createTextNode(
                    `PKR ${Number(room.pricePerNight).toLocaleString()}`
                )
            );

            const pricePer = document.createElement("span");
            pricePer.className = "price-per";
            pricePer.textContent = "/night";

            overlayPrice.appendChild(pricePer);


            // =========================
            // BUILD OVERLAY
            // =========================
            overlayTop.appendChild(wishBtn);

            overlayBottom.appendChild(overlayRating);
            overlayBottom.appendChild(overlayPrice);

            overlay.appendChild(overlayTop);
            overlay.appendChild(overlayBottom);


            // =========================
            // PROPERTY FOOTER
            // =========================
            const propFoot = document.createElement("div");
            propFoot.className = "prop-foot";


            const propFootMain = document.createElement("div");
            propFootMain.className = "prop-foot-main";


            // Property name
            const propName = document.createElement("h3");
            propName.className = "prop-name";
            propName.textContent = room.name;


            // Location
            const propLocation = document.createElement("span");
            propLocation.className = "prop-location";


            // Location SVG
            const locationSvg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

            locationSvg.setAttribute("width", "11");
            locationSvg.setAttribute("height", "11");
            locationSvg.setAttribute("viewBox", "0 0 24 24");
            locationSvg.setAttribute("fill", "none");
            locationSvg.setAttribute("stroke", "currentColor");
            locationSvg.setAttribute("stroke-width", "2.2");
            locationSvg.setAttribute("stroke-linecap", "round");
            locationSvg.setAttribute("stroke-linejoin", "round");
            locationSvg.setAttribute("aria-hidden", "true");

            const locationPath = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );

            locationPath.setAttribute(
                "d",
                "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
            );

            const locationCircle = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            );

            locationCircle.setAttribute("cx", "12");
            locationCircle.setAttribute("cy", "10");
            locationCircle.setAttribute("r", "3");

            locationSvg.appendChild(locationPath);
            locationSvg.appendChild(locationCircle);

            propLocation.appendChild(locationSvg);
            propLocation.appendChild(
                document.createTextNode(room.location)
            );


            // =========================
            // FOOTER RIGHT RATING
            // =========================
            const propFootRight = document.createElement("div");
            propFootRight.className = "prop-foot-right";


            const footerStar = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

            footerStar.setAttribute("width", "12");
            footerStar.setAttribute("height", "12");
            footerStar.setAttribute("viewBox", "0 0 24 24");
            footerStar.setAttribute("fill", "#C4A040");
            footerStar.setAttribute("stroke", "#C4A040");
            footerStar.setAttribute("stroke-width", "1");
            footerStar.setAttribute("aria-hidden", "true");

            const footerPolygon = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "polygon"
            );

            footerPolygon.setAttribute(
                "points",
                "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            );

            footerStar.appendChild(footerPolygon);

            propFootRight.appendChild(footerStar);
            propFootRight.appendChild(
                document.createTextNode(room.rating || "0")
            );


            // =========================
            // BUILD FOOTER
            // =========================
            propFootMain.appendChild(propName);
            propFootMain.appendChild(propLocation);

            propFoot.appendChild(propFootMain);
            propFoot.appendChild(propFootRight);


            // =========================
            // BUILD IMAGE WRAPPER
            // =========================
            imgWrap.appendChild(img);
            imgWrap.appendChild(availBadge);
            imgWrap.appendChild(propBadge);
            imgWrap.appendChild(overlay);


            // =========================
            // BUILD FINAL CARD
            // =========================
            card.appendChild(imgWrap);
            card.appendChild(propFoot);


            // =========================
            // APPEND TO MASONRY GRID
            // =========================
            masonryGrid.appendChild(card);
        });
    } catch (error) {
        console.error(error)
    }
};

GetRooms();