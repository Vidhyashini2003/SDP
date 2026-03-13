const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);
router.use(authorizeRole('chef', 'admin')); // Chef or Admin

// Orders
router.get('/orders', orderController.getAllOrders);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.put('/orders/:id/start-cooking', orderController.startCooking);
router.put('/orders/items/:itemId/status', orderController.updateOrderItemStatus);

// Menu Management
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/menu';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/menu', orderController.getAllMenuItems); 
router.post('/menu', upload.single('image'), orderController.addMenuItem);
router.put('/menu/:id', upload.single('image'), orderController.updateMenuItem);
router.delete('/menu/:id', orderController.deleteMenuItem);

// Damages (Chefs can also report damages found in the kitchen)
const damageController = require('../controllers/damageController');
router.get('/damages', damageController.getAllDamages);
router.post('/damages', damageController.reportDamage);

module.exports = router;
