const products = [
  {id:"pillow-pair",name:"Cặp ruột gối nằm bông gòn cao cấp",size:"45 × 65 CM · 2 CHIẾC",description:"Gối phồng đều, độ cao vừa phải, hợp nằm ngửa & nằm nghiêng. Bán theo cặp cotton mềm mại.",price:229000,oldPrice:279000,badge:"Bán chạy nhất",badgeClass:"",category:["pain"],image:"assets/images/white-pillow.png"},
  {id:"body-pillow",name:"Ruột gối ôm dài người lớn Mộng Mơ",size:"35 × 100 CM",description:"Thân dài, hai đầu bo tròn, kẹp giữa hai chân khi nằm nghiêng giúp hông thẳng hàng.",price:149000,oldPrice:179000,badge:"Tựa hông thẳng",badgeClass:"green",category:["relax"],image:"assets/images/bolster-pillow.png"},
  {id:"kids-pillow",name:"Gối ngủ trẻ em thêu khủng long",size:"30 × 50 CM",description:"Mặt gối chân ôm mềm mại, viền sóng xanh êm ái cho bé từ 2 tuổi ngủ sâu giấc.",price:159000,oldPrice:189000,badge:"Bé thích",badgeClass:"blue",category:["family"],image:"assets/images/pillow-collection.png"},
  {id:"pregnancy-pillow",name:"Gối ôm chữ U cho mẹ bầu Mộng Mơ",size:"140 × 70 CM · GỐI ÔM CHỮ U",description:"Thiết kế ôm dài hai bên giúp mẹ bầu kê đỡ bụng và lưng khi nằm nghỉ. Vỏ gối mềm mại, có thể tháo giặt.",price:489000,oldPrice:550000,badge:"Nâng đỡ toàn thân",badgeClass:"purple",category:["relax"],image:"assets/images/bed-pillow-set.png"},
  {id:"rolled-quilt",name:"Chăn cuộn chần bông Mộng Mơ",size:"CHĂN CHẦN BÔNG · CUỘN GỌN",description:"Chăn chần bông mềm mại, có thể cuộn gọn để cất giữ khi không sử dụng.",price:489000,oldPrice:550000,badge:"Gọn nhẹ",badgeClass:"purple",category:["bedding"],image:"assets/images/rolled-quilt.png"},
  {id:"quilted-mat",name:"Thảm chần bông Mộng Mơ",size:"THẢM CHẦN BÔNG",description:"Thảm chần bông êm ái, dùng làm lớp trải nghỉ ngơi trong không gian gia đình.",price:489000,oldPrice:550000,badge:"Êm ái",badgeClass:"green",category:["bedding"],image:"assets/images/quilted-floor-mat.png"},
  {id:"bedding-set",name:"Bộ chăn ga gối Mộng Mơ",size:"BỘ CHĂN GA GỐI",description:"Bộ chăn ga gối tông màu dịu nhẹ, tạo cảm giác ấm cúng cho không gian phòng ngủ.",price:699000,oldPrice:799000,badge:"Bộ bán chạy",badgeClass:"",category:["bedding"],image:"assets/images/bedroom-bedding.png"}
];
const formatPrice = value => new Intl.NumberFormat("vi-VN").format(value) + "đ";
const cartKey = "mongmo-cart-v1";
let cart = loadCart();
let activeCategory = "all";
let query = "";
let toastTimer;
let selectedProductId = null;
let accountMode = "login";
let currentUser = loadUser();
let checkoutAfterLogin = false;

