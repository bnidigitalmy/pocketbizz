# Manual Subscription Control - Admin Guide

## Overview
Backup system untuk activate dan extend langganan pengguna secara manual bila automatic payment BCL.my ada masalah.

## Features Implemented

### 1. Backend API Endpoints

#### **POST /api/admin/subscriptions/manual-activate**
Activate subscription baru untuk pengguna secara manual.

**Request Body:**
```json
{
  "userId": "user-uuid-here",
  "planId": "plan-uuid-here",
  "durationMonths": 3,  // Options: 1, 3, 6, 12
  "notes": "Payment received via bank transfer on 15/11/2025"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": { /* subscription object */ },
  "message": "Successfully activated Premium Plan for user@example.com (3 months)"
}
```

**What it does:**
- Creates new active subscription
- Disables trial if user is on trial
- Logs admin action to audit trail
- Validates duration (must be 1, 3, 6, or 12 months)
- Sets `activationSource` to `manual_admin`
- Stores admin notes in metadata

---

#### **PATCH /api/admin/subscriptions/:subscriptionId/extend**
Extend existing subscription untuk pelanggan yang dah bayar.

**Request Body:**
```json
{
  "extensionMonths": 3,  // Options: 1, 3, 6, 12
  "notes": "Customer paid RM237 via Maybank2u"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": { /* updated subscription */ },
  "message": "Successfully extended subscription by 3 months. New end date: 15/02/2026"
}
```

**What it does:**
- Extends from current end date (bukan dari hari ni)
- Reactivates subscription if expired
- Updates total paid amount
- Logs extension details in metadata
- Logs admin action for audit

---

#### **GET /api/admin/subscriptions**
List semua subscriptions dengan user details.

**Response:**
```json
[
  {
    "id": "sub-uuid",
    "userId": "user-uuid",
    "userEmail": "user@example.com",
    "userName": "Ahmad Bakery",
    "planName": "Premium Plan",
    "status": "active",
    "durationMonths": 3,
    "subscriptionStartsAt": "2025-11-15T00:00:00Z",
    "subscriptionEndsAt": "2026-02-15T00:00:00Z",
    "totalPaid": "237.00",
    "paymentProvider": "manual_admin",
    "activationSource": "manual_admin",
    "isExpired": false,
    "createdAt": "2025-11-15T10:30:00Z"
  }
]
```

---

### 2. Admin UI Page

**Location:** `/admin/subscriptions`

**Features:**
- ✅ List all subscriptions dengan filter search
- ✅ Status badges (Active, Expired, Canceled)
- ✅ Payment source indicators (Manual Admin, BCL Auto, ToyyibPay)
- ✅ "Activate New Subscription" button
- ✅ "Extend" button untuk setiap subscription
- ✅ Duration options: 1, 3, 6, 12 bulan
- ✅ Auto-calculate total amount
- ✅ Admin notes field untuk record payment details

---

## Usage Guide

### Scenario 1: Customer Bayar Tapi Auto Payment Tak Masuk

1. Navigate to `/admin/subscriptions`
2. Click **"Activate New Subscription"**
3. Select user dari dropdown
4. Choose subscription plan
5. Select duration (1, 3, 6, or 12 months)
6. Add notes: "Bank transfer RM237 received 15/11/2025 - Ref: FT251115XXXXX"
7. Click **"Activate Subscription"**
8. System will:
   - Create active subscription
   - Turn off trial mode
   - Log admin action
   - Show success message

---

### Scenario 2: Extend Existing Subscription

1. Navigate to `/admin/subscriptions`
2. Find customer's subscription (use search bar)
3. Click **"Extend"** button
4. Select extension duration (1, 3, 6, or 12 months)
5. Add notes: "Renewal payment RM237 via Maybank2u"
6. Click **"Extend Subscription"**
7. System will:
   - Extend from current end date (not today!)
   - Update total paid amount
   - Reactivate if expired
   - Log extension details

---

## Important Notes

### ✅ Duration Options
Only accept: **1, 3, 6, or 12 months**

### ✅ Audit Trail
All manual activations & extensions are logged in `admin_activity_logs`:
- Admin ID who performed action
- Action type (`manual_subscription_activate` or `manual_subscription_extend`)
- Target user
- Details with notes
- Timestamp

### ✅ Metadata Stored
```json
{
  "activatedBy": "admin@pocketbizz.com",
  "adminNotes": "Bank transfer received...",
  "activatedAt": "2025-11-15T10:30:00Z",
  "lastExtension": {
    "extendedBy": "admin@pocketbizz.com",
    "extensionMonths": 3,
    "extensionAmount": 237,
    "adminNotes": "Renewal payment...",
    "extendedAt": "2026-02-15T10:00:00Z"
  }
}
```

### ✅ Payment Source Indicators
- **Manual Admin** (yellow badge) - Activated manually by admin
- **BCL Auto** (blue badge) - Auto-approved from BCL payment webhook
- **ToyyibPay** (purple badge) - Legacy ToyyibPay payments

---

## Quick Access

**Admin Dashboard:** `/admin`
- Click "Subscriptions" button to access manual control

**Direct Link:** `/admin/subscriptions`

---

## Testing Checklist

- [ ] Can activate new subscription for user on trial
- [ ] Can activate subscription for user with expired subscription
- [ ] Can extend active subscription
- [ ] Can extend expired subscription (reactivates it)
- [ ] Duration validation works (only 1, 3, 6, 12 accepted)
- [ ] Total amount calculation correct
- [ ] Admin notes saved properly
- [ ] Audit logs created
- [ ] Search/filter works
- [ ] Status badges show correctly

---

## Security

- ✅ Protected with `requireAdmin` middleware
- ✅ Only admins can access (isAdmin = 1)
- ✅ All actions logged for audit
- ✅ Cannot activate invalid durations
- ✅ User validation before activation

---

## API Examples

### cURL: Manual Activate
```bash
curl -X POST https://pocketbizz.com/api/admin/subscriptions/manual-activate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "userId": "user-123",
    "planId": "plan-456",
    "durationMonths": 3,
    "notes": "Bank transfer RM237"
  }'
```

### cURL: Extend Subscription
```bash
curl -X PATCH https://pocketbizz.com/api/admin/subscriptions/sub-789/extend \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "extensionMonths": 6,
    "notes": "Renewal RM474 via FPX"
  }'
```

---

## Future Enhancements (Optional)

- [ ] Bulk activation from CSV
- [ ] Email notification to customer upon manual activation
- [ ] Refund/cancellation flow
- [ ] Payment receipt generation
- [ ] WhatsApp notification integration
- [ ] Export subscription report to Excel
- [ ] Auto-reminder for upcoming expiries

---

**Created:** November 15, 2025  
**Last Updated:** November 15, 2025  
**Version:** 1.0
