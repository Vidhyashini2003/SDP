/**
 * routes/chef.js — Chef / Kitchen Staff Portal Routes
 *
 * All routes require a valid JWT token AND role = 'chef' or 'admin'.
 * Both middleware are applied globally at the top with router.use().
 *
 * Features:
 *  - Order Management: view all food orders, update order status, start cooking, update individual item statuses
 *  - Menu Management: CRUD operations for menu items with image uploads (stored in /uploads/menu/)
 *  - Damage Reporting: Chefs can report and view damages found in the kitchen
 *
 * Image Uploads:
 *   Menu item images are uploaded to uploads/menu/ using Multer disk storage.
 *   Each image filename is prefixed with "item-" followed by a unique timestamp + random number.
 *
 * All routes are mounted at: /api/chef (see server.js)
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, authorizeRole } = require('../config/auth');

// Apply JWT verification AND role check to all routes below
router.use(verifyToken);
router.use(authorizeRole('chef', 'admin')); // Only chef or admin can access these routes

// ─────────────────────────────────────────────
// ORDER MANAGEMENT
// ─────────────────────────────────────────────

// GET /api/chef/orders               — List all food orders (pending, preparing, delivered, etc.)
router.get('/orders', orderController.getAllOrders);

// PUT /api/chef/orders/:id/status    — Update the overall status of a food order
//     (e.g. Pending → Preparing → Prepared → Delivered)
router.put('/orders/:id/status', orderController.updateOrderStatus);

// PUT /api/chef/orders/:id/start-cooking — Chef accepts an order and starts cooking.
//     Marks the order as "In Progress" and assigns the chef.
router.put('/orders/:id/start-cooking', orderController.startCooking);

// PUT /api/chef/orders/items/:itemId/status — Update the status of a single item within an order.
//     Allows fine-grained control (e.g. one item is ready while others are still cooking).
router.put('/orders/items/:itemId/status', orderController.updateOrderItemStatus);

// ─────────────────────────────────────────────
// MENU MANAGEMENT (with image upload)
// ─────────────────────────────────────────────

// Multer setup for menu item image uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the upload directory exists at server startup
const uploadDir = 'uploads/menu';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // Create /uploads/menu/ if it doesn't exist
}

// Configure disk storage for menu item images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files to uploads/menu/
    },
    filename: (req, file, cb) => {
        // Generate unique filename: e.g. "item-1713700800000-123456789.jpg"
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage }); // Create the upload middleware

// GET    /api/chef/menu      — List all menu items (for display and management)
router.get('/menu', orderController.getAllMenuItems); 

// POST   /api/chef/menu      — Add a new menu item (with optional image upload)
router.post('/menu', upload.single('image'), orderController.addMenuItem);

// PUT    /api/chef/menu/:id  — Update an existing menu item's details or image
router.put('/menu/:id', upload.single('image'), orderController.updateMenuItem);

// DELETE /api/chef/menu/:id  — Remove a menu item from the menu
router.delete('/menu/:id', orderController.deleteMenuItem);

// ─────────────────────────────────────────────
// DAMAGE MANAGEMENT
// ─────────────────────────────────────────────

// Chefs can also report kitchen equipment or food-related damages
const damageController = require('../controllers/damageController');

// GET  /api/chef/damages — View all damage reports
router.get('/damages', damageController.getAllDamages);

// POST /api/chef/damages — Report a new damage (kitchen equipment, crockery, etc.)
router.post('/damages', damageController.reportDamage);

module.exports = router;
