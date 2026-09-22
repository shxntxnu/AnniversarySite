const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/config - Get personal configuration
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const personalCfg = await store.getPersonalConfig();
    return res.json({
      success: true,
      data: personalCfg
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/config - Update personal configuration (admin only)
router.put('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const {
      partnerName,
      yourName,
      greetingSplash,
      relationshipStartDate,
      birthday,
      reasonsToLove,
      coupons,
      quiz
    } = req.body;

    const updates = {};
    if (partnerName !== undefined) updates.partnerName = partnerName;
    if (yourName !== undefined) updates.yourName = yourName;
    if (greetingSplash !== undefined) updates.greetingSplash = greetingSplash;
    if (relationshipStartDate !== undefined) updates.relationshipStartDate = relationshipStartDate;
    if (birthday !== undefined) updates.birthday = birthday;
    if (Array.isArray(reasonsToLove)) updates.reasonsToLove = reasonsToLove;
    if (Array.isArray(coupons)) updates.coupons = coupons;
    if (Array.isArray(quiz)) updates.quiz = quiz;

    const updated = await store.updatePersonalConfig(updates);
    return res.json({
      success: true,
      message: 'Personal details updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
