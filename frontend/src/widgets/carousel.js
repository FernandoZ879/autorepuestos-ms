import { getProducts } from '../api/catalog.js';

export const initCarousel = async () => {
    const products = await getProducts();
    const featuredProducts = products.slice(0, 5); // Simple rule: first 5 products

    const carousel = document.getElementById('carousel');
    if (carousel) {
        carousel.innerHTML = featuredProducts.map(product => `
            <div class="carousel-item">
                <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-64 object-cover">
                <div class="p-4">
                    <h3 class="text-lg font-bold">${product.name}</h3>
                    <p class="text-gray-600">${product.description}</p>
                    <p class="text-lg font-bold mt-2">$${product.price}</p>
                </div>
            </div>
        `).join('');
    }
};
