const db = require('../config/db');

(async () => {
  try {
    const whereClause = "WHERE r.refund_status = 'Pending'";
    const [rows] = await db.query(`
      SELECT
          r.refund_id,
          r.payment_id,
          r.refund_amount,
          r.refund_reason,
          r.refund_status,
          r.refund_date,
          CASE
              WHEN rb.rb_id IS NOT NULL THEN 'Room'
              WHEN ab.ab_id IS NOT NULL THEN 'Activity'
              WHEN vb.vb_id IS NOT NULL THEN 'Vehicle'
              WHEN fo.order_id IS NOT NULL THEN 'Food'
              ELSE 'Unknown'
          END AS service_type,
          COALESCE(
              CONCAT(u.first_name, ' ', u.last_name),
              CONCAT(wig.first_name, ' ', wig.last_name)
          ) AS guest_name,
          COALESCE(u.email, 'Walk-in') AS guest_email,
          u.user_id AS guest_user_id,
          rb.rb_checkin, rb.rb_checkout,
          ab.ab_start_time, ab.ab_end_time,
          vb.vb_date, vb.vb_days,
          fo.order_date, fo.scheduled_date
       FROM refund r
       JOIN payment p ON r.payment_id = p.payment_id
       LEFT JOIN (SELECT rb_id, rb_payment_id, rb_checkin, rb_checkout, guest_id, wig_id FROM roombooking) rb
          ON p.payment_id = rb.rb_payment_id
       LEFT JOIN (SELECT ab_id, ab_payment_id, ab_start_time, ab_end_time, guest_id, wig_id FROM activitybooking) ab
          ON p.payment_id = ab.ab_payment_id AND rb.rb_id IS NULL
       LEFT JOIN (SELECT vb_id, vb_payment_id, vb_date, vb_days, guest_id, wig_id FROM hirevehicle) vb
          ON p.payment_id = vb.vb_payment_id AND rb.rb_id IS NULL AND ab.ab_id IS NULL
       LEFT JOIN (SELECT order_id, payment_id, order_date, scheduled_date, guest_id, wig_id FROM foodorder) fo
          ON p.payment_id = fo.payment_id AND rb.rb_id IS NULL AND ab.ab_id IS NULL AND vb.vb_id IS NULL
       LEFT JOIN Guest g ON COALESCE(rb.guest_id, ab.guest_id, vb.guest_id, fo.guest_id) = g.guest_id
       LEFT JOIN Users u ON g.user_id = u.user_id
       LEFT JOIN walkin_guest wig ON COALESCE(rb.wig_id, ab.wig_id, vb.wig_id, fo.wig_id) = wig.wig_id
       ${whereClause}
       ORDER BY r.refund_date DESC
    `);
    console.log('SUCCESS rows:', rows.length);
    if (rows.length > 0) {
      console.log('IDs:', rows.map(r => r.refund_id));
      console.log('Unique IDs:', [...new Set(rows.map(r => r.refund_id))].length);
      console.log('Sample:', JSON.stringify(rows[0], null, 2));
    }
    process.exit(0);
  } catch (e) {
    console.error('SQL ERROR:', e.message);
    console.error('SQL CODE:', e.code);
    process.exit(1);
  }
})();
