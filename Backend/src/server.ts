import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// DATABASE

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "mini_erp_crm",

  connectionLimit: 5,
  connectTimeout: 10000,
  acquireTimeout: 20000,
  idleTimeout: 300,
});

const prisma = new PrismaClient({
  adapter,
});

// DATABASE CONNECTION

async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error);
    process.exit(1);
  }
}

const PORT = 5000;

// Health Check

app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Mini ERP CRM Backend is running",
  });
});

// CUSTOMERS

app.get("/api/customers", async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customers.findMany({
      orderBy: {
        id: "desc",
      },
    });
    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("GET /api/customers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
});

app.get("/api/customers/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }
    const customer = await prisma.customers.findUnique({
      where: {
        id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.json(customer);
  } catch (error) {
    console.error("GET customer error:", error);

    res.status(500).json({
      message: "Failed to fetch customer",
    });
  }
});

app.post("/api/customers", async (req: Request, res: Response) => {
  try {
    const {
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
    } = req.body;

    if (!name || !mobile || !customer_type) {
      return res.status(400).json({
        message: "Name, mobile and customer type are required",
      });
    }

    const customer = await prisma.customers.create({
      data: {
        name,
        mobile,
        email: email || null,
        business_name: business_name || null,
        gst_number: gst_number || null,
        customer_type,
        address: address || null,
        status: status || "LEAD",
        follow_up_date: follow_up_date
          ? new Date(follow_up_date)
          : null,
        notes: notes || null,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error("POST /api/customers error:", error);

    res.status(500).json({
      message: "Failed to create customer",
    });
  }
});

app.put("/api/customers/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const {
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
    } = req.body;

    const customer = await prisma.customers.update({
      where: {
        id,
      },
      data: {
        name,
        mobile,
        email: email || null,
        business_name: business_name || null,
        gst_number: gst_number || null,
        customer_type,
        address: address || null,
        status,
        follow_up_date: follow_up_date
          ? new Date(follow_up_date)
          : null,
        notes: notes || null,
        updated_at: new Date(),
      },
    });

    res.json(customer);
  } catch (error) {
    console.error("PUT customer error:", error);

    res.status(500).json({
      message: "Failed to update customer",
    });
  }
});

// DELETE customer
app.delete("/api/customers/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    await prisma.customers.delete({
      where: {
        id,
      },
    });

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("DELETE customer error:", error);

    res.status(500).json({
      message: "Failed to delete customer",
    });
  }
});

// PRODUCTS

app.get("/api/products", async (_req: Request, res: Response) => {
  try {
    const products = await prisma.products.findMany({
      orderBy: {
        id: "desc",
      },
    });

    const result = products.map((product) => ({
      ...product,
      unit_price: Number(product.unit_price),
    }));

    res.json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("GET /api/products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

app.get("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.products.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      ...product,
      unit_price: Number(product.unit_price),
    });
  } catch (error) {
    console.error("GET product error:", error);

    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
});
app.post("/api/products", async (req: Request, res: Response) => {
  try {
    const {
      name,
      sku,
      category,
      unit_price,
      current_stock,
      minimum_stock,
      warehouse_location,
    } = req.body;

    if (!name || !sku || unit_price === undefined) {
      return res.status(400).json({
        message: "Name, SKU and unit price are required",
      });
    }

    const product = await prisma.products.create({
      data: {
        name,
        sku,
        category: category || null,
        unit_price: Number(unit_price),
        current_stock: Number(current_stock || 0),
        minimum_stock: Number(minimum_stock || 0),
        warehouse_location: warehouse_location || null,
      },
    });

    res.status(201).json({
      ...product,
      unit_price: Number(product.unit_price),
    });
  } catch (error: any) {
    console.error("POST /api/products error:", error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "SKU already exists",
      });
    }

    res.status(500).json({
      message: "Failed to create product",
    });
  }
});