function normalizeSearchText(value) {
  return value.toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function loadUser() {
  try { return JSON.parse(sessionStorage.getItem("mongmo-demo-user") || "null"); }
  catch (error) { console.warn("Không thể đọc phiên tài khoản demo:", error); return null; }
}
function loadReviews() {
  try {
    const stored = JSON.parse(localStorage.getItem("mongmo-reviews-v1") || "[]");
    return Array.isArray(stored) ? stored.filter(review =>
      products.some(product => product.id === review.productId) &&
      typeof review.name === "string" && typeof review.comment === "string" &&
      Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5
    ) : [];
  } catch (error) {
    console.warn("Không thể đọc đánh giá đã lưu:", error);
    return [];
  }
}
let customerReviews = loadReviews();

function loadCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(cartKey) || "[]");
    return Array.isArray(stored) ? stored.filter(item => products.some(product => product.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch (error) {
    console.warn("Không thể đọc giỏ hàng đã lưu:", error);
    return [];
  }
}
function saveCart() {
  try { localStorage.setItem(cartKey, JSON.stringify(cart)); }
  catch (error) { showToast("Không thể lưu giỏ hàng trên thiết bị này."); console.error(error); }
}
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function renderProducts() {
  const grid = document.querySelector("#productGrid");
  const searchTerms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  const filtered = products.filter(product => {
    const categoryMatch = activeCategory === "all" || product.category.includes(activeCategory);
    const categoryNames = product.category.map(category => ({
      pain: "goi nam",
      family: "goi cho be gia dinh",
      relax: "goi om tu tua thu gian",
      bedding: "chan tham chan ga goi"
    }[category] || category)).join(" ");
    const text = normalizeSearchText(`${product.name} ${product.size} ${product.description} ${product.badge} ${categoryNames}`);
    return categoryMatch && searchTerms.every(term => text.includes(term));
  });
  grid.innerHTML = filtered.map(product => `<article class="product-card">
    <button class="product-image product-detail-trigger" data-detail="${product.id}" aria-label="Xem chi tiết ${product.name}"><img src="${product.image}" alt="${product.name}" loading="lazy"><span class="product-badge ${product.badgeClass}">${product.badge}</span><span class="image-view-label">Xem chi tiết ↗</span></button>
    <div class="product-info"><span class="product-size">${product.size}</span><button class="product-name-button" data-detail="${product.id}">${product.name}</button><div class="card-rating"><span>★★★★★</span> <small>${reviewCount(product.id) ? `${averageRating(product.id)} · ${reviewCount(product.id)} đánh giá` : "Chưa có đánh giá"}</small></div><p>${product.description}</p>
      <div class="product-bottom"><span class="product-prices"><strong class="price">${formatPrice(product.price)}</strong><s class="old-price">${formatPrice(product.oldPrice)}</s></span><span class="product-actions"><button class="add-button cart-icon-button" data-add="${product.id}" aria-label="Thêm ${product.name} vào giỏ hàng" title="Thêm vào giỏ hàng"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.4L22 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg></button><button class="buy-now-button" data-buy="${product.id}">Mua ngay</button></span></div>
    </div></article>`).join("");
  document.querySelector("#emptyProducts").classList.toggle("hidden", filtered.length > 0);
    const resultLabel = document.querySelector("#searchStatus");
    resultLabel.textContent = searchTerms.length
      ? `Tìm thấy ${filtered.length} trong ${products.length} sản phẩm${query ? ` cho “${query}”` : ""}.`
      : `Đang hiển thị ${filtered.length} sản phẩm.`;
}
function reviewCount(productId) {
  return customerReviews.filter(review => review.productId === productId).length;
}
function averageRating(productId) {
  const reviews = customerReviews.filter(review => review.productId === productId);
  if (!reviews.length) return "0.0";
  return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
}
function renderReviewCards(container, reviews) {
  container.replaceChildren();
  if (!reviews.length) {
    const empty = document.createElement("p");
    empty.className = "detail-empty-review";
    empty.textContent = "Chưa có đánh giá cho sản phẩm này. Hãy là người đầu tiên chia sẻ nhé!";
    container.append(empty);
    return;
  }
  reviews.forEach(review => {
    const card = document.createElement("article");
    card.className = "detail-review-card";
    const heading = document.createElement("div");
    heading.className = "detail-review-heading";
    const name = document.createElement("b");
    name.textContent = review.name;
    const stars = document.createElement("span");
    stars.className = "stars";
    stars.textContent = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    heading.append(name, stars);
    const comment = document.createElement("p");
    comment.textContent = review.comment;
    const date = document.createElement("small");
    date.textContent = review.date || "Đánh giá gần đây";
    card.append(heading, comment, date);
    container.append(card);
  });
}
function renderCustomerReviews() {
  const container = document.querySelector("#customerReviews");
  container.replaceChildren();
  customerReviews.slice(0, 6).forEach(review => {
    const product = products.find(item => item.id === review.productId);
    if (!product) return;
    const card = document.createElement("article");
    card.className = "customer-review-card";
    const productName = document.createElement("span");
    productName.className = "customer-review-product";
    productName.textContent = product.name;
    const heading = document.createElement("div");
    heading.className = "detail-review-heading";
    const name = document.createElement("b");
    name.textContent = review.name;
    const stars = document.createElement("span");
    stars.className = "stars";
    stars.textContent = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    heading.append(name, stars);
    const comment = document.createElement("p");
    comment.textContent = review.comment;
    card.append(productName, heading, comment);
    container.append(card);
  });
}
function openProductDetail(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;
  selectedProductId = productId;
  document.querySelector("#detailImage").src = product.image;
  document.querySelector("#detailImage").alt = product.name;
  document.querySelector("#detailBadge").textContent = product.badge;
  document.querySelector("#detailName").textContent = product.name;
  document.querySelector("#detailPrice").textContent = formatPrice(product.price);
  document.querySelector("#detailDescription").textContent = `${product.description} Kích thước: ${product.size}. Giá cũ ${formatPrice(product.oldPrice)}.`;
  document.querySelector("#detailRatingText").textContent = reviewCount(productId) ? `${averageRating(productId)}/5 · ${reviewCount(productId)} đánh giá` : "Chưa có đánh giá";
  document.querySelector("#detailStars").textContent = reviewCount(productId) ? "★".repeat(Math.round(Number(averageRating(productId)))) + "☆".repeat(5 - Math.round(Number(averageRating(productId)))) : "☆☆☆☆☆";
  renderReviewCards(document.querySelector("#detailReviewList"), customerReviews.filter(review => review.productId === productId));
  document.querySelector("#productModal").classList.remove("hidden");
}
function saveReview(productId, rating, comment) {
  const review = {
    productId,
    rating,
    comment,
    name: currentUser?.name || "Khách hàng",
    date: new Intl.DateTimeFormat("vi-VN").format(new Date())
  };
  customerReviews.unshift(review);
  try { localStorage.setItem("mongmo-reviews-v1", JSON.stringify(customerReviews)); }
  catch (error) {
    customerReviews.shift();
    showToast("Không thể lưu đánh giá trong trình duyệt này.");
    console.error("Không thể lưu đánh giá:", error);
    return false;
  }
  renderProducts();
  renderCustomerReviews();
  if (selectedProductId) openProductDetail(selectedProductId);
  showToast("Cảm ơn bạn đã gửi đánh giá!");
  return true;
}
function addToCart(id, quantity = 1) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const existing = cart.find(item => item.id === id);
  if (existing) existing.quantity += quantity;
  else cart.push({id, quantity});
  saveCart();
  renderCart();
  showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
}
function updateQuantity(id, amount) {
  const item = cart.find(entry => entry.id === id);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== id);
  saveCart();
  renderCart();
}
function renderCart() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelector("#cartCount").textContent = count;
  document.querySelector("#drawerCount").textContent = `(${count})`;
  document.querySelector("#cartEmpty").classList.toggle("hidden", count > 0);
  document.querySelector("#cartSummary").classList.toggle("hidden", count === 0);
  const subtotal = cart.reduce((total, item) => total + products.find(product => product.id === item.id).price * item.quantity, 0);
  document.querySelector("#cartSubtotal").textContent = formatPrice(subtotal);
  document.querySelector("#cartItems").innerHTML = cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    return `<article class="cart-line"><img src="${product.image}" alt=""><div><h3>${product.name}</h3><span>${formatPrice(product.price)}</span><div class="quantity-control"><button data-quantity="-1" data-id="${item.id}" aria-label="Giảm số lượng">−</button><span>${item.quantity}</span><button data-quantity="1" data-id="${item.id}" aria-label="Tăng số lượng">+</button></div></div><strong>${formatPrice(product.price * item.quantity)}</strong></article>`;
  }).join("");
}
function openCart() {
  document.querySelector("#cartDrawer").classList.add("open");
  document.querySelector("#cartDrawer").setAttribute("aria-hidden", "false");
  document.querySelector("#drawerBackdrop").classList.remove("hidden");
}
function closeCart() {
  document.querySelector("#cartDrawer").classList.remove("open");
  document.querySelector("#cartDrawer").setAttribute("aria-hidden", "true");
  document.querySelector("#drawerBackdrop").classList.add("hidden");
}

