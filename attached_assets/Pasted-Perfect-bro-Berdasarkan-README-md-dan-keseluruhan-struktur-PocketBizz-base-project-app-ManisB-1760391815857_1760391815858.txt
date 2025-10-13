Perfect bro 🔥
Berdasarkan README.md dan keseluruhan struktur PocketBizz (base project) — app ManisBizz / BakeFlow kau dah hampir lengkap gila, tapi ada beberapa benda penting yang masih boleh kita tambah / adjust supaya betul-betul sesuai untuk bisnes dessert wife kau (bukan sekadar SME general system).

⸻

⚙️ ANALISIS — Apa Dah Ada vs Apa Belum

✅ Dah Lengkap (boleh terus guna)
	•	📦 Product + Recipe + Costing + Production + Sales → semua fully integrated
	•	💰 Expenses Module siap, boleh rekod bahan, kos, utilities
	•	🤝 Vendor Management siap, boleh track vendor & claim
	•	📸 Scan Receipt (OCR) siap, boleh capture invoice
	•	📊 Report & Analytics siap, boleh nampak profit/loss
	•	💾 Backup & Export siap
	•	📱 PWA Ready (Install ke phone tanpa Play Store) dah ada

Jadi app ni memang dah boleh jalan penuh dari bahan mentah → production → vendor → jualan → report.

⸻

🧩 Belum Disesuaikan Untuk BakeFlow (Dessert Use Case)

Komponen	Status Sekarang	Apa Perlu Ditambah
Production Log Harian	Ada tapi general	Tambah “Hari Ini” view (produk siap, rejected, expired, leftover)
Vendor Claim Sheet	Boleh guna dari vendor-reseller-backup.html	Perlu auto-generate report claim setiap vendor + status claim “Pending / Settled”
Expiry Tracker	Belum spesifik	Tambah expiry_date pada batch + alert warna merah jika dekat expired
Daily Delivery Record	Tiada	Modul baru delivery-log.html (auto-generate dari vendor list)
Quick Report (Dashboard)	Ada tapi general	Tambah ringkasan khas “Modal Hari Ini”, “Untung Hari Ini”, “Produk Reject Hari Ini”
Multi-user Access (kalau staff bantu)	Planned	Boleh tambah Supabase Auth bila nak scale
Simple WhatsApp Share	Ada sikit dalam MyShop	Perlu untuk hantar vendor report / claim terus via WhatsApp link
Print Invoice (Mini)	Tiada	Boleh tambah simple print/export PDF per vendor (A5 receipt layout)


⸻

🎨 Design Upgrade Cadangan (BakeFlow Edition)

Kita buat visual tone khas untuk baker:
	•	Soft pink 🍓 (#FBCFE8), cream ☕ (#F8EDEB), brown 🍫 (#A67C52)
	•	Rounded card UI (macam Flutter-style)
	•	Bottom tab bar: Home | Production | Vendor | Sales | Report
	•	Dashboard ada ilustrasi cupcake / whisk kecil 🎂

⸻

🚀 Recommended Dev Plan (Untuk Replit Agent)

Phase 1: Rename + Branding BakeFlow
	•	Rename semua label dan logo → “BakeFlow”
	•	Update manifest.json + favicon + PWA icon
	•	Update color theme (pastel pink + cream)

Phase 2: Add Specialized Modules
	1.	delivery-log.html
	•	Auto load vendor list
	•	Checkbox untuk hantar, reject, expired
	•	Auto save ke localStorage bakeflow_delivery
	2.	daily-report.html
	•	Summary: produk siap, jualan, reject, claim, untung
	•	Date filter (harian, mingguan, bulanan)
	3.	claim-tracker.html
	•	Vendor list + status claim
	•	WhatsApp share button auto-generate mesej

Phase 3: Simplify UI for Wife
	•	One-click shortcuts:
“Tambah Produk Siap Hari Ini” → direct ke production form
“Rekod Hantar Vendor” → direct ke delivery log
“Lihat Untung Rugi Minggu Ini” → auto filter report

⸻

🔮 Bila Dah Stabil

Kita boleh masukkan:
	•	Supabase sync → multi-device backup
	•	Cloud sync mode → boleh guna 2 phone (wife + admin)
	•	Offline-first mode kekal (macam sekarang)

⸻

Kalau kau nak, aku boleh bantu terus buat:

📁 BakeFlow Conversion Pack
– Auto rename semua file
– Tambah module delivery-log.html, daily-report.html, claim-tracker.html
– Update UI color + manifest + logo

Nak aku teruskan siapkan versi tu (BakeFlow Conversion Pack untuk Replit)?