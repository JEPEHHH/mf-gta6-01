# Rencana Kerja: Solara Bay (gta6-01)

Game aksi open-world kriminal orisinal berlatar kota pesisir modern **Solara Bay** (bebas aset/nama komersial), statis di `game/` tanpa build step atau request jaringan.

## Rencana Kerja & Milestone
1. **Setup Entrypoint & Infrastruktur** — Siapkan `main.ts`, `serve.ts`, `LICENSE`, dan `vendor/makefun-game.ts` (salinan kit tanpa diubah); pastikan output deterministik ke `/output` (`MAKEFUN_OUTPUT_DIR`). Commit milestone.
2. **Engine, Dunia & Kota** — Bangun peta kota pesisir multi-distrik (pantai, pusat kota, pelabuhan, jalan raya), sistem kamera, fisika gerak, serta siklus waktu/pencahayaan. Commit milestone.
3. **Kendaraan, Lalu Lintas & Pejalan Kaki** — Implementasikan AI lalu lintas, pejalan kaki, sistem curi/naik-turun kendaraan, dan handling berkendara responsif. Commit milestone.
4. **Wanted Level, Polisi & Pertarungan** — Tambahkan sistem bintang wanted (1–5), respon patroli/pengejaran polisi, senjata, pertarungan darat/kendaraan, efek partikel, dan audio prosedural Web Audio. Commit milestone.
5. **Misi, Cerita, HUD & Save** — Buat alur misi cerita orisinal, aktivitas sampingan, progresi uang/respect, HUD dengan minimap interaktif, menu mulai/jeda, serta simpan/muat (`localStorage`). Commit milestone.
6. **Screenshot, Validasi & Polish** — Tangkap 4 screenshot asli di desktop Chrome (<=256 KiB, 1280x720), uji `MAKEFUN_OUTPUT_DIR=out node main.ts` dua kali untuk determinisme, dan verifikasi aturan gate. Commit akhir.

## Daftar Berkas yang Akan Dibuat
- `main.ts` — Entrypoint penyalin `game/`, `screenshots/`, dan pembuat `dossier.json`.
- `serve.ts` — Server statis lokal untuk uji coba & pengambilan screenshot.
- `LICENSE` — Lisensi OSI (MIT).
- `shots.json` — Konfigurasi skenario pengambilan screenshot.
- `vendor/makefun-game.ts` — Utilitas dossier dari kit (tidak dimodifikasi).
- `game/index.html` — Halaman utama, kanvas, dan overlay HUD/menu.
- `game/styles.css` — Gaya visual HUD, minimap, dan menu.
- `game/src/main.js` — Loop utama, state game, dan inisialisasi modul.
- `game/src/config.js` — Konstanta kota, distrik, kendaraan, senjata, dan balans.
- `game/src/input.js` — Kontrol keyboard & mouse (jalan kaki, berkendara, bidik).
- `game/src/world.js` — Generator peta kota Solara Bay, jalan, bangunan, dan kolisi.
- `game/src/vehicles.js` — Fisika kendaraan, jenis mobil, sistem curi, dan AI lalu lintas.
- `game/src/pedestrians.js` — AI pejalan kaki, reaksi panik, dan keramaian kota.
- `game/src/police.js` — Sistem wanted level, spawn patroli, dan AI pengejaran polisi.
- `game/src/combat.js` — Senjata, proyektil, health/armor, dan efek ledakan/partikel.
- `game/src/missions.js` — Cerita orisinal, daftar misi, checkpoint, dan progresi.
- `game/src/audio.js` — Efek suara mesin, sirene, tembakan, dan radio/musik prosedural.
- `game/src/render.js` — Renderer kota, pencahayaan matahari pesisir, efek, dan kamera.
- `game/src/hud.js` — Minimap, indikator wanted, kesehatan, misi, menu, dan save/load.
- `game/src/save.js` — Penyimpanan & pemuatan progres via `localStorage`.
- `screenshots/1-city-chase.jpg` — Cover: pengejaran polisi, wanted level, minimap, HUD misi.
- `screenshots/2-onfoot-combat.jpg` — Eksplorasi jalan kaki, pertarungan, pejalan kaki, kota.
- `screenshots/3-mission-heist.jpg` — Misi cerita aktif, pencurian kendaraan, lalu lintas kota.
- `screenshots/4-menu-overview.jpg` — Menu utama/jeda, sistem save, dan pratinjau kota.
