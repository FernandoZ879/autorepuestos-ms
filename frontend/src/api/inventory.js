import client from './client.js';

export const getStores = () => {
    return client.get('/inventory/stores');
};

export const createStore = (store) => {
    return client.post('/inventory/stores', store);
};

export const getStock = (productId, storeId) => {
    let path = '/inventory/stock';
    const params = new URLSearchParams();
    if (productId) {
        params.append('productId', productId);
    }
    if (storeId) {
        params.append('storeId', storeId);
    }
    if (params.toString()) {
        path += `?${params.toString()}`;
    }
    return client.get(path);
};

export const createStock = (stock) => {
    return client.post('/inventory/stock', stock);
};

export const transferStock = (transfer) => {
    return client.post('/inventory/transfers', transfer);
};

export const importStores = (items) => {
    return client.post('/inventory/import/stores', { items });
};

export const importStock = (items) => {
    return client.post('/inventory/import/stock', { items });
};
