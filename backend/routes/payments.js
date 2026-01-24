const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../config/auth');

router.use(verifyToken);
router.get('/:id', paymentController.getPaymentDetails);
router.post('/', paymentController.processPayment);

module.exports = router;
