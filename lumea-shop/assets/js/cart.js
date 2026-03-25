const statusEl = document.getElementById("cartStatus");
const listEl = document.getElementById("cartList");
const totalEl = document.getElementById("totalPrice");

function formatRSD(v) {
  return new Intl.NumberFormat("sr-RS").format(v) + " RSD";
}

function finalPrice(p) {
  if (p.discount?.active) return Math.round(p.price * (1 - p.discount.percent / 100));
  return p.price;
}

function getCart() {
  try { return JSON.parse(localStorage.getItem("lumea_cart")) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem("lumea_cart", JSON.stringify(cart));
}

function setStatus(msg, type="info") {
  statusEl.className = `status status--${type}`;
  statusEl.textContent = msg;
}

let productsIndex = new Map();

async function loadProductsIndex() {
  const res = await fetch("data/products.json");
  const data = await res.json();
  productsIndex = new Map((data.products || []).map(p => [p.id, p]));
}

function render() {
  const cart = getCart();

  if (!cart.length) {
    listEl.innerHTML = "";
    totalEl.textContent = formatRSD(0);
    setStatus("Your cart is empty.", "warn");
    return;
  }

  setStatus("");

  let total = 0;

  listEl.innerHTML = cart.map(item => {
    const p = productsIndex.get(item.id);
    if (!p) return "";
    const price = finalPrice(p);
    total += price * item.qty;

    return `
      <article class="cart-item" data-id="${p.id}">
        <img src="${p.images?.main || "assets/img/placeholder.png"}" alt="${p.name}">
        <div>
          <h3>${p.name}</h3>
          <p>${formatRSD(price)} • ${p.category}</p>
        </div>

        <div class="qty">
          <button type="button" data-dec>-</button>
          <span>${item.qty}</span>
          <button type="button" data-inc>+</button>
        </div>

        <button class="remove" type="button" data-remove>Remove</button>
      </article>
    `;
  }).join("");

  totalEl.textContent = formatRSD(total);

  // update badge
  const badge = document.getElementById("cartCount");
  if (badge) badge.textContent = String(cart.reduce((s,i)=>s+i.qty,0));
}

listEl.addEventListener("click", (e) => {
  const row = e.target.closest(".cart-item");
  if (!row) return;
  const id = Number(row.dataset.id);

  let cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;

  if (e.target.matches("[data-inc]")) item.qty += 1;
  if (e.target.matches("[data-dec]")) item.qty -= 1;
  if (e.target.matches("[data-remove]")) item.qty = 0;

  cart = cart.filter(i => i.qty > 0);
  saveCart(cart);
  render();
});

(async function init() {
  try {
    await loadProductsIndex();
    render();
  } catch (err) {
    console.error(err);
    setStatus("Failed to load cart items. Try refresh.", "error");
  }
})();
