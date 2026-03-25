import { createEggOrder, saveEggAlert } from "./firebase.js";

const products = [
  {
    id: "farmhouse-dozen",
    name: "Farmhouse Brown Dozen",
    category: "classic",
    pack: "12 eggs",
    price: 6,
    description: "12 large brown chicken eggs with rich yolks and clean shells for everyday breakfasts.",
    bestFor: "Best for everyday breakfasts",
    tag: "Best seller",
    hue: 42,
  },
  {
    id: "jumbo-dozen",
    name: "Jumbo Breakfast Dozen",
    category: "classic",
    pack: "12 jumbo eggs",
    price: 7,
    description: "Extra-large chicken eggs for hearty scrambles, breakfast sandwiches, and meal prep.",
    bestFor: "Best for bigger morning meals",
    tag: "Extra large",
    hue: 32,
  },
  {
    id: "pasture-18",
    name: "Pasture-Raised 18 Pack",
    category: "pasture",
    pack: "18 eggs",
    price: 11,
    description: "18 pasture-raised chicken eggs from hens with outdoor access and deep orange yolks.",
    bestFor: "Best for premium home kitchens",
    tag: "High demand",
    hue: 96,
  },
  {
    id: "organic-large",
    name: "Organic Large Dozen",
    category: "organic",
    pack: "12 eggs",
    price: 9,
    description: "Certified organic chicken eggs packed cold for clean, dependable weekly cooking.",
    bestFor: "Best for clean weekly cooking",
    tag: "Certified organic",
    hue: 78,
  },
  {
    id: "family-tray",
    name: "Family Tray 30",
    category: "bulk",
    pack: "30 eggs",
    price: 16,
    description: "A 30-egg tray for bigger households that cook breakfast, lunches, and baking in volume.",
    bestFor: "Best for bigger households",
    tag: "Family size",
    hue: 28,
  },
  {
    id: "baker-flat",
    name: "Baker's Flat 60",
    category: "bulk",
    pack: "60 eggs",
    price: 28,
    description: "Sixty fresh chicken eggs for bakeries, cafes, and serious home bakers.",
    bestFor: "Best for bakeries and cafes",
    tag: "Bakery pick",
    hue: 18,
  },
];

const storageKey = "sunnynest-eggs-cart";
const orderButtonLabel = "Reserve these eggs";
const filterLabels = {
  all: "all chicken eggs",
  classic: "classic chicken eggs",
  pasture: "pasture-raised chicken eggs",
  organic: "organic chicken eggs",
  bulk: "bulk chicken eggs",
};

const state = {
  filter: "all",
  cart: loadCart(),
};

const productGrid = document.querySelector("#product-grid");
const filterToolbar = document.querySelector("#filter-toolbar");
const cartCount = document.querySelector("#cart-count");
const cartItems = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const productSummary = document.querySelector("#product-summary");
const cartDrawer = document.querySelector("#cart-drawer");
const cartBackdrop = document.querySelector("#cart-backdrop");
const cartNote = document.querySelector("#cart-note");
const checkoutButton = document.querySelector("#checkout-button");
const customerNameInput = document.querySelector("#customer-name");
const customerEmailInput = document.querySelector("#customer-email");
const newsletterNote = document.querySelector("#newsletter-note");
const waitlistForm = document.querySelector(".newsletter-form");
const newsletterEmailInput = waitlistForm.querySelector("input");
const newsletterButton = waitlistForm.querySelector("button");

renderProducts();
renderCart();
setupRevealAnimations();

document.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-filter]");
  const addButton = event.target.closest("[data-add-product]");
  const scrollButton = event.target.closest("[data-scroll-target]");
  const quantityButton = event.target.closest("[data-quantity]");

  if (filterButton) {
    setFilter(filterButton.dataset.filter);
  }

  if (addButton) {
    addToCart(addButton.dataset.addProduct);
  }

  if (scrollButton) {
    const target = document.querySelector(scrollButton.dataset.scrollTarget);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (quantityButton) {
    updateQuantity(quantityButton.dataset.id, Number(quantityButton.dataset.quantity));
  }
});

filterToolbar.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const filterButton = event.target.closest("[data-filter]");
  if (!filterButton) {
    return;
  }

  event.preventDefault();
  setFilter(filterButton.dataset.filter);
});

document.querySelector("#open-cart").addEventListener("click", openCart);
document.querySelector("#close-cart").addEventListener("click", closeCart);
document.querySelector("#cart-backdrop").addEventListener("click", closeCart);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
  }
});

checkoutButton.addEventListener("click", submitEggOrder);
waitlistForm.addEventListener("submit", submitEggAlert);

function setFilter(nextFilter) {
  state.filter = nextFilter;

  document.querySelectorAll(".filter-pill").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === nextFilter);
  });

  renderProducts();
}

