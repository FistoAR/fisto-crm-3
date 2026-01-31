const express = require("express");
const router = express.Router();
const db = require("../../dataBase/connection");

// GET - Fetch today's celebrations (quotes with today's date)
router.get("/today", (req, res) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  const query = `
    SELECT 
      id,
      date,
      quote,
      occasion,
      image_url as imageUrl,
      created_at
    FROM quotes
    WHERE DATE(date) = ?
    ORDER BY date DESC
  `;

  db.pool.query(query, [todayStr], (err, results) => {
    if (err) {
      console.error("Error fetching today's celebrations:", err);
      return res.status(500).json({
        status: false,
        message: "Database error",
        error: err.message,
      });
    }

    const celebrations = results.map(quote => ({
      id: quote.id,
      date: quote.date,
      quote: quote.quote,
      occasion: quote.occasion,
      imageUrl: quote.imageUrl,
      description: quote.quote // Added for backward compatibility
    }));

    res.json({
      status: true,
      celebrations: celebrations,
      count: celebrations.length
    });
  });
});

// GET - Fetch upcoming celebrations (next 7 days)
router.get("/upcoming", (req, res) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const query = `
    SELECT 
      id,
      date,
      quote,
      occasion,
      image_url as imageUrl,
      created_at
    FROM quotes
    WHERE DATE(date) BETWEEN ? AND ?
    ORDER BY date ASC
  `;

  db.pool.query(query, [todayStr, nextWeekStr], (err, results) => {
    if (err) {
      console.error("Error fetching upcoming celebrations:", err);
      return res.status(500).json({
        status: false,
        message: "Database error",
        error: err.message,
      });
    }

    const upcoming = results.map(quote => {
      const date = new Date(quote.date);
      const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      
      return {
        id: quote.id,
        date: quote.date,
        quote: quote.quote,
        occasion: quote.occasion,
        imageUrl: quote.imageUrl,
        daysUntil: daysUntil,
        formattedDate: formatDate(date)
      };
    });

    res.json({
      status: true,
      upcoming: upcoming,
      count: upcoming.length
    });
  });
});

// GET - Fetch recent celebrations (last 30 days)
router.get("/recent", (req, res) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const lastMonth = new Date();
  lastMonth.setDate(today.getDate() - 30);
  const lastMonthStr = lastMonth.toISOString().split('T')[0];

  const query = `
    SELECT 
      id,
      date,
      quote,
      occasion,
      image_url as imageUrl,
      created_at
    FROM quotes
    WHERE DATE(date) BETWEEN ? AND ?
    ORDER BY date DESC
    LIMIT 20
  `;

  db.pool.query(query, [lastMonthStr, todayStr], (err, results) => {
    if (err) {
      console.error("Error fetching recent celebrations:", err);
      return res.status(500).json({
        status: false,
        message: "Database error",
        error: err.message,
      });
    }

    res.json({
      status: true,
      recent: results,
      count: results.length
    });
  });
});

// GET - Fetch celebrations by occasion type
router.get("/occasion/:type", (req, res) => {
  const { type } = req.params;
  
  let occasionTypes = [];
  
  switch (type.toLowerCase()) {
    case 'birthdays':
      occasionTypes = ['Birthday'];
      break;
    case 'anniversaries':
      occasionTypes = ['Work Anniversary'];
      break;
    case 'holidays':
      occasionTypes = ['Holiday'];
      break;
    case 'special':
      occasionTypes = ['Special Day', 'Celebration'];
      break;
    default:
      occasionTypes = [type];
  }

  const query = `
    SELECT 
      id,
      date,
      quote,
      occasion,
      image_url as imageUrl,
      created_at
    FROM quotes
    WHERE occasion IN (?)
    ORDER BY date DESC
    LIMIT 50
  `;

  db.pool.query(query, [occasionTypes], (err, results) => {
    if (err) {
      console.error("Error fetching celebrations by occasion:", err);
      return res.status(500).json({
        status: false,
        message: "Database error",
        error: err.message,
      });
    }

    res.json({
      status: true,
      celebrations: results,
      count: results.length,
      occasionType: type
    });
  });
});

// GET - Search celebrations by keyword
router.get("/search", (req, res) => {
  const { q, occasion, month, year } = req.query;
  
  let query = `
    SELECT 
      id,
      date,
      quote,
      occasion,
      image_url as imageUrl,
      created_at
    FROM quotes
    WHERE 1=1
  `;
  
  const params = [];
  
  if (q) {
    query += ` AND (quote LIKE ? OR occasion LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`);
  }
  
  if (occasion) {
    query += ` AND occasion = ?`;
    params.push(occasion);
  }
  
  if (month) {
    query += ` AND MONTH(date) = ?`;
    params.push(month);
  }
  
  if (year) {
    query += ` AND YEAR(date) = ?`;
    params.push(year);
  }
  
  query += ` ORDER BY date DESC LIMIT 50`;

  db.pool.query(query, params, (err, results) => {
    if (err) {
      console.error("Error searching celebrations:", err);
      return res.status(500).json({
        status: false,
        message: "Database error",
        error: err.message,
      });
    }

    res.json({
      status: true,
      results: results,
      count: results.length
    });
  });
});

// GET - Get quote of the day (random quote)
router.get("/quote-of-day", (req, res) => {
  const query = `
    SELECT 
      id,
      date,
      quote,
      occasion,
      image_url as imageUrl
    FROM quotes
    ORDER BY RAND()
    LIMIT 1
  `;

  db.pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching quote of day:", err);
      return res.status(500).json({
        status: false,
        message: "Database error",
        error: err.message,
      });
    }

    res.json({
      status: true,
      quote: results[0] || null
    });
  });
});

// Helper functions
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

module.exports = router;