// UPDATE product
app.put("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const {
      name,
      sku,
      category,
      unit_price,
      current_stock,
      minimum_stock,
      warehouse_location,
    } = req.body;

    const product = await prisma.products.update({
      where: {
        id,
      },
      data: {
        name,
        sku,
        category: category || null,
        unit_price: Number(unit_price),
        current_stock: Number(current_stock),
        minimum_stock: Number(minimum_stock),
        warehouse_location: warehouse_location || null,
        updated_at: new Date(),
      },
    });

    res.json({
      ...product,
      unit_price: Number(product.unit_price),
    });
  } catch (error) {
    console.error("PUT product error:", error);

    res.status(500).json({
      message: "Failed to update product",
    });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await prisma.products.findUnique({ where: { id } });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const orderItemCount = await prisma.challan_items.count({
      where: { product_id: id },
    });

    if (orderItemCount > 0) {
      return res.status(409).json({
        message: `Cannot delete ${product.name} because it is used in ${orderItemCount} order item(s). Keep it to preserve order history.`,
      });
    }

    await prisma.products.delete({
      where: {
        id,
      },
    });

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE product error:", error);

    if (error?.code === "P2003") {
      return res.status(409).json({
        message: "This product cannot be deleted because it is used in existing records.",
      });
    }

    res.status(500).json({
      message: "Failed to delete product",
    });
  }
});

// GET sales
app.get("/api/sales", async (_req: Request, res: Response) => {
  try {
    const sales = await prisma.challans.findMany({
      include: {
        customers: true,
        challan_items: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    const result = sales
      .filter((sale) => !sale.challan_number.startsWith("ORD-"))
      .map((sale) => ({
      id: sale.id,
      sale_number: sale.challan_number,
      challan_number: sale.challan_number,
      customer_id: sale.customer_id,
      customer: sale.customers,
      customers: sale.customers,
      total_quantity: sale.total_quantity,
      status: sale.status,
      created_at: sale.created_at,

      items: sale.challan_items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        unit_price: Number(item.unit_price),
        quantity: item.quantity,
        total: Number(item.unit_price) * item.quantity,
      })),

      total_amount: sale.challan_items.reduce(
        (sum, item) =>
          sum + Number(item.unit_price) * item.quantity,
        0
      ),
    }));

    res.json(result);
  } catch (error) {
    console.error("GET /api/sales error:", error);

    res.status(500).json({
      message: "Failed to fetch sales",
    });
  }
});
app.put("/api/sales/:id/cancel", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const cancelledSale = await prisma.$transaction(async (tx) => {
      const sale = await tx.challans.findUnique({
        where: { id },
        include: { challan_items: true },
      });

      if (!sale || sale.challan_number.startsWith("ORD-")) {
        throw new Error("Sale not found");
      }

      if (sale.status === "CANCELLED") {
        throw new Error("Sale is already cancelled");
      }

      if (sale.status !== "CONFIRMED") {
        throw new Error("Only confirmed sales can be cancelled");
      }

      for (const item of sale.challan_items) {
        await tx.products.update({
          where: { id: item.product_id },
          data: { current_stock: { increment: item.quantity }, updated_at: new Date() },
        });
        await tx.stock_movements.create({
          data: {
            product_id: item.product_id,
            quantity: item.quantity,
            movement_type: "IN",
            reason: `Cancelled sale ${sale.challan_number}`,
          },
        });
      }

      return tx.challans.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    });

    res.json({ success: true, message: "Sale cancelled and stock restored", sale: cancelledSale });
  } catch (error: any) {
    console.error("PUT /api/sales/:id/cancel error:", error);
    const message = error?.message || "Failed to cancel sale";
    const status = ["Sale not found", "Sale is already cancelled", "Only confirmed sales can be cancelled"].includes(message) ? 400 : 500;
    res.status(status).json({ message });
  }
});

