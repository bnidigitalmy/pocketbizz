# User Payment Flow - PocketBizz

## 🔄 Complete User Journey

### Flow 1: New User (Not Logged In)

```
1. User visits /pricing page
   ↓
2. User selects plan (e.g., BASIC 6 Bulan)
   ↓
3. Click "Bayar Sekarang" button
   ↓
4. System checks: User not logged in
   ↓
5. Redirect to /auth/register?plan=basic&duration=6&returnTo=/pricing
   ↓
6. User sees registration form with:
   - Badge: "Trial Percuma 7 Hari"
   - Info box: "Pakej dipilih: Basic (6 bulan)"
   - Message: "Daftar sekarang untuk cuba trial 7 hari, kemudian boleh upgrade"
   ↓
7. User fills form and registers
   ↓
8. Account created with:
   - 7-day FREE TRIAL activated
   - Trial ends at: today + 7 days
   ↓
9. Redirect back to /pricing page
   ↓
10. User now logged in, can select plan again
    ↓
11. Click "Bayar Sekarang" → redirects to BCL.my form with user data
    ↓
12. User completes payment at BCL.my
    ↓
13. BCL.my webhook fires → PocketBizz receives payment notification
    ↓
14. Webhook creates subscription record:
    - Upgrades trial to paid subscription
    - Sets subscriptionEndsAt = today + (duration months)
    - Saves totalPaid, paymentProvider, transactionId
    ↓
15. User can access full features based on plan
```

### Flow 2: Existing User (On Trial)

```
1. User on FREE TRIAL (registered earlier)
   ↓
2. User receives reminder emails:
   - 7 days before expiry
   - 3 days before expiry
   - 1 day before expiry (last day)
   ↓
3. User clicks "Upgrade" link in email/dashboard
   ↓
4. Redirects to /pricing page
   ↓
5. User already logged in ✅
   ↓
6. User selects plan (e.g., PRO 12 Bulan)
   ↓
7. Click "Bayar Sekarang"
   ↓
8. Redirect to BCL.my form with pre-filled data:
   - email
   - user_id
   - name
   - package
   - duration
   ↓
9. User applies coupon code: POCKETBIZZ100 (if early bird)
   ↓
10. User completes payment
    ↓
11. BCL.my webhook → PocketBizz
    ↓
12. Subscription activated (trial upgraded to paid)
    ↓
13. User sees active subscription in /subscription page
```

### Flow 3: Existing User (Renewal)

```
1. User's subscription expires
   ↓
2. User enters grace period (7 days)
   ↓
3. User receives renewal reminder
   ↓
4. User visits /subscription page
   ↓
5. Click "Renew Subscription" button
   ↓
6. Redirect to /pricing?renew=true
   ↓
7. User selects plan (can change package/duration)
   ↓
8. Click "Bayar Sekarang"
   ↓
9. Redirect to BCL.my form
   ↓
10. Complete payment
    ↓
11. Webhook creates new subscription record
    ↓
12. User active again
```

---

## 🎯 Key Points

### Registration Benefits:
✅ **User gets FREE TRIAL first** - Try before buy
✅ **Better UX** - Users can test the system
✅ **Email reminders** - System can send upgrade notifications
✅ **User data in system** - Easier webhook matching
✅ **Seamless upgrade** - Trial to paid conversion

### Why Not Direct Payment?
❌ No trial period
❌ Can't send reminder emails
❌ User might not know what they're buying
❌ Complex webhook logic (create account + subscription)
❌ Poor user experience

### Current Implementation:
- ✅ Not logged in → Redirect to **register** (not login)
- ✅ Register page shows selected plan
- ✅ After register → Back to pricing page
- ✅ User can then complete payment
- ✅ Webhook upgrades trial to paid subscription

---

## 🔐 Security & Validation

### User Matching in Webhook:
1. **Priority 1**: Match by `user_id` from BCL.my form
2. **Fallback**: Match by `email` if userId not found
3. **Validation**: Verify user exists before creating subscription

### Payment Verification:
1. BCL.my webhook signature verification
2. Check `payment_status = "paid"`
3. Validate package and duration
4. Prevent duplicate subscriptions

---

## 📊 Current Status

**Implementation**: ✅ Complete

**Testing Checklist**:
- [ ] New user registers from pricing page
- [ ] Trial activated after registration
- [ ] Redirect back to pricing works
- [ ] Payment completes successfully
- [ ] Webhook upgrades trial to paid
- [ ] Subscription displays in /subscription page
- [ ] Early bird coupon applies correctly
- [ ] Renewal flow works
