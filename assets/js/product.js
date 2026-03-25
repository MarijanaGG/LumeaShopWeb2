const statusEl = document.getElementById("productStatus");
const wrap = document.getElementById("productWrap");

const imgEl = document.getElementById("productImg");
const nameEl = document.getElementById("productName");
const metaEl = document.getElementById("productMeta");
const priceEl = document.getElementById("productPrice");
const descEl = document.getElementById("productDesc");
const ingEl = document.getElementById("productIngredients");
const badgesEl = document.getElementById("productBadges");
const addBtn = document.getElementById("addBtn");

function setStatus(msg, type="info") {
  statusEl.className = `status status--${type}`;
  statusEl.textContent = msg;
}

function formatRSD(v){
  return new Intl.NumberFormat("sr-RS").format(v) + " RSD";
}

function finalPrice(p){
  if (p.discount?.active) return Math.round(p.price * (1 - p.discount.percent/100));
  return p.price;
}

function getIdFromUrl(){
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("id"));
}

function addToCart(productId){
  const raw = localStorage.getItem("lumea_cart");
  const cart = raw ? JSON.parse(raw) : [];
  const existing = cart.find(i => i.id === productId);
  if (existing) existing.qty += 1;
  else cart.push({ id: productId, qty: 1 });
  localStorage.setItem("lumea_cart", JSON.stringify(cart));

  const badge = document.getElementById("cartCount");
  if (badge) badge.textContent = String(cart.reduce((s,i)=>s+i.qty,0));
}

function renderProduct(p){
  wrap.hidden = false;
  setStatus("");

  imgEl.src = p.images?.main || "assets/img/placeholder.png";
  imgEl.alt = p.name;

  badgesEl.innerHTML = `
    ${p.flags?.bestseller ? `<span class="pill">Bestseller</span>` : ""}
    ${p.flags?.new ? `<span class="pill pill--new">New</span>` : ""}
    ${p.discount?.active ? `<span class="pill pill--sale">-${p.discount.percent}%</span>` : ""}
  `;

  nameEl.textContent = p.name;
  metaEl.textContent = `${p.category} • ${ (p.skinTypes || []).join(", ") } • Rating ${p.rating}`;

  const fp = finalPrice(p);
  priceEl.innerHTML = `
    ${p.discount?.active ? `<span class="old">${formatRSD(p.price)}</span>` : ""}
    <span class="now">${formatRSD(fp)}</span>
  `;

  descEl.textContent = p.details?.description || "";

  const ingredients = p.details?.ingredients || [];
  ingEl.innerHTML = ingredients.map(x => `<li>${x}</li>`).join("");

  addBtn.onclick = () => {
    addToCart(p.id);
    setStatus(`Added to cart: ${p.name}`, "info");
  };

  // SEO basic per product
  document.title = `LUMÉA | ${p.name}`;
}

async function init(){
  const id = getIdFromUrl();
  if (!id) {
    setStatus("Product ID is missing. Go back to the shop.", "error");
    return;
  }

  try{
    setStatus("Loading product...", "info");
    const res = await fetch("data/products.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const products = data.products || [];
    const p = products.find(x => x.id === id);

    if (!p) {
      setStatus("Product not found (404). Go back to the shop.", "error");
      return;
    }

    renderProduct(p);
  } catch(err){
    console.error(err);
    setStatus("Failed to load product. Please try again later.", "error");
  }
}

init();
