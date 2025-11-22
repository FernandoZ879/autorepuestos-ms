import client from './client.js';

export const getSalesByStore = () => {
    return client.get('/reports/sales-by-store');
};

export const getTopProducts = () => {
    return client.get('/reports/top-products');
};

export const getInventorySnapshot = () => {
    return client.get('/reports/inventory-snapshot');
};
