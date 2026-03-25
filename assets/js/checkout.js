const form = document.getElementById("checkoutForm");
const formStatus = document.getElementById("formStatus");

const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const city = document.getElementById("city");
const address = document.getElementById("address");
const zip = document.getElementById("zip");
const terms = document.getElementById("terms");

const err = {
  fullName: document.getElementById("errFullName"),
  email: document.getElementById("errEmail"),
  phone: document.getElementById("errPhone"),
  city: document.getElementById("errCity"),
  address: document.getElementById("errAddress"),
  zip: document.getElementById("errZip"),
  payment: document.getElementById("errPayment"),
  terms: document.getElementById("errTerms")
};

// Regex
const rxName = /^[A-Za-zÀ-žŠĐŽČĆšđžčć]{2,}(?:\s+[A-Za-zÀ-žŠĐŽČĆšđžčć]{2,})+$/;
const rxEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const rxPhone = /^(\+381|0)\s?6\d(\s?\d{3}\s?\d{3,4})$/;   // +381 64 123 4567 ili 064 123 4567
const rxZip = /^\d{5}$/;

function setStatus(msg, type = "info") {
  formStatus.className = `status status--${type}`;
  formStatus.textContent = msg;
}

function clearErrors() {
  Object.values(err).forEach(e => e.textContent = "");
  setStatus("");
}

function getPaymentValue() {
  const checked = document.querySelector('input[name="payment"]:checked');
  return checked ? checked.value : "";
}

function validate() {
  clearErrors();
  let ok = true;

  const nameVal = fullName.value.trim();
  if (!rxName.test(nameVal)) {
    err.fullName.textContent = "Enter first and last name (min 2 letters each).";
    ok = false;
  }

  const emailVal = email.value.trim();
  if (!rxEmail.test(emailVal)) {
    err.email.textContent = "Enter a valid email address.";
    ok = false;
  }

  const phoneVal = phone.value.trim();
  if (!rxPhone.test(phoneVal)) {
    err.phone.textContent = "Use format +381 64 123 4567 or 064 123 4567.";
    ok = false;
  }

  if (!city.value) {
    err.city.textContent = "Choose a city.";
    ok = false;
  }

  const addrVal = address.value.trim();
  if (addrVal.length < 6) {
    err.address.textContent = "Enter a valid address.";
    ok = false;
  }

  const zipVal = zip.value.trim();
  if (!rxZip.test(zipVal)) {
    err.zip.textContent = "ZIP must be 5 digits (e.g. 11000).";
    ok = false;
  }

  const pay = getPaymentValue();
  if (!pay) {
    err.payment.textContent = "Select payment method.";
    ok = false;
  }

  if (!terms.checked) {
    err.terms.textContent = "You must accept the terms.";
    ok = false;
  }

  if (!ok) setStatus("Please fix the highlighted fields.", "error");
  return ok;
}

// Live validation (raznovrsnost koda)
[fullName, email, phone, address, zip].forEach(inp => {
  inp.addEventListener("blur", validate);
});
city.addEventListener("change", validate);
document.querySelectorAll('input[name="payment"]').forEach(r => r.addEventListener("change", validate));
terms.addEventListener("change", validate);

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validate()) return;

  // Obrada porudžbine (demo)
  try {
    // Sačuvaj “poslednju porudžbinu” (bonus localStorage)
    const order = {
      fullName: fullName.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      city: city.value,
      address: address.value.trim(),
      zip: zip.value.trim(),
      payment: getPaymentValue(),
      createdAt: new Date().toISOString()
    };
    localStorage.setItem("lumea_last_order", JSON.stringify(order));

    // Očisti korpu
    localStorage.removeItem("lumea_cart");

    setStatus("Order placed successfully! Redirecting…", "info");

    // redirect
    setTimeout(() => {
      window.location.href = "index.html";
    }, 900);
  } catch (err) {
    console.error(err);
    setStatus("Something went wrong. Please try again.", "error");
  }
});
