const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);
router.use(authorizeRole('kitchen', 'admin')); // Kitchen staff or Admin

router.get('/orders', orderController.getAllOrders);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.put('/orders/items/:itemId/status', orderController.updateOrderItemStatus);

router.get('/menu', orderController.getAllMenuItems); // Kitchen sees all status
router.post('/menu', orderController.addMenuItem);
router.put('/menu/:id', orderController.updateMenuItem);

// Damages
const damageController = require('../controllers/damageController');
router.get('/damages', damageController.getAllDamages);
router.post('/damages', damageController.reportDamage);

module.exports = router;
