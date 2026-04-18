async function testAdminFlows() {
    console.log('=== Admin Portal Unit Tests ===\n');
    let token, headers;
    let passed = 0, failed = 0;

    function pass(label) { console.log(`✅ PASS: ${label}`); passed++; }
    function fail(label, msg) { console.log(`❌ FAIL: ${label} — ${msg}`); failed++; }

    // 1. Login
    try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin01@gmail.com', password: '@Vidhy117' })
        });
        const data = await res.json();
        if (!res.ok || !data.token) throw new Error(data.error || 'No token');
        token = data.token;
        headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        pass('Admin login');
    } catch (e) { fail('Admin login', e.message); return; }

    // 2. Dashboard
    try {
        const res = await fetch('http://localhost:5000/api/admin/dashboard', { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (!data.summary || !data.revenue) throw new Error('Missing summary or revenue keys');
        pass(`Dashboard stats (total revenue: Rs. ${data.revenue.total?.toFixed(2)}, guests: ${data.summary.guests}, staff: ${data.summary.staff})`);
    } catch (e) { fail('Dashboard stats', e.message); }

    // 3. Staff list
    let staffList = [];
    try {
        const res = await fetch('http://localhost:5000/api/admin/staff', { headers });
        staffList = await res.json();
        if (!res.ok) throw new Error(staffList.error);
        if (!Array.isArray(staffList)) throw new Error('Expected array');
        pass(`Staff list (${staffList.length} members found)`);
    } catch (e) { fail('Staff list', e.message); }

    // 4. Customer/Guest list
    let guestList = [];
    try {
        const res = await fetch('http://localhost:5000/api/admin/customers', { headers });
        guestList = await res.json();
        if (!res.ok) throw new Error(guestList.error);
        if (!Array.isArray(guestList)) throw new Error('Expected array');
        pass(`Customer list (${guestList.length} guests found)`);
    } catch (e) { fail('Customer list', e.message); }

    // 5. Booking reports (all)
    try {
        const res = await fetch('http://localhost:5000/api/reports/bookings', { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (!Array.isArray(data)) throw new Error('Expected array');
        const total = data.length;
        const withExtras = data.filter(r => r.activities?.length > 0 || r.food?.length > 0 || r.vehicles?.length > 0).length;
        pass(`Booking report (${total} room bookings, ${withExtras} with extras)`);
    } catch (e) { fail('Booking report', e.message); }

    // 6. Booking reports with date filter
    try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`http://localhost:5000/api/reports/bookings?startDate=2024-01-01&endDate=${today}`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        pass(`Booking report with date filter (${data.length} results)`);
    } catch (e) { fail('Booking report with date filter', e.message); }

    // 7. Booking reports filtered by type
    for (const type of ['Room', 'Activity', 'Food', 'Vehicle']) {
        try {
            const res = await fetch(`http://localhost:5000/api/reports/bookings?type=${type}`, { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            pass(`Booking report filtered by type: ${type} (${data.length} results)`);
        } catch (e) { fail(`Booking report type: ${type}`, e.message); }
    }

    // 8. User reports
    try {
        const res = await fetch('http://localhost:5000/api/reports/users', { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        pass(`User report (${data.length} users)`);
    } catch (e) { fail('User report', e.message); }

    // 9. User reports filtered by role
    for (const role of ['guest', 'driver', 'chef', 'receptionist']) {
        try {
            const res = await fetch(`http://localhost:5000/api/reports/users?role=${role}`, { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            pass(`User report filtered by role: ${role} (${data.length} users)`);
        } catch (e) { fail(`User report role: ${role}`, e.message); }
    }

    // 10. User history for a guest
    if (guestList.length > 0) {
        const guest = guestList[0];
        try {
            const res = await fetch(`http://localhost:5000/api/reports/user-history/${guest.id}`, { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            pass(`Guest history for "${guest.name}" (${data.length} records)`);
        } catch (e) { fail(`Guest history for "${guest.name}"`, e.message); }
    }

    // 11. User history for a driver
    const driver = staffList.find(s => s.role === 'driver');
    if (driver) {
        try {
            const res = await fetch(`http://localhost:5000/api/reports/user-history/${driver.id}`, { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            pass(`Driver history for "${driver.name}" (${data.length} records)`);
        } catch (e) { fail(`Driver history for "${driver.name}"`, e.message); }
    }

    // 12. User history for a chef
    const chef = staffList.find(s => s.role === 'chef');
    if (chef) {
        try {
            const res = await fetch(`http://localhost:5000/api/reports/user-history/${chef.id}`, { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            pass(`Chef history for "${chef.name}" (${data.length} records)`);
        } catch (e) { fail(`Chef history for "${chef.name}"`, e.message); }
    }

    // 13. Admin reports list
    try {
        const res = await fetch('http://localhost:5000/api/admin/reports', { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        pass(`Admin saved reports list (${data.length} reports)`);
    } catch (e) { fail('Admin reports list', e.message); }

    // 14. Menu items (admin)
    let menuItems = [];
    try {
        const res = await fetch('http://localhost:5000/api/admin/menu-items', { headers });
        menuItems = await res.json();
        if (!res.ok) throw new Error(menuItems.error);
        pass(`Admin menu items (${menuItems.length} items)`);
    } catch (e) { fail('Admin menu items', e.message); }

    // 15. Toggle menu item status
    if (menuItems.length > 0) {
        const item = menuItems.find(i => i.item_availability === 'Available') || menuItems[0];
        const newStatus = item.item_availability === 'Available' ? 'Unavailable' : 'Available';
        try {
            const res = await fetch(`http://localhost:5000/api/admin/menu-items/${item.item_id}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: newStatus, reason: 'Testing' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            pass(`Toggle menu item "${item.item_name}" to ${newStatus}`);
            // Revert
            await fetch(`http://localhost:5000/api/admin/menu-items/${item.item_id}/status`, {
                method: 'PUT', headers,
                body: JSON.stringify({ status: item.item_availability })
            });
        } catch (e) { fail(`Toggle menu item status`, e.message); }
    }

    // 16. Update staff status
    if (staffList.length > 0) {
        const staffMember = staffList[0];
        const newStatus = staffMember.account_status === 'Active' ? 'Inactive' : 'Active';
        try {
            const res = await fetch(`http://localhost:5000/api/admin/staff/${staffMember.id}/status`, {
                method: 'PUT', headers,
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            pass(`Update staff status for "${staffMember.name}" to ${newStatus}`);
            // Revert
            await fetch(`http://localhost:5000/api/admin/staff/${staffMember.id}/status`, {
                method: 'PUT', headers,
                body: JSON.stringify({ status: staffMember.account_status })
            });
        } catch (e) { fail(`Update staff status`, e.message); }
    }

    // 17. Test invalid user-history for non-existent user
    try {
        const res = await fetch('http://localhost:5000/api/reports/user-history/999999', { headers });
        const data = await res.json();
        if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
        pass('User history 404 for non-existent user');
    } catch (e) { fail('User history 404 guard', e.message); }

    console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
}

testAdminFlows();