function renderProducts() {
  const visibleProducts =
    state.filter === "all"
      ? products
      : products.filter((product) => product.category === state.filter);

  productSummary.textContent =
    state.filter === "all"
      ? `Showing all ${visibleProducts.length} fresh chicken egg cartons.`
      : `Showing ${visibleProducts.length} ${filterLabels[state.filter]} carton${visibleProducts.length === 1 ? "" : "s"}.`;

  productGrid.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="product-card reveal is-visible">
          <div class="product-visual" style="--hue: ${product.hue}">
            <span class="product-badge">${product.tag}</span>
            <div class="product-eggs" aria-hidden="true">
              <span class="product-egg"></span>
              <span class="product-egg product-egg-alt"></span>
            </div>
          </div>
          <div class="product-meta">
            <div>
              <h3>${product.name}</h3>
              <span class="product-pack">${product.pack}</span>
            </div>
            <span class="price">${formatPrice(product.price)}</span>
          </div>
          <p>${product.description}</p>
          <div class="product-footer">
            <span class="product-tag">${product.bestFor}</span>
            <div class="product-actions">
              <span class="product-type">${filterLabels[product.category]}</span>
              <button class="product-action-button" type="button" data-add-product="${product.id}">
                Add eggs
              </button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderCart() {
  const items = getCartDetails();

  if (!items.length) {
    state.cart = [];
    cartItems.innerHTML =
      '<p class="empty-cart">Your egg basket is empty right now. Add a few chicken egg cartons and your egg total will update instantly.</p>';
    cartCount.textContent = "0";
    cartTotal.textContent = formatPrice(0);
    saveCart();
    return;
  }

  const { itemCount, subtotal } = getCartMetrics(items);

  cartItems.innerHTML = items
    .map(
      (item) => `
        <article class="cart-item">
          <div class="cart-item-copy">
            <h3>${item.name}</h3>
            <span>${item.pack} | ${formatPrice(item.price)} each</span>
          </div>
          <div class="quantity-controls" aria-label="Adjust ${item.name}">
            <button type="button" data-id="${item.id}" data-quantity="-1">-</button>
            <span>${item.quantity}</span>
            <button type="button" data-id="${item.id}" data-quantity="1">+</button>
          </div>
        </article>
      `
    )
    .join("");

  cartCount.textContent = String(itemCount);
  cartTotal.textContent = formatPrice(subtotal);
  saveCart();
}

function addToCart(productId) {
  const existingItem = state.cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({ id: productId, quantity: 1 });
  }

  cartNote.textContent = "Chicken egg carton added to your basket. Your egg basket is saved in this browser.";
  renderCart();
  openCart();
}

function updateQuantity(productId, change) {
  state.cart = state.cart
    .map((item) =>
      item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
    )
    .filter((item) => item.quantity > 0);

  renderCart();
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  cartBackdrop.hidden = false;
  document.body.classList.add("cart-open");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartBackdrop.hidden = true;
  document.body.classList.remove("cart-open");
}

async function submitEggAlert(event) {
  event.preventDefault();

  const email = newsletterEmailInput.value.trim();
  if (!looksLikeEmail(email)) {
    newsletterNote.textContent = "Enter a valid email address to receive egg updates.";
    newsletterEmailInput.focus();
    return;
  }

  newsletterButton.disabled = true;
  newsletterButton.textContent = "Saving...";
  newsletterNote.textContent = "Saving your egg alert...";

  try {
    await saveEggAlert(email);
    newsletterNote.textContent = `Thanks, ${email} will receive chicken egg restocks and route updates.`;
    newsletterEmailInput.value = "";
  } catch (error) {
    console.error(error);
    newsletterNote.textContent = "We could not save your egg alert right now. Please try again.";
  } finally {
    newsletterButton.disabled = false;
    newsletterButton.textContent = "Join egg updates";
  }
}

async function submitEggOrder() {
  const items = getCartDetails();

  if (!items.length) {
    cartNote.textContent = "Add a few chicken egg cartons first, then reserve your chilled egg delivery.";
    return;
  }

  const name = customerNameInput.value.trim();
  const email = customerEmailInput.value.trim();

  if (!name) {
    cartNote.textContent = "Enter your name so we can save your chicken egg request.";
    customerNameInput.focus();
    return;
  }

  if (!looksLikeEmail(email)) {
    cartNote.textContent = "Enter a valid email so we can confirm your chicken egg request.";
    customerEmailInput.focus();
    return;
  }

  const { itemCount, subtotal } = getCartMetrics(items);

  checkoutButton.disabled = true;
  checkoutButton.textContent = "Saving...";
  cartNote.textContent = "Saving your chicken egg basket to Firebase...";

  try {
    const docRef = await createEggOrder({
      name,
      email,
      itemCount,
      subtotal,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        pack: item.pack,
        price: item.price,
        quantity: item.quantity,
      })),
    });

    state.cart = [];
    renderCart();
    resetOrderForm();
    cartNote.textContent = `Your chicken egg request was saved. Reference: ${docRef.id.slice(0, 8)}.`;
  } catch (error) {
    console.error(error);
    cartNote.textContent = "We could not save your chicken egg request right now. Please try again.";
  } finally {
    checkoutButton.disabled = false;
    checkoutButton.textContent = orderButtonLabel;
  }
}

function getCartDetails() {
  return state.cart
    .map((item) => {
      const product = products.find((productEntry) => productEntry.id === item.id);

      if (!product) {
        return null;
      }

      return {
        id: item.id,
        name: product.name,
        pack: product.pack,
        price: product.price,
        quantity: item.quantity,
      };
    })
    .filter(Boolean);
}

function getCartMetrics(items) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return { itemCount, subtotal };
}

function resetOrderForm() {
  customerNameInput.value = "";
  customerEmailInput.value = "";
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function saveCart() {
  window.localStorage.setItem(storageKey, JSON.stringify(state.cart));
}

function loadCart() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      return [];
    }

    const validIds = new Set(products.map((product) => product.id));
    return JSON.parse(saved).filter(
      (item) =>
        item &&
        validIds.has(item.id) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );
  } catch (error) {
    return [];
  }
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function setupRevealAnimations() {
  const revealItems = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealItems.forEach((item) => observer.observe(item));
}
