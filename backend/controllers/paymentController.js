const db = require('../config/db');

exports.getPaymentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const [payments] = await db.query('SELECT * FROM Payment WHERE payment_id = ?', [id]);
        if (payments.length === 0) return res.status(404).json({ error: 'Payment not found' });
        res.json(payments[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payment' });
    }
};

// Process generic payment if separate from booking
exports.processPayment = async (req, res) => {
    // This might be used for ad-hoc payments or integration with gateway callbacks
    res.json({ message: 'Payment processed' });
}
