import Orders from "./components/Orders";
import Reports from "./pages/Reports";
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

// API

const API_BASE = "http://localhost:5000/api";

const CUSTOMER_API = `${API_BASE}/customers`;
const PRODUCT_API = `${API_BASE}/products`;
const SALES_API = `${API_BASE}/sales`;

// TYPES

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string | null;
  business_name?: string | null;
  gst_number?: string | null;
  customer_type: string;
  address?: string | null;
  status: string;
  follow_up_date?: string | null;
  notes?: string | null;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category?: string | null;
  unit_price: number | string;
  current_stock: number;
  minimum_stock: number;
  warehouse_location?: string | null;
}

interface SaleItem {
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
}

interface Sale {
  id: number;
  challan_number: string;
  total_quantity: number;
  status: string;
  created_at?: string;
  customer?: Customer;
  customers?: Customer;
  challan_items?: SaleItem[];
}

// CUSTOMER FORM

interface CustomerForm {
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number: string;
  customer_type: string;
  address: string;
  status: string;
  follow_up_date: string;
  notes: string;
}

const emptyCustomerForm: CustomerForm = {
  name: "",
  mobile: "",
  email: "",
  business_name: "",
  gst_number: "",
  customer_type: "WHOLESALE",
  address: "",
  status: "ACTIVE",
  follow_up_date: "",
  notes: "",
};

// PRODUCT FORM

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  unit_price: string;
  current_stock: string;
  minimum_stock: string;
  warehouse_location: string;
}

const emptyProductForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  unit_price: "",
  current_stock: "",
  minimum_stock: "",
  warehouse_location: "",
};

