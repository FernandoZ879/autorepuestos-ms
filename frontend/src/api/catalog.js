import { API_URL } from '../config.js';

export async function fetchProducts() {
    const res = await fetch(`${API_URL}/catalog/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

export async function fetchStock() {
    const res = await fetch(`${API_URL}/inventory/stock`);
    if (!res.ok) throw new Error('Failed to fetch stock');
    return res.json();
}

export async function fetchStores() {
    const res = await fetch(`${API_URL}/inventory/stores`);
    if (!res.ok) throw new Error('Failed to fetch stores');
    return res.json();
}

export async function importProducts(data) {
    const res = await fetch(`${API_URL}/catalog/import/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: data })
    });
    if (!res.ok) throw new Error('Failed to import products');
    return res.json();
}

export async function importStores(data) {
    const res = await fetch(`${API_URL}/inventory/import/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: data })
    });
    if (!res.ok) throw new Error('Failed to import stores');
    return res.json();
}

export async function importStock(data) {
    const res = await fetch(`${API_URL}/inventory/import/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: data })
    });
    if (!res.ok) throw new Error('Failed to import stock');
    return res.json();
}
