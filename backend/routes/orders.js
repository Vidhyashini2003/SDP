const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);

// Guest Routes
router.get('/menu', orderController.getMenu); // Guests see available menu
router.post('/', authorizeRole('guest'), orderController.placeOrder);
router.get('/:id', authorizeRole('guest'), async (req, res) => { /* Details impl if needed */ });

module.exports = router;
