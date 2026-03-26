const API_URL = "data/products.json";

const grid = document.getElementById("productGrid");
const statusEl = document.getElementById("status");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");

const categorySelect = document.getElementById("categorySelect");
const skinSelect = document.getElementById("skinSelect");
const priceRange = document.getElementById("priceRange");
const priceValue = document.getElementById("priceValue");
const saleOnly = document.getElementById("saleOnly");
const bestOnly = document.getElementById("bestOnly");

let allProducts = [];
let filteredProducts = [];

let currentPage = 1;
const pageSize = 6;

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getWishlist() {
  return safeParse("lumea_wishlist", []);
}

function saveWishlist(arr) {
  localStorage.setItem("lumea_wishlist", JSON.stringify(arr));
}

function getCart() {
  return safeParse("lumea_cart", []);
}

function saveCart(arr) {
  localStorage.setItem("lumea_cart", JSON.stringify(arr));
}

function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  const cart = getCart();
  const count = cart.reduce((s, i) => s + (i.qty || 0), 0);
  badge.textContent = String(count);
}

function updateWishBadge() {
  const badge = document.getElementById("wishCount");
  if (!badge) return;
  badge.textContent = String(getWishlist().length);
}

function formatRSD(value) {
  return new Intl.NumberFormat("sr-RS").format(value) + " RSD";
}

function finalPrice(p) {
  if (p.discount?.active) return Math.round(p.price * (1 - p.discount.percent / 100));
  return p.price;
}

function showStatus(msg, type = "info") {
  if (!statusEl) return;
  statusEl.className = `status status--${type}`;
  statusEl.textContent = msg;
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function renderProducts(list) {
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = "";
    showStatus("No products match your search.", "warn");
    if (pageInfo) pageInfo.textContent = "Page 1 / 1";
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  showStatus("");

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * pageSize;
  const pageItems = list.slice(start, start + pageSize);

  const wish = getWishlist();

  grid.innerHTML = pageItems.map(p => {
    const price = finalPrice(p);
    const hasDiscount = p.discount?.active;
    const wished = wish.includes(p.id);

    return `
      <article class="card">
        <div class="card__badge">
          ${p.flags?.bestseller ? `<span class="pill">Bestseller</span>` : ""}
          ${p.flags?.new ? `<span class="pill pill--new">New</span>` : ""}
          ${hasDiscount ? `<span class="pill pill--sale">-${p.discount.percent}%</span>` : ""}
        </div>

        <div class="card__img">
          <img src="${p.images?.main || "assets/img/placeholder.png"}" alt="${escapeHTML(p.name)}" />
        </div>

        <h3 class="card__title">
          <a class="link" href="product.html?id=${p.id}">${escapeHTML(p.name)}</a>
        </h3>

        <p class="card__meta">${escapeHTML(p.category)} • ${escapeHTML((p.skinTypes || []).join(", "))}</p>

        <div class="card__price">
          ${hasDiscount ? `<span class="old">${formatRSD(p.price)}</span>` : ""}
          <span class="now">${formatRSD(price)}</span>
        </div>

        <div class="card__actions">
          <button class="btn btn--ghost ${wished ? "saved" : ""}" type="button" data-wish="${p.id}">
            ${wished ? "♥ Saved" : "♡ Save"}
          </button>

          <button class="btn btn--primary" type="button" data-add="${p.id}">
            Add to cart
          </button>
        </div>
      </article>
    `;
  }).join("");

  if (pageInfo) pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

function applySearchAndSort() {
  const q = (searchInput?.value || "").trim().toLowerCase();
  const cat = categorySelect?.value || "all";
  const skin = skinSelect?.value || "all";
  const maxPrice = Number(priceRange?.value || 999999);
  const onlySale = !!saleOnly?.checked;
  const onlyBest = !!bestOnly?.checked;

  filteredProducts = allProducts.filter(p => {
    const hay = `${p.name} ${p.category} ${(p.tags || []).join(" ")}`.toLowerCase();
    if (q && !hay.includes(q)) return false;

    if (cat !== "all" && p.category !== cat) return false;

    if (skin !== "all") {
      const skins = p.skinTypes || [];
      if (!skins.includes(skin)) return false;
    }

    if (finalPrice(p) > maxPrice) return false;

    if (onlySale && !(p.discount?.active)) return false;
    if (onlyBest && !(p.flags?.bestseller)) return false;

    return true;
  });

  const sort = sortSelect?.value || "featured";
  filteredProducts.sort((a, b) => {
    if (sort === "price-asc") return finalPrice(a) - finalPrice(b);
    if (sort === "price-desc") return finalPrice(b) - finalPrice(a);
    if (sort === "rating-desc") return (b.rating || 0) - (a.rating || 0);
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    return 0;
  });

  currentPage = 1;
  renderProducts(filteredProducts);
}


async function loadProducts() {
  try {
    showStatus("Loading products...", "info");

    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    allProducts = data.products || [];
    filteredProducts = [...allProducts];

    if (priceValue && priceRange) priceValue.textContent = priceRange.value;

    updateCartBadge();
    updateWishBadge();

    applySearchAndSort(); 
  } catch (err) {
    console.error(err);
    showStatus("Failed to load products. Please refresh or try again later.", "error");
  }
}


if (searchInput) searchInput.addEventListener("input", applySearchAndSort);
if (sortSelect) sortSelect.addEventListener("change", applySearchAndSort);

if (categorySelect) categorySelect.addEventListener("change", applySearchAndSort);
if (skinSelect) skinSelect.addEventListener("change", applySearchAndSort);

if (priceRange) {
  priceRange.addEventListener("input", () => {
    if (priceValue) priceValue.textContent = priceRange.value;
    applySearchAndSort();
  });
}

if (saleOnly) saleOnly.addEventListener("change", applySearchAndSort);
if (bestOnly) bestOnly.addEventListener("change", applySearchAndSort);

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderProducts(filteredProducts);
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
    if (currentPage < totalPages) {
      currentPage++;
      renderProducts(filteredProducts);
    }
  });
}

if (grid) {
  grid.addEventListener("click", (e) => {
    // ADD TO CART
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      const id = Number(addBtn.dataset.add);
      const p = allProducts.find(x => x.id === id);
      if (!p) return;

      const cart = getCart();
      const existing = cart.find(i => i.id === id);

      if (existing) existing.qty += 1;
      else cart.push({ id, qty: 1 });

      saveCart(cart);
      updateCartBadge();

      showStatus(`Added to cart: ${p.name}`, "info");
      return;
    }

    //wishlist dugme
    const wishBtn = e.target.closest("[data-wish]");
    if (wishBtn) {
      const id = Number(wishBtn.dataset.wish);

      const wishlist = getWishlist();
      const idx = wishlist.indexOf(id);

      if (idx === -1) {
        wishlist.push(id);
        wishBtn.classList.add("saved");
        wishBtn.textContent = "♥ Saved";
        showStatus("Saved to wishlist.", "info");
      } else {
        wishlist.splice(idx, 1);
        wishBtn.classList.remove("saved");
        wishBtn.textContent = "♡ Save";
        showStatus("Removed from wishlist.", "warn");
      }

      saveWishlist(wishlist);
      updateWishBadge();
      return;
    }
  });
}

loadProducts();
