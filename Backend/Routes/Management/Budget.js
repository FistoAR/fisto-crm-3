const express = require("express");
const router = express.Router();
const { queryWithRetry } = require("../../dataBase/connection");

// ========== HELPER FUNCTION: FORMAT MONTH ==========
function formatMonth(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// ========== GET CURRENT MONTH ==========
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ========== SET MONTHLY BUDGET ==========
router.post("/set-budget", async (req, res) => {
  try {
    const userData = JSON.parse(req.headers["x-user-data"] || "{}");
    const employee_id = userData.userName || "FST001";
    const { month, budget_amount } = req.body;

    if (!month || !budget_amount) {
      return res.status(400).json({
        success: false,
        error: "Month and budget amount are required",
      });
    }

    // Check if budget already exists for this month
    const existing = await queryWithRetry(
      "SELECT id FROM monthly_budgets WHERE month = ?",
      [month]
    );

    if (existing.length > 0) {
      // Update existing budget
      await queryWithRetry(
        "UPDATE monthly_budgets SET budget_amount = ?, updated_at = NOW() WHERE month = ?",
        [parseFloat(budget_amount), month]
      );
    } else {
      // Insert new budget
      await queryWithRetry(
        "INSERT INTO monthly_budgets (month, budget_amount, created_by) VALUES (?, ?, ?)",
        [month, parseFloat(budget_amount), employee_id]
      );
    }

    res.json({
      success: true,
      message: "Budget set successfully",
      month: month,
      budget_amount: parseFloat(budget_amount),
    });
  } catch (err) {
    console.error("❌ Set budget error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to set budget",
    });
  }
});

// ========== GET MONTHLY BUDGET ==========
router.get("/budget/:month", async (req, res) => {
  try {
    const { month } = req.params;

    const result = await queryWithRetry(
      "SELECT * FROM monthly_budgets WHERE month = ?",
      [month]
    );

    if (result.length === 0) {
      return res.json({
        success: true,
        budget: null,
        budget_amount: 0,
      });
    }

    res.json({
      success: true,
      budget: result[0],
      budget_amount: result[0].budget_amount,
    });
  } catch (err) {
    console.error("❌ Get budget error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch budget",
    });
  }
});

// ========== GET ALL BUDGETS ==========
router.get("/budgets", async (req, res) => {
  try {
    const results = await queryWithRetry(
      "SELECT * FROM monthly_budgets ORDER BY month DESC"
    );

    res.json({
      success: true,
      budgets: results,
    });
  } catch (err) {
    console.error("❌ Get budgets error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch budgets",
    });
  }
});

