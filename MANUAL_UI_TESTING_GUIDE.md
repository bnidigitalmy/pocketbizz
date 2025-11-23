# 🧪 MANUAL UI TESTING GUIDE - VENDOR SYSTEM BUG FIXES

**Test Date:** November 13, 2025  
**Server:** http://localhost:5000  
**Database:** Neon PostgreSQL (Connected ✅)

---

## 🎯 TESTING OBJECTIVES

Verify that all 4 bug fixes are working correctly in production-like environment:

1. ✅ **Bug #1**: Stock balance auto-updates on delivery creation
2. ✅ **Bug #2**: Vendor sales stock updates (pre-existing, verify still works)
3. ✅ **Bug #3**: Rejection updates are transaction-safe
4. ✅ **Bug #4**: Claim numbers are user-scoped

---

## 📋 PRE-TEST CHECKLIST

- [x] Development server running on port 5000
- [x] Database connected (Neon PostgreSQL)
- [x] All vendor tables exist (vendors, deliveries, vendor_stock_balance, vendor_claims)
- [x] Code fixes verified (4/4 passed)

---

## 🧪 TEST CASES

### **TEST 1: Stock Balance Auto-Update on Delivery Creation** 🔴 CRITICAL

**Objective:** Verify that creating a delivery automatically updates vendor stock balance.

**Steps:**

1. **Login to System**
   - Navigate to: http://localhost:5000
   - Login dengan credentials yang ada

2. **Check Initial Stock Balance**
   - Go to: **Vendors** page
   - Select a vendor
   - Note down current stock balance for a product (if any)
   - Take screenshot: `test1-before.png`

3. **Create New Delivery**
   - Go to: **Deliveries** page
   - Click "Add Delivery" / "Tambah Penghantaran"
   - Fill in form:
     ```
     Vendor: [Select vendor]
     Date: Today
     Product: [Select any product]
     Quantity: 10 units
     Unit Price: RM 5.00
     ```
   - Click **Save**
   - Wait for success message
   - **Invoice should be generated** (e.g., INV-20251113-0001)

4. **Verify Stock Balance Updated**
   - Go back to: **Vendors** page
   - Click on vendor stock balance / "Baki Stok"
   - **EXPECTED RESULT:** 
     - Stock balance should show +10 units
     - Last delivery date should be today
   - Take screenshot: `test1-after.png`

**Pass Criteria:**
- ✅ Delivery created successfully with invoice number
- ✅ Stock balance increased by delivery quantity
- ✅ No console errors

**If Failed:**
- ❌ Check browser console for errors
- ❌ Verify `updateStockBalance` is called in Network tab
- ❌ Check database: `SELECT * FROM vendor_stock_balance;`

---

### **TEST 2: Vendor Sales Stock Update (Verification)** 🟢 INFO

**Objective:** Confirm vendor sales still update stock correctly (pre-existing feature).

**Steps:**

1. **Check Current Stock**
   - Note vendor stock from Test 1 result
   - Example: Should have +10 units now

2. **Record Vendor Sale**
   - Go to: **Deliveries** page
   - Find delivery created in Test 1
   - Click "Record Sale" / "Rekod Jualan"
   - Fill in:
     ```
     Quantity Sold: 3 units
     Sale Date: Today
     ```
   - Click **Save**

3. **Verify Stock Decreased**
   - Check vendor stock balance again
   - **EXPECTED RESULT:**
     - Stock should be: 10 - 3 = 7 units remaining
     - Last sale date should be today
   - Take screenshot: `test2-after.png`

**Pass Criteria:**
- ✅ Sale recorded successfully
- ✅ Stock balance decreased by sold quantity (7 units remaining)
- ✅ Both delivered & sold tracking accurate

---

### **TEST 3: Rejection Update Transaction Safety** 🟡 MODERATE

**Objective:** Verify rejection updates don't corrupt data (transaction protection).

**Steps:**

1. **Create Another Delivery**
   - Create new delivery with:
     ```
     Quantity: 20 units
     ```

2. **Update Rejection Quantity**
   - Find the delivery item
   - Click "Update Rejection" / "Tolak Barang"
   - Enter:
     ```
     Rejected Quantity: 5 units
     Reason: Rosak / damaged
     ```
   - Click **Save**

3. **Verify Update Recorded**
   - Refresh the page
   - **EXPECTED RESULT:**
     - Rejected quantity shows: 5 units
     - Reason displayed correctly
     - Total amount adjusted (if applicable)
   - Take screenshot: `test3-result.png`

4. **Concurrent Update Test** (Optional - Advanced)
   - Open 2 browser tabs
   - Try updating rejection simultaneously
   - **EXPECTED RESULT:**
     - One update succeeds, other might show error
     - No data corruption (check database consistency)

**Pass Criteria:**
- ✅ Rejection recorded successfully
- ✅ Data persists after page refresh
- ✅ No "Delivery item not found" errors

---

