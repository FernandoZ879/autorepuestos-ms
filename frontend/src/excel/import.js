import { importProducts, importStores, importStock } from '../api/catalog.js';

export async function handleExcelUpload(file, onSuccess) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            let importedCount = 0;

            // 1. Import Stores
            if (workbook.Sheets['Tiendas']) {
                const stores = XLSX.utils.sheet_to_json(workbook.Sheets['Tiendas']);
                const mappedStores = stores.map(s => ({
                    name: s.Nombre,
                    nit: String(s.NIT),
                    address: s.Direccion,
                    phone: String(s.Telefono)
                }));

                if (mappedStores.length > 0) {
                    await importStores(mappedStores);
                    importedCount += mappedStores.length;
                }
            }

            // 2. Import Products
            if (workbook.Sheets['Productos']) {
                const products = XLSX.utils.sheet_to_json(workbook.Sheets['Productos']);
                const mappedProducts = products.map(p => ({
                    name: p.Nombre,
                    slug: p.Slug,
                    description: p.Descripcion,
                    price: p.Precio,
                    imageUrl: p.Imagen,
                    categoryName: p.Categoria
                }));

                if (mappedProducts.length > 0) {
                    await importProducts(mappedProducts);
                    importedCount += mappedProducts.length;
                }
            }

            // 3. Import Stock
            if (workbook.Sheets['Stock']) {
                const stock = XLSX.utils.sheet_to_json(workbook.Sheets['Stock']);
                const mappedStock = stock.map(s => ({
                    productSlug: s.ProductoSlug,
                    storeNit: String(s.TiendaNIT),
                    quantity: Number(s.Cantidad)
                }));

                if (mappedStock.length > 0) {
                    await importStock(mappedStock);
                    importedCount += mappedStock.length;
                }
            }

            alert('Importación completada exitosamente');
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error importing Excel:', error);
            alert('Error al procesar el archivo Excel. Revisa el formato.');
        }
    };
    reader.readAsArrayBuffer(file);
}