// ========== ADD CLIENT ==========
router.post("/clients", async (req, res) => {
  try {
    const userData = JSON.parse(req.headers["x-user-data"] || "{}");
    const employee_id = userData.userName || "FST001";

    const {
      company_name,
      client_name,
      project_name,
      project_category,
      expected_amount,
      due_date,
      notes,
      month,
    } = req.body;

    // Validation
    if (
      !company_name ||
      !client_name ||
      !project_name ||
      !project_category ||
      !expected_amount ||
      !month
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const result = await queryWithRetry(
      `INSERT INTO budget_clients 
       (company_name, client_name, project_name, project_category, expected_amount, 
        due_date, notes, month, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_name,
        client_name,
        project_name,
        project_category,
        parseFloat(expected_amount),
        due_date || null,
        notes || null,
        month,
        employee_id,
      ]
    );

    res.json({
      success: true,
      message: "Client added successfully",
      client_id: result.insertId,
    });
  } catch (err) {
    console.error("❌ Add client error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to add client",
    });
  }
});

// ========== UPDATE CLIENT ==========
router.put("/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company_name,
      client_name,
      project_name,
      project_category,
      expected_amount,
      due_date,
      notes,
    } = req.body;

    // Check if client exists
    const existing = await queryWithRetry(
      "SELECT id FROM budget_clients WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    await queryWithRetry(
      `UPDATE budget_clients 
       SET company_name = ?, client_name = ?, project_name = ?, 
           project_category = ?, expected_amount = ?, due_date = ?, 
           notes = ?, updated_at = NOW() 
       WHERE id = ?`,
      [
        company_name,
        client_name,
        project_name,
        project_category,
        parseFloat(expected_amount),
        due_date || null,
        notes || null,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Client updated successfully",
    });
  } catch (err) {
    console.error("❌ Update client error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update client",
    });
  }
});

// ========== DELETE CLIENT ==========
router.delete("/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if client exists
    const existing = await queryWithRetry(
      "SELECT id FROM budget_clients WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    await queryWithRetry("DELETE FROM budget_clients WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete client error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete client",
    });
  }
});

// ========== GET CLIENTS BY MONTH ==========
router.get("/clients/month/:month", async (req, res) => {
  try {
    const { month } = req.params;
    const { search, status, category } = req.query;

    let query = "SELECT * FROM budget_clients WHERE month = ?";
    let params = [month];

    // Add search filter
    if (search) {
      query += ` AND (company_name LIKE ? OR client_name LIKE ? OR project_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add status filter
    if (status && status !== "all") {
      query += ` AND payment_status = ?`;
      params.push(status);
    }

    // Add category filter
    if (category && category !== "all") {
      query += ` AND project_category = ?`;
      params.push(category);
    }

    query += " ORDER BY created_at DESC";

    const results = await queryWithRetry(query, params);

    res.json({
      success: true,
      clients: results,
      count: results.length,
    });
  } catch (err) {
    console.error("❌ Get clients error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch clients",
    });
  }
});

// ========== GET ALL CLIENTS ==========
router.get("/clients", async (req, res) => {
  try {
    const results = await queryWithRetry(
      "SELECT * FROM budget_clients ORDER BY month DESC, created_at DESC"
    );

    res.json({
      success: true,
      clients: results,
    });
  } catch (err) {
    console.error("❌ Get all clients error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch clients",
    });
  }
});

// ========== UPDATE PAYMENT ==========
router.put("/clients/:id/payment", async (req, res) => {
  try {
    const userData = JSON.parse(req.headers["x-user-data"] || "{}");
    const employee_id = userData.userName || "FST001";
    const { id } = req.params;
    const { received_amount, payment_status, notes } = req.body;

    // Get current payment info
    const current = await queryWithRetry(
      "SELECT received_amount, payment_status, notes FROM budget_clients WHERE id = ?",
      [id]
    );

    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    const previous = current[0];
    const amount_change = parseFloat(received_amount) - previous.received_amount;

    // Update client payment
    await queryWithRetry(
      `UPDATE budget_clients 
       SET received_amount = ?, payment_status = ?, notes = ?, updated_at = NOW() 
       WHERE id = ?`,
      [parseFloat(received_amount), payment_status, notes || previous.notes, id]
    );

    // Insert payment history
    await queryWithRetry(
      `INSERT INTO budget_payment_history 
       (client_id, previous_amount, new_amount, amount_change, 
        previous_status, new_status, notes, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        previous.received_amount,
        parseFloat(received_amount),
        amount_change,
        previous.payment_status,
        payment_status,
        notes || null,
        employee_id,
      ]
    );

    res.json({
      success: true,
      message: "Payment updated successfully",
    });
  } catch (err) {
    console.error("❌ Update payment error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update payment",
    });
  }
});

// ========== GET PAYMENT HISTORY FOR CLIENT ==========
router.get("/clients/:id/payment-history", async (req, res) => {
  try {
    const { id } = req.params;

    const results = await queryWithRetry(
      "SELECT * FROM budget_payment_history WHERE client_id = ? ORDER BY updated_at DESC",
      [id]
    );

    res.json({
      success: true,
      history: results,
    });
  } catch (err) {
    console.error("❌ Get payment history error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment history",
    });
  }
});

// ========== GET MONTHLY OVERVIEW ==========
router.get("/overview/:month", async (req, res) => {
  try {
    const { month } = req.params;

    // Get budget
    const budgetResult = await queryWithRetry(
      "SELECT budget_amount FROM monthly_budgets WHERE month = ?",
      [month]
    );
    const budget = budgetResult.length > 0 ? budgetResult[0].budget_amount : 0;

    // Get clients summary
    const clients = await queryWithRetry(
      "SELECT * FROM budget_clients WHERE month = ?",
      [month]
    );

    // Calculate totals
    let total_expected = 0;
    let total_received = 0;
    let status_counts = {
      pending: 0,
      partial: 0,
      received: 0,
      overdue: 0,
    };
    let category_totals = {};

    clients.forEach((client) => {
      total_expected += parseFloat(client.expected_amount);
      total_received += parseFloat(client.received_amount);
      status_counts[client.payment_status]++;

      if (!category_totals[client.project_category]) {
        category_totals[client.project_category] = 0;
      }
      category_totals[client.project_category] += parseFloat(
        client.expected_amount
      );
    });

    const pending_amount = total_expected - total_received;
    const budget_progress = budget > 0 ? (total_received / budget) * 100 : 0;

    res.json({
      success: true,
      overview: {
        month: month,
        budget: budget,
        total_expected: total_expected,
        total_received: total_received,
        pending_amount: pending_amount,
        budget_progress: budget_progress,
        client_count: clients.length,
        status_distribution: status_counts,
        category_distribution: category_totals,
      },
    });
  } catch (err) {
    console.error("❌ Get overview error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch overview",
    });
  }
});

// ========== GET AVAILABLE MONTHS ==========
router.get("/available-months", async (req, res) => {
  try {
    // Get months from budgets and clients
    const query = `
      SELECT DISTINCT month FROM (
        SELECT month FROM monthly_budgets
        UNION
        SELECT month FROM budget_clients
      ) AS all_months
      ORDER BY month DESC
    `;

    const results = await queryWithRetry(query);

    res.json({
      success: true,
      months: results.map((row) => row.month),
      current_month: getCurrentMonth(),
    });
  } catch (err) {
    console.error("❌ Get available months error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch available months",
    });
  }
});

// ========== GET BUDGET HISTORY FOR CHARTS ==========
router.get("/history", async (req, res) => {
  try {
    const query = `
      SELECT 
        mb.month,
        mb.budget_amount,
        COALESCE(SUM(bc.received_amount), 0) AS total_received,
        COUNT(bc.id) AS client_count
      FROM monthly_budgets mb
      LEFT JOIN budget_clients bc ON mb.month = bc.month
      GROUP BY mb.month, mb.budget_amount
      ORDER BY mb.month ASC
    `;

    const results = await queryWithRetry(query);

    res.json({
      success: true,
      history: results,
    });
  } catch (err) {
    console.error("❌ Get history error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch history",
    });
  }
});

// ========== GET CATEGORY DISTRIBUTION ==========
router.get("/categories/:month", async (req, res) => {
  try {
    const { month } = req.params;

    const results = await queryWithRetry(
      `SELECT 
        project_category,
        COUNT(*) AS project_count,
        SUM(expected_amount) AS total_expected,
        SUM(received_amount) AS total_received
      FROM budget_clients
      WHERE month = ?
      GROUP BY project_category
      ORDER BY total_expected DESC`,
      [month]
    );

    res.json({
      success: true,
      categories: results,
    });
  } catch (err) {
    console.error("❌ Get categories error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
});

// ========== GET PAYMENT STATUS DISTRIBUTION ==========
router.get("/status-distribution/:month", async (req, res) => {
  try {
    const { month } = req.params;

    const results = await queryWithRetry(
      `SELECT 
        payment_status,
        COUNT(*) AS count,
        SUM(expected_amount) AS total_expected,
        SUM(received_amount) AS total_received
      FROM budget_clients
      WHERE month = ?
      GROUP BY payment_status`,
      [month]
    );

    res.json({
      success: true,
      status_distribution: results,
    });
  } catch (err) {
    console.error("❌ Get status distribution error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch status distribution",
    });
  }
});

// ========== CHECK IF MONTH HAS DATA ==========
router.get("/check-month/:month", async (req, res) => {
  try {
    const { month } = req.params;

    const budgetCheck = await queryWithRetry(
      "SELECT id FROM monthly_budgets WHERE month = ?",
      [month]
    );

    const clientCheck = await queryWithRetry(
      "SELECT id FROM budget_clients WHERE month = ? LIMIT 1",
      [month]
    );

    const has_data = budgetCheck.length > 0 || clientCheck.length > 0;

    res.json({
      success: true,
      month: month,
      has_data: has_data,
      has_budget: budgetCheck.length > 0,
      has_clients: clientCheck.length > 0,
    });
  } catch (err) {
    console.error("❌ Check month error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to check month",
    });
  }
});

// ========== GET DASHBOARD SUMMARY (ALL DATA) ==========
router.get("/dashboard-summary", async (req, res) => {
  try {
    // Get all budgets
    const budgets = await queryWithRetry(
      "SELECT * FROM monthly_budgets ORDER BY month DESC"
    );

    // Get all clients
    const clients = await queryWithRetry(
      "SELECT * FROM budget_clients ORDER BY month DESC, created_at DESC"
    );

    // Create budget history data
    const budgetHistoryData = {};
    budgets.forEach((budget) => {
      budgetHistoryData[budget.month] = parseFloat(budget.budget_amount);
    });

    res.json({
      success: true,
      budgets: budgetHistoryData,
      clients: clients,
      current_month: getCurrentMonth(),
    });
  } catch (err) {
    console.error("❌ Get dashboard summary error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard summary",
    });
  }
});

// ========== TEST ROUTE ==========
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Budget API routes are working!",
    current_month: getCurrentMonth(),
  });
});

module.exports = router;