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
  return cart.reduce((sum, item) => sum + (item.qty || 0), 0);
}

function wishCount() {
  const wish = safeParse("lumea_wishlist", []);
  return wish.length;
}

function updateBadges() {
  const cartEl = document.getElementById("cartCount");
  if (cartEl) {
    cartEl.textContent = String(cartCount());
  }

  const wishEl = document.getElementById("wishCount");
  if (wishEl) {
    wishEl.textContent = String(wishCount());
  }
}

function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (!menuToggle || !mainNav) return;

  menuToggle.addEventListener("click", function () {
    const isActive = mainNav.classList.toggle("active");
    menuToggle.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", isActive ? "true" : "false");
  });

  const navLinks = mainNav.querySelectorAll("a");
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth <= 900) {
        mainNav.classList.remove("active");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) {
      mainNav.classList.remove("active");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

fetch("partials/header.html")
  .then(function (res) {
    return res.text();
  })
  .then(function (data) {
    const header = document.getElementById("header");
    if (header) {
      header.innerHTML = data;
      updateBadges();
      initMobileMenu();
    }
  })
  .catch(function (error) {
    console.error("Header failed to load:", error);
  });

fetch("partials/footer.html")
  .then(function (res) {
    return res.text();
  })
  .then(function (data) {
    const footer = document.getElementById("footer");
    if (footer) {
      footer.innerHTML = data;
    }
  })
  .catch(function (error) {
    console.error("Footer failed to load:", error);
  });

window.addEventListener("storage", updateBadges);