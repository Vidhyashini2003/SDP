const express = require('express');
const router = express.Router();
const damageController = require('../controllers/damageController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);
router.use(authorizeRole('guest'));

router.get('/:guestId/damages', damageController.getDamagesByGuest);
router.post('/damages/:id/pay', damageController.payDamage);

module.exports = router;
