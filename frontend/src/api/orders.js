import client from './client.js';

export const addToCart = (productId, quantity) => {
    return client.post('/orders/cart', { productId, quantity });
};

export const getCart = () => {
    return client.get('/orders/cart');
};

export const checkout = (order) => {
    return client.post('/orders/checkout', order);
};

export const getOrders = () => {
    return client.get('/orders/orders');
};

export const getOrder = (id) => {
    return client.get(`/orders/orders/${id}`);
};