function App() {
  const [page, setPage] = useState<
    "dashboard" | "customers" | "products" | "sales" | "orders" | "reports">("dashboard");

  const [message, setMessage] = useState("");
  const [productDeleteError, setProductDeleteError] = useState("");
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerForm, setCustomerForm] =
    useState<CustomerForm>(emptyCustomerForm);

  const [editingCustomerId, setEditingCustomerId] =
    useState<number | null>(null);

  const [customerSearch, setCustomerSearch] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [productForm, setProductForm] =
    useState<ProductForm>(emptyProductForm);

  const [editingProductId, setEditingProductId] =
    useState<number | null>(null);

  const [productSearch, setProductSearch] = useState("");

  const [sales, setSales] = useState<Sale[]>([]);

  const [selectedCustomer, setSelectedCustomer] =
    useState<string>("");

  const [selectedProduct, setSelectedProduct] =
    useState<string>("");

  const [saleQuantity, setSaleQuantity] =
    useState<number>(1);

  const [saleItems, setSaleItems] =
    useState<SaleItem[]>([]);

  const [creatingSale, setCreatingSale] =
    useState(false);

  const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Request failed"
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Something went wrong";
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(CUSTOMER_API);

      setCustomers(response.data.data || []);
    } catch (error) {
      console.error("CUSTOMERS ERROR:", error);
      setMessage(getErrorMessage(error));
    }
  };

  // FETCH PRODUCTS

  const fetchProducts = async () => {
    try {
      const response = await axios.get(PRODUCT_API);

      setProducts(response.data.data || []);
    } catch (error) {
      console.error("PRODUCTS ERROR:", error);
      setMessage(getErrorMessage(error));
    }
  };

  const fetchSales = async () => {
    try {
      const response = await axios.get(SALES_API);

      setSales(
        Array.isArray(response.data)
          ? response.data
          : response.data.data || []
      );
    } catch (error) {
      console.error("SALES ERROR:", error);
      setMessage(getErrorMessage(error));
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchSales();
  }, []);


  const handleCustomerChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setCustomerForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCustomerSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const data = {
        name: customerForm.name,
        mobile: customerForm.mobile,
        email: customerForm.email || null,
        business_name:
          customerForm.business_name || null,
        gst_number:
          customerForm.gst_number || null,
        customer_type:
          customerForm.customer_type,
        address:
          customerForm.address || null,
        status:
          customerForm.status,

        follow_up_date:
          customerForm.follow_up_date
            ? `${customerForm.follow_up_date}T00:00:00.000Z`
            : null,

        notes:
          customerForm.notes || null,
      };

      if (editingCustomerId !== null) {
        await axios.put(
          `${CUSTOMER_API}/${editingCustomerId}`,
          data
        );

        setMessage(
          "Customer updated successfully"
        );
      } else {
        await axios.post(
          CUSTOMER_API,
          data
        );

        setMessage(
          "Customer created successfully"
        );
      }

      setCustomerForm(emptyCustomerForm);
      setEditingCustomerId(null);

      await fetchCustomers();
    } catch (error) {
      console.error(error);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const editCustomer = (customer: Customer) => {
    setEditingCustomerId(customer.id);

    setCustomerForm({
      name: customer.name || "",
      mobile: customer.mobile || "",
      email: customer.email || "",
      business_name:
        customer.business_name || "",
      gst_number:
        customer.gst_number || "",
      customer_type:
        customer.customer_type || "WHOLESALE",
      address:
        customer.address || "",
      status:
        customer.status || "ACTIVE",

      follow_up_date:
        customer.follow_up_date
          ? customer.follow_up_date.substring(0, 10)
          : "",

      notes:
        customer.notes || "",
    });

    setPage("customers");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteCustomer = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this customer?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      await axios.delete(
        `${CUSTOMER_API}/${id}`
      );

      setMessage(
        "Customer deleted successfully"
      );

      await fetchCustomers();
    } catch (error) {
      console.error(error);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setProductForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleProductSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const data = {
        name: productForm.name,
        sku: productForm.sku,
        category:
          productForm.category || null,
        unit_price:
          Number(productForm.unit_price),
        current_stock:
          Number(productForm.current_stock || 0),
        minimum_stock:
          Number(productForm.minimum_stock || 0),
        warehouse_location:
          productForm.warehouse_location || null,
      };

      if (editingProductId !== null) {
        await axios.put(
          `${PRODUCT_API}/${editingProductId}`,
          data
        );

        setMessage(
          "Product updated successfully"
        );
      } else {
        await axios.post(
          PRODUCT_API,
          data
        );

        setMessage(
          "Product created successfully"
        );
      }

      setProductForm(emptyProductForm);
      setEditingProductId(null);

      await fetchProducts();
    } catch (error) {
      console.error(error);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (product: Product) => {
    setEditingProductId(product.id);

    setProductForm({
      name: product.name || "",
      sku: product.sku || "",
      category:
        product.category || "",
      unit_price:
        String(product.unit_price),
      current_stock:
        String(product.current_stock),
      minimum_stock:
        String(product.minimum_stock),
      warehouse_location:
        product.warehouse_location || "",
    });

    setPage("products");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteProduct = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setProductDeleteError("");

      await axios.delete(
        `${PRODUCT_API}/${id}`
      );

      setMessage(
        "Product deleted successfully"
      );

      await fetchProducts();
    } catch (error) {
      console.error(error);
      setMessage("");
      setProductDeleteError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const addSaleProduct = () => {
    if (!selectedProduct) {
      alert("Please select a product");
      return;
    }

    const product = products.find(
      (item) =>
        item.id === Number(selectedProduct)
    );

    if (!product) {
      alert("Product not found");
      return;
    }

    if (saleQuantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    if (
      saleQuantity >
      product.current_stock
    ) {
      alert(
        `Only ${product.current_stock} units available`
      );
      return;
    }

    const alreadyAdded = saleItems.find(
      (item) =>
        item.product_id === product.id
    );

    if (alreadyAdded) {
      alert(
        "Product already added. Remove it first."
      );
      return;
    }

    const newItem: SaleItem = {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      unit_price: Number(
        product.unit_price
      ),
      quantity: saleQuantity,
    };

    setSaleItems((previous) => [
      ...previous,
      newItem,
    ]);

    setSelectedProduct("");
    setSaleQuantity(1);
  };

  const removeSaleItem = (
    productId: number
  ) => {
    setSaleItems((previous) =>
      previous.filter(
        (item) =>
          item.product_id !== productId
      )
    );
  };

  const createSale = async () => {
    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }

    if (saleItems.length === 0) {
      alert("Please add at least one product");
      return;
    }

    try {
      setCreatingSale(true);
      setMessage("");

      const payload = {
        customer_id:
          Number(selectedCustomer),

        items: saleItems.map((item) => ({
          product_id:
            item.product_id,
          quantity:
            item.quantity,
        })),
      };

      const response =
        await axios.post(
          SALES_API,
          payload
        );

      const sale =
        response.data.data;

      setMessage(
        `Sale created successfully - ${sale?.challan_number || ""}`
      );

      setSaleItems([]);
      setSelectedProduct("");
      setSaleQuantity(1);

      await fetchProducts();
      await fetchSales();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "CREATE SALE ERROR:",
        error
      );

      setMessage(
        getErrorMessage(error)
      );
    } finally {
      setCreatingSale(false);
    }
  };

  const cancelSale = async (id: number) => {
    if (
      !window.confirm(
        "Cancel this sale and restore stock?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      await axios.put(
        `${SALES_API}/${id}/cancel`
      );

      setMessage(
        "Sale cancelled and stock restored"
      );

      await fetchProducts();
      await fetchSales();
    } catch (error) {
      console.error(error);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers =
    customers.filter((customer) => {
      const search =
        customerSearch.toLowerCase();

      return (
        customer.name
          ?.toLowerCase()
          .includes(search) ||
        customer.mobile
          ?.toLowerCase()
          .includes(search) ||
        customer.email
          ?.toLowerCase()
          .includes(search) ||
        customer.business_name
          ?.toLowerCase()
          .includes(search)
      );
    });

  const filteredProducts =
    products.filter((product) => {
      const search =
        productSearch.toLowerCase();

      return (
        product.name
          .toLowerCase()
          .includes(search) ||
        product.sku
          .toLowerCase()
          .includes(search) ||
        product.category
          ?.toLowerCase()
          .includes(search)
      );
    });

  const totalQuantity =
    saleItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  const totalAmount =
    saleItems.reduce(
      (total, item) =>
        total +
        item.unit_price *
          item.quantity,
      0
    );


  const activeCustomers =
    customers.filter(
      (customer) =>
        customer.status === "ACTIVE"
    ).length;

  const wholesaleCustomers =
    customers.filter(
      (customer) =>
        customer.customer_type ===
        "WHOLESALE"
    ).length;

  const retailCustomers =
    customers.filter(
      (customer) =>
        customer.customer_type ===
        "RETAIL"
    ).length;

  const lowStockProducts =
    products.filter(
      (product) =>
        product.current_stock <=
        product.minimum_stock
    ).length;

  return (
    <div className="app">

      <header className="header">

        <div className="logo">
          <h1>Mini ERP CRM</h1>

          <p>
            Customer & Product Management System
          </p>
        </div>

        <div className="header-count">
          Customers
          <strong>
            {customers.length}
          </strong>
        </div>

      </header>

      <nav className="navbar">

        <button
          className={
            page === "dashboard"
              ? "nav-active"
              : ""
          }
          onClick={() =>
            setPage("dashboard")
          }
        >
          Dashboard
        </button>

        <button
          className={
            page === "customers"
              ? "nav-active"
              : ""
          }
          onClick={() =>
            setPage("customers")
          }
        >
          Customers
        </button>

        <button
          className={
            page === "products"
              ? "nav-active"
              : ""
          }
          onClick={() =>
            setPage("products")
          }
        >
          Products
        </button>

        <button
          className={
            page === "sales"
              ? "nav-active"
              : ""
          }
          onClick={() =>
            setPage("sales")
          }
        >
          Sales
        </button>

        <button
          className={
            page === "orders"
              ? "nav-active"
              : ""
          }
          onClick={() =>
            setPage("orders")
          }
        >
          Orders
        </button>

        <button
          className={
            page === "reports"
              ? "nav-active"
              : ""
          }
          onClick={() =>
            setPage("reports")
          }
        >
          Reports
        </button>

      </nav>

      <main className="container">

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {productDeleteError && (
          <div className="message order-error" role="alert">
            {productDeleteError}
          </div>
        )}

        {page === "dashboard" && (
          <>
            <div className="stats">

              <div className="stat-card">
                <span>
                  Total Customers
                </span>

                <strong>
                  {customers.length}
                </strong>
              </div>

              <div className="stat-card">
                <span>
                  Active Customers
                </span>

                <strong>
                  {activeCustomers}
                </strong>
              </div>

              <div className="stat-card">
                <span>
                  Total Products
                </span>

                <strong>
                  {products.length}
                </strong>
              </div>

              <div className="stat-card">
                <span>
                  Low Stock
                </span>

                <strong>
                  {lowStockProducts}
                </strong>
              </div>

            </div>

            <section className="card">

              <div className="card-header">
                <h2>
                  Mini ERP CRM Dashboard
                </h2>
              </div>

              <p>
                Manage customers, products,
                inventory and sales from one
                application.
              </p>

              <div className="stats">

                <div className="stat-card">
                  <span>
                    Wholesale
                  </span>

                  <strong>
                    {wholesaleCustomers}
                  </strong>
                </div>

                <div className="stat-card">
                  <span>
                    Retail
                  </span>

                  <strong>
                    {retailCustomers}
                  </strong>
                </div>

                <div className="stat-card">
                  <span>
                    Total Sales
                  </span>

                  <strong>
                    {sales.length}
                  </strong>
                </div>

              </div>

            </section>
          </>
        )}

        {page === "customers" && (
          <>

            <div className="stats">

              <div className="stat-card">
                <span>
                  Total Customers
                </span>

                <strong>
                  {customers.length}
                </strong>
              </div>

              <div className="stat-card">
                <span>
                  Active Customers
                </span>

                <strong>
                  {activeCustomers}
                </strong>
              </div>

              <div className="stat-card">
                <span>
                  Wholesale
                </span>

                <strong>
                  {wholesaleCustomers}
                </strong>
              </div>

              <div className="stat-card">
                <span>
                  Retail
                </span>

                <strong>
                  {retailCustomers}
                </strong>
              </div>

            </div>

            {/* CUSTOMER FORM */}

            <section className="card">

              <div className="card-header">

                <h2>
                  {editingCustomerId !== null
                    ? "Update Customer"
                    : "Add New Customer"}
                </h2>

              </div>

              <form
                onSubmit={
                  handleCustomerSubmit
                }
              >

                <div className="form-grid">

                  <div className="form-group">
                    <label>
                      Name *
                    </label>

                    <input
                      name="name"
                      value={
                        customerForm.name
                      }
                      onChange={
                        handleCustomerChange
                      }
                      placeholder="Enter customer name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Mobile *
                    </label>

                    <input
                      name="mobile"
                      value={
                        customerForm.mobile
                      }
                      onChange={
                        handleCustomerChange
                      }
                      placeholder="Enter mobile number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={
                        customerForm.email
                      }
                      onChange={
                        handleCustomerChange
                      }
                      placeholder="Enter email"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Business Name
                    </label>

                    <input
                      name="business_name"
                      value={
                        customerForm.business_name
                      }
                      onChange={
                        handleCustomerChange
                      }
                      placeholder="Enter business name"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      GST Number
                    </label>

                    <input
                      name="gst_number"
                      value={
                        customerForm.gst_number
                      }
                      onChange={
                        handleCustomerChange
                      }
                      placeholder="Enter GST number"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Customer Type
                    </label>

                    <select
                      name="customer_type"
                      value={
                        customerForm.customer_type
                      }
                      onChange={
                        handleCustomerChange
                      }
                    >
                      <option value="RETAIL">
                        RETAIL
                      </option>

                      <option value="WHOLESALE">
                        WHOLESALE
                      </option>

                      <option value="DISTRIBUTOR">
                        DISTRIBUTOR
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        customerForm.status
                      }
                      onChange={
                        handleCustomerChange
                      }
                    >
                      <option value="LEAD">
                        LEAD
                      </option>

                      <option value="ACTIVE">
                        ACTIVE
                      </option>

                      <option value="INACTIVE">
                        INACTIVE
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Follow Up Date
                    </label>

                    <input
                      type="date"
                      name="follow_up_date"
                      value={
                        customerForm.follow_up_date
                      }
                      onChange={
                        handleCustomerChange
                      }
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>
                      Address
                    </label>

                    <textarea
                      name="address"
                      value={
                        customerForm.address
                      }
                      onChange={
                        handleCustomerChange
                      }
                      placeholder="Enter address"
                      rows={3}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      value={
                        customerForm.notes
                      }
                      onChange={
                        handleCustomerChange
                      }
                      placeholder="Enter notes"
                      rows={3}
                    />
                  </div>

                </div>

                <div className="form-buttons">

                  <button
                    className="btn primary"
                    disabled={loading}
                  >
                    {loading
                      ? "Saving..."
                      : editingCustomerId !== null
                      ? "Update Customer"
                      : "Add Customer"}
                  </button>

                  {editingCustomerId !==
                    null && (
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => {
                        setEditingCustomerId(
                          null
                        );

                        setCustomerForm(
                          emptyCustomerForm
                        );
                      }}
                    >
                      Cancel
                    </button>
                  )}

                </div>

              </form>

            </section>

            {/* CUSTOMER LIST */}

            <section className="card">

              <div className="card-header">

                <h2>
                  Customer List
                </h2>

                <button
                  className="btn refresh"
                  onClick={
                    fetchCustomers
                  }
                >
                  Refresh
                </button>

              </div>

              <div className="search-box">

                <input
                  value={
                    customerSearch
                  }
                  onChange={(e) =>
                    setCustomerSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search customer..."
                />

              </div>

              <div className="table-container">

                <table>

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>Business</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredCustomers.map(
                      (customer) => (
                        <tr
                          key={
                            customer.id
                          }
                        >

                          <td>
                            {customer.id}
                          </td>

                          <td>
                            {customer.name}
                          </td>

                          <td>
                            {customer.mobile}
                          </td>

                          <td>
                            {customer.email ||
                              "-"}
                          </td>

                          <td>
                            {customer.business_name ||
                              "-"}
                          </td>

                          <td>
                            {customer.customer_type}
                          </td>

                          <td>
                            <span
                              className={`status ${
                                customer.status ===
                                "ACTIVE"
                                  ? "active"
                                  : "inactive"
                              }`}
                            >
                              {
                                customer.status
                              }
                            </span>
                          </td>

                          <td>

                            <div className="actions">

                              <button
                                className="btn edit"
                                onClick={() =>
                                  editCustomer(
                                    customer
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="btn delete"
                                onClick={() =>
                                  deleteCustomer(
                                    customer.id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </>
        )}

        {/* =================================================
            PRODUCTS
        ================================================= */}

        {page === "products" && (
          <>

            <section className="card">

              <div className="card-header">

                <h2>
                  {editingProductId !== null
                    ? "Update Product"
                    : "Add New Product"}
                </h2>

              </div>

              <form
                onSubmit={
                  handleProductSubmit
                }
              >

                <div className="form-grid">

                  <div className="form-group">
                    <label>
                      Product Name *
                    </label>

                    <input
                      name="name"
                      value={
                        productForm.name
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      SKU *
                    </label>

                    <input
                      name="sku"
                      value={
                        productForm.sku
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="Enter SKU"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Category
                    </label>

                    <input
                      name="category"
                      value={
                        productForm.category
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="Enter category"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Unit Price *
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="unit_price"
                      value={
                        productForm.unit_price
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="Enter price"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Current Stock
                    </label>

                    <input
                      type="number"
                      min="0"
                      name="current_stock"
                      value={
                        productForm.current_stock
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="Enter current stock"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Minimum Stock
                    </label>

                    <input
                      type="number"
                      min="0"
                      name="minimum_stock"
                      value={
                        productForm.minimum_stock
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="Enter minimum stock"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>
                      Warehouse Location
                    </label>

                    <input
                      name="warehouse_location"
                      value={
                        productForm.warehouse_location
                      }
                      onChange={
                        handleProductChange
                      }
                      placeholder="Enter warehouse location"
                    />
                  </div>

                </div>

                <div className="form-buttons">

                  <button
                    className="btn primary"
                    disabled={loading}
                  >
                    {loading
                      ? "Saving..."
                      : editingProductId !==
                        null
                      ? "Update Product"
                      : "Add Product"}
                  </button>

                  {editingProductId !==
                    null && (
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => {
                        setEditingProductId(
                          null
                        );

                        setProductForm(
                          emptyProductForm
                        );
                      }}
                    >
                      Cancel
                    </button>
                  )}

                </div>

              </form>

            </section>

            <section className="card">

              <div className="card-header">

                <h2>
                  Product List
                </h2>

                <button
                  className="btn refresh"
                  onClick={
                    fetchProducts
                  }
                >
                  Refresh
                </button>

              </div>

              <div className="search-box">

                <input
                  value={
                    productSearch
                  }
                  onChange={(e) =>
                    setProductSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search product..."
                />

              </div>

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
                      <th>Min Stock</th>
                      <th>Warehouse</th>
                      <th>Action</th>
                    </tr>

                  </thead>

                  <tbody>

                    {filteredProducts.map(
                      (product) => (
                        <tr
                          key={
                            product.id
                          }
                        >

                          <td>
                            {product.id}
                          </td>

                          <td>
                            {product.name}
                          </td>

                          <td>
                            {product.sku}
                          </td>

                          <td>
                            {product.category ||
                              "-"}
                          </td>

                          <td>
                            ₹
                            {Number(
                              product.unit_price
                            ).toFixed(2)}
                          </td>

                          <td>
                            <strong>
                              {
                                product.current_stock
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              product.minimum_stock
                            }
                          </td>

                          <td>
                            {product.warehouse_location ||
                              "-"}
                          </td>

                          <td>

                            <div className="actions">

                              <button
                                className="btn edit"
                                onClick={() =>
                                  editProduct(
                                    product
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="btn delete"
                                onClick={() =>
                                  deleteProduct(
                                    product.id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </>
        )}

        {/* =================================================
            SALES
        ================================================= */}

        {page === "sales" && (
          <>

            {/* CREATE SALE */}

            <section className="card">

              <div className="card-header">

                <h2>
                  Create New Sale
                </h2>

              </div>

              <div className="form-grid">

                {/* CUSTOMER */}

                <div className="form-group full-width">

                  <label>
                    Customer *
                  </label>

                  <select
                    value={
                      selectedCustomer
                    }
                    onChange={(e) =>
                      setSelectedCustomer(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select Customer
                    </option>

                    {customers.map(
                      (customer) => (
                        <option
                          key={
                            customer.id
                          }
                          value={
                            customer.id
                          }
                        >
                          {customer.name} -{" "}
                          {customer.mobile}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* PRODUCT */}

                <div className="form-group">

                  <label>
                    Product *
                  </label>

                  <select
                    value={
                      selectedProduct
                    }
                    onChange={(e) =>
                      setSelectedProduct(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select Product
                    </option>

                    {products
                      .filter(
                        (product) =>
                          product.current_stock >
                          0
                      )
                      .map(
                        (product) => (
                          <option
                            key={
                              product.id
                            }
                            value={
                              product.id
                            }
                          >
                            {product.name} -
                            ₹
                            {Number(
                              product.unit_price
                            ).toFixed(2)}{" "}
                            (Stock:{" "}
                            {
                              product.current_stock
                            }
                            )
                          </option>
                        )
                      )}

                  </select>

                </div>

                {/* QUANTITY */}

                <div className="form-group">

                  <label>
                    Quantity *
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      saleQuantity
                    }
                    onChange={(e) =>
                      setSaleQuantity(
                        Number(
                          e.target.value
                        )
                      )
                    }
                  />

                </div>

              </div>

              <div className="form-buttons">

                <button
                  type="button"
                  className="btn primary"
                  onClick={
                    addSaleProduct
                  }
                >
                  + Add Product
                </button>

              </div>

            </section>

            {/* SALE ITEMS */}

            <section className="card">

              <div className="card-header">

                <h2>
                  Sale Items
                </h2>

              </div>

              {saleItems.length === 0 ? (
                <div className="empty">
                  No products added
                </div>
              ) : (
                <div className="table-container">

                  <table>

                    <thead>

                      <tr>
                        <th>
                          Product
                        </th>

                        <th>
                          SKU
                        </th>

                        <th>
                          Unit Price
                        </th>

                        <th>
                          Quantity
                        </th>

                        <th>
                          Total
                        </th>

                        <th>
                          Action
                        </th>
                      </tr>

                    </thead>

                    <tbody>

                      {saleItems.map(
                        (item) => (
                          <tr
                            key={
                              item.product_id
                            }
                          >

                            <td>
                              {
                                item.product_name
                              }
                            </td>

                            <td>
                              {item.sku}
                            </td>

                            <td>
                              ₹
                              {item.unit_price.toFixed(
                                2
                              )}
                            </td>

                            <td>
                              {item.quantity}
                            </td>

                            <td>
                              ₹
                              {(
                                item.unit_price *
                                item.quantity
                              ).toFixed(2)}
                            </td>

                            <td>

                              <button
                                className="btn delete"
                                onClick={() =>
                                  removeSaleItem(
                                    item.product_id
                                  )
                                }
                              >
                                Remove
                              </button>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

              {saleItems.length > 0 && (
                <>

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "flex-end",
                      gap: "30px",
                      marginTop:
                        "20px",
                      fontSize:
                        "18px",
                      fontWeight:
                        "bold",
                    }}
                  >

                    <span>
                      Total Quantity:{" "}
                      {totalQuantity}
                    </span>

                    <span>
                      Total Amount: ₹
                      {totalAmount.toFixed(
                        2
                      )}
                    </span>

                  </div>

                  <div className="form-buttons">

                    <button
                      className="btn primary"
                      onClick={
                        createSale
                      }
                      disabled={
                        creatingSale
                      }
                    >
                      {creatingSale
                        ? "Creating Sale..."
                        : "Create Sale"}
                    </button>

                    <button
                      className="btn secondary"
                      onClick={() =>
                        setSaleItems([])
                      }
                      disabled={
                        creatingSale
                      }
                    >
                      Clear
                    </button>

                  </div>

                </>
              )}

            </section>

            {/* SALES HISTORY */}

            <section className="card">

              <div className="card-header">

                <h2>
                  Sales History
                </h2>

                <button
                  className="btn refresh"
                  onClick={
                    fetchSales
                  }
                >
                  Refresh
                </button>

              </div>

              {sales.length === 0 ? (
                <div className="empty">
                  No sales found
                </div>
              ) : (

                <div className="table-container">

                  <table>

                    <thead>

                      <tr>
                        <th>
                          Challan
                        </th>

                        <th>
                          Customer
                        </th>

                        <th>
                          Quantity
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Date
                        </th>

                        <th>
                          Action
                        </th>
                      </tr>

                    </thead>

                    <tbody>

                      {sales.map(
                        (sale) => (
                          <tr
                            key={
                              sale.id
                            }
                          >

                            <td>
                              {
                                sale.challan_number
                              }
                            </td>

                            <td>
                              {sale.customer?.name || sale.customers?.name || "-"}
                            </td>

                            <td>
                              {
                                sale.total_quantity
                              }
                            </td>

                            <td>

                              <span
                                className={`status ${
                                  sale.status ===
                                  "CONFIRMED"
                                    ? "active"
                                    : "inactive"
                                }`}
                              >
                                {
                                  sale.status
                                }
                              </span>

                            </td>

                            <td>
                              {sale.created_at
                                ? new Date(
                                    sale.created_at
                                  ).toLocaleString()
                                : "-"}
                            </td>

                            <td>

                              {sale.status !==
                                "CANCELLED" && (
                                <button
                                  className="btn delete"
                                  onClick={() =>
                                    cancelSale(
                                      sale.id
                                    )
                                  }
                                >
                                  Cancel
                                </button>
                              )}

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          </>
        )}

        {page === "orders" && (
          <Orders />
        )}

        {page === "reports" && (
          <Reports />
        )}

      </main>

    </div>
  );
}

export default App;