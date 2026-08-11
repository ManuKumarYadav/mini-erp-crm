import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const customers = await prisma.customers.findMany();

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const customer = await prisma.customers.findUnique({
      where: {
        id: id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("GET CUSTOMER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const customer = await prisma.customers.create({
      data: {
        ...req.body,
        follow_up_date: req.body.follow_up_date
          ? new Date(req.body.follow_up_date)
          : null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("CREATE CUSTOMER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const customer = await prisma.customers.update({
      where: {
        id: id,
      },
      data: {
        ...req.body,
        follow_up_date: req.body.follow_up_date
          ? new Date(req.body.follow_up_date)
          : null,
      },
    });

    res.json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.customers.delete({
      where: {
        id: id,
      },
    });

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CUSTOMER ERROR:", error);

    res.status(404).json({
      success: false,
      message: "Customer not found",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;