app.post("/api/sales", async (req: Request, res: Response) => {
  try {
    const { customer_id, items } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        message: "Customer is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one product is required",
      });
    }

    const customer = await prisma.customers.findUnique({
      where: {
        id: Number(customer_id),
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalQuantity = 0;

      const preparedItems: any[] = [];

      for (const item of items) {
        const productId = Number(
          item.product_id ?? item.productId
        );

        const quantity = Number(item.quantity);

        if (!productId || quantity <= 0) {
          throw new Error("Invalid product or quantity");
        }

        const product = await tx.products.findUnique({
          where: {
            id: productId,
          },
        });

        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        if (product.current_stock < quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available stock: ${product.current_stock}`
          );
        }

        totalQuantity += quantity;

        preparedItems.push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          unit_price: product.unit_price,
          quantity,
        });
      }

      const challanNumber =
        "SAL-" +
        Date.now() +
        Math.floor(Math.random() * 1000);

      const challan = await tx.challans.create({
        data: {
          challan_number: challanNumber,
          customer_id: Number(customer_id),
          total_quantity: totalQuantity,
          status: "CONFIRMED",
        },
      });

      for (const item of preparedItems) {
        await tx.challan_items.create({
          data: {
            challan_id: challan.id,
            product_id: item.product_id,
            product_name: item.product_name,
            sku: item.sku,
            unit_price: item.unit_price,
            quantity: item.quantity,
          },
        });

        await tx.sales.create({
          data: {
            challan_id: challan.id,
            customer_id: Number(customer_id),
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: Number(item.unit_price) * item.quantity,
          },
        });

        await tx.products.update({
          where: {
            id: item.product_id,
          },
          data: {
            current_stock: {
              decrement: item.quantity,
            },
            updated_at: new Date(),
          },
        });

        await tx.stock_movements.create({
          data: {
            product_id: item.product_id,
            quantity: item.quantity,
            movement_type: "OUT",
            reason: `Sale ${challanNumber}`,
          },
        });
      }

      return challan;
    });

    res.status(201).json({
      success: true,
      message: "Sale created successfully",
      sale: result,
      sale_number: result.challan_number,
    });
  } catch (error: any) {
    console.error("POST /api/sales error:", error);

    res.status(500).json({
      message: error?.message || "Failed to create sale",
    });
  }
});

// ORDERS

app.get("/api/orders", async (_req: Request, res: Response) => {
  try {
    console.log("GET /api/orders");

    const [orders, products] = await Promise.all([
      prisma.challans.findMany({
        include: {
          customers: true,
          challan_items: true,
        },
        orderBy: {
          id: "desc",
        },
      }),
      prisma.products.findMany({ select: { id: true } }),
    ]);
    const availableProductIds = new Set(products.map((product) => product.id));

    const result = orders.map((order) => {
      const unavailableProducts = order.challan_items
        .filter((item) => !availableProductIds.has(item.product_id))
        .map((item) => item.product_name);

      return {
      id: order.id,

      order_number: order.challan_number,

      customer_id: order.customer_id,

      customer: order.customers
        ? {
            id: order.customers.id,
            name: order.customers.name,
            mobile: order.customers.mobile,
            email: order.customers.email,
          }
        : null,

      total_quantity: order.total_quantity,

      status: order.status,

      can_confirm: order.status === "DRAFT" && unavailableProducts.length === 0,
      unavailable_products: unavailableProducts,

      created_at: order.created_at,

      items: order.challan_items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        unit_price: Number(item.unit_price),
        quantity: item.quantity,
        total:
          Number(item.unit_price) * Number(item.quantity),
      })),

      total_amount: order.challan_items.reduce(
        (sum, item) =>
          sum +
          Number(item.unit_price) *
            Number(item.quantity),
        0
      ),
    };
    });

    res.json(result);
  } catch (error) {
    console.error("GET /api/orders error:", error);

    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});

// GET SINGLE ORDER
app.get("/api/orders/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await prisma.challans.findUnique({
      where: {
        id,
      },
      include: {
        customers: true,
        challan_items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      id: order.id,
      order_number: order.challan_number,
      customer_id: order.customer_id,

      customer: order.customers,

      total_quantity: order.total_quantity,

      status: order.status,

      created_at: order.created_at,

      items: order.challan_items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        unit_price: Number(item.unit_price),
        quantity: item.quantity,
        total:
          Number(item.unit_price) *
          Number(item.quantity),
      })),

      total_amount: order.challan_items.reduce(
        (sum, item) =>
          sum +
          Number(item.unit_price) *
            Number(item.quantity),
        0
      ),
    });
  } catch (error) {
    console.error("GET order error:", error);

    res.status(500).json({
      message: "Failed to fetch order",
    });
  }
});

// CREATE ORDER
app.post("/api/orders", async (req: Request, res: Response) => {
  try {
    console.log("POST /api/orders");
    console.log("Body:", req.body);

    const { customer_id, items } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        message: "Customer is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one product is required",
      });
    }

    const customer = await prisma.customers.findUnique({
      where: {
        id: Number(customer_id),
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalQuantity = 0;

      const preparedItems: any[] = [];

      for (const item of items) {
        const productId = Number(
          item.product_id ??
            item.productId ??
            item.id
        );

        const quantity = Number(item.quantity);

        if (!productId) {
          throw new Error("Product is required");
        }

        if (!quantity || quantity <= 0) {
          throw new Error(
            "Product quantity must be greater than 0"
          );
        }

        const product = await tx.products.findUnique({
          where: {
            id: productId,
          },
        });

        if (!product) {
          throw new Error(
            `Product with ID ${productId} not found`
          );
        }

        if (product.current_stock < quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available stock: ${product.current_stock}`
          );
        }

        totalQuantity += quantity;

        preparedItems.push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          unit_price: product.unit_price,
          quantity,
        });
      }

      const orderNumber =
        "ORD-" +
        Date.now() +
        Math.floor(Math.random() * 1000);

      const order = await tx.challans.create({
        data: {
          challan_number: orderNumber,
          customer_id: Number(customer_id),
          total_quantity: totalQuantity,
          status: "DRAFT",
        },
      });
      const databaseOrder = await tx.orders.create({
        data: {
          order_number: orderNumber,
          customer_id: Number(customer_id),
          total_quantity: totalQuantity,
          total_amount: preparedItems.reduce(
            (total, item) => total + Number(item.unit_price) * item.quantity,
            0
          ),
          status: "PENDING",
        },
      });

      for (const item of preparedItems) {
        await tx.challan_items.create({
          data: {
            challan_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            sku: item.sku,
            unit_price: item.unit_price,
            quantity: item.quantity,
          },
        });

        await tx.order_items.create({
          data: {
            order_id: databaseOrder.id,
            product_id: item.product_id,
            product_name: item.product_name,
            sku: item.sku,
            unit_price: item.unit_price,
            quantity: item.quantity,
          },
        });
      }

      return order;
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: result.id,
        order_number: result.challan_number,
        customer_id: result.customer_id,
        total_quantity: result.total_quantity,
        status: result.status,
      },
    });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);

    res.status(500).json({
      message:
        error?.message || "Failed to create order",
    });
  }
});

