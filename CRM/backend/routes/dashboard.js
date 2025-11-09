const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// vendor dashboard example - only accessible to vendors
router.get('/vendor', protect, authorize('vendor'), (req, res) => {
  // in real app: fetch vendor-specific data (leads, sales, etc.)
  res.json({
    message: `Welcome to vendor dashboard, ${req.user.name}`,
    stats: { leads: 12, deals: 3 },
  });
});

// customer dashboard example - only accessible to customers
router.get('/customer', protect, authorize('customer'), (req, res) => {
  res.json({
    message: `Welcome to customer dashboard, ${req.user.name}`,
    info: { purchases: 5, activeSubscriptions: 1 },
  });
});

// generic profile route accessible to any authenticated user
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
