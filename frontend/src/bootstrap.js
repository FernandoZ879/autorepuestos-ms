import { showView } from './ui/router.js';
import { login, register, getProfile } from './api/auth.js';
import { fetchProducts, fetchStock, fetchStores } from './api/catalog.js';
import { handleExcelUpload } from './excel/import.js';

// Global State
window.currentUser = null;
window.cart = [];
window.globalProducts = [];
window.globalStock = [];
window.globalStores = [];
window.currentDetailProductId = null;

// Expose functions to window for HTML onclick handlers
window.showView = showView;
window.handleExcelUpload = (input) => handleExcelUpload(input.files[0], () => window.loadCatalog());

// Auth Functions
window.showLoginModal = () => {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('loginModal').classList.add('flex');
};

window.closeLoginModal = () => {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('loginModal').classList.remove('flex');
};

let isLoginMode = true;
window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    const title = document.querySelector('#loginModal h3');
    const authBtn = document.getElementById('authActionBtn');
    const toggleBtn = document.getElementById('authToggleBtn');
    const nameField = document.getElementById('nameField');
    const roleField = document.getElementById('roleField');

    if (isLoginMode) {
        title.textContent = 'Iniciar Sesión';
        authBtn.textContent = 'Ingresar';
        authBtn.onclick = window.login;
        toggleBtn.textContent = '¿No tienes cuenta? Regístrate';
        nameField.classList.add('hidden');
        roleField.classList.add('hidden');
    } else {
        title.textContent = 'Registrarse';
        authBtn.textContent = 'Registrarse';
        authBtn.onclick = window.register;
        toggleBtn.textContent = '¿Ya tienes cuenta? Inicia Sesión';
        nameField.classList.remove('hidden');
        roleField.classList.remove('hidden');
    }
};

window.login = async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const data = await login(email, password);
        sessionStorage.setItem('token', data.token);
        window.currentUser = { name: data.name, role: data.role, email };
        updateUIForLoggedInUser();
        window.closeLoginModal();
        if (window.currentUser.role === 'ADMIN' || window.currentUser.role === 'MANAGER') {
            showView('admin');
        }
        alert(`Bienvenido, ${window.currentUser.name}!`);
    } catch (e) {
        alert(e.message);
    }
};

window.register = async () => {
    const name = document.getElementById('loginName').value;
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;
    try {
        await register(name, email, password, role);
        alert('Registro exitoso. Por favor inicia sesión.');
        window.toggleAuthMode();
    } catch (e) {
        alert(e.message);
    }
};

window.logout = () => {
    sessionStorage.removeItem('token');
    window.currentUser = null;
    updateUIForLoggedOutUser();
    showView('home');
};

function updateUIForLoggedInUser() {
    if (!window.currentUser) return;
    document.getElementById('loginBtn').classList.add('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    if (window.currentUser.role === 'ADMIN' || window.currentUser.role === 'MANAGER') {
        document.getElementById('adminBtn').classList.remove('hidden');
        document.getElementById('adminCard').classList.remove('hidden');
    }
}

function updateUIForLoggedOutUser() {
    document.getElementById('loginBtn').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    document.getElementById('adminBtn').classList.add('hidden');
    document.getElementById('adminCard').classList.add('hidden');
}

// Catalog Functions
window.loadCatalog = async () => {
    try {
        const [products, stock, stores] = await Promise.all([
            fetchProducts(),
            fetchStock(),
            fetchStores()
        ]);
        window.globalProducts = products;
        window.globalStock = stock;
        window.globalStores = stores;

        const storeFilter = document.getElementById('storeFilter');
        if (storeFilter) {
            storeFilter.innerHTML = '<option value="">Todas las Tiendas</option>';
            stores.forEach(store => {
                storeFilter.innerHTML += `<option value="${store.id}">${store.name}</option>`;
            });
        }
        renderCatalogGrid(products, stock);
    } catch (e) {
        console.error(e);
        const grid = document.getElementById('catalogGrid');
        if (grid) grid.innerHTML = '<p class="text-red-500">Error cargando el catálogo.</p>';
    }
    lucide.createIcons();
};

window.filterByStore = () => {
    const storeId = document.getElementById('storeFilter').value;
    renderCatalogGrid(window.globalProducts, window.globalStock, storeId);
};

function renderCatalogGrid(products, stock, filterStoreId = null) {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;
    grid.innerHTML = '';

    products.forEach(product => {
        const productStock = stock.filter(s => s.product_id === product.id);
        let totalStock = 0;
        let showProduct = true;
        let stockText = '';

        if (filterStoreId) {
            const storeStock = productStock.find(s => s.store_id == filterStoreId);
            if (!storeStock || storeStock.quantity === 0) {
                showProduct = false;
            } else {
                totalStock = storeStock.quantity;
                stockText = `Stock en tienda: ${totalStock}`;
            }
        } else {
            totalStock = productStock.reduce((sum, s) => sum + s.quantity, 0);
            stockText = `Stock total: ${totalStock}`;
        }

        if (showProduct) {
            const maxStock = Math.max(...productStock.map(s => s.quantity), 1);
            const stockBars = productStock.map(s => {
                const width = (s.quantity / maxStock) * 100;
                const color = s.quantity > 5 ? 'bg-green-500' : s.quantity > 2 ? 'bg-yellow-500' : 'bg-red-500';
                return `<div class="stock-bar ${color}" style="width: ${width}%" title="${s.store_name}: ${s.quantity}"></div>`;
            }).join('');

            grid.innerHTML += `
                <div class="product-card bg-white rounded-xl shadow-lg overflow-hidden">
                    <img src="${product.imageUrl || '/placeholder.png'}" alt="${product.name}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="font-semibold text-lg mb-2">${product.name}</h3>
                        <p class="text-gray-600 text-sm mb-3">${product.description ? product.description.substring(0, 80) : ''}...</p>
                        <p class="text-2xl font-bold text-blue-600 mb-2">Bs. ${product.price}</p>
                        <div class="mb-3">
                            <div class="flex space-x-1 h-1 mb-1">${stockBars}</div>
                            <p class="text-xs text-gray-600 mt-1">${stockText}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="viewProduct('${product.id}')" class="btn-primary flex-1 text-sm">Ver Detalle</button>
                            <button onclick="addToCart('${product.id}')" class="btn-success text-sm"><i data-lucide="shopping-cart" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    lucide.createIcons();
}

window.viewProduct = (productId) => {
    window.currentDetailProductId = productId;
    const product = window.globalProducts.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('productName').textContent = product.name;
    document.getElementById('productDescription').textContent = product.description;
    document.getElementById('productPrice').textContent = product.price;
    document.getElementById('productImage').src = product.imageUrl || '/placeholder.png';

    const storeStockContainer = document.getElementById('storeStock');
    storeStockContainer.innerHTML = '';

    const productStock = window.globalStock.filter(s => s.product_id === productId);
    if (productStock.length === 0) {
        storeStockContainer.innerHTML = '<p class="text-red-500">No hay stock disponible</p>';
    } else {
        productStock.forEach(s => {
            if (s.quantity > 0) {
                storeStockContainer.innerHTML += `
                    <div class="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span class="font-medium">${s.store_name || 'Tienda ' + s.store_id}</span>
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">${s.quantity} unid.</span>
                    </div>
                `;
            }
        });
    }
    showView('producto');
};

// Cart Functions
window.addToCart = (productId) => {
    const product = window.globalProducts.find(p => p.id === productId);
    if (!product) return;
    const existingItem = window.cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        window.cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
    alert('Producto agregado al carrito');
};

window.addToCartFromDetail = () => {
    if (window.currentDetailProductId) {
        window.addToCart(window.currentDetailProductId);
    }
};

window.updateQuantity = (productId, change) => {
    const item = window.cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) {
        window.removeFromCart(productId);
    } else {
        updateCartUI();
    }
};

window.removeFromCart = (productId) => {
    window.cart = window.cart.filter(i => i.id !== productId);
    updateCartUI();
};

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = window.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    if (totalItems > 0) {
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }

    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        cartItems.innerHTML = '';
        let subtotal = 0;
        window.cart.forEach(item => {
            const total = item.price * item.quantity;
            subtotal += total;
            cartItems.innerHTML += `
                <div class="flex items-center bg-white p-4 rounded-lg shadow">
                    <img src="${item.imageUrl || '/placeholder.png'}" alt="${item.name}" class="w-20 h-20 object-cover rounded-md mr-4">
                    <div class="flex-1">
                        <h4 class="font-semibold">${item.name}</h4>
                        <p class="text-blue-600 font-bold">Bs. ${item.price}</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button onclick="updateQuantity('${item.id}', -1)" class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">-</button>
                        <span class="font-medium">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', 1)" class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">+</button>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="ml-4 text-red-500 hover:text-red-700">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>
            `;
        });
        const subElem = document.getElementById('cartSubtotal');
        const totElem = document.getElementById('cartTotal');
        if (subElem) subElem.textContent = subtotal.toFixed(2);
        if (totElem) totElem.textContent = subtotal.toFixed(2);
    }
    lucide.createIcons();
}

window.checkout = () => {
    if (window.cart.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    alert('¡Gracias por tu compra! (Simulación)');
    window.cart = [];
    updateCartUI();
    showView('home');
};

// Admin Functions (Placeholder for now)
window.showAdminSection = (section) => {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    const el = document.getElementById(`admin${section.charAt(0).toUpperCase() + section.slice(1)}`);
    if (el) el.classList.remove('hidden');
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    const token = sessionStorage.getItem('token');
    if (token) {
        try {
            const user = await getProfile(token);
            window.currentUser = user;
            updateUIForLoggedInUser();
        } catch (e) {
            sessionStorage.removeItem('token');
        }
    }
    window.loadCatalog();
});