app.put(
  "/api/orders/:id/confirm",
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      const result = await prisma.$transaction(
        async (tx) => {
          const order = await tx.challans.findUnique({
            where: {
              id,
            },
            include: {
              challan_items: true,
            },
          });

          if (!order) {
            throw new Error("Order not found");
          }

          if (order.status === "CONFIRMED") {
            throw new Error("Order is already confirmed");
          }

          if (order.status === "CANCELLED") {
            throw new Error(
              "Cancelled order cannot be confirmed"
            );
          }

          for (const item of order.challan_items) {
            const product =
              await tx.products.findUnique({
                where: {
                  id: item.product_id,
                },
              });

            if (!product) {
              throw new Error(
                `Product ${item.product_name} not found`
              );
            }

            if (
              product.current_stock <
              item.quantity
            ) {
              throw new Error(
                `Insufficient stock for ${product.name}`
              );
            }

            await tx.products.update({
              where: {
                id: product.id,
              },
              data: {
                current_stock: {
                  decrement: item.quantity,
                },
                updated_at: new Date(),
              },
            });

            await tx.stock_movements.create({
              data: {
                product_id: product.id,
                quantity: item.quantity,
                movement_type: "OUT",
                reason: `Order ${order.challan_number}`,
              },
            });
          }

          const confirmed =
            await tx.challans.update({
              where: {
                id,
              },
              data: {
                status: "CONFIRMED",
              },
            });

          return confirmed;
        }
      );

      res.json({
        success: true,
        message: "Order confirmed successfully",
        order: result,
      });
    } catch (error: any) {
      console.error(
        "PUT /api/orders/:id/confirm error:",
        error
      );

      res.status(500).json({
        message:
          error?.message ||
          "Failed to confirm order",
      });
    }
  }
);

