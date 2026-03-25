function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function cartCount() {
  const cart = safeParse("lumea_cart", []);
  return cart.reduce((s, i) => s + (i.qty || 0), 0);
}

function wishCount() {
  const wish = safeParse("lumea_wishlist", []);
  return wish.length;
}

function updateBadges() {
  const cartEl = document.getElementById("cartCount");
  if (cartEl) cartEl.textContent = String(cartCount());

  const wishEl = document.getElementById("wishCount");
  if (wishEl) wishEl.textContent = String(wishCount());
}

fetch("partials/header.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("header").innerHTML = data;
    updateBadges();
  });

fetch("partials/footer.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;
  });

window.addEventListener("storage", updateBadges);