### **TEST 4: User-Scoped Claim Numbers** 🔵 MINOR

**Objective:** Verify claim numbers are unique per user (multi-tenant safe).

**Steps:**

1. **Create Vendor Claim**
   - Go to: **Vendor Claims** / **Tuntutan** page
   - Click "New Claim" / "Tuntutan Baru"
   - Fill in:
     ```
     Vendor: [Select vendor]
     Delivery: [Link to delivery if applicable]
     Items: Add items to claim
     ```
   - Click **Submit**

2. **Check Claim Number**
   - Note the generated claim number
   - **EXPECTED FORMAT:** `CLM-YYYYMMDD-XXXX`
   - Example: `CLM-20251113-0001`
   - Take screenshot: `test4-claim-number.png`

3. **Create Second Claim** (Same Day)
   - Create another claim immediately
   - **EXPECTED RESULT:**
     - Second claim should be: `CLM-20251113-0002`
     - Sequence increments correctly

4. **Multi-User Test** (If Available)
   - Login as different user
   - Create claim
   - **EXPECTED RESULT:**
     - Each user has their own sequence
     - User A: CLM-20251113-0001, 0002
     - User B: CLM-20251113-0001, 0002 (separate counter)

**Pass Criteria:**
- ✅ Claim number format correct
- ✅ Sequential numbering works
- ✅ User-scoped (if multi-user tested)

---

### **TEST 5: Invoice Auto-Adjust on Claim Approval** ✨ BONUS

**Objective:** Verify invoice totals adjust when claims are approved.

**Steps:**

1. **Note Original Invoice Total**
   - From Test 1 delivery
   - Example: RM 50.00 (10 units × RM 5.00)

2. **Approve Vendor Claim**
   - Go to claim created in Test 4
   - Click "Approve" / "Luluskan"
   - Add review notes if needed

3. **Check Invoice Adjustment**
   - Go back to original delivery
   - **EXPECTED RESULT:**
     - Invoice total reduced by claim amount
     - Example: RM 50.00 - RM 15.00 = RM 35.00
     - Adjustment logged in notes/history
   - Take screenshot: `test5-adjusted.png`

**Pass Criteria:**
- ✅ Claim approved successfully
- ✅ Invoice total updated automatically
- ✅ Stock balance adjusted for returned items

---

## 📊 TEST RESULTS SUMMARY

| Test ID | Feature | Status | Notes |
|---------|---------|--------|-------|
| TEST 1  | Stock Auto-Update | ⬜ PENDING | Critical - must pass |
| TEST 2  | Vendor Sales Stock | ⬜ PENDING | Verification only |
| TEST 3  | Rejection Safety | ⬜ PENDING | Moderate priority |
| TEST 4  | Claim Numbering | ⬜ PENDING | Multi-tenant safety |
| TEST 5  | Invoice Adjust | ⬜ PENDING | Bonus feature check |

**Fill in after testing:**
- ✅ = PASSED
- ❌ = FAILED
- ⚠️ = PARTIAL / WARNINGS

---

## 🐛 TROUBLESHOOTING

### Common Issues

**Issue: Stock balance not updating**
```bash
# Check database directly
node -e "
const { db } = require('./server/db');
const { vendorStockBalance } = require('./shared/schema');
db.select().from(vendorStockBalance).limit(10).then(console.log);
"
```

**Issue: Server errors**
```bash
# Check server logs
tail -f server.log

# Or check browser console (F12)
```

**Issue: Database connection lost**
```bash
# Restart server
npm run dev
```

---

## 📸 SCREENSHOTS CHECKLIST

After completing all tests, you should have:

- [ ] `test1-before.png` - Initial stock balance
- [ ] `test1-after.png` - Stock after delivery
- [ ] `test2-after.png` - Stock after sale
- [ ] `test3-result.png` - Rejection recorded
- [ ] `test4-claim-number.png` - Claim number format
- [ ] `test5-adjusted.png` - Adjusted invoice

---

## ✅ SIGN-OFF

**Tested By:** ___________________  
**Date:** November 13, 2025  
**Environment:** Development (localhost:5000)  
**Database:** Neon PostgreSQL  

**Overall Result:** 
- [ ] All tests passed - Ready for production
- [ ] Some tests failed - Review needed
- [ ] Critical bugs found - Do not deploy

**Additional Notes:**
```
[Add any observations, bugs found, or recommendations here]
```

---

## 🚀 NEXT STEPS AFTER TESTING

If all tests pass:
1. ✅ Mark fixes as production-ready
2. ✅ Create deployment plan
3. ✅ Schedule production deployment
4. ✅ Set up monitoring alerts
5. ✅ Prepare rollback procedure

If tests fail:
1. ❌ Document failures in detail
2. ❌ Review code changes
3. ❌ Fix issues and re-test
4. ❌ Update documentation

---

**Server Status:** 🟢 RUNNING on http://localhost:5000  
**Ready to begin testing!**