app.put(
  "/api/orders/:id/cancel",
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      const order = await prisma.challans.findUnique({
        where: {
          id,
        },
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      if (order.status === "CONFIRMED") {
        return res.status(400).json({
          message:
            "Confirmed order cannot be cancelled from this endpoint",
        });
      }

      const updated =
        await prisma.challans.update({
          where: {
            id,
          },
          data: {
            status: "CANCELLED",
          },
        });

      res.json({
        success: true,
        message: "Order cancelled successfully",
        order: updated,
      });
    } catch (error) {
      console.error(
        "PUT /api/orders/:id/cancel error:",
        error
      );

      res.status(500).json({
        message: "Failed to cancel order",
      });
    }
  }
);

app.delete("/api/orders/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    await prisma.$transaction(async (tx) => {
      const record = await tx.challans.findUnique({
        where: { id },
        include: { challan_items: true },
      });

      if (!record) {
        throw new Error("Order not found");
      }

      if (record.status === "CONFIRMED") {
        for (const item of record.challan_items) {
          const product = await tx.products.findUnique({ where: { id: item.product_id } });
          if (!product) continue;

          await tx.products.update({
            where: { id: item.product_id },
            data: { current_stock: { increment: item.quantity }, updated_at: new Date() },
          });
          await tx.stock_movements.create({
            data: {
              product_id: item.product_id,
              quantity: item.quantity,
              movement_type: "IN",
              reason: `Deleted order ${record.challan_number}`,
            },
          });
        }
      }

      const mirroredOrder = await tx.orders.findUnique({
        where: { order_number: record.challan_number },
        select: { id: true },
      });
      if (mirroredOrder) {
        await tx.order_items.deleteMany({ where: { order_id: mirroredOrder.id } });
        await tx.orders.delete({ where: { id: mirroredOrder.id } });
      }

      await tx.sales.deleteMany({ where: { challan_id: record.id } });
      await tx.challan_items.deleteMany({ where: { challan_id: record.id } });
      await tx.challans.delete({ where: { id: record.id } });
    });

    res.json({ success: true, message: "Order history deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/orders/:id error:", error);
    const message = error?.message || "Failed to delete order history";
    res.status(message === "Order not found" ? 404 : 500).json({ message });
  }
});

// CHALLANS

