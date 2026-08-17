/**
 * VEYRA Global Loader Utility Component (Premium Edition)
 */

function ensureVeyraLoaderElement() {
    let loader = document.getElementById("veyra-global-loader");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "veyra-global-loader";
        loader.className = "veyra-loader";
        loader.innerHTML = `
            <div class="veyra-loader-content">
                <div class="veyra-loader-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0D5C4E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                </div>
                <div class="veyra-loader-text">
                    Loading<span class="dots-wrapper"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span>
                </div>
            </div>
        `;
        if (document.body) {
            document.body.prepend(loader);
        }
    }
    return loader;
}

function showVeyraLoader() {
    const loader = ensureVeyraLoaderElement();
    if (!loader) return;
    loader.style.display = "flex";
    loader.classList.remove("hidden");
}

function hideVeyraLoader() {
    const loader = document.getElementById("veyra-global-loader");
    if (!loader) return;
    loader.classList.add("hidden");
    setTimeout(() => {
        loader.style.display = "none";
    }, 250);
}