document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) addToCart(addButton.dataset.add);
  const buyButton = event.target.closest("[data-buy]");
  if (buyButton) {
    addToCart(buyButton.dataset.buy);
    openCheckout();
  }
  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) updateQuantity(quantityButton.dataset.id, Number(quantityButton.dataset.quantity));
});
document.querySelector("#openCart").addEventListener("click", openCart);
document.querySelector("#closeCart").addEventListener("click", closeCart);
document.querySelector("#drawerBackdrop").addEventListener("click", closeCart);
document.querySelector("#continueShopping").addEventListener("click", closeCart);
document.querySelector("#checkoutButton").addEventListener("click", openCheckout);
function openCheckout() {
  if (!cart.length) {
    showToast("Giỏ hàng đang trống.");
    return;
  }
  closeCart();
  if (!currentUser) {
    checkoutAfterLogin = true;
    setAccountMode("login", "Đăng nhập để thanh toán");
    document.querySelector("#accountModal").classList.remove("hidden");
    showToast("Vui lòng đăng nhập hoặc đăng ký để tiếp tục thanh toán.");
    return;
  }
  const subtotal = cart.reduce((total, item) => total + products.find(product => product.id === item.id).price * item.quantity, 0);
  const shipping = subtotal >= 500000 ? 0 : 30000;
  document.querySelector("#checkoutItems").replaceChildren();
  cart.forEach(item => {
    const product = products.find(entry => entry.id === item.id);
    const row = document.createElement("div");
    row.className = "checkout-item";
    const name = document.createElement("span");
    name.textContent = `${product.name} × ${item.quantity}`;
    const price = document.createElement("b");
    price.textContent = formatPrice(product.price * item.quantity);
    row.append(name, price);
    document.querySelector("#checkoutItems").append(row);
  });
  document.querySelector("#checkoutShipping").textContent = shipping ? formatPrice(shipping) : "Miễn phí";
  document.querySelector("#checkoutTotal").textContent = formatPrice(subtotal + shipping);
  document.querySelector("#checkoutForm").classList.remove("hidden");
  document.querySelector(".checkout-layout").classList.remove("hidden");
  document.querySelector("#orderSuccess").classList.add("hidden");
  document.querySelector("#checkoutModal").classList.remove("hidden");
  if (currentUser?.name) {
    const nameInput = document.querySelector("#checkoutForm [name=name]");
    nameInput.value = currentUser.name;
    document.querySelector("#checkoutForm [name=email]").value = currentUser.email || "";
  }
}
document.querySelector("#categoryFilters").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  document.querySelectorAll(".filter-pill").forEach(pill => pill.classList.toggle("active", pill === button));
  renderProducts();
});
document.querySelector(".discovery-grid").addEventListener("click", event => {
  const card = event.target.closest("[data-shop-category]");
  if (!card) return;
  activeCategory = card.dataset.shopCategory;
  document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.classList.toggle("active", pill.dataset.category === activeCategory);
  });
  renderProducts();
  document.querySelector("#products").scrollIntoView({behavior:"smooth"});
});
const searchInput = document.querySelector("#searchInput");
const searchClear = document.querySelector("#searchClear");
searchInput.addEventListener("input", event => {
  query = event.target.value.trim();
  searchClear.classList.toggle("hidden", !event.target.value);
  renderProducts();
});
document.querySelector("#searchForm").addEventListener("submit", event => {
  event.preventDefault();
  document.querySelector("#products").scrollIntoView({behavior:"smooth"});
});
searchClear.addEventListener("click", () => {
  searchInput.value = "";
  query = "";
  searchClear.classList.add("hidden");
  renderProducts();
  searchInput.focus();
});
document.querySelector("#mobileMenu").addEventListener("click", () => document.querySelector(".main-nav").classList.toggle("mobile-open"));
document.querySelectorAll(".main-nav a").forEach(link => link.addEventListener("click", () => document.querySelector(".main-nav").classList.remove("mobile-open")));
document.querySelector("#welcomeButton").addEventListener("click", () => {
  if (currentUser) {
    if (confirm(`Bạn đang đăng nhập dưới tên ${currentUser.name}. Đăng xuất khỏi phiên demo?`)) {
      sessionStorage.removeItem("mongmo-demo-user");
      currentUser = null;
      renderAccount();
    }
    return;
  }
  document.querySelector("#accountModal").classList.remove("hidden");
});
document.addEventListener("click", event => {
  const detailButton = event.target.closest("[data-detail]");
  if (detailButton) openProductDetail(detailButton.dataset.detail);
  const closeButton = event.target.closest("[data-close-modal]");
  if (closeButton) closeButton.closest(".modal-backdrop").classList.add("hidden");
  if (event.target.classList.contains("modal-backdrop")) event.target.classList.add("hidden");
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") document.querySelectorAll(".modal-backdrop:not(.hidden)").forEach(modal => modal.classList.add("hidden"));
});
document.querySelector("#detailAdd").addEventListener("click", () => {
  if (!selectedProductId) return;
  addToCart(selectedProductId);
  document.querySelector("#productModal").classList.add("hidden");
});
document.querySelector("#detailBuy").addEventListener("click", () => {
  if (!selectedProductId) return;
  addToCart(selectedProductId);
  document.querySelector("#productModal").classList.add("hidden");
  openCheckout();
});
function renderAccount() {
  document.querySelector("#accountLabel").textContent = currentUser ? `Xin chào, ${currentUser.name}` : "Đăng nhập / Đăng ký";
  document.querySelector("#accountSub").textContent = currentUser ? currentUser.email : "Tài khoản Mộng Mơ";
  document.querySelector(".avatar").textContent = currentUser?.name?.trim().charAt(0).toUpperCase() || "M";
  document.querySelector(".avatar").classList.toggle("hidden", !currentUser);
  document.querySelector("#welcomeButton").classList.toggle("is-logged-in", Boolean(currentUser));
}
function setAccountMode(mode, title) {
  accountMode = mode;
  document.querySelectorAll("[data-account-tab]").forEach(button => button.classList.toggle("active", button.dataset.accountTab === mode));
  document.querySelector("#accountTitle").textContent = title || (mode === "login" ? "Chào mừng bạn" : "Tạo tài khoản mới");
  document.querySelector("#accountSubmit").textContent = mode === "login" ? "Đăng nhập" : "Tạo tài khoản";
  const nameInput = document.querySelector("#accountForm [name=name]");
  nameInput.closest("label").classList.toggle("hidden", mode !== "register");
  nameInput.required = mode === "register";
  document.querySelector("#accountForm [name=password]").autocomplete = mode === "login" ? "current-password" : "new-password";
}
document.querySelectorAll("[data-account-tab]").forEach(tab => tab.addEventListener("click", () => {
  setAccountMode(tab.dataset.accountTab);
}));
document.querySelector("#accountForm").addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get("email")).trim();
  const name = accountMode === "register" ? String(form.get("name")).trim() : email.split("@")[0];
  if (!name || !email) return;
  currentUser = {name, email};
  try { sessionStorage.setItem("mongmo-demo-user", JSON.stringify(currentUser)); }
  catch (error) { console.warn("Không thể lưu phiên tài khoản demo:", error); }
  renderAccount();
  document.querySelector("#accountModal").classList.add("hidden");
  showToast(`Xin chào ${name}! Đây là phiên đăng nhập demo.`);
  event.currentTarget.reset();
  document.querySelector("#accountForm [name=name]").closest("label").classList.add("hidden");
  document.querySelector("#accountForm [name=name]").required = false;
  setAccountMode("login");
  const continueToCheckout = checkoutAfterLogin;
  checkoutAfterLogin = false;
  if (continueToCheckout) openCheckout();
});
document.querySelector("#detailReviewForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!selectedProductId) return;
  const form = new FormData(event.currentTarget);
  if (saveReview(selectedProductId, Number(form.get("rating")), String(form.get("comment")).trim())) event.currentTarget.reset();
});
document.querySelector("#checkoutForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!cart.length) {
    showToast("Giỏ hàng đã trống, vui lòng thêm sản phẩm.");
    return;
  }
  const form = new FormData(event.currentTarget);
  const buyer = String(form.get("name")).trim();
  const orderNumber = `MM${Date.now().toString().slice(-8)}`;
  document.querySelector("#orderMessage").textContent = `${buyer}, mã đơn hàng demo của bạn là ${orderNumber}. Chưa có đơn hàng hoặc giao dịch thật nào được gửi đi.`;
  cart = [];
  saveCart();
  renderCart();
  document.querySelector("#checkoutForm").classList.add("hidden");
  document.querySelector(".checkout-layout").classList.add("hidden");
  document.querySelector("#orderSuccess").classList.remove("hidden");
});