app.get("/api/challans", async (_req: Request, res: Response) => {
  try {
    const challans = await prisma.challans.findMany({
      include: {
        customers: true,
        challan_items: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    res.json(challans);
  } catch (error) {
    console.error(
      "GET /api/challans error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch challans",
    });
  }
});

// STOCK MOVEMENTS

app.get(
  "/api/stock-movements",
  async (_req: Request, res: Response) => {
    try {
      const movements =
        await prisma.stock_movements.findMany({
          include: {
            products: true,
          },
          orderBy: {
            id: "desc",
          },
        });

      res.json(
        movements.map((movement) => ({
          ...movement,
          product: movement.products,
        }))
      );
    } catch (error) {
      console.error(
        "GET stock movements error:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch stock movements",
      });
    }
  }
);

// REPORTS

app.get("/api/reports", async (_req: Request, res: Response) => {
  try {
    const [customers, products, orders] = await Promise.all([
      prisma.customers.findMany({
        select: { id: true, name: true, status: true },
      }),
      prisma.products.findMany({
        select: {
          id: true,
          name: true,
          current_stock: true,
          minimum_stock: true,
        },
      }),
      prisma.challans.findMany({
        include: { customers: true, challan_items: true },
        orderBy: { id: "desc" },
      }),
    ]);

    const productTotals = new Map<string, { quantity: number; revenue: number }>();
    const customerTotals = new Map<string, { customer_name: string; orders: number; quantity: number; revenue: number }>();

    let totalRevenue = 0;
    let totalQuantity = 0;

    for (const order of orders) {
      if (order.status !== "CONFIRMED") continue;

      let orderRevenue = 0;
      for (const item of order.challan_items) {
        const revenue = Number(item.unit_price) * item.quantity;
        orderRevenue += revenue;

        const product = productTotals.get(item.product_name) ?? { quantity: 0, revenue: 0 };
        product.quantity += item.quantity;
        product.revenue += revenue;
        productTotals.set(item.product_name, product);
      }

      totalQuantity += order.total_quantity;
      totalRevenue += orderRevenue;
      const customer = customerTotals.get(String(order.customer_id)) ?? {
        customer_name: order.customers?.name ?? `Deleted customer #${order.customer_id}`,
        orders: 0,
        quantity: 0,
        revenue: 0,
      };
      customer.orders += 1;
      customer.quantity += order.total_quantity;
      customer.revenue += orderRevenue;
      customerTotals.set(String(order.customer_id), customer);
    }

    const orderAmount = (order: typeof orders[number]) =>
      order.challan_items.reduce(
        (total, item) => total + Number(item.unit_price) * item.quantity,
        0
      );

    res.json({
      success: true,
      data: {
        totalCustomers: customers.length,
        activeCustomers: customers.filter((customer) => customer.status === "ACTIVE").length,
        totalProducts: products.length,
        lowStockProducts: products.filter((product) => product.current_stock <= product.minimum_stock).length,
        totalSales: orders.length,
        confirmedSales: orders.filter((order) => order.status === "CONFIRMED").length,
        draftSales: orders.filter((order) => order.status === "DRAFT").length,
        cancelledSales: orders.filter((order) => order.status === "CANCELLED").length,
        totalQuantity,
        totalRevenue,
        topProducts: [...productTotals.entries()]
          .map(([product_name, totals]) => ({ product_name, ...totals }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
        topCustomers: [...customerTotals.values()]
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
        recentSales: orders.slice(0, 8).map((order) => ({
          id: order.id,
          challan_number: order.challan_number,
          customer_name: order.customers?.name ?? `Deleted customer #${order.customer_id}`,
          status: order.status ?? "DRAFT",
          total_quantity: order.total_quantity,
          total_amount: orderAmount(order),
          created_at: order.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    res.status(500).json({ message: "Failed to build reports" });
  }
});

// DASHBOARD

app.get(
  "/api/dashboard",
  async (_req: Request, res: Response) => {
    try {
      const totalCustomers =
        await prisma.customers.count();

      const activeCustomers =
        await prisma.customers.count({
          where: {
            status: "ACTIVE",
          },
        });

      const totalProducts =
        await prisma.products.count();

      const lowStock =
        await prisma.products.count({
          where: {
            current_stock: {
              lte: prisma.products.fields.minimum_stock,
            },
          },
        });

      const wholesale =
        await prisma.customers.count({
          where: {
            customer_type: "WHOLESALE",
          },
        });

      const retail =
        await prisma.customers.count({
          where: {
            customer_type: "RETAIL",
          },
        });

      const totalSales =
        await prisma.challans.count({
          where: {
            status: "CONFIRMED",
          },
        });

      res.json({
        totalCustomers,
        activeCustomers,
        totalProducts,
        lowStock,
        wholesale,
        retail,
        totalSales,
      });
    } catch (error) {
      console.error(
        "GET dashboard error:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch dashboard",
      });
    }
  }
);

// ==================================================
// 404
// ==================================================

app.use(
  (_req: Request, res: Response) => {
    res.status(404).json({
      message: "API route not found",
    });
  }
);

// GLOBAL ERROR HANDLER

app.use(
  (
    error: any,
    _req: Request,
    res: Response,
    _next: any
  ) => {
    console.error("Global error:", error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
);

// START SERVER

async function startServer() {
  try {
    await prisma.$connect();

    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(
        `Server running on Port 5000`
      );
    });
  } catch (error) {
    console.error(
      "Failed to connect to database:",
      error
    );

    process.exit(1);
  }
}

// SHUTDOWN

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
