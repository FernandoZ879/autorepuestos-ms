const BASE_URL = '/api';

const client = {
    async get(path) {
        const response = await fetch(`${BASE_URL}${path}`);
        return response.json();
    },

    async post(path, data) {
        const response = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },

    async delete(path) {
        const response = await fetch(`${BASE_URL}${path}`, {
            method: 'DELETE',
        });
        return response.json();
    },
};

export default client;
