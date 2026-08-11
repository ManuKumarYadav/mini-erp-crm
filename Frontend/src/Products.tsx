import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  warehouse_location: string | null;
}

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  unit_price: string;
  current_stock: string;
  minimum_stock: string;
  warehouse_location: string;
}

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  unit_price: "",
  current_stock: "0",
  minimum_stock: "0",
  warehouse_location: "",
};

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API = "http://localhost:5000/api/products";

  // ==========================================
  // GET PRODUCTS
  // ==========================================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await fetch(API);
      const result = await response.json();

      if (result.success) {
        setProducts(result.data);
      } else {
        setMessage("Failed to fetch products");
      }
    } catch (error) {
      console.error(error);
      setMessage("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `${API}/${editingId}`
        : API;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          category: form.category,
          unit_price: Number(form.unit_price),
          current_stock: Number(form.current_stock),
          minimum_stock: Number(form.minimum_stock),
          warehouse_location: form.warehouse_location,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Something went wrong");
        return;
      }

      setMessage(
        editingId
          ? "Product updated successfully"
          : "Product created successfully"
      );

      setForm(emptyForm);
      setEditingId(null);

      await fetchProducts();
    } catch (error) {
      console.error(error);
      setMessage("Backend connection failed");
    }
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = (product: Product) => {
    setEditingId(product.id);

    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category || "",
      unit_price: String(product.unit_price),
      current_stock: String(product.current_stock),
      minimum_stock: String(product.minimum_stock),
      warehouse_location: product.warehouse_location || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Product deleted successfully");
        await fetchProducts();
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      console.error(error);
      setMessage("Delete failed");
    }
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredProducts = products.filter((product) => {
    const value = search.toLowerCase();

    return (
      product.name.toLowerCase().includes(value) ||
      product.sku.toLowerCase().includes(value) ||
      (product.category || "").toLowerCase().includes(value)
    );
  });

  return (
    <div className="container">

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      {/* ======================================
          PRODUCT FORM
      ====================================== */}

      <div className="card">

        <div className="card-header">
          <h2>
            {editingId ? "Edit Product" : "Add New Product"}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            <div className="form-group">
              <label>Product Name *</label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="form-group">
              <label>SKU *</label>

              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="Enter SKU"
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>

              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Enter category"
              />
            </div>

            <div className="form-group">
              <label>Unit Price *</label>

              <input
                type="number"
                name="unit_price"
                value={form.unit_price}
                onChange={handleChange}
                placeholder="Enter price"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Current Stock</label>

              <input
                type="number"
                name="current_stock"
                value={form.current_stock}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Minimum Stock</label>

              <input
                type="number"
                name="minimum_stock"
                value={form.minimum_stock}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group full-width">
              <label>Warehouse Location</label>

              <input
                type="text"
                name="warehouse_location"
                value={form.warehouse_location}
                onChange={handleChange}
                placeholder="Example: Warehouse A"
              />
            </div>

          </div>

          <div className="form-buttons">

            <button
              type="submit"
              className="btn primary"
            >
              {editingId ? "Update Product" : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn secondary"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}

          </div>

        </form>

      </div>


      {/* ======================================
          PRODUCT LIST
      ====================================== */}

      <div className="card">

        <div className="card-header">

          <h2>Product List</h2>

          <button
            className="btn refresh"
            onClick={fetchProducts}
          >
            Refresh
          </button>

        </div>

        <div className="search-box">

          <input
            type="text"
            placeholder="Search by name, SKU or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        {loading ? (
          <div className="loading">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty">
            No products found.
          </div>
        ) : (

          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Minimum</th>
                  <th>Warehouse</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredProducts.map((product) => (

                  <tr key={product.id}>

                    <td>{product.id}</td>

                    <td>{product.name}</td>

                    <td>{product.sku}</td>

                    <td>
                      {product.category || "-"}
                    </td>

                    <td>
                      ₹{Number(product.unit_price).toFixed(2)}
                    </td>

                    <td>
                      {product.current_stock}
                    </td>

                    <td>
                      {product.minimum_stock}
                    </td>

                    <td>
                      {product.warehouse_location || "-"}
                    </td>

                    <td>

                      <div className="actions">

                        <button
                          className="btn edit"
                          onClick={() => handleEdit(product)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn delete"
                          onClick={() => handleDelete(product.id)}
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default Products;
