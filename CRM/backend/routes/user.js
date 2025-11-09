const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middleware/firebaseAuth');
const User = require('../models/User');

router.get('/me', verifyFirebaseToken, async (req, res) => {
  const { uid, email, name } = req.user;

  // check if user exists in MongoDB
  let user = await User.findOne({ firebaseUID: uid });
  if (!user) {
    // if not, create
    user = await User.create({ firebaseUID: uid, email, name });
  }

  res.json(user);
});

module.exports = router;