async function initViewer() {
  const canvas = document.querySelector("#productCanvas");
  const stage = document.querySelector("#viewerStage");
  let THREE;
  let renderer;
  try {
    THREE = await import("three");
  } catch (error) {
    document.querySelector("#viewerFallback").classList.remove("hidden");
    canvas.classList.add("hidden");
    console.error("Không thể tải thư viện 3D:", error);
    return;
  }
  try {
    renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  } catch (error) {
    document.querySelector("#viewerFallback").classList.remove("hidden");
    canvas.classList.add("hidden");
    console.error("Không thể khởi tạo mô hình 3D:", error);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 100);
  camera.position.set(0, 0, 6);
  scene.add(new THREE.HemisphereLight(0xfff4e8, 0x44333b, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(-3, 5, 6);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xe5a9b8, 1.7);
  rimLight.position.set(4, -2, -3);
  scene.add(rimLight);
  const pillowShape = new THREE.Shape();
  const x = -1.65, y = -.92, width = 3.3, height = 1.84, radius = .32;
  pillowShape.moveTo(x + radius, y);
  pillowShape.lineTo(x + width - radius, y);
  pillowShape.quadraticCurveTo(x + width, y, x + width, y + radius);
  pillowShape.lineTo(x + width, y + height - radius);
  pillowShape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  pillowShape.lineTo(x + radius, y + height);
  pillowShape.quadraticCurveTo(x, y + height, x, y + height - radius);
  pillowShape.lineTo(x, y + radius);
  pillowShape.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ExtrudeGeometry(pillowShape, {depth:.72, bevelEnabled:true, bevelSegments:8, steps:1, bevelSize:.19, bevelThickness:.19, curveSegments:12});
  geometry.center();
  const material = new THREE.MeshStandardMaterial({color:0xf8f3ed, roughness:.83});
  const pillow = new THREE.Mesh(geometry, material);
  pillow.rotation.set(-.16, -.25, -.1);
  scene.add(pillow);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), new THREE.MeshBasicMaterial({color:0x171316, transparent:true, opacity:.28}));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.3;
  shadow.scale.set(1.35,.4,1);
  scene.add(shadow);
  const resize = () => {
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  let dragging = false, previousX = 0, previousY = 0;
  canvas.addEventListener("pointerdown", event => {dragging=true;previousX=event.clientX;previousY=event.clientY;canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener("pointermove", event => {
    if (!dragging) return;
    pillow.rotation.y += (event.clientX-previousX)*.009;
    pillow.rotation.x += (event.clientY-previousY)*.007;
    previousX=event.clientX;previousY=event.clientY;
  });
  canvas.addEventListener("pointerup", () => dragging=false);
  canvas.addEventListener("pointercancel", () => dragging=false);
  document.querySelectorAll(".swatch").forEach(swatch => swatch.addEventListener("click", () => {
    material.color.set(swatch.dataset.color);
    document.querySelectorAll(".swatch").forEach(button => button.classList.toggle("selected", button === swatch));
  }));
  document.querySelector("#vrButton").addEventListener("click", async () => {
    if (!navigator.xr || !renderer.xr) {
      showToast("Trình duyệt hoặc thiết bị chưa hỗ trợ VR. Thử Chrome trên thiết bị tương thích.");
      return;
    }
    try {
      const supported = await navigator.xr.isSessionSupported("immersive-vr");
      if (!supported) { showToast("Thiết bị chưa hỗ trợ chế độ VR."); return; }
      const session = await navigator.xr.requestSession("immersive-vr", {optionalFeatures:["local-floor"]});
      renderer.xr.enabled = true;
      await renderer.xr.setSession(session);
    } catch (error) {
      showToast("Không thể khởi động VR. Hãy kiểm tra quyền truy cập thiết bị.");
      console.error("Không thể khởi động VR:", error);
    }
  });
  renderer.setAnimationLoop(() => {
    if (!dragging && !renderer.xr.isPresenting) pillow.rotation.y += .0025;
    renderer.render(scene, camera);
  });
}
renderProducts();
renderCart();
renderCustomerReviews();
renderAccount();
initViewer();
