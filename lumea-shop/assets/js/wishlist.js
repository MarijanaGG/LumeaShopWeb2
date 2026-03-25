const statusEl = document.getElementById("wishStatus");
const grid = document.getElementById("wishGrid");

function setStatus(msg, type="info"){
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

function getWish(){
  try { return JSON.parse(localStorage.getItem("lumea_wishlist")) || []; }
  catch { return []; }
}

function saveWish(arr){
  localStorage.setItem("lumea_wishlist", JSON.stringify(arr));
}

let products = [];

function render(){
  const wishIds = getWish();

  if (!wishIds.length){
    grid.innerHTML = "";
    setStatus("Your wishlist is empty.", "warn");
    return;
  }

  const items = products.filter(p => wishIds.includes(p.id));

  if (!items.length){
    grid.innerHTML = "";
    setStatus("Wishlist items could not be loaded.", "error");
    return;
  }

  setStatus("");

  grid.innerHTML = items.map(p => {
    const hasDiscount = p.discount?.active;
    const fp = finalPrice(p);

    return `
      <article class="card">
        <div class="card__badge">
          ${p.flags?.bestseller ? `<span class="pill">Bestseller</span>` : ""}
          ${p.flags?.new ? `<span class="pill pill--new">New</span>` : ""}
          ${hasDiscount ? `<span class="pill pill--sale">-${p.discount.percent}%</span>` : ""}
        </div>

        <div class="card__img">
          <img src="${p.images?.main || "assets/img/placeholder.png"}" alt="${p.name}" />
        </div>

        <h3 class="card__title">
          <a class="link" href="product.html?id=${p.id}">${p.name}</a>
        </h3>

        <div class="card__price">
          ${hasDiscount ? `<span class="old">${formatRSD(p.price)}</span>` : ""}
          <span class="now">${formatRSD(fp)}</span>
        </div>

        <button class="btn btn--ghost" type="button" data-remove="${p.id}">Remove</button>
        <button class="btn btn--primary" type="button" data-add="${p.id}">Add to cart</button>
      </article>
    `;
  }).join("");
}

function addToCart(id){
  const raw = localStorage.getItem("lumea_cart");
  const cart = raw ? JSON.parse(raw) : [];
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, qty: 1 });
  localStorage.setItem("lumea_cart", JSON.stringify(cart));

  const badge = document.getElementById("cartCount");
  if (badge) badge.textContent = String(cart.reduce((s,i)=>s+i.qty,0));
}

grid.addEventListener("click", (e) => {
  const rem = e.target.closest("[data-remove]");
  const add = e.target.closest("[data-add]");

  if (rem){
    const id = Number(rem.dataset.remove);
    const wish = getWish().filter(x => x !== id);
    saveWish(wish);
    const wishBadge = document.getElementById("wishCount");
if (wishBadge) wishBadge.textContent = String(wish.length);

    render();
  }

  if (add){
    const id = Number(add.dataset.add);
    addToCart(id);
    setStatus("Added to cart.", "info");
  }
});

(async function init(){
  try{
    setStatus("Loading wishlist...", "info");
    const res = await fetch("data/products.json");
    const data = await res.json();
    products = data.products || [];
    render();
  } catch(err){
    console.error(err);
    setStatus("Failed to load wishlist.", "error");
  }
})();
