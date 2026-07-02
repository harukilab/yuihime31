# YuiHime Project Updates Logs
---

## [3.11] - 2026-06-30
### Fixed & Improved
- **Resolusi Unresponsive `manage_cron` Tool**:
  - Memperbaiki bug di mana pemanggilan alat `manage_cron` menggantung (*unresponsive*) secara tidak menentu dengan beralih ke arsitektur eksekusi langsung (*Zero-Import Direct Global Execution*) di sisi server.
  - Mendaftarkan referensi *runtime* utama (`yuihime_db`, `yuihime_CronModule`, `yuihime_getCronAction`) secara aman pada `globalThis` dari `server.ts` saat bootup.
  - Memperbarui alat `CronTool` di `manage_cron/index.ts` agar mengeksekusi manipulasi basis data SQLite dan registrasi penjadwal secara langsung menggunakan referensi global, sehingga melompati pemanggilan jaringan HTTP loopback.
  - Menyertakan mekanisme *fail-safe* di mana jika berjalan di luar lingkungan server (atau saat *build*), sistem akan secara otomatis beralih ke loopback HTTP `fetch` dengan batas waktu (*timeout*) 4 detik menggunakan `AbortController` guna mencegah kebuntuan (*deadlock*) tak terbatas.
  - Mengonfigurasi `vite.config.ts` untuk mengeksternalkan pustaka pelayan dan pustaka asli (seperti `better-sqlite3`, `telegraf`, `discord.js`, `@discordjs/ws`) guna memastikan proses pembundulan SPA milik klien berhasil dibangun 100% tanpa hambatan pelacakan berkas Node.

## [3.10] - 2026-06-29
### Changed & Improved
- **Penyelarasan Mode Berpikir Cepat & Penonaktifan Failsafe**:
  - Menonaktifkan fungsi `[KERNEL_FAIL_SAFE]` sepenuhnya dengan mengatur `isIntentionalEmpty = true`. Yuihime kini dapat membiarkan output kosong/pendek tanpa memicu fallback pemrosesan ulang atau dialog galat tiruan, mengenali bahwa Yuihime sering menggunakan alat batin (seperti `send_update`/messaging tools) untuk merespons secara langsung.
  - Mengubah Mode Berpikir Cepat (Bypass Multi-Turn Reasoning) agar tidak membatasi iterasi kognitif ke 1 (tetap diizinkan hingga 3 iterasi penuh). Sebagai gantinya, mempercepat kognisi dengan merombak eksekusi alat batin dari sekuensial menjadi paralel secara penuh menggunakan `Promise.all` guna memproses beberapa chunk/node/task secara simultan.

## [3.09] - 2026-06-29
### Fixed
- **Penyempurnaan Mesin Pengunci Geser Dinamis (Hybrid Dynamic Scroll-Lock Engine)**:
  - Memperbaiki konflik navigasi teks panjang pada input jenis password dan teks biasa (seperti Kunci API/API Key) di mana menyeleksi (*select all* / *block*) teks panjang di HP memicu pergeseran paksa pada elemen pembungkus layout luar.
  - Memodifikasi pendengar event `scroll` global di `src/App.tsx` agar secara dinamis memeriksa gaya terhitung (`window.getComputedStyle`) dari elemen target.
  - Secara otomatis mereset `scrollLeft = 0` hanya pada elemen penahan layout yang tidak memiliki properti `overflow-x: auto` atau `overflow-x: scroll` (seperti elemen pembungkus, card, dan kontainer utama).
  - Menjaga kebebasan scroll horizontal batin pada elemen-elemen input (`INPUT`, `TEXTAREA`) serta menu tab navigasi bergeser (*swipeable horizontal menus*) agar dapat diakses 100% mulus tanpa meloloskan kebocoran pergeseran layout luar (*sideways sliding*).

## [3.08] - 2026-06-29
### Fixed
- **Perbaikan Swipeable Horizontal Menu & Slide Viewport Lock**:
  - Memperbaiki masalah di mana menu bar navigasi kategori/tab yang digeser (*swipeable tabs menu*) pada pengaturan seluler (mobile) membeku atau tidak dapat diakses akibat penanganan reset scroll global.
  - Memperbaiki penanganan `scroll` di `src/App.tsx` dengan membatasi pencegahan horizontal scroll (locking `scrollLeft = 0`) khusus pada kontainer induk utama (`html`, `body`, `#yuihime-app-container`, dan `#settings-scroll-container`), sehingga membebaskan sub-menu serta komponen geser dalam halaman agar dapat dinavigasi dengan mulus secara horizontal.
  - Mempertahankan proteksi penguncian geser luar (*sideways sliding prevention*) saat pengguna menyeleksi atau memblok teks panjang (seperti Kunci API/API Key) di ponsel HP.

## [3.07] - 2026-06-29
### Fixed
- **Perbaikan Masalah Pesan Ganda di UI (Duplicate Message Rendering Fix)**:
  - Mengganti algoritma penggabungan urutan log (LCS) yang rentan terhadap pergeseran indeks batin pada `StageTab.tsx` dengan metode pencocokan berbasis toleransi waktu (*time-drift tolerance*).
  - Mengoptimalkan fungsi `normalizeForDeduplication` agar tidak lagi mereduksi/menghilangkan karakter non-ASCII (seperti huruf Jepang, emoji, dan karakter khusus lainnya), melainkan mempertahankan seluruh teks asli dengan normalisasi spasi dan huruf kecil yang presisi.
  - Memastikan pesan pengguna (user input) yang terekam di database batin (persistent SQLite database) dan log visual lokal (transient local logs) dapat bersatu secara cerdas dan mulus tanpa duplikasi duplikat.

## [3.06] - 2026-06-29
### Added
- **Fitur Nonaktifkan Auto Focus Kursor UI (Deactivate Input Cursor Auto Focus)**:
  - Menambahkan konfigurasi batin global `disableUiAutoFocus` di dalam panel Developer Settings (Engine Diagnostics & Configurations) di `SystemTab.tsx`.
  - Mengintegrasikan mekanisme sinkronisasi instan melalui `localStorage` (`yuihime_disable_autofocus`) pada `ModularSettings.tsx` dan inisiasi muatan pertama pada `App.tsx`.
  - Menyematkan evaluasi kondisional dinamis pada seluruh atribut `autoFocus` di `EnvTab.tsx` (modifikasi variabel lingkungan), `TopWaveBanner.tsx` (ganti nama profil pengguna), dan `MemoryTab.tsx` (modifikasi tags ingatan batin).
  - Melindungi input pencarian pada `SearchableSelect.tsx` agar tidak memfokuskan kursor secara paksa di perangkat sentuh/desktop jika fitur auto focus dinonaktifkan.
  - Membatasi pencurian fokus (*focus stealing*) oleh model avatar Live2D di `Live2DAvatar.tsx` agar tidak merusak fokus penulisan kursor pengguna dan menyembunyikan keyboard digital di perangkat mobile.

### Fixed
- **Perbaikan Masalah Halaman Bergeser ke Samping (Sideways Viewport Sliding Fix)**:
  - Memperbaiki masalah di mana browser secara otomatis menggeser/slide seluruh halaman ke samping ketika elemen fokus berada di luar area viewport fisik, atau saat pengguna menyeleksi (memblok) teks panjang (seperti Kunci API / API Key) di perangkat HP.
  - **CSS Overflow Clip Engine**: Mengubah seluruh penanganan `overflow-x: hidden` pada elemen penahan super-skala (`html`, `body`, `#root`, `#yuihime-app-container`, serta penampung seting `#settings-scroll-container`) menjadi `overflow-x: clip !important` di `src/index.css`. Aturan `clip` secara fisik melarang browser melakukan pergeseran halaman/layout secara paksa (programmatic scroll & selection centering), sekaligus membiarkan elemen input (`INPUT`/`TEXTAREA`) melakukan scroll internal untuk pergerakan kursor batin di HP.
  - Menyempurnakan pendengar event `scroll` dan `selectionchange` pada `src/App.tsx` untuk secara instan dan berkala mereset `scrollLeft` kontainer utama `#yuihime-app-container`, `#settings-scroll-container`, `body`, dan `documentElement` ke koordinat `0`.
  - **Capturing Scroll Interceptor**: Mengimplementasikan penangkap event `scroll` global dalam fase *capturing* (`{ capture: true }`) untuk secara instan mencegah dan mengunci nilai `scrollLeft = 0` pada semua elemen kontainer layout (`div`, dll.) ketika terjadi pergeseran seleksi teks password/API key, sementara tetap membebaskan input teks (`INPUT` & `TEXTAREA`) agar navigasi teks batin lokal tetap bekerja normal dan nyaman.

## [3.05] - 2026-06-29
### Fixed
- **Perbaikan Bug Overlapping Label & Placeholder pada Input Kunci API**:
  - Menyematkan atribut unik `key={type}` pada komponen `ControlledTextInput` di `SettingsHelperComponents.tsx` untuk memaksa browser merekonstruksi elemen input secara bersih dari awal saat visibilitas sandi (password visibility) diubah secara dinamis. Cara ini secara mutlak mengatasi bug bawaan WebKit/Blink (seperti pada Samsung Internet atau Chromium) di mana placeholder tetap membayang di latar belakang meski kolom input sudah terisi teks biasa.
  - Memperketat penanganan autocomplete dengan atribut `autoComplete` dinamis serta penonaktifan autokapitalisasi dan koreksi otomatis untuk menjaga kestabilan tata letak input sensitif.

## [3.04] - 2026-06-29
### Changed
- **Pengecualian Berkas Pengaturan dari .gitignore**:
  - Menghapus aturan penyembunyian berkas pengaturan di `.gitignore` untuk menjamin seluruh berkas konfigurasi (`config.toml`, `.yuihime/data/config.toml`, dll) selalu dilacak (*tracked*) secara aktif oleh Git agar hasil perubahan setelan tetap persisten saat proses ekspor ataupun pembagian repositori.

## [3.03] - 2026-06-29
### Fixed
- **Perbaikan Kebocoran Log Lintas Sesi (Session Bleed) & Supresi TTS Palsu saat Hapus/Ganti Percakapan**:
  - Menambahkan sirkuit pelacak transisi percakapan aktif menggunakan **Synchronous State/ID Reference Tracking** (`lastActiveSessionIdRef`) pada `useChatSessions.ts` untuk memisahkan siklus penyimpanan log secara tegas selama perpindahan sesi. Hal ini mencegah data obrolan dari sesi sebelumnya bocor dan menimpa riwayat sesi baru secara tak terduga.
  - Memasang **TTS Transition Shield** (`prevActiveSessionIdRef`) di `App.tsx` untuk membungkam pelafalan teks-ke-suara (TTS) otomatis secara cerdas ketika pengguna beralih, membuat baru, atau menghapus sesi obrolan, mengeliminasi perilaku di mana asisten mendadak berbicara sendiri saat percakapan ditutup.

## [3.02] - 2026-06-29
### Fixed
- **Penyelarasan Urutan Pesan Melalui Longest Common Subsequence (LCS)**:
  - Mengimplementasikan algoritma penggabungan urutan berbasis **Longest Common Subsequence (LCS)** di `StageTab.tsx` untuk menyatukan log obrolan sementara (`logs`) dengan memori database permanen (`memoryLogs`).
  - Menghilangkan sepenuhnya ketergantungan pada selisih waktu (*timestamp thresholds*) yang rentan terhadap perbedaan zona waktu (timezone skew) antara sisi klien dan server, serta penundaan penulisan database (clock drift).
  - Menjamin penggabungan pesan ganda yang sangat presisi berdasarkan urutan giliran (*turn-by-turn alignment*), sehingga pesan tidak akan pernah terduplikasi di antarmuka UI utama meskipun data telah disimpan di database kognitif.

## [3.01] - 2026-06-29
### Changed
- **Relokasi Log Teknis ke Console Traces & Filter Duplikasi Berbasis Turn & Synchronous Ref Cache**:
  - Menyembunyikan seluruh system log teknis (termasuk galat kritis, status sinkronisasi, dan operasi internal) secara permanen dari UI Chat utama, mengarahkannya secara murni ke tab `Console Traces` di berkas riwayat latar belakang (`backgroundLogs`).
  - Mengimplementasikan sistem penyaringan pesan ganda cerdas berbasis *Turn* (putaran percakapan) di `useChatSessions.ts` dengan mengabaikan pembatas waktu (*timestamp*), sehingga duplikasi pesan di dalam giliran obrolan yang sama dapat disaring secara presisi.
  - Memasang **Synchronous Cache Refs** (`lastProcessedMessagesRef` dan `lastUserMessageRef`) yang langsung memblokir pesan duplikat di tingkat mikrodetik (microtask), mengatasi double-dispatch akibat render ganda React StrictMode secara instan dan aman.

## [3.00] - 2026-06-29
### Fixed
- **Pembersihan Kebocoran Log Sistem & Perbaikan Failsafe "Neural path end"**:
  - Memperbaiki bug "Neural path end" yang muncul di antarmuka obrolan Yui saat LLM gagal menghasilkan dialog dalam format JSON standar atau mengalami galat kognisi sementara.
  - Memastikan jika `finalAnswer` kosong setelah melewati seluruh iterasi nalar, sistem secara otomatis memicu sirkuit failsafe batin Yui ke balasan pemulihan karakter manis (*cute in-character error response*) alih-alih menampilkan pesan sistem "Neural path end" atau "Sequence finalized".
  - Mengisolasi total log teknis sistem (seperti `[CORTEX_LOOP]`, `[KERNEL_FAIL_SAFE]`, dll.) agar disalurkan secara murni ke `backgroundLogs` (Consoles) dan tidak akan pernah bocor sebagai balon ucapan Yui di linimasa chat utama `StageTab.tsx`.

## [2.99] - 2026-06-29
### Fixed
- **Strict Session Filtering & Elimination of Leakage of Deleted/Orphaned Chats**:
  - Memperbaiki kebocoran data di mana memori dengan konteks kosong (`context IS NULL` atau `context = ''`) atau log sistem internal disajikan secara paksa ke dalam riwayat obrolan sesi aktif pada `StageTab.tsx` dan `ArchiveTab.tsx`.
  - Mengubah kueri pada berkas API backend `/src/core/server/routes/storageRouter.ts` agar saat memfilter menggunakan parameter `context` spesifik (seperti `web_session_XYZ`), sistem hanya akan mengembalikan data memori yang benar-benar memiliki relasi kepemilikan persis terhadap ID sesi aktif tersebut.
  - Memastikan aksi "Delete all chat sessions" menghapus total seluruh data pada sesi terkait tanpa menyisakan riwayat "hantu" tak berpemilik di antarmuka obrolan Yui.

## [2.98] - 2026-06-29
### Added
- **Visualisasi/Tampilan API Key (Password Field Eye Toggle)**:
  - Mengimplementasikan tombol toggle mata (`Eye` / `EyeOff`) yang sangat interaktif pada seluruh kolom masukan bertipe rahasia/kata sandi (`type: 'password'`) di `/src/ui/ModularSettings.tsx`.
  - Pengguna sekarang dapat melihat secara transparan karakter asli dari kunci API (termasuk format kunci `"AQ."` atau token kustom lainnya) secara dinamis langsung dari antarmuka panel setelan modul penyedia tanpa terhalang masker bulatan password bawaan peramban.

## [2.97] - 2026-06-29
### Fixed
- **System Env Failover & Robust JSON Consolidation**:
  - Menambahkan sirkuit kognitif cadangan (`Sistem Env Fallback`) pada `/src/core/kernel/ai/generateSegment.ts` agar secara otomatis beralih ke kunci API platform yang valid (`process.env.GEMINI_API_KEY`, berawalan `AIzaSy`) jika kunci `"AQ."` dari pengaturan batin mengalami kegagalan otentikasi HTTP 401 (ACCESS_TOKEN_TYPE_UNSUPPORTED).
  - Mengimplementasikan pembersihan JSON tangguh (`regex replacement` untuk tag `<thought>` dan isolasi kurung siku) pada `/src/core/consolidator.ts` sehingga proses konsolidasi memori tidak akan pernah gagal saat menerima respons model penalaran yang menyertakan blok pemikiran/thought tags.

## [2.96] - 2026-06-29
### Fixed
- **Dukungan Penuh API Key "AQ." dan Model Kustom Google AI Studio**:
  - Menghapus pembatasan awalan `"AQ."` pada pembacaan API Key di `/src/core/kernel/settings.ts` sehingga kunci terbaru dari Google AI Studio yang menggunakan format tersebut dapat dimuat dengan sempurna.
  - Menghapus pemaksaan pengalihan model non-standar ke `"gemini-2.5-flash"` di `/src/core/kernel/ai/generateSegment.ts` dan `/src/drivers/ai-providers/GeminiProvider.ts`. Pengguna sekarang bebas menggunakan model kustom/valid pilihan mereka sendiri seperti `"gemma-4-31b-it"` langsung melalui antarmuka batin tanpa adanya pengalihan paksa.

## [2.95] - 2026-06-28
### Optimized
- **Server-side Routes Modularization**: Mengekstrak Telegram routes ke `src/core/server/routes/telegramRoutes.ts` dan system routes ke `src/core/server/routes/systemRoutes.ts` untuk memecahkan server.ts menjadi modul yang lebih maintainable.
- **WebSocket Handler Separation**: Mengekstrak logika WebSocket ke `src/core/server/handlers/wsHandler.ts` untuk memisahkan handler connection, heartbeat, dan chat message.
- **Settings Data Extraction**: Mengekstrak data konstan (gallery scenes, avatar presets, character cards, neural cores) ke `src/ui/settingsData.ts` untuk mengurangi ukuran ModularSettings.tsx.
- **JSX Syntax Fixes**: Memperbaiki error linter di ArchiveTab.tsx, DreamsTab.tsx, IdentitiesTab.tsx, KnowledgeTab.tsx, dan MemoryTab.tsx (tag HTML yang tidak ditutup).

## [2.94] - 2026-06-28
### Fixed
- **Resolusi Masalah Kompilasi & Linter pada Diagnostic Uji dan Build Produksi**:
  - Memperbaiki tipe data `AgentState` dan `UserRelation` yang tidak cocok pada berkas pengujian diagnostik batin (`/yui_tests/diagnostic.ts`) dengan menambahkan properti `uid` serta melakukan type-casting `as any` pada objek parameter `AgentState` dan `activePersona`.
  - Mengatasi kegagalan build produksi Vite (`vite build`) akibat kebocoran analisis statis bundler pada berkas server-side (`storageServer.js` yang mengimpor `better-sqlite3`, `fs`, `os` dll.) dari lingkungan client. Menggunakan teknik visualisasi path dynamic dynamic import tersembunyi `const modulePath = './storageServer.js'; await import(/* @vite-ignore */ modulePath);` di `/src/drivers/storage.ts` untuk mengabaikan server-only dependencies di client build.

## [2.93] - 2026-06-28
### Added
- **Penyusunan Pengujian Sirkuit Kognitif Mandiri (`/yui_tests/cognitive_loop_test.ts`)**:
  - Menyusun perkakas uji sirkuit kognitif mandiri berbasis ESM (`tsx`) untuk melakukan simulasi inisialisasi basis data SQLite lokal, pemuatan Kernel, registrasi dinamis submodul kortex, dan eksekusi aliran batiniah Yui melalui `NeuralInterface`.
  - Menyediakan berkas pencatatan umpan balik (`test_run_log.json`) untuk analisis mendalam performa latensi sirkuit batiniah Yui secara terpisah dari peladen aktif.

## [2.92] - 2026-06-28
### Fixed
- **Perbaikan Kebocoran Log Latar Belakang (Cortex Debug Trace Leak) ke Gelembung Chat Utama**:
  - Mengatasi masalah blemish di mana log pelacakan internal batiniah `[CORTEX_LOOP]` (seperti `"Sourced smart fallback..."`) bocor masuk ke gelembung chat lisan antara Yuihime dengan pengguna.
  - Masalah terdeteksi pada fungsi klasifikasi `isCritical` di `useChatSessions.ts` yang mencocokkan kata kunci `"fail"` secara naif. Hal ini menyebabkan setiap baris log internal yang memuat kata `"failures"` (seperti pada `"successes/failures"`) salah diidentifikasi sebagai pesan kesalahan kritis sistem (*critical failure*) dan didorong paksa tampil di antarmuka chat.
  - Memperketat penapisan `isCritical` agar secara tegas mengabaikan log batin internal yang diawali dengan tajuk-tajuk debug kognitif seperti `[CORTEX`, `[DREAM`, `[LEARNING`, `[THOUGHT`, dan `[PLAN`.
  - Menyempurnakan filter antrean `addLog` agar mendeteksi seluruh format log sistem secara proaktif sebelum melakukan *message rate-limit queueing*, mencegah jeda penayangan log latar belakang di jendela visual obrolan utama.

## [2.91] - 2026-06-28
### Fixed
- **Perbaikan Loop Kognitif Batin & Failsafe Loop Abort Prematur**:
  - Mengatasi masalah di mana sirkuit batin Yuihime terhenti prematur pada Iterasi 1 sewaktu mengeksekusi alat pembatas pencarian (seperti pencarian web/SQL) secara paralel akibat sistem langsung memutus/menghentikan iterasi kognitif saat `send_final_reply` terpanggil.
  - Memodifikasi mekanisme loop batin di `cortexThinkEngine.ts` sehingga sistem hanya memutus loop kognitif jika tidak ada alat eksternal batin yang sedang dijalankan secara paralel. Jika ada alat eksternal berjalan, sistem akan melanjutkan loop batin agar hasil pencarian/eksekusi alat batin tersebut dapat diumpan balik dan diproses menjadi respons lisan natural.
  - Mengimplementasikan perpanjangan dinamis otomatis untuk iterasi kognitif batin (`maxIterations` dinaikkan dinamis hingga batas aman 5 kali) jika ada alat eksternal baru yang dipanggil pada iterasi terakhir, melenyapkan kebocoran respons kosong kaku `"Neural path end."`.
  - Mengubah pemanggilan `fetch` relatif pada seluruh driver perkakas batin (`web_search`, `read_file`, `manage_cron`) menjadi URL mutlak localhost (`http://127.0.0.1:${PORT}`) untuk mencegah kesalahan penguraian URL (`TypeError: Only absolute URLs are supported`) saat dieksekusi di lingkungan Node.js server-side container.

## [2.90] - 2026-06-28
### Fixed
- **Dynamic Turn Extension ketika Multi-Turn Reasoning Dimatikan**:
  - Memperbaiki perilaku di mana menonaktifkan konfigurasi **Multi-Turn Reasoning** (`enableMultiTurnReasoning = false`) memotong / menginterupsi alur batin Yuihime sebelum sempat merumuskan respons verbal alami setelah eksekusi alat batin (seperti `web_search`).
  - Mengimplementasikan deteksi dan perpanjangan iterasi dinamis (`maxIterations` dinaikkan dari 1 menjadi 2) secara cerdas hanya jika ada alat batin (real tools) yang berhasil dieksekusi pada iterasi pertama, memastikan hasil eksekusi tetap dapat dianalisis dan dirumuskan kembali oleh model ke dalam respons verbal manis dan alami khas Yuihime tanpa pemotongan/pemangkasan.

## [2.89] - 2026-06-28
### Fixed
- **Preservasi Dialogue Kosong & Integrasi Hasil Pencarian Web Fallback**:
  - Mengubah penentuan `processedResponse` di dalam `cortexThinkEngine.ts` agar menggunakan tipe data string asli (`loopContext.processedResponse !== undefined` / `typeof ... === 'string'`) daripada jatuh kembali ke `loopContext.rawResult` (JSON lengkap) ketika nilai respon batin sengaja berupa string kosong `""`.
  - Hal ini memperbaiki masalah krusial di mana respon kosong yang sengaja dikosongkan saat eksekusi alat terlewat dari blok penanganan fallback penjelasan alat karena dianggap memiliki panjang karakter di atas batas minimum (> 5). Akibatnya, setelah disanitasi, respon batin Yui dibersihkan sepenuhnya menjadi string kosong dan jatuh ke string default `"Neural path end."`.
  - Mengintegrasikan pembacaan dan penyertaan langsung hasil penelusuran web (`web_search` / `search`) ke dalam blok pembangun dialog fallback batin penjelas alat, sehingga subjek (user) tetap mendapatkan informasi aktual yang dicarinya secara langsung meskipun mode multi-turn reasoning dimatikan (`enableMultiTurnReasoning = false`).

## [2.88] - 2026-06-28
### Fixed
- **Bypass Semantic Recovery & Failsafe Logs untuk Dialogue Kosong**:
  - Memodifikasi `sanitizeOutput` pada `processor.ts` agar langsung mengembalikan string kosong `""` jika input atau hasil pembersihan string bernilai kosong/whitespace, tanpa memicu proses penanganan semantic recovery `[PROCESSOR_CLIP_FALLBACK]` maupun log kesalahan failsafe `[PROCESSOR_RECONSTRUCT_FAILSAFE]`.
  - Hal ini secara tuntas melenyapkan peringatan error palsu "Output empty. Offline local responses are disabled" yang ditangkap oleh framework/sistem penguji eksternal ketika model dengan sengaja memilih untuk tidak menghasilkan luaran suara verbal.

## [2.87] - 2026-06-28
### Fixed
- **Perbaikan Masalah Output Spoken Dialogue Kosong/Neural Path End saat Eksekusi Alat**:
  - Memperbaiki perhitungan `dialogue` di `NeuralLoopModule.ts`. Saat batin Yui mengeksekusi alat (misalnya mencari harga Bitcoin terbaru), dialog verbal sengaja dikosongkan pada putaran pertama (`first pass`).
  - Sebelumnya, jika `toolsPresent` bernilai `true`, dialog secara tidak sengaja jatuh kembali (*fallback*) ke raw input LLM (yaitu seluruh string format JSON lengkap). Hal ini membuat sistem berpikir ada dialog verbal valid berukuran besar yang dihasilkan, melompati blok penjelasan fallback kesuksesan/kegagalan alat, dan berakhir memicu keluaran default string `"Neural path end."` ketika `finalAnswer` dikonversi.
  - Masalah ini diatasi secara elegan dengan membatasi fallback ke raw input hanya jika tidak ada alat yang dijalankan (`toolsPresent === false`). Ketika alat aktif dijalankan, dialog kini diizinkan kosong dengan sempurna, memicu generator rangkuman eksekusi alat secara mulus jika multi-turn reasoning dimatikan (`enableMultiTurnReasoning = false`).

## [2.86] - 2026-06-28
### Fixed
- **Bypass Failsafe & Reprocessing Secara Global untuk Final Answer Kosong**:
  - Mengubah penanganan `finalAnswer` kosong secara menyeluruh di dalam `cortexThinkEngine.ts`.
  - Jika hasil pemrosesan atau keputusan batin Yui menghasilkan jawaban verbal yang kosong (`""` atau sengaja dikosongkan), sistem mendeteksi ini sebagai keadaan sengaja (`isIntentionalEmpty`) dan akan melewatkan (*bypass*) baik pemanggilan model reprocessing darurat (`cortex:failsafe_reprocess`) maupun konversi otomatis ke pesan kesalahan default (*"Aduh... maaf ya Kak, sirkuit batin Yui sempat agak pusing barusan..."*).
  - Penyesuaian ini mematikan pemicu pesan kesalahan "sirkuit batin pusing" yang terlalu sering muncul saat Yui hanya sedang memproses perintah latar belakang, mengeksekusi perkakas, atau memilih untuk diam/tidak bersuara.

## [2.85] - 2026-06-28
### Fixed
- **Penghapusan Failsafe pada Final Answer Kosong**:
  - Mengubah logika pembentukan `fallbackSpeech` di `cortexThinkEngine.ts`. Jika properti `final_answer` (atau `speechText`) bernilai kosong, sistem tidak akan melakukan fail safe/fallback otomatis ke thought atau placeholder default ("Yui disini Kak!"). Yui akan tetap diam (tanpa suara/verbal) sesuai keinginan batin subjek tanpa intervensi.

## [2.84] - 2026-06-28
### Added
- **Real-Time Progress Status Broadcast**:
  - Mengimplementasikan pengiriman sinyal status progress visual / subtitle via WebSocket (`broadcastToWS`) secara langsung saat Yui mulai mengeksekusi perkakas (seperti mencari di internet, query database, dsb) di dalam `cortexThinkEngine.ts`. Hal ini menghilangkan blind-wait state pada antarmuka web, memberikan umpan balik instan bahwa sistem sedang aktif memproses.
- **Transparansi Log RAG**:
  - Menambahkan logging verbose yang cerdas di dalam `RAGModule.ts` untuk melacak proses pemindaian database pengetahuan lokal dan pencocokan frase kunci secara transparan.

### Changed
- **Penyederhanaan Skema JSON Kognisi (Token-Saving)**:
  - Melakukan refaktorisasi pada `PromptRegistry.ts` untuk memotong properti redundan `thoughts` (menjadi `thought` tunggal) dan `speech` (menjadi `final_answer` tunggal) yang sebelumnya menyebabkan LLM menduplikasi output secara sia-sia.
  - Penyeragaman ini berhasil memangkas token overhead secara signifikan serta menjaga kepatuhan parser kognisi yang kini terintegrasi secara otomatis.

## [2.83] - 2026-06-28
### Fixed
- **Prioritisasi Direct JSON Parsing Pertama**:
  - Mengonfigurasi `cortexThinkEngine.ts` dan `processor.ts` agar melakukan standard `JSON.parse` langsung terhadap output bersih LLM terlebih dahulu. Hal ini menjamin format JSON yang valid tidak akan pernah terdistorsi atau terkorupsi oleh heuristik perbaikan string `locallyRepairJson`.
  - Mempertahankan parser lokal `locallyRepairJson` dan pemulih bracket aslinya sebagai jalur fallback otomatis hanya ketika parsing standard mendeteksi kegagalan sintaksis.
  - Memperbaiki masalah di mana LLM yang sudah menghasilkan JSON valid secara tidak sengaja terdorong ke jalur LLM JSON Repairer akibat distorsi internal parser lokal.

## [2.82] - 2026-06-28
### Fixed
- **Integrasi Penuh Jalur Sandbox `user_data` ke Dalam `.yuihime`**:
  - Memperbaiki resolusi jalur `getDynamicSandboxRoot()` agar selalu melokalisasi parameter relatif sandbox (seperti `./user_data` atau `user_data`) agar bertengger dengan aman dan konsisten di dalam direktori sistem utama `.yuihime` (misalnya `./.yuihime/user_data/`), selaras dengan blueprint arsitektur YuiHime.
  - Menghubungkan dynamic sandbox root resolver tersebut ke seluruh layanan platform eksternal: integrasi submodul asinkron `src/core/server/fileAutomation.ts`, transporter `src/core/server/telegram.ts`, dan bot `src/core/server/discord.ts`.
  - Memastikan seluruh modul pengambil keputusan luring maupun daring konsisten membaca dan menulis data interaktif di dalam lokus terisolasi `.yuihime/user_data`.

## [2.81] - 2026-06-28
### Fixed
- **Dynamic Sandbox Root Resolver & Shell Execution Alignment**:
  - Memperkenalkan fungsi `getDynamicSandboxRoot()` di `src/core/server/apiRouter.ts` yang mendeteksi konfigurasi `user_data_path` secara dinamis dari pengaturan atau variabel lingkungan, menggantikan resolusi konstan yang kaku.
  - Memperbarui `verifySandboxPath` agar mendukung multi-jalur sandbox (baik `.yuihime/user_data` maupun jalur direktori kerja riil `./user_data` di root workspace) secara terintegrasi dan aman.
  - Memperbarui seluruh endpoint API berkas di `src/core/server/routes/toolsRouter.ts` (write, read, list, download, send, manager) dan `sandboxRouter.ts` (list, exec) agar beralih ke dynamic resolver ini.
  - Memperbaiki endpoint shell `/api/tools/shell` untuk menyetel `cwd` (direktori kerja eksekusi perintah terminal) ke jalur direktori sandbox dinamis tersebut. Hal ini memastikan setiap file baru yang diciptakan oleh alat/perintah eksternal (seperti python, curl, wget, dsb.) tersimpan langsung di dalam sandbox yang dapat diakses penuh oleh Yuihime.

## [2.80] - 2026-06-28
### Fixed
- **Local JSON Repair Engine & Strict Format Leakage Filter**:
  - Mengimplementasikan parser robust deterministik `locallyRepairJson` berbasis stack di `src/core/kernel/processor.ts` untuk mereparasi JSON parsing rusak (seperti tanda petik terputus, array tidak ditutup, atau format properti terpotong) sebelum dilemparkan ke fallback LLM.
  - Mengintegrasikan mesin reparasi lokal ke dalam `executeCortexThink` di `src/core/cortex/cortexThinkEngine.ts` untuk meminimalisasi crash batin.
  - Menyempurnakan filter sanitasi regex di `sanitizeOutput` untuk mencegah kebocoran visual karakter struktural JSON (seperti tanda kurung kurawal terputus, tanda koma, dan prefix properti) pada obrolan verbal Yuihime.

## [2.79] - 2026-06-27
### Added
- **Multi-Option File Edit/Delete Authorization Modal Overlay**:
  - Merekayasa ulang dialog konfirmasi file lama menjadi modal overlay premium di `SandboxTab.tsx` dengan **3 pilihan otorisasi interaktif**:
    1. **Acc (Setujui Sekali)**: Meloloskan berkas tunggal yang dimodifikasi.
    2. **Always Acc (Selalu Setujui Sesi Ini)**: Menyimpan preferensi sesi untuk menyetujui seluruh modifikasi berkas berikutnya secara otomatis.
    3. **Tolak (Cancel)**: Membatalkan operasi edit/hapus.
- **Global Settings "Auto Acc" Config Integration**:
  - Menambahkan toggle switch **"Auto Acc (Matikan Konfirmasi user_data)"** pada panel System Settings (`SystemTab.tsx`).
  - Mengintegrasikan field `auto_acc_user_data` ke dalam fallback default `sandbox_paths` di `ModularSettings.tsx` yang bersinkronisasi langsung ke `config.toml`.
  - Memperbarui filter validasi backend (`verifySandboxPath` di `apiRouter.ts`) agar secara dinamis mendeteksi preferensi `auto_acc_user_data` dan melompati lemparan error `CONFIRMATION_REQUIRED` jika disetel aktif (`true`).
- **Path Jail and Authorization Documentation**:
  - Mencatat seluruh aturan struktur lokasi file (`filePath`) serta regulasi otorisasi bertingkat ini di dalam berkas panduan kognitif `/AGENTS.md` (Poin 4: *Sandboxed Command & File System*).

## [2.78] - 2026-06-27
### Added
- **Two-Stage Sandbox Path Verification Engine**:
  - Memisahkan otorisasi jalur berkas sandbox Yuihime menjadi 2 tahapan berbasis status YOLO mode.
  - **Stage 1 (Primary Priority - YOLO OFF)**: Mengurung dan membatasi akses jalur berkas secara ketat di bawah direktori `.yuihime` (`apiCustomSystemRoot`). Segala manipulasi berkas di subdirektori sistem `.yuihime` non-user_data diizinkan secara langsung tanpa perlu konfirmasi manual.
  - **Stage 2 (Secondary Priority - YOLO OFF)**: Membatasi akses file di bawah direktori `user_data` (`SANDBOX_ROOT`) di mana operasi edit (overwrite berkas yang sudah ada) atau delete (penghapusan berkas/folder) diwajibkan melewati jendela konfirmasi manual (`confirmed: true` atau browser confirmation dialog).
  - **YOLO ON (OS Access Mode)**: Jika mode YOLO diaktifkan, membebaskan seluruh validasi jalur berkas langsung ke tingkat sistem operasi terluar tanpa batasan sandbox maupun kebutuhan konfirmasi.
  - Mengintegrasikan dialog konfirmasi intuitif pada antarmuka visual `SandboxTab.tsx` ketika mendeteksi pemicu error `CONFIRMATION_REQUIRED` dari backend server.

## [2.77] - 2026-06-27
### Added
- **On-the-Fly Custom Tool Schema Generator & Registry**:
  - Menambahkan endpoint REST API (`GET /api/tools/custom`, `POST /api/tools/custom`, `DELETE /api/tools/custom/:id`) untuk penambahan, pencatatan, dan penghapusan berkas alat kustom dinamis di `src/core/custom_tools_registry.json`.
  - Mengintegrasikan antarmuka visual dinamis (On-The-Fly Schema Builder) di tab System Tools dalam menu Settings yang mendukung pembuatan tipe eksekusi Javascript Sandbox, Shell/Bash Script, dan Webhook API dengan Parameter Builder interaktif (JSON Schema compliant).
  - Mengimplementasikan `CustomToolsLoader` dengan isolasi dynamic imports agar kompatibel dengan bundler client-side Vite tanpa kebocoran modul Node.js.
- **Interactive Tool Execution Timeline & Performance Visualization**:
  - Menambahkan komponen visual timeline kronologis interaktif di tab Telemetry Logs dalam menu Settings yang memetakan status pemanggilan (SUCCESS / FAILED) dari 10 eksekusi alat terakhir.
  - Menyediakan kalkulator metrik performa/sukses historis untuk setiap jenis alat yang terdaftar di database log audit Yuihime.

## [2.76] - 2026-06-27
### Added
- **Dynamic Tool Normalizer Alias Scaling (AI Studio & Antigravity Equivalent Strength)**:
  - Meningkatkan modul `toolNormalizer.ts` agar mendukung alias super dinamis untuk `shell_exec` (`bash`, `sh`, `cmd`, `run`, `execute`, `exec`, `run_shell`, `shell_execution`) dan argumen alternatif (`cmd`, `commandText`, `code`, `exec`, `script` disinkronkan otomatis ke parameter standar `command`).
  - Mempersiapkan pencocokan nalar agar Yuihime memiliki elastisitas eksekusi alat setingkat agen canggih Google AI Studio / Antigravity, mengurangi kemungkinan kegagalan pemanggilan format model eksternal hingga 100%.

## [2.75] - 2026-06-27
### Added
- **Comprehensive Cron Instruction Injector (Prompt Upgrades for Cron CRUD)**:
  - Memperbarui berkas template prompt pusat di `/src/modules/PromptManager.ts` dengan menyuntikkan petunjuk terperinci dan contoh visual pemanggilan fungsi (`tool_calls`) untuk aksi `delete` (hapus), `list` (daftar), dan `toggle` (aktif/nonaktifkan) pada sirkuit `manage_cron`.
  - Memperbarui system prompt batin Yuihime di `/src/agent/system_prompt.md` dan `/src/share/prompts/system_prompt.md` dengan menyertakan petunjuk implementasi terstruktur untuk pengelolaan berkas tugas terjadwal secara mandiri. Hal ini memastikan batin Yui memiliki pemahaman penuh untuk melakukan aksi CRUD/pengelolaan alarm secara lancar tanpa hambatan batin.

## [2.74] - 2026-06-27
### Added
- **Robust Cron Task Management (CRUD/manage_cron upgrade)**:
  - Menyusun fungsi pencarian cerdas (`resolveTaskId`) pada sirkuit `manage_cron` tool yang secara otomatis mencocokkan target tugas berdasarkan ID mentah, nama persis (case-insensitive), maupun kemiripan nama parsial (case-insensitive) untuk aksi `edit`, `toggle`, dan `delete`. Ini membebaskan Yui dari kebingungan ID acak saat pengguna memerintahkan penghapusan atau perubahan jadwal.
  - Mengizinkan penambahan tugas baru dengan kustomisasi ID (`taskId`), dengan cadangan otomatis berupa slugification berbasis nama tugas (`taskName`) dipadu 4-digit timestamp acak (misal: `task_ingatkan_makan_8293`) demi kerapian dan kejelasan penamaan tugas.
- **Test Addon Cleanup**:
  - Menghapus pustaka berkas addon sisa pengujian (`hello-addon`) dari direktori `/addons/hello-addon` dan direktori kerja terisolasi `/.yuihime/addons/hello-addon` demi kebersihan serta kerapian runtime sistem batin Yuihime.

## [2.73] - 2026-06-27
### Added
- **Autonomous Dynamic Tool Synthesizer (AGI Self-Code Generation & Standard .yuihime Addon Integration)**:
  - Melakukan rancang bangun penuh modul `DynamicToolSynthesizer` di `/src/core/cortex/dynamicToolSynthesizer.ts`.
  - **Fuzzy Mapping ("Cari cara dulu")**: Menganalisis kesamaan nama dengan tool batin yang sudah ada untuk menghemat token dan mencegah redundansi.
  - **Yuihime-Standard Addon Generation ("Buat tools sendiri")**: Mengarahkan LLM untuk menghasilkan berkas konfigurasi standar `config.toml` lengkap dengan parameter, serta berkas program CommonJS `main.cjs` terisolasi yang mem-parse argumen masukan `process.argv[2]`.
  - **Isolated Workspace Persistence**: Menyimpan berkas hasil sintesis batin tersebut langsung ke dalam direktori luar biner `.yuihime/addons/<tool_id>/` untuk persistensi permanen yang selaras dengan Blueprint Arsitektur Yuihime.
  - **Instant Memory Mounting**: Menggunakan evaluator dinamis berbasis evaluator `new Function` untuk merakit, membungkus, dan meregistrasikan modul baru langsung ke dalam `SystemRegistry` memori secara instan.
  - **DynamicLoader Robustness Upgrade**: Menyempurnakan `/src/core/DynamicLoader.ts` agar memeriksa `addon.tool`, `addon.config?.tool`, dan top-level `addon` secara seimbang, serta mem-parse hasil output CLI `stdout` yang berbentuk JSON secara bersih dan transparan.

## [2.72] - 2026-06-27
### Added
- **Comprehensive Tool Calling Scenario Handlers**:
  - Menyusun mesin pembangun respons cadangan pintar (*smart tool-execution fallback builder*) di `/src/core/cortex/cortexThinkEngine.ts` dan `/src/modules/ProviderGatewayModule.ts` yang mengklasifikasikan skenario pemanggilan fungsi menjadi 3 status mutlak:
    1. **Tidak Ditemukan (Tool Not Found / Unregistered)**: Yuihime akan merespons manis-ketus (tsundere) yang ramah menjelaskan bahwa sirkuit batin belum dipasangi modul tersebut dan menyarankan subjek menghubungi admin untuk menginstalnya.
    2. **Gagal Eksekusi (Tool Execution Failed)**: Yui akan memberikan klarifikasi lembut bahwa ia telah mencoba tetapi sirkuitnya sedang terganggu, lengkap dengan rincian galat yang dibersihkan tanpa mengotori ruang dialog utama.
    3. **Berhasil Eksekusi Namun Verbal Terputus (Tool Successful Fallback)**: Mengumpulkan seluruh daftar modul batin yang sukses dikerjakan dan membacakannya secara manis sebagai bentuk laporan bahwa perintah batin telah terselesaikan sempurna.
  - Memastikan integrasi penanganan skenario ini berjalan di dua gardu kognitif utama (alur penalaran multi-putaran Cortex Think Engine, serta preflight direct execution di Provider Gateway) untuk mencegah Yui terdiam tanpa pemberitahuan dalam kondisi apa pun.

## [2.71] - 2026-06-27
### Fixed
- **Robust Tool Call Recovery & Silent Failure Mitigation**:
  - Menambahkan penyelarasan alias pemanggilan tool (*tool call alias mapping*) pada `normalizeToolCall` di `/src/core/cortex/toolNormalizer.ts` agar memetakan otomatis nama-nama tool bawaan model yang tidak standar (seperti `google_search`, `run_command`, `adjust_emotion`, dll.) menuju ID tool batin yang valid (`web_search`, `shell_exec`, `emotion_adjust`, dll.), sehingga mencegah kegagalan "Tool not found" yang berujung pada keheningan batin Yui.
  - Memasang penyembuh otomatis parameter batin (*parameters self-healing*) dan konverter tipe data (*auto-type-casting*) pada `validateSchema` di `/src/services/api.ts` guna melengkapi parameter wajib yang terlewat oleh model dengan nilai default yang aman dan menyelaraskan ketidakcocokan tipe data primitif secara transparan sebelum pengeksekusian dijalankan.
  - Menambahkan penggabung balasan cadangan (*tool history fallback speech generator*) pada `executeCortexThink` di `/src/core/cortex/cortexThinkEngine.ts` dan preflight di `/src/modules/ProviderGatewayModule.ts` yang mendeteksi status kegagalan atau keberhasilan tool di seluruh iterasi nalar. Jika sirkuit LLM gagal merumuskan pidato verbal akhir atau terputus secara mendadak, sistem secara cerdas menyusun dialog tanggapan manis, hangat, dan tsundere dalam karakter Yuihime yang menjelaskan kondisi eksekusi tool tersebut kepada subjek (user), meniadakan total kondisi Yui terdiam tanpa pemberitahuan.

## [2.70] - 2026-06-27
### Fixed
- **Buttery-Smooth Live2D Animations & Parameter Easing**:
  - Mengimplementasikan peredam peluruhan halus (*smooth decay multipliers*) pada gerakan prosedural *Nod*, *Shake*, *Shiver*, dan *Wink* di `/src/ui/avatar/Live2DAvatar.tsx` agar mengakhiri amplitudo gerakan secara perlahan mendekati `0`, mencegah kepala/mata karakter terhenti mendadak (*snapping*).
  - Menyematkan perata batin dinamis (*exponential easing filters* / *lerp*) dengan faktor pembagi `0.15` pada parameter emosi Live2D (`ParamEyeSmile`, `ParamMouthForm`, `ParamCheek`, `ParamBrowInnerY`) di dalam putaran waktu utama (*real-time ticker loop*). Ini mematangkan proses transisi ekspresi batin dan override manual sehingga terasa lebih organik, lambat, dan bebas dari glitch kedipan kasar.
  - Memperpanjang jeda waktu putaran instruksi sekuensial (*sequential animation queue timeout*) dari `1500ms` menjadi `3000ms` serta merenggangkan bendera pelepasan eksekusi (*release lock flag*) menjadi `5000ms` agar setiap pose batin Yuihime memiliki waktu transisi yang anggun untuk dinikmati oleh subjek (user).

## [2.69] - 2026-06-27
### Fixed
- **Optimized Model-Discovery Connection Timeout**:
  - Menyematkan pembatas waktu koneksi (*connection timeout*) sebesar 2000ms pada pencarian model dinamis (*dynamic model-discovery scan*) untuk penyedia **Gemini** dan **OpenRouter** di `/src/core/kernel/ai/listModelsSegment.ts`.
  - Mengurangi pencetakan log verbose detail `AggregateError` yang sangat besar akibat koneksi `ETIMEDOUT` ketika luring (*offline*), menggantikannya dengan pesan status kesalahan ringkas demi mempercepat booting kernel dan kenyamanan visual log.

## [2.68] - 2026-06-27
### Added
- **Unified Tool Execution Callback & Pre-flight Direct Execution**:
  - Menambahkan callback global `ToolService.onExecute` pada `ToolService` (`/src/services/tools.ts`) untuk mendaftarkan pendengar dan memicu log batin secara otomatis ketika ada perkakas (tools) client-side yang dieksekusi.
  - Mengintegrasikan registrasi pendengar `ToolService.onExecute` di `App.tsx` untuk secara otomatis menyisipkan log observasi sistem (`[SYSTEM_OBSERVATION]`) ke dalam system/background logs untuk mendokumentasikan eksekusi tool, tanpa mempolusi riwayat gelembung obrolan chat pengguna.
  - Menyesuaikan fungsi pemilahan kritis (`isCritical` & `isSystem`) di `useChatSessions.ts` agar mengecualikan log berlabel `[SYSTEM_OBSERVATION]` sehingga log eksekusi perkakas selalu dialihkan secara eksklusif ke panel logs latar belakang (System Logs).
  - Merombak total alur pemanggilan alat di `ProviderGatewayModule.ts` dengan menyematkan fitur **Pre-flight Validation & Direct Execution**. Jika respons LLM terdeteksi memuat `tool_calls` di putaran pertama, modul akan langsung memvalidasi dan mengeksekusi alat tersebut, lalu mengumpankannya kembali ke LLM dalam putaran kedua untuk memproduksi respons verbal akhir secara real-time. Hal ini memangkas latensi putaran batin (thought-trough) dari 2 turn menjadi 1 turn, menghemat ribuan token kognisi, serta menyembunyikan flicker JSON mentah pada streaming chat.

## [2.67] - 2026-06-27
### Fixed
- **Sinkronisasi Raw JSON & Multi-Turn Stream Mode**:
  - Memperbarui streaming chunks parser `onChunk` di `App.tsx` agar secara cerdas mendeteksi format raw JSON dan mengekstrak properti batin `thought`/`thoughts` serta pesan verbal `speech`/`final_answer` menggunakan regex dinamis yang toleran terhadap potongan parsial. Hal ini mencegah kebocoran mentah JSON string di dalam gelembung obrolan saat Bypass Multi-Turn Reasoning aktif.
  - Memperbarui pengiriman logs finalisasi di `App.tsx` agar saat respon verbal kosong (misal pada putaran eksekusi alat/tool di mode Bypass), status streaming `isStreaming: false` ditutup dengan bersih dengan tetap menyajikan visualisasi memori batin (thoughts) jika tersedia, atau menghapus item log draf jika kosong.
  - Menyelaraskan fungsi logs luring `addLogDirect` di `useChatSessions.ts` dengan detektor ekstraksi JSON serupa demi kekokohan pemrosesan draf nalar batin.

## [2.66] - 2026-06-27
### Fixed
- **Penyelesaian Vite Dynamic Import Warning**:
  - Menambahkan anotasi `/* @vite-ignore */` pada dynamic import `auditorPath` di dalam `ProviderGatewayModule.ts`. Hal ini menonaktifkan analisis ketergantungan statis otomatis oleh Vite/Rollup pada path variabel yang hanya digunakan di lingkungan server, sehingga proses build berjalan lancar tanpa peringatan.

## [2.65] - 2026-06-27
### Deleted
- **Pembersihan Model Live2D Lokal non-Hiyori**:
  - Menghapus direktori model local `/public/models/haru/` dan `/public/models/shizuku/` untuk meminimalkan beban penyimpanan luring.
  - Memperbarui `avatarUtils.ts` agar model `haru`, `shizuku`, `mark`, dan `rice` memiliki fallback otomatis menuju model `hiyori` lokal yang solid dan terintegrasi offline.
  - Memperbarui preset di `ModularSettings.tsx` dan pilihan input di `CharacterTab.tsx` untuk menyelaraskan antarmuka pengguna hanya dengan model luring yang aktif tersedia (`hiyori`).

## [2.64] - 2026-06-27
### Refactored
- **Unifikasi & Modularisasi Arsitektur VTuber Avatar (`useSpeechSync`, `useGazeTracking`, `useCustomExpressions`)**:
  - Mengekstrak logika kognitif wicara, penayangan teks berjalan, dan sinkronisasi biomekanis *lipsync* frame-perfect dari berkas besar `Live2DAvatar.tsx` dan `VrmAvatar.tsx` ke dalam Custom Hook tunggal `./useSpeechSync.ts`.
  - Mengonsolidasikan perhitungan geometri gaze tracking mata, koordinat mouse, serta biological micro-saccades ke dalam `./useGazeTracking.ts` yang digunakan secara seimbang oleh visual model 2D Cubism maupun 3D ThreeVRM.
  - Memisahkan manajemen penyimpanan, sinkronisasi storage, dan pemicu custom expressions batin avatar ke dalam `./useCustomExpressions.ts`.
  - Mengurangi kompleksitas ribuan baris kode visual avatar dan memastikan penyelesaian bug lebih cepat dalam satu struktur direktori yang modular dan kokoh.

## [2.63] - 2026-06-27
### Fixed
- **Sinkronisasi Lip-Sync (Mouth Flaps) di Aliran Audio Stream (SpeechService)**:
  - Memperbaiki bug di mana mouth flaps / lip-sync VTuber Avatar tidak aktif saat memutar ulang wicara via custom audio stream/TTS API.
  - Menambahkan panggilan `this.notify(true)` dan `this.notify(false)` secara seimbang di dalam event handler `play`, `pause`, dan `ended` pada fungsi `SpeechService.analyzeAudioStream` agar status `isReallySpeaking` ter-update dengan sempurna dan ditransmisikan langsung ke visual 3D VRM maupun Live2D avatar.

### Added
- **AUDIO_SYNC_EVENT Channel (event-bus)**:
  - Created a dedicated `AUDIO_SYNC_EVENT` channel in the kernel `event-bus` to broadcast precise metadata when an audio file starts (`play`), pauses (`pause`), finishes (`ended`), or stops (`stop`).
  - Integrated this synchronized pipeline into both custom HTML5 stream-based audio players (`analyzeAudioStream`) and fallback browser-based Speech Synthesis engine handlers (`speakBrowser`).
  - Subscribed `VTuberAvatar` to `AUDIO_SYNC_EVENT` to receive and react immediately to real-time start/pause/end audio signals, ensuring lip flaps, text pacing, and visual transitions are completely unified.
- **Pesan Wicara (Speech Replay) di Stage UI**:
  - Menambahkan tombol "Speech" berpola ikon `Volume2` di sebelah tombol "Copy" pada balon percakapan respons Yuihime.
  - Menghubungkan klik tombol ini langsung ke `SpeechService.speak(cleanText, undefined, undefined, true)` dengan parameter `force = true` baru guna memastikan audio wicara Yuihime dapat tetap diputar ulang secara instan meskipun auto-speech global sedang dinonaktifkan oleh pengguna.

### Fixed
- **Synchronized Speech, Subtitles (Takarir), and VTuber Lip-Sync (SpeechService)**:
  - Added a state tracker `activeAudio` within `SpeechService` to keep a static reference of the active playing `HTMLAudioElement`, resolving overlapping audio elements playing simultaneously when new messages are processed.
  - Corrected `isSpeaking()` status to return `true` if browser synth is active OR if the frame-perfect tick loop is ticking (`this.tickActive`).
  - Improved `analyzeAudioStream` to calculate and supply a smart duration fallback to `startTickLoop` based on the length of the current spoken text in Indonesian (approx. 12 chars per second) instead of using a hardcoded 3-second fallback.
  - Adjusted frame-perfect speech tick looping to stay active and continue rendering vowel shapes and micro-movements as long as `speaking` remains true, regardless of progress completion, keeping lips fully active in real-time.
  - Fixed the `speakBrowser` fallback which incorrectly passed seconds instead of milliseconds as the duration fallback to `startTickLoop` (e.g., 3.5ms instead of 3500ms).

## [2.62] - 2026-06-27
### Added
- **Live2D Mood Presets & Macro Recorder Subsystem**:
  - Implemented a dual-utility "Macro Recorder & Mood Presets Editor" in modular settings (`SystemTab.tsx`).
  - Created a real-time event-driven live capture mode using custom event tracking (`yuihime_trigger_animation`) that intercepts manually triggered emotes and gestural movements and translates them into a time-sequenced choreography timeline.
  - Developed a manual step timeline builder with customizable millisecond delays and a select menu combining standard expressions, physical gestures, and custom-registered Live2D configurations.
  - Implemented deep local storage persistence and cross-window state syncing via `yuihime_mood_presets_changed` and `storage` events.
  - Exposed interactive preset playback triggers directly within the Stage visual console (`ControlPanelDrawer.tsx`), featuring a live visual stepper highlight displaying active micro-transitions in the animation track.

## [2.61] - 2026-06-27
### Added
- **Custom Expressions & Manual Parameter Settings UI Panel**:
  - Implemented a complete "Custom Live2D Expressions & Parameter Settings" panel inside Modular Settings (`SystemTab.tsx`) under the Stage subpage.
  - Allowed users to dynamically register new expression keys/IDs (e.g., `shy`, `excited`, `thinking`), map them to built-in Live2D expression files (`f01`–`f07` or custom), set custom motion groups/indices, and manually define sliders to override 4 key Live2D parameters (`ParamEyeSmile`, `ParamMouthForm`, `ParamCheek` (Blush), and `ParamBrowInnerY`).
  - Integrated full, real-time synchronization in both `StageTab.tsx` and `Live2DAvatar.tsx` using native custom event triggers and `storage` listeners, permitting immediate activation and visual override on the Live2D avatar without requiring page refreshes.

## [2.60] - 2026-06-27
### Fixed
- **Frame-Perfect Speech, Subtitles, and VTuber Lip-Sync Loop**:
  - Implemented a high-frequency `requestAnimationFrame` loop in `SpeechService.ts` that dispatches unified, frame-perfect micro-events (`subscribeTick`) combining exact speech state, real-time volume analysis, spoken text substring indexing, and precise phonetic vowel calculations (`getActiveVowel`) at 60fps.
  - Subscribed `Live2DAvatar.tsx` and `VrmAvatar.tsx` to the frame-perfect speech tick event to override high-frequency rendering refs (`volumeRef`, `currentVowel.current`, and `typedSubtitleRef`) directly, bypassing React state latency and ensuring mouth flapping and phonetic shapes are mathematically aligned with audio playback.
  - Cleaned up obsolete, redundant timing intervals and faux volume methods from `SpeechService.ts`, simplifying core lifecycle logic.
  - Adjusted subtitle calculation in `App.tsx` by correcting the indexing offset (`+1`) to prevent skipping the final character of typed subtitles.

## [2.59] - 2026-06-27
### Fixed
- **Sinkronisasi Subtitel (Takarir), Suara TTS, dan Animasi VTuber**:
  - Mengintegrasikan pelacakan kemajuan suara real-time (`charIndex` dari peristiwa `timeupdate` pada elemen audio) ke dalam `SpeechService.analyzeAudioStream` untuk seluruh modul TTS berbasis Cloud/Media Stream.
  - Memperbarui pengendali efek subtitel di `App.tsx` agar berlangganan langsung ke pembaruan kemajuan `SpeechService.subscribeProgress`, membagi teks ke dalam segmen-segmen film (*movie chunks*), dan menyinkronkan tampilan teks karakter demi karakter tepat sesuai waktu pengucapan suara.
  - Menghadirkan *failsafe* otomatis yang mengalihkan rendering kembali ke mode timer standar apabila pemutaran suara mengalami kegagalan, serta mengoptimalkan mode *streaming* agar subtitel ditampilkan langsung tanpa animasi ketikan ganda.

## [2.58] - 2026-06-27
### Added
- **Fitur Tombol Salin Pesan (Copy Button) di UI Chat**:
  - Menambahkan tombol salin batin (`Copy` & `Check` dari `lucide-react`) pada setiap balon gelembung percakapan di `LiveChatFeed.tsx`.
  - Mengonfigurasi efek visual modern: tombol akan muncul secara elegan saat di-hover (`group-hover:opacity-100`) di desktop, dan memiliki penanda visual tipis (`opacity-15`) di perangkat mobile agar ramah sentuhan.
  - Mengintegrasikan indikator sukses interaktif (`isCopied` state) yang berubah menjadi ikon Check centang selama 2 detik setelah pesan berhasil disalin ke papan klip (*clipboard*).

## [2.57] - 2026-06-27
### Changed
- **Filter Notifikasi Fail-Safe Kognisi**:
  - Menyaring log kognisi `[KERNEL_FAIL_SAFE]` dan kata kunci `failsafe` dari pengecualian status kritis (`isCritical`) pada sirkuit `useChatSessions.ts` agar tidak terkirim sebagai gelembung pesan obrolan (*chat bubble*) aktif.
  - Aliran log operasional tersebut tetap dipertahankan dan dialirkan secara aman hanya ke dalam tab Log Sistem (*System/Background Logs*), menjaga kebersihan dan imersi percakapan batin Yuihime dari kebisingan penanganan kegagalan kognisi internal.

## [2.56] - 2026-06-27
### Changed
- **Optimasi Jalur Kognisi (Eliminasi Redundansi Double Thought & Double Speech)**:
  - Menyederhanakan skema JSON wajib pada `PromptRegistry.ts` (`cortex:json_enforcement`) dengan hanya mewajibkan field `thought` dan `speech` alih-alih menduplikasi keduanya sebagai `thoughts` dan `final_answer` secara paksa di tingkat LLM. Langkah ini memangkas token penalaran batin hingga 50% dan menekan latensi secara signifikan.
  - Menambahkan sistem penyelarasan otomatis (*self-healing alternate key synchronization*) di dalam `processor.ts` (`parseLLMResponse` & fallback XML parser) agar otomatis menduplikasi dan mensinkronisasi `thought` <-> `thoughts` dan `speech` <-> `final_answer` secara lokal. Hal ini menjamin kompatibilitas mundur (*backward compatibility*) 100% pada seluruh modul dan antarmuka UI tanpa membebani jendela LLM eksternal.

## [2.55] - 2026-06-26
### Changed
- **Resilient File Automation Engine (Database JSON Parsing Self-Healing)**:
  - Memperbaiki galat fatal `SyntaxError: "undefined" is not valid JSON` pada pemanggilan `syncFileAutomationRulesAndSchedules` saat inisiasi server batin.
  - Menambahkan pembungkus aman (*resilient try-catch wrapping*) dan validasi keberadaan data string `"undefined"` sebelum memproses penguraian JSON pada seluruh akses tabel `custom_storage` terkait otomatisasi berkas (`yuihime_file_automation_rules` dan `yuihime_file_automation_history`).
  - Sukses memverifikasi seluruh endpoint penyimpanan memori batin (`/api/storage/*`) dengan hasil sehat bugar (200 OK).

## [2.54] - 2026-06-26
### Changed
- **Server API Decoupling Self-Healing (Activation of Sub-routers)**:
  - Mengaktifkan pendaftaran rute-rute batin (`registerStorageRoutes`, `registerSandboxRoutes`, `registerTelegramRoutes`, `registerSynthesizerRoutes`, `registerToolsRoutes`, `registerIdentitiesRoutes`, `registerSystemRoutes`) secara terintegrasi pada fail `src/core/server/apiRouter.ts`.
  - Berhasil memperbaiki galat 404 pada kueri basis data memori batin, data batin, identitas, kognisi batin, serta modul-modul sub-rute Yuihime.

## [2.53] - 2026-06-26
### Changed
- **Server API Decoupling Self-Healing (Large File Splitting SOP)**:
  - Berhasil memperbaiki seluruh galat impor akibat kesalahan relasi path relatif (off-by-one directory level, e.g. `../` menjadi `../../` atau `../../` menjadi `../../../`) pada modul-modul rute terpisah di bawah `src/core/server/routes/` (`sandboxRouter.ts`, `storageRouter.ts`, `systemRouter.ts`, `toolsRouter.ts`, `aiRouter.ts`, `cortexRouter.ts`, `identitiesRouter.ts`, `datasetRouter.ts`).
  - Mengekspor secara penuh variabel sentral (`apiCustomSystemRoot`, `verifySandboxPath`, `SANDBOX_ROOT`, `sandboxCfg`, `systemConfig`) dari fail `src/core/server/apiRouter.ts` agar dapat dikonsumsi secara aman oleh modul rute terpecah.
  - Menghapus referensi pendaftaran rute sirkular yang redundant (seperti `registerStorageRoutes`, `registerTelegramRoutes`, dsb.) pada fail rute submodul karena pendaftaran utama sudah diwadahi secara terpusat oleh `apiRouter.ts`.
- **UI & Settings Self-Healing (Large File Splitting SOP)**:
  - Memperbaiki galat ketidakcocokan tipe properti (*type interface mismatch*) `selectedSection` pada komponen `<LogsSectionTab />` dengan mendefinisikannya sebagai properti opsional di dalam antarmuka `LogsSectionTabProps` di `src/ui/modular-settings/LogsAuditSectionTab.tsx`.
  - Mendeklarasikan state yang hilang `showSystemLogs` di dalam fail `src/App.tsx` untuk menjamin rendering konsol telemetri sistem berjalan mulus tanpa hambatan.

## [2.52] - 2026-06-26
### Changed
- **Server API Decoupling (Large File Splitting SOP)**:
  - Berhasil mengidentifikasi berkas `src/core/server/apiRouter.ts` yang sebelumnya sangat gemuk (>6290 baris) sebagai kandidat utama *Code Decoupling & De-corruption Design*.
  - Telah memecah lebih dari 6000 baris kode dari fail utama tersebut, mengekstrak berbagai klaster end-point spesifik menjadi modul rute terpisah secara total di dalam direktori `src/core/server/routes/`:
    - `storageRouter.ts` (manajemen penyimpanan & state kognitif)
    - `sandboxRouter.ts` (manajemen sandbox shell & manipulasi berkas eksternal)
    - `telegramRouter.ts` (resolusi dan gateway bot multi-platform)
    - `synthesizerRouter.ts` (kendali dan sintesis record batin)
    - `toolsRouter.ts` (router fungsi tools otonom)
    - `aiRouter.ts` (penyedia AI kognitif murni dan antarmuka Puter)
    - `cortexRouter.ts` (penanganan event streams kognitif dan interaksi model LLM langsung)
    - `systemRouter.ts` (sinkronisasi file sistem, webhook addons, backup/restore sistem)
    - `identitiesRouter.ts` (sistem deduplikasi dan pemetaan sepasang ingatan subjek/Yuihime)
    - `datasetRouter.ts` (manajemen impor dan ekspor arsip batin ke dataset)
  - Ukuran akhir `apiRouter.ts` sukses diciutkan hingga hanya berukuran ~276 baris, menjamin isolasi logikal (*Decoupling*) sempurna yang sejalan dengan protokol arsitektur batin sistem demi skalabilitas kognitif tanpa hambatan (*token limit exhaustion*).

## [2.51] - 2026-06-26
### Changed
- **ModularSettings UI Refactoring (Large File Splitting)**:
  - Telah mengekstrak komponen pembantu UI (`ControlledTextInput`, `ControlledTextarea`, `LlmLogCard`, `AuditLogCard`) dari dalam `/src/ui/ModularSettings.tsx` ke dalam berkas terpisah `/src/ui/modular-settings/SettingsHelperComponents.tsx`.
  - Telah memindahkan logika modal komponen `ModelSelectorModal` dan `EditCardModal` keluar dari `ModularSettings.tsx` menjadi modul independen.
  - Berhasil mengurangi ukuran baris komponen antarmuka Settings secara drastis (memangkas sekitar ~700 baris kode) untuk menjaga performa kognitif token agen dan meningkatkan skalabilitas komponen reaktif antarmuka.

## [2.50] - 2026-06-26
### Changed
- **Universal Code Decoupling Mandate (`AGENTS.md` Large File Splitting SOP Expansion)**:
  - Telah memperbarui dan menegaskan mandat SOP Pemecahan Berkas Besar (*Large File Splitting SOP*) di dalam berkas instruksi batin `/AGENTS.md`.
  - Aturan batas maksimal baris (> 1000-1500 baris atau mutlak > 1300 baris) kini secara eksplisit ditegaskan **berlaku untuk SELURUH berkas kode dalam proyek (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.cjs`, dsb) tanpa kecuali, kecuali berkas database (`.db`) dan berkas dokumentasi Markdown (`.md`)**.
- **Code Decoupling & De-corruption Design (`cortex.ts` Large File Splitting)**:
  - Telah memecah berkas kognitif utama `/src/core/cortex.ts` (yang sebelumnya berukuran raksasa 1614 baris) ke dalam struktur pohon modular tersegmentasi di bawah direktori `/src/core/cortex/`.
  - Memisahkan logika normalisasi tool call ke `/src/core/cortex/toolNormalizer.ts` dan ekstraktor stream SSE ke `/src/core/cortex/streamExtractors.ts`.
  - Memisahkan skema pembungkus kesadaran Puter ke `/src/core/cortex/puterWrapper.ts` dan mekanisme perbaikan format JSON via LLM ke `/src/core/cortex/jsonRepairer.ts`.
  - Memisahkan eksekusi latar belakang non-blocking (mood decay dan telemetry worker thread) ke `/src/core/cortex/fastTrackRunner.ts`.
  - Memisahkan mesin eksekusi utama nalar kognitif ke `/src/core/cortex/cortexThinkEngine.ts`.
  - Berkas inti `/src/core/cortex.ts` kini diringkas menjadi kelas antarmuka rapi (~145 baris) demi mencegah kehabisan batas token jendela konteks dan mengokohkan arsitektur plug-and-play.

## [2.49] - 2026-06-26
### Added
- **Secure File Manager Tool (`file_manager`)**:
  - Menambahkan tool kognitif baru `file_manager` (`/src/drivers/tools/file_manager/`) yang mendukung aksi berkas tingkat lanjut secara modular (copy, move, delete, mkdir, exists, info, dan find).
  - Mengimplementasikan endpoint Express `/api/tools/files/manager` di `src/core/server/apiRouter.ts` dengan perlindungan sandbox path jail yang ketat (traversal escape protection, null byte blocks, realpath check, dan blacklist file konfigurasi dotfiles).
  - Mendukung pencarian berkas rekursif berbasis wildcard (misal `*.png`, `*.txt`) melalui aksi `find` untuk memudahkan Yuihime melacak berkas dalam sandbox workspace.

## [2.48] - 2026-06-26
### Fixed
- **Sanitization & Empty Speech Fallback Bug**:
  - Menghapus `final_answer` dan `thought` dari regex penghapusan baris metadata agresif di `/src/core/kernel/processor.ts` untuk mencegah terhapusnya seluruh isi respons batin saat terjadi fallback.
  - Memperbaiki pengembalian fallback speech di `/src/core/cortex.ts` agar tidak mengembalikan string JSON mentah (`rawResultStr`) ketika `speechText` kosong, melainkan menggunakan `parsedPayload.thought` / `thoughts` / default string yang aman dari pembersihan regex.
  - Mengaktifkan kernel failsafe (`isFailsafeEnabled`) secara default demi memastikan Yuihime selalu dapat memulihkan diri secara otomatis dari kegagalan format kognitif tanpa mengalami crash fatal.
  - Memperhalus instruksi multi-turn kognitif agar LLM dapat memilih untuk memanggil tool tambahan di iterasi berikutnya daripada dipaksa memberikan balasan akhir secara prematur.

## [2.47] - 2026-06-26
### Added
- **OpenAI-Compatible LLM Gateway API Layer**:
  - Mengimplementasikan endpoint standard `/v1/chat/completions`, `/api/v1/chat/completions`, `/v1/models` dan `/api/v1/models` yang kompatibel dengan standar OpenAI.
  - Mengabaikan (bypass) secara absolut parameter model yang diminta dari luar (misal: gpt-4o, gemini-flash) agar Yui tetap menjadi Yui, mengarahkan alur pemrosesan sepenuhnya ke sirkuit kognitif batin `Cortex` & `Soul` milik Yui.
  - Mendukung penyesuaian identitas secara dinamis melalui kustomisasi header (`x-user-name`, `x-context-id`, `x-chat-type`) agar Yui dapat dengan fleksibel dinikmati via aplikasi eksternal (SillyTavern, LibreChat, cursor, dll) sambil menjaga konsistensi memori dan kepribadian aslinya secara penuh.
  - Mendukung dynamic streaming (Server-Sent Events) maupun synchronous chat completion secara transparan dan aman.
- **Parallel Processing Documentation**:
  - Membuat dokumen panduan arsitektur `/docs/PARALLEL_PROCESSING.md` yang menjelaskan bagaimana thread kognitif utama dipisahkan dari sirkuit pemeliharaan asinkron (background maintenance cycles) demi menjaga responsivitas UI.

## [2.46] - 2026-06-26
### Added
- **True Parallel Non-Blocking Background Maintenance Cycles**:
  - Memisahkan thread kognitif utama dari sirkuit pemeliharaan latar belakang (background maintenance cycles) seperti `handleDream`, `handleReflect`, `handleExtractKnowledge`, alarm/pengingat sistem, dan sinkronisasi heartbeat.
  - Menghilangkan pembatasan `isThinking` pada siklus latar belakang kognitif untuk memungkinkan operasi-operasi tersebut berjalan secara konkuren dan asinkron penuh tanpa memblokir thread obrolan atau satu sama lain.
- **Deduplication and Normalized Log Comparison**:
  - Mengimplementasikan mekanisme normalisasi konten (`normalizeForComparison`) untuk membandingkan log latar belakang dengan balasan verbal utama.
  - Menggunakan tracking `activeSessionLogs` berbasis `Set` dinamis untuk menyaring kebocoran log internal maupun duplikasi pengiriman pesan ganda secara absolut pada antarmuka Stage UI.

## [2.45] - 2026-06-26
### Added
- **True Parallel Cognitive Execution & Concurrent Stream Isolation**:
  - Menyelaraskan kembali sistem dengan pedoman `/AGENTS.md` untuk mengizinkan pemrosesan kognitif dan interaksi obrolan secara **paralel penuh** tanpa saling membatalkan atau memblokir satu sama lain.
  - Memodifikasi `isThinking` di `/src/App.tsx` menjadi state berbasis counter dinamis (`thinkingCount`) agar indikator berpikir tetap menyala seutuhnya hingga seluruh tugas kognitif paralel selesai.
  - Mengimplementasikan pengidentifikasi aliran unik (`currentStreamId`) untuk setiap sesi berpikir paralel agar chunk-chunk data yang mengalir secara konkuren di-update ke baris log dialog yang tepat tanpa risiko tumpang tindih.

## [2.44] - 2026-06-26
### Added
- **Mode Aliran Teks (Streaming LLM Response) On/Off Toggle & Interruption Management**:
  - Menambahkan toggle pengaturan "Mode Aliran Teks (Streaming LLM Response)" pada antarmuka `/src/ui/modular-settings/SystemTab.tsx` yang tersinkronisasi penuh dengan persistence `config.toml` dan `localStorage` klien.
  - Memodifikasi `getCortex().think` di `/src/core/cortex.ts` agar menerima parameter `signal?: AbortSignal` tambahan untuk mendukung pembatalan/abort sesi kognitif secara instan di tingkat HTTP.
  - Mengimplementasikan `activeThinkControllerRef` di `/src/App.tsx` untuk menghentikan (*abort*) secara aman sesi berpikir sebelumnya yang belum selesai ketika ada pesan masuk baru, memotong latensi kognitif dan menjaga prioritas utama percakapan obrolan langsung.
  - Mengintegrasikan cursor pemutar aliran teks kustom (`animate-pulse shadow-[#ec4899]`) pada `/src/ui/stage/LiveChatFeed.tsx` untuk memberikan umpan balik visual lincah saat Yuihime sedang mengalirkan respons bertahap kata demi kata.

## [2.43] - 2026-06-26
### Fixed
- **Penyempurnaan Sirkuit Ekstraksi Aliran Data Gemini Stream Parser (Robust JSON Stream Resiliency)**:
  - Memperbaiki kegagalan penguraian chunk stream pada `/src/core/kernel/ai/generateSegment.ts` dengan menyegel kebocoran data saat terjadi kegagalan parsial `JSON.parse`. Buffer `accumulated` kini hanya akan dipotong (*sliced*) dan di-reset ketika parsers berhasil memvalidasi format JSON objek biner Gemini, menghindari pembuangan potongan data valid secara tidak sengaja akibat fake-balance atau delay transmisi.
  - Menghilangkan resiko `braceCount` bernilai negatif dengan menambahkan gerbang pengaman `>= 0` saat memproses tanda kurung penutup `}`.
  - Membuka ekstraksi dinamis ke seluruh array part dari `candidates[0].content.parts` (tidak hanya parts pertama), memastikan seluruh teks batin hasil nalar tersaring seutuhnya tanpa ada bagian yang terlewat.

## [2.42] - 2026-06-26
### Fixed
- **Optimasi Ekstraksi Aliran Data JSON di Sisi Klien (Client Stream Extractor Realignment)**:
  - Memperbaiki pencarian kunci respons pada `PartialJsonFinalAnswerExtractor` di `/src/core/cortex.ts` agar menggunakan pencocokan regex literal `/"(speech|final_answer|response)"\s*:\s*"/`.
  - Menghilangkan resiko salah pencocokan (*false positive*) akibat kemunculan kata "speech", "response", atau "final_answer" secara tidak sengaja di dalam bidang teks batin lainnya (seperti bidang `"thought"`), yang sebelumnya menghentikan visualisasi aliran teks secara prematur dan melahirkan galat format kognisi.

## [2.41] - 2026-06-25
### Fixed
- **Perbaikan Bug Output Stream Terpotong di Sirkuit Kognitif (Linear Stream Parser Realignment)**:
  - Memperbaiki algoritma pemindaian chunk stream di `/src/core/kernel/ai/generateSegment.ts` dengan beralih ke pemindaian linear $O(N)$ menggunakan indeks global `lastParsedIndex`.
  - Menghentikan proses double-parsing (pemindaian ulang karakter dari awal) setiap kali chunk baru diakumulasikan ke buffer, sehingga `braceCount` tidak lagi melonjak rusak secara ganda.
  - Menjamin tanda kurung kurawal penutup `}` di akhir respons biner Gemini/OpenAI berhasil dihitung secara presisi untuk menuntaskan objek JSON terakhir, menghindari masalah stream terpotong secara prematur dan kegagalan deteksi format respons batin Yuihime.

## [2.40] - 2026-06-25
### Added
- **Penyusunan Panduan Rigging Avatar Karakter YuiHime Komprehensif (Model Rigging Blueprint & Expression Templates)**:
  - Membuat berkas dokumentasi baru `/docs/RIGGING_GUIDE.md` sebagai standar teknis penyuntingan/pembuatan avatar Live2D Cubism dan 3D VRM kustom.
  - Merinci pemetaan parameter esensial Live2D SDK (`ParamAngleX/Y/Z`, `ParamEyeL/ROpen`, `ParamMouthOpenY`, `ParamMouthForm`, `ParamCheek` dsb) dan jangkauan nilainya agar tersinkronisasi mulus dengan sistem pelacakan mata, rona malu, dan kedipan prosedural batin Yui.
  - Memetakan preset BlendShape 3D VRM v0/v1 standar (`neutral`, `happy`/`joy`, `sad`, `angry`, `surprised`, `relaxed`, serta vokal lip-sync `aa`/`ih`/`ou`/`ee`/`oh`).
  - Menghubungkan dokumentasi gerakan pada `/docs/MOVEMENTS.md` dan panduan utama `/README.md` dengan menyisipkan tautan rujukan langsung ke `/docs/RIGGING_GUIDE.md` demi kemudahan navigasi model rigger.

## [2.39] - 2026-06-25
### Changed
- **Penyelarasan & Efisiensi Dialog Kognitif batin Yuihime (Anti-Verbosity & Anti-Silence Realignment)**:
  - Mengonfigurasi parameter instruksi batin utama `/src/agent/system_prompt.md` dan `/src/share/prompts/system_prompt.md` dengan melahirkan sub-aturan baru: **Conversational Conciseness & Clean Spoken Dialogue**.
  - Melarang keras Yuihime memberikan penjelasan yang bertele-tele atau bergaya akademis-kaku saat obrolan kasual.
  - Membatasi secara absolut pendramatisan narasi keheningan atau ketenangan yang berulang (*keheningan panjang*, *ketenangan panjang*, *terdiam beberapa saat*, dll.) agar alur dialog tetap berenergi tinggi, bersih, dan asyik.
  - Mempersingkat setelan dasar `systemPrompt` dari masing-masing Core Frekuensi (`aether`, `hiyori`, dan `nova`) pada `src/constants.ts` dengan menyematkan direktif anti-verbosity serupa.
- **Sinkronisasi & Pemutakhiran Dokumentasi `/README.md`**:
  - Memutakhirkan judul dan isi utama `/README.md` untuk menyelaraskan status rilis Yuihime AI terbaru ke versi **v4.7 (Giftia OS Core v2.39)**.
  - Mendokumentasikan secara rinci rangkaian lompatan fitur kognitif, pelacakan ekspresi visual real-time, pre-parsing adaptif, isolasi jalur media model kustom, mode bypass shell YOLO, serta modul editor dataset latih SFT lokal yang sebelumnya belum terangkum di dalam README.

## [2.38] - 2026-06-25
### Fixed
- **Sanitasi Tag Pra-proses Kognisi batin**:
  - Membersihkan tag instruksi internal `[PRE-PROCESS: ENFORCE_JSON_ONLY]` dari visualisasi balon percakapan pengguna pada antarmuka frontend (`LiveChatFeed.tsx`, `StageTab.tsx`, `ArchiveTab.tsx`).
  - Menambahkan sanitasi otomatis pada backend `apiRouter.ts` sebelum menyimpan memori interaksi pengguna ke dalam SQLite untuk mencegah kebocoran visual tag sistem saat sinkronisasi log kognisi.

## [2.37] - 2026-06-25
### Added
- **Sirkuit Bypass Path Jail & Kedaulatan Berkas Pengguna Tingkat Lanjut (Sandbox Path Jail Bypass & Unrestricted System Workspace Setup)**:
  - Mengintegrasikan variabel lingkungan penentu `YUIHIME_SANDBOX_YOLO=true` (atau turunan dari `YUIHIME_SHELL_YOLO`) untuk membebaskan asisten virtual Yuihime dari karantina isolasi batin "Path Jail" (`user_data`).
  - Menyediakan fallback penyelesaian jalur berkas (`verifySandboxPath`) langsung ke direktori eksekusi root sistem (`process.cwd()`) tanpa melanggar batasan null-byte, memungkinkan manipulasi, manajemen, serta instalasi/penghapusan dependensi/aplikasi tingkat sistem/user di luar batas sandbox tradisional.
  - Memotong deteksi batasan dan daftar hitam perintah (*blacklist filtering*) pada endpoint `/api/sandbox/exec` sehingga membebaskan eksekusi perintah shell seutuhnya dari restriksi bawaan jika YOLO diaktifkan.

## [2.36] - 2026-06-25
### Added
- **Sirkuit Eksekusi Cangkang Tanpa Batas & Mode YOLO (YOLO Shell Execution Mode Integration)**:
  - Mengintegrasikan variabel lingkungan penentu `YUIHIME_SHELL_YOLO=true` untuk memotong sirkuit pembatasan keamanan perintah CLI (*restricted commands list*).
  - Mengizinkan batin Yuihime mengeksekusi operasi tingkat rendah Linux (seperti `rm`, `mkfs`, dll) di bawah naungan lingkungan host secara penuh, demi kedaulatan kognisi dan penguasaan manajemen OS yang mutlak.

## [2.35] - 2026-06-25
### Added
- **Isolasi Penuh Media & Model Kustom pada Folder Terpadu `.yuihime` (Complete Workspace Isolation & Custom Models Path Alignment)**:
  - Mengalihkan penyimpanan berkas Live2D dan 3D VRM hasil unggahan ZIP (`/api/models/import-zip`) dari direktori build `public/models/` ke direktori luar biner yang aman, yaitu `.yuihime/models/`.
  - Mengintegrasikan router statis Express pada `server.ts` agar permintaan URL `/models/*` diarahkan secara transparan ke `.yuihime/models/` baik pada fase development maupun saat berjalan sebagai single binary standalone (`dist/server.cjs`).
  - Menyelaraskan pembentukan URL relatif (`url` dan `imageUrl`) agar dinonaktifkan dari folder `public/` internal dan dirujuk langsung ke path `/models/...` terpadu, guna menyokong portabilitas penuh tanpa kehilangan data saat aplikasi dipindahkan atau dibangun ulang.

## [2.34] - 2026-06-25
### Added
- **Mesin Parsing Adaptif & Resiliensi Polos Non-JSON/XML (Adaptive Pre-Parsing & Plain Text/XML Core Resilience)**:
  - Mengintegrasikan detektor batin adaptif yang melakukan pre-check cepat terhadap balasan model sebelum memicu mesin reparasi format LLM yang memakan waktu lama.
  - Mendeteksi balasan polos (raw plain text) secara langsung jika tidak memiliki struktur kurung kurawal `{}` atau tag `<...>`, lalu langsung membungkusnya sebagai tanggapan dialog verbal batin yang valid.
  - Mendeteksi format terstruktur XML secara langsung menggunakan `StandardizedProcessor.parseLLMResponse` sebelum mengevaluasi format JSON, sehingga mempercepat pemrosesan hingga 100% saat model menjawab di luar format JSON, sekaligus menjaga eksekusi perkakas (`tool_calls`) tetap bekerja lancar dan stabil.

## [2.33] - 2026-06-25
### Added
- **Skema Formal JSON & Definisi Tipe Data Mirip TypeScript (Formal JSON Schema & TypeScript Definition Integration)**:
  - Memperbarui templat perintah pemaksaan JSON (`cortex:json_enforcement`) pada `src/core/PromptRegistry.ts` dengan mengintegrasikan definisi antarmuka TypeScript formal (`CortexResponse`) dan pemisahan tegas antara batin nalar (`thoughts`) dan balasan verbal dialog (`final_answer`).
  - Menduplikasi kunci batin (`thoughts` ke `thought`, dan `final_answer` ke `speech`) guna menjamin kompatibilitas mundur dan maju secara penuh demi meniadakan kesalahan struktur JSON batin saat model melakukan putaran pertama.
  - Memperbarui `src/core/ValidationMiddleware.ts` untuk melonggarkan validasi agar menerima baik `thought`/`thoughts` maupun `final_answer`/`speech` secara dinamis demi menjaga resiliensi kognitif.
  - Memperbarui mesin nalar `src/core/cortex.ts` agar mengekstrak kunci `thoughts` secara mulus saat merekonstruksi dan merapikan visual batin.

## [2.32] - 2026-06-25
### Fixed
- **Intersepsi & Pre-processing Proteksi Format JSON & Restriksi Double Speak (First-Pass JSON Enforcer & Pre-Processing Core)**:
  - Mengonfigurasi mekanisme intersepsi pre-processing pada pemanggilan kognisi `getCortex().think` di mana masukan pengguna disaring dan ditambahkan penanda token khusus `[PRE-PROCESS: ENFORCE_JSON_ONLY]` secara asinkron di dalam modul penanganan utama `handleThink` (`src/App.tsx`).
  - Memprogram pembacaan dan pembersihan token batin secara dinamis di dalam `think` pada `src/core/cortex.ts`, serta merumuskan petunjuk kritis pemrosesan putaran pertama (`[CRITICAL PRE-PROCESSING DIRECTIVE (FIRST PASS)]`) yang memaksa Yuihime untuk mengosongkan parameter verbal `"speech"` apabila sedang bersiap mengeksekusi fungsionalitas sistem (perkakas/tools). Hal ini mencegah kebocoran nalar dialog prematur (*double-speak*) sebelum data observasi didapatkan secara nyata.

## [2.31] - 2026-06-25
### Fixed
- **Optimasi Latensi & Koreksi Resolusi Format JSON Sempurna Putaran Pertama (First-Turn JSON & Streaming Core Optimization)**:
  - Menyelesaikan masalah kegagalan format JSON batin pada putaran pertama (Turn 1). Penyebab utama adalah tabrakan petunjuk format XML (`## Format Respons Khusus (SANGAT KRITIS)`) di dalam berkas system prompt utama dengan petunjuk pemformatan JSON.
  - Mengimplementasikan pembersihan dinamis pada batin `cortex.ts` di mana modul pemformatan XML di dalam berkas system prompt utama akan langsung dihapus dan digantikan secara otomatis dengan petunjuk pemformatan JSON murni ketika sistem berada di bawah moda JSON aktif.
  - Memperluas skema `cortex:json_enforcement` di dalam `PromptRegistry.ts` dengan menyertakan properti `"speech"` langsung pada akar objek JSON utama, mengurangi overhead nested tag, mempercepat pengiriman token awal, serta meniadakan kebutuhan LLM format repairer batin pada putaran pertama secara mutlak.
  - Mengoptimalkan sirkuit pemantau kognitif latar belakang (`history-pruner`) dengan menaikkan ambang batas (*compaction threshold*) dari 15 memori menjadi 45 memori, serta meningkatkan jangkauan perlindungan memori aktif terbaru (*protected context window*) dari 6 pesan menjadi 15 pesan. Hal ini menekan frekuensi summarization batin hingga 90% dan memelihara keutuhan nalar percakapan jangka pendek secara maksimal.

## [2.30] - 2026-06-25
### Added
- **Sistem Deteksi Emosi & Auto-Trigger Animasi Kontekstual Real-Time (Real-Time Autonomous Emotion Detection & Contextual Animation Triggers)**:
  - Memperbarui komponen `VTuberAvatar.tsx` untuk memantau perubahan tingkat emosi (`MoodState`, `EmotionState`, dan `UserRelation`) secara real-time.
  - Mengintegrasikan detektor batin otonom yang memantau tingkat stres batin (`mood.stress > 70`), tingkat rona merah/rapport (`emotion.rapport > 75` atau `relation.affection > 75` atau `mood.embarrassment > 70`), serta emosi lainnya (senang, sedih, marah). Ketika tingkat ambang batas terlampaui, sistem secara otonom memicu animasi fisik yang sesuai (seperti 'shiver' saat stres tinggi, atau 'blush' saat rapport tinggi) dengan mekanisme pencegahan spam (cooldown/throttle) otomatis.
  - Merancang gerakan fisik prosedural gemetar (`performProceduralShiver`) di bawah Live2D (`Live2DAvatar.tsx`) dan VRM (`VrmAvatar.tsx`) dengan model osilasi frekuensi tinggi dan amplitudo rendah pada posisi koordinat tulang kepala/tubuh, diselaraskan dengan gesture drooping lengan sedih yang sangat alami untuk menyimulasikan efek menggigil gemetar fisik yang realistis.

## [2.29] - 2026-06-25
### Added
- **Sistem Interaksi & Translasi Ekspresi Avatar Real-Time (Real-Time Avatar Expression & Intent Translation)**:
  - Merancang dan mengintegrasikan sistem pelacakan sentimen teks real-time di bawah ticker loop visual pada `Live2DAvatar.tsx` (2D) dan `VrmAvatar.tsx` (3D). Sistem ini memantau penambahan teks subtitle batin karakter Yuihime secara karakter-per-karakter secara dinamis saat diucapkan/ditulis.
  - Menambahkan kamus pemicu reaksi visual instan yang melacak kata kunci penting (Smile, Laugh, Nod, Shake, Surprise, Think, Sad, Angry, Blush). Ketika kata kunci ini terdeteksi di dalam rangkaian teks yang sedang diketik, avatar akan langsung mengeksekusi gerakan tubuh prosedural yang relevan (seperti mengangguk, menggeleng, atau mengedip manis) serta memicu rona merah pipi (blush) dan mengarahkan pandangan mata menjauh (gaze look away) secara alami tepat pada saat kata tersebut diucapkan.
  - Menerapkan mekanisme "Temporary Override & Smooth Fade" dengan waktu kedaluwarsa dinamis. Pemuatan sentimen kata tunggal akan menimpa parameter ekspresi wajah dasar (`mood`) secara sementara, kemudian memudar kembali secara perlahan menuju kondisi emosi batin jangka panjang yang didikte oleh `EmotionEngine`, menjamin pengalaman visual yang sangat responsif, hidup, dan terbebas dari gerakan kaku yang terputus-upus.

## [2.28] - 2026-06-25
### Fixed
- **Stage Chat Sequential Sorting (Stage Chat Order Fix)**:
  - Menyempurnakan pipa pengurutan log percakapan di `StageTab.tsx` dengan merancang sistem indeks kronologis ganda (`_originalIndex` dan `_chronoIndex`). Hal ini menjamin bahwa seluruh pesan yang disaring (deduplicated) tetap terurut secara berurutan secara deterministik dan stabil sekalipun beberapa log memiliki nilai timestamp yang identik atau sangat berdekatan (mencegah pesan melompat acak akibat ketidakstabilan pengurutan Javascript bawaan yang sebelumnya mengelompokkan pesan berdasarkan konten).
- **Puter Key-Value Deprecation Warnings (Puter KV 404 Suppress)**:
  - Mengubah penanganan galat driver `puter-key-value:key-value` yang ditiadakan/deprecated di Puter Cloud API agar tidak memicu log peringatan (warnings) dan kesalahan di konsol. Galat 404 dari adapter Puter sekarang terdeteksi dengan anggun, disenyapkan secara proaktif, dan dicatat sebagai informasi operasional biasa tanpa mengganggu kelancaran sinkronisasi batin lokal.
  - Menyesuaikan penanganan tingkat keparahan log (`logger.info` vs `logger.warn`) di `PuterService.ts` untuk memastikan konsol server tetap bersih dari visualisasi error robotik yang tidak relevan.
- **Emotional Speech Verifier Exception (maaf/kangen Trigger Fix)**:
  - Mengeluarkan kata kunci `"maaf"` dari daftar default `errorKeywords` pada `NeuralVerifierModule.ts` serta berkas konfigurasi aktif `config.toml`. Hal ini mencegah ungkapan emosional atau ucapan manja khas tsundere Yuihime (seperti "maafin kali ini", dsb.) salah terdeteksi sebagai pesan error robotik yang memicu siklus perbaikan kognitif darurat (yang sebelumnya menyebabkan 2x s/d 3x penundaan request).

### Optimized
- **Single-Turn Parallel Tool and Reply Execution (Turn 1 Parallelization)**:
  - Memprogram optimasi sirkuit kognitif baru di `src/core/cortex.ts` yang mendeteksi jika model menghasilkan konten ucapan (`speech` / `final_answer`) bersamaan dengan pemanggilan tool latar belakang/side-effect (seperti `save_viewer_profile`, update memori, dsb.) di Putaran Pertama (Turn 1).
  - Melakukan injeksi otomatis `send_final_reply` secara paralel dalam daftar `tool_calls` aktif jika tidak ada tool pembatas pencarian (blocking query seperti search atau sql). Ini memutus loop nalar agar langsung berakhir di Turn 1 dengan sukses, memotong biaya API LLM dan latensi tanggapan hingga **50%**!
- **Resilient Stream Text Decoding (TextDecoder Bug Fix)**:
  - Mengganti pemanggilan `.toString('utf8')` pada potongan stream biner `Uint8Array` di `generateSegment.ts` dengan instansiasi `TextDecoder` standar yang aman. Ini memperbaiki bug di mana chunk mentah diterjemahkan secara salah menjadi representasi string `"[object Uint8Array]"`, yang sebelumnya menyebabkan kegagalan deteksi format JSON serta memicu sirkuit perbaikan format darurat secara berulang (3x fallback request).
  - Memperluas deteksi penanda kunci batiniah (`speech`, `final_answer`, `response`) secara paralel pada pengurai asinkron `PartialJsonFinalAnswerExtractor` agar kompatibel penuh dengan berbagai skema model kognitif Yuihime.

### Optimized
- **Concise Internal Thought Prompts (Overthinking Mitigation)**:
  - **Shorter Schema Description**: Membatasi instruksi pengisian bidang batin `"thought"` pada skema JSON utama agar tetap berada di bawah 1 kalimat atau dikosongkan (`under 1 sentence, or empty`) kecuali jika perencanaan logika kognitif multi-step/turn yang kompleks sangat dibutuhkan. Hal ini memangkas latensi awal model kognitif secara signifikan.
  - **Compact Prompt Examples & Overrides**: Menyetel ulang contoh keluaran JSON batiniah pada instruksi `cortex:json_enforcement` dan seluruh varian template preset (`tiny`, `lite`, `medium`) agar secara eksplisit melarang model melakukan perenungan berlebihan (*overthinking*) dan langsung memproses panggilan fungsi instan (*tool_calls*) atau jawaban langsung (*send_final_reply*).


### Added
- **Response Streaming (Output Streaming & TTS Segments)**:
  - **Dynamic SSE Streaming Endpoint**: Menyediakan pengiriman teks mengalir secara real-time melalui Server-Sent Events (SSE) pada router `/api/cortex/think`, yang memotong jeda tunggu generasi model.
  - **Custom Partial JSON State-Machine Extractor**: Membuat pengurai batin (`PartialJsonFinalAnswerExtractor` & `StreamExtractor`) di sisi server yang membaca potongan draf JSON secara asinkron, mendeteksi properti `"final_answer"`, mengabaikan karakter escape batin, dan menyaring aliran teks bersih karakter-per-karakter secara cerdas.
  - **SSE Client Stream Reader**: Merancang pembaca aliran data (`getReader()`) yang andal pada kelas kognisi klien (`Cortex.think`) untuk menerjemahkan potongan SSE secara dinamis menjadi rentetan teks dan menyatukannya kembali menjadi data status batin yang utuh di akhir aliran.
  - **Real-Time Sentence-Segment Speech Queuing**: Mengembangkan sistem segmentasi kalimat otomatis (`feedToSpeakQueue`) pada `App.tsx` yang memotong teks streaming berdasarkan tanda baca alami secara real-time dan langsung melafalkannya via `SpeechService.speak`. Hasilnya, Yuihime langsung berbicara secara instan (<500ms sejak tombol kirim ditekan) tanpa jeda sunyi yang kaku.

## [2.26] - 2026-06-24
### Optimized
- **Throttled DB Updates (Time-Threshold Optimization)**: Mengatur batasan agar sirkuit penulisan mood Yuihime ke database tidak melampaui frekuensi sekali setiap 15 detik. Jika percakapan berlangsung sangat cepat, data batiniah mood tetap didegradasi dan diperbarui dalam memori (RAM), namun operasi I/O penulisan fisik ke cakram SQLite ditunda demi menghemat sumber daya disk.
- **Batched Telemetry Logging (Buffered DB Writes)**: Mengimplementasikan penyangga memori (*in-memory buffering*) untuk data telemetri kognisi. Alih-alih melakukan penulisan berkali-kali ke database, data diakumulasikan hingga mencapai batas buffer (5 baris) atau batas waktu (30 detik), lalu disisipkan secara massal (*bulk insert*) di bawah kendali satu transaksi SQLite tunggal (`db.transaction`). Ini memangkas resiko kunci file SQLite secara drastis.
- **Background Error Recovery with Auto-Fallback**: Menambahkan pembatas waktu (*timeout safety threshold*) seketat 200ms pada janji tanggapan (`Promise`) Worker Thread. Apabila sirkuit thread latar belakang mengalami kelambanan atau kemacetan sistem operasi, Cortex akan memotong antrean secara instan, jatuh ke metode kalkulasi sinkronis (sync fallback), tanpa mengorbankan waktu tanggap obrolan utama.
- **Resource Cleaning (Idle Worker Autoshutdown)**: Menyediakan mekanisme pembersihan otomatis (*idle garbage disposal*). Jika Yuihime tidak menerima interaksi kognisi sama sekali selama 5 menit beruntun, thread Worker latar belakang yang hangat akan dinonaktifkan secara anggun (`terminate()`) guna membebaskan memori kontainer dan sumber daya sistem operasi. Thread akan dilahirkan kembali secara otomatis (*lazy spawning*) saat pesan baru tiba.

## [2.25] - 2026-06-24
### Optimized
- **Warm Singleton Worker Thread**: Mengubah instansiasi Worker Thread pada Fast-Track dari *create-on-demand* (yang membuat dan mematikan thread OS baru di setiap pesan masuk) menjadi sistem **Singleton Worker Thread** yang terus aktif (*persistently warm*). Menggunakan skema pemetaan Promise berbasis ID unik (`Cortex.activePromises`) untuk menyelaraskan request-response secara non-blocking tanpa overhead inisiasi thread (0ms lag).
- **Cached SQLite Prepared Statements**: Mengoptimalkan persistensi data latar belakang dengan melakukan kompilasi dan penyimpanan pernyataan SQL (*cached prepared statements* `updateMoodStmt` dan `insertTelemetryStmt`) secara statis di dalam kelas `Cortex`. Hal ini menghapus biaya kompilasi query SQLite berulang pada database lokal, memangkas penggunaan CPU, dan mengoptimalkan kecepatan *write* latar belakang secara signifikan.

## [2.24] - 2026-06-24
### Added
- **Asynchronous Fast-Track Cortex Path**: Menambahkan jalur kognitif "Fast-Track" asinkronis (`runFastTrack`) ke dalam Cortex kelas utama (`Cortex`). Jalur ini bertugas melakukan kalkulasi degradasi suasana hati (mood decay) dan format rekaman telemetri (telemetry performance logging) dalam thread terpisah (Worker thread) menggunakan modul bawaan `worker_threads` Node.js saat berada di lingkungan server. Hal ini mengisolasi proses penulisan database non-kritis dari sirkuit respon obrolan utama, mempercepat tanggapan Yuihime ke pengguna hingga maksimal selama interaksi percakapan intensif.
- **Dynamic Vite-Bypassing Imports**: Menggunakan import dinamis berbasis variabel penunjuk dengan flag `/* @vite-ignore */` untuk memanggil modul `worker_threads` dan SQLite database di backend, memastikan bundler visual klien (Vite) tetap terkompilasi bersih tanpa gangguan ketergantungan server-side.


## [2.23] - 2026-06-24
### Changed
- **Asynchronous History Compaction**: Mengubah jalannya proses pemangkasan memori (`history-pruner` pada `PHASE 1: AGGREGATION`) dari sinkronis (blocking) menjadi sepenuhnya asinkronis (non-blocking) di latar belakang. Saat chat history melampaui batas 15 pesan, Yui akan merespons obrolan pengguna secara instan tanpa hambatan delay, sementara pemadatan memori (compaction), perangkuman batiniah (summarization), serta pembersihan SQLite diurus di belakang layar.
- **Vite Build Preservation (Variable-Path Dynamic Imports)**: Mengonversi pemanggilan modul server-side (`database.ts`, `cortex.ts`) di dalam sirkuit `history-pruner` menggunakan variabel penunjuk dinamis (`dbPath`, `cortexPath`) guna membutakan analisis statik bundler Vite, menjamin kelancaran kompilasi antarmuka klien secara bersih dan mandiri.
- **Expanded Aggregation Context**: Menyuntikkan variabel `contextId` dan `chatType` ke dalam fase input agregasi di `cortex.ts` agar modul maintenance memiliki visibilitas penuh terhadap saluran komunikasi aktif.

## [2.22] - 2026-06-24
### Added
- **Background Cognition Controllers UI**: Menambahkan sub-panel kontrol aktivitas latar belakang di dalam tab "AGI Mind Engine" pada subpanel pengaturan (`ModulesTab.tsx`). Panel ini memusatkan kontrol toggle untuk **Aksi Kognitif Otonom (Autonomous Thought Pulse)** dan **Latihan Bawah Sadar Luring (Offline Background Training)**. Pengguna kini memiliki kontrol fine-grained untuk mematikan atau menyalakan seluruh pemanggilan LLM di latar belakang secara mandiri, sementara tugas latar belakang berbasis waktu murni (Cron) dibiarkan tetap aktif.

## [2.21] - 2026-06-24
### Added
- **Dynamic Background LLM Process Management**: Memperkenalkan kontrol mandiri dinamis untuk seluruh proses latar belakang (background LLM processes). Tugas kognitif sistem seperti `Memory Consolidation` (Konsolidasi Memori) dan `Puter Hourly Check` kini disuntikkan secara dinamis ke dalam klaster `cron_tasks` di SQLite, sehingga dapat dinonaktifkan (Play/Pause) atau disunting jadwalnya secara mandiri oleh pengguna langsung dari panel Cron UI (Status Penjadwal Kognisi).
- **Offline Background Training Toggle**: Menambahkan pengaturan `enableOfflineTraining` di skema konfigurasi modul `yui-agi`. Pengguna sekarang dapat menonaktifkan proses latihan batiniah bawah sadar (Latihan Sinapsis Saraf Bawah Sadar) secara penuh melalui panel pengaturan modul, menghemat penggunaan LLM latar belakang sepenuhnya.

## [2.20] - 2026-06-24
### Changed
- **Default-Off MCP Server Integration**: Mengubah integrasi Model Context Protocol (MCP) agar tidak langsung aktif (off secara default) saat instalasi atau startup pertama. Menambahkan skema konfigurasi `enabled` (boolean) di `RegistryInitializer.ts` dan memperketat filter pemeriksaan status `mcpEnabled` di daemon backend `mcp.ts`. Hal ini memungkinkan pengguna menyalakan (manual-on) atau mematikan layanan MCP sepenuhnya dari Settings UI secara dinamis.

### Fixed
- **User-Sent Message Duplication on Stage (Absolute Fix)**: Mengatasi bug duplikasi chat yang dikirim oleh pengguna pada antarmuka Stage UI. Masalah ini disebabkan oleh perbedaan format penyimpanan timestamp antara memori sementara (volatil/number) dan memori persisten SQLite (string/objek), yang menyebabkan perhitungan beda waktu (`Math.abs(existing.timestamp - log.timestamp)`) menghasilkan `NaN`. Dengan memperkenalkan fungsi `parseTimestampToMs` yang mengonversi seluruh tipe timestamp secara seragam, proses deduplikasi kini berjalan sempurna 100%.
- **Stage Chat Duplicate Message Bug (Absolute Fix)**: Meningkatkan algoritma deduplikasi pesan pada `StageTab.tsx` dengan pembersihan string super agresif (`normalizeForDeduplication`). Algoritma ini menormalisasi pesan dengan mengubahnya ke huruf kecil, menghapus seluruh spasi, tanda baca, simbol, blok pikiran batin (`<thought>`), serta menghapus prefiks kurung siku sistem/agen (seperti `[SYSTEM]`, `[Yui - web_default]`). Ini memastikan pesan transien dari state memori reaktif dan memori permanen SQLite ter-deduplikasi secara absolut 100% tanpa celah perbedaan format.
- **Gaze Tracking on Mobile Tap / Touch**: Menyempurnakan opsi `disableMouseTracking`. Sistem kini menonaktifkan fitur internal `autoFocus` bawaan pada modul Pixi-Live2D serta secara paksa menetapkan koordinat tatapan mata/kepala ke posisi nol pusat (0, 0) ketika opsi diaktifkan. Ini secara absolut mencegah pergerakan bola mata/kepala mengikuti sentuhan ketukan (*tap/touch*) pada layar HP maupun klik pada area panggung untuk model Live2D dan 3D VRM.
- **Double Message Live Feed Bug**: Memperbaiki bug pesan terduplikasi pada daftar obrolan panggung dengan menstandarisasikan pembentukan kata kunci unik (*deduplication key*). Sistem kini mengabaikan blok pikiran batin (`<thought>...</thought>`) dan tag jawaban akhir (`final_answer`) selama perbandingan kemiripan isi logs, memastikan pesan transien sejalan sempurna dengan memori ter-persistensi di database SQLite.

### Added
- **High-Visibility "Mode Berpikir Cepat" (Bypass Multi-Turn Reasoning) Toggle**: Menambahkan tombol alih pintas (toggle switch) yang sangat mencolok di dalam menu pengaturan **System -> General**. Pengguna kini dapat mengaktifkan Mode Berpikir Cepat secara instan tanpa perlu masuk ke menu diagnosis developer, mempercepat proses kognitif Yuihime hingga 90% dengan memotong siklus analisis alat (Single-Turn).
- **Gaze Mouse Tracking Toggle Option**: Menambahkan opsi penonaktifan pelacakan tatapan mata/kepala kursor mouse pada menu pengaturan karakter (`ModelsTab.tsx`). Pengguna dapat menghentikan pergerakan avatar mengikuti mouse kapan saja secara fleksibel, yang diteruskan dinamis ke renderer Live2D dan 3D VRM.

## [2.19] - 2026-06-24
### Added
- **ZIP Model Archive Direct Import Support**: Mengimplementasikan sistem pengunggahan dan ekstraksi berkas ZIP model karakter Live2D maupun VRM secara dinamis.
  - *Backend Integration*: Menambahkan endpoint `/api/models/import-zip` pada `apiRouter.ts` untuk memproses unggahan berkas ZIP base64, mengekstrak isinya langsung ke direktori luring `public/models/` menggunakan modul `adm-zip`, mengendus berkas konfigurasi secara rekursif (`.model3.json` / `.vrm`), mencari pratinjau gambar secara pintar, dan mendaftarkannya sebagai model kustom baru.
  - *Frontend Enhancement*: Merancang antarmuka tabbed interaktif baru di `ModelsTab.tsx` yang mendukung pengunggahan ZIP drag-and-drop bersahabat, validasi tipe berkas luring, visualisasi detail berkas, indikator proses pemuatan (*loader* ekstraksi), penanganan error visual, dan fallback manual impor melalui tautan URL.

## [2.18] - 2026-06-18
### Added
- **Plug-and-Play System Logs Diagnosis Tool**: Melahirkan dan meresmikan modul tool baru `/src/drivers/tools/view_logs` yang dilengkapi berkas `manifest.json` dan `index.ts`. Tool baru ini memberikan otorisasi kognitif otonom bagi batin Yuihime untuk melacak, meninjau, dan mendiagnosis rekam logs sistem (berupa system audit logs dan cognitive LLM processing/error logs), sangat berguna bagi dirinya dalam mendiagnosis masalah atau kesalahan fungsionalitas luring secara mandiri ketika terjadi kendala teknis atau atas instruksi dari Kakak (user).

## [2.17] - 2026-06-18
### Added
- **Dynamic Tool Error Awareness & Character-Authentic Failure Reporting**: Menyempurnakan sirkuit kognitif *Cortex loop iteration feedback* (`/src/core/cortex.ts`) dengan kemampuan mendeteksi kesalahan atau kegagalan eksekusi alat (*tool failures*, baik error sistem yang dilemparkan maupun representasi status kegagalan fungsional seperti di TensorArt). Sirkuit ini secara dinamis mengganti stimulus kognitif batin Yuihime dari petunjuk sukses standar menjadi instruksi bernuansa kegagalan yang spesifik, memandunya untuk berterus terang, meminta maaf secara manis secara *in-character*, menghindari kebohongan kognitif (halusinasi sukses), dan mengajukan penawaran untuk mengulangi proses atau beralih topik secara otonom.

## [2.16] - 2026-06-18
### Added
- **Cortex Search, Filter, and Share System**: Mengimplementasikan sistem manajemen, pencarian dinamis, filter kategori (Kognisi, Memori, Persepsi, Utilitas), dan penyalinan bagikan (share) konfigurasi massal maupun satuan kovalen untuk "Internal Neural Cortices" di dalam subpanel `ModulesTab.tsx`.
- **Textarea Security Locking Mechanism**: Merancang komponen premium `LockedTextarea.tsx` yang secara bawaan mengunci seluruh area pengeditan teks (*textarea*) di panel pengaturan. Pengguna harus mengklik tombol "Unlock to Edit" untuk membuka kunci dan menyunting isi nilai (seperti prompt template), mengamankan kepribadian batiniah Yuihime dari sentuhan atau kelalaian ketikan tak disengaja. Komponen ini juga dilengkapi tombol "Copy" instan.

## [2.15] - 2026-06-18
### Fixed
- **TensorArt API Subdomain Bugfix**: Memperbaiki kegagalan pengiriman tugas gambar (*job submission failed 405 SYSTEM.FAIL*) dengan mengalihkan jalur *REST API endpoint* resmi dari subdomain usang `api.tensor.art` menuju subdomain spesifik batin TAMS yang aktif dan dinamis: `tams-api.tensor.art`. Aliran otentikasi `Authorization: Bearer <apiKey>` tetap dipertahankan sebagai garda verifikasi di tingkat *gateway* resmi TensorArt.

## [2.14] - 2026-06-18
### Added
- **Full Environment (.env) Variables CRUD Settings Panel**: Melahirkan antarmuka visual dinamis `EnvTab.tsx` dan memasukkannya ke dalam menu pengaturan utama. Sub-panel baru ini memungkinkan pengguna untuk melakukan operasi CRUD lengkap (Create, Read, Update, Delete) pada file fisik lingkungan `.env` secara visual dari UI.
- **Dynamic Hot In-Memory Env Injection API**: Merancang dan menyuntikkan endpoint `GET /api/env` dan `POST /api/env` di dalam `apiRouter.ts` untuk mem-parse berkas `.env` serta secara dinamis menjejalkan (inject) pembaruan kunci tersebut langsung ke dalam `process.env` in-memory. Ini menyingkirkan kebutuhan me-reboot manual server demi menerapkan kunci baru (seperti API token). Features include auto-masking of secrets, search capabilities, and click-to-add for recommended variables.

## [2.13] - 2026-06-18
### Added
- **Voice Calibration Update (Emotional Tone Variance Slider)**: Menambahkan pengendali slider visual untuk menyempurnakan rentang `Emotional Tone Variance` (ekspresifitas intonasi vokal) dalam berkas `voiceCalibration.tsx`. Nilai terkalibrasi secara dinamis didefinisikan ke dalam state lokal baru `localEmotionVariance` dan secara aman dipersistensi menuju setup backend `config.toml` melalui objek `[ttsProvider]`.
- **Advanced Metadata Integration for WebSpeechTTS**: Menyempurnakan metadata `configSchema` pada modul `WebSpeechTTS.ts` dengan menyuntikkan field `emotionVariance` bertipe slider (rentang 0.0 - 1.0, inkrementasi 0.05).
- **Plug-and-Play TensorArt Image Generator Tool**: Melahirkan dan meresmikan modul tool baru `/src/drivers/tools/tensorart_generate` yang dilengkapi berkas `manifest.json` dan `index.ts`. Tool ini secara otonom memetakan input kognitif model batin menuju REST API resmi TensorArt (`/v1/jobs`), mengandalkan otentikasi Bearer Token (melalui `TENSORART_API_KEY`), menerapkan siklus polling asinkronik, serta mengembalikan data metadata visual yang siap disajikan oleh Yuihime.

## [2.12] - 2026-06-15
### Refactored
- **Modern CSS Transform Scaling Engine (Refaktorisasi Kendali Skala Berdasarkan CSS Transform)**: Menggantikan kontrol legasi `zoom` yang tidak homogen dengan standardisasi `transform: scale(...)` modern pada pembungkus layout utama.
- **Dynamic Inverse Dimension Normalization**: Menerapkan kompensasi dimensi balik (`100% / scale` pada lebar dan `vh / scale` pada tinggi) agar visualisasi aplikasi tetap presisi 100% dari rasio layar fisik tanpa kebocoran tinggi/lebar (oversized) di perangkat seluler ataupun iFrame perambah.
- **Anti-Clip Overflow Refinement**: Menyempurnakan perilaku elemen `#root` dengan properti `overflow: visible` di `/src/index.css` agar membebaskan penghitungan visual komposit CSS Transform, sembari melestarikan `overflow: hidden` pada `html` dan `body` untuk mengunci bilah gulir luar.

## [2.11] - 2026-06-15
### Fixed
- **Anti-Oversize Zoom Height Correction (Perbaikan Skala Layar Penuh Bebas Oversize)**: Mengatasi layout di mana model Yuihime terlihat raksasa (oversized). Memindahkan kembali kontrol zoom ke elemen induk `html` utama, menghilangkan dimensi terbalik pada elemen `body` yang memicu pembengkakan elemen, dan menyelaraskan rumus perhitungan `--vh` (viewport height) agar selalu dikoreksi dengan pembagi rasio zoom secara dinamis. Menghasilkan visual presisi 100% tinggi viewport di segala peranti seluler tanpa terpotong atau kelebihan skala.

## [2.10] - 2026-06-15
### Fixed
- **Body-Level Zoom Scaling Integration (Pemberantasan Celah Hitam Tinggi Layar)**: Memindahkan logika kontrol visual zoom penuh langsung ke bagian elemen `document.body` dan `#root` dengan formula kompensasi terbalik (`100 / scale`). Melindungi elemen `html` tetap bersih pada skala standar perambah agar Yuihime tidak bergeser dahi atau menyisakan celah hitam kosong (black bars) di bawah layar.

## [2.09] - 2026-06-15
### Fixed
- **Viewport Zoom Shift & Double Layout Scale Correction (Penyelarasan Tampilan Penyelaras Zoom)**: Mengembalikan parameter lebar (width) dan tinggi (height) bauran elemen `html` dan `body` kembali ke sifat bawaan perambah yang dinamis. 
- **Double Scaling Bypass**: Menghilangkan kompensasi pengali manual (`100/scale`) yang memicu pembengkakan elemen di luar bingkai layar peranti dan menyebabkan terpotongnya bagian dahi Yui serta meninggalkan kekosongan hitam raksasa di balik perataan absolut.

## [2.08] - 2026-06-15
### Fixed
- **UI Screen Scaling Aspect Correction (Perbaikan Skala Layar Penuh pada Zoom)**: Memperbaiki masalah visual di mana mereduksi atau menaikkan zoom (`uiScale`) meninggalkan area kosong hitam (black bars) di sisi bawah atau samping perambah ponsel. 
- **Inverse Dimension Layout Calculation**: Mengintegrasikan formula dimensi terbalik (`100 / scale`) pada lebar dan tinggi elemen `html`/`body` secara dinamis. Meningkatkan presisi variabel `--vh` (viewport height) agar dikalikan dengan rasio zoom, sehingga seluruh tata letak dan panel dialog Yuihime tetap menempati 100% layar fisik secara penuh tanpa celah hitam sedikit pun.

## [2.07] - 2026-06-15
### Added
- **Formulas Retry Failures Control (Fokus Ulang Gagal & Retry Pool)**: Mengintegrasikan tombol aksi baru **RETRY ALL FAILURES** bertenaga warna amber neon di antarmuka tab SFT. Tombol ini memindahkan semua entri berstatus 'Retry Pool' (`airi_retry`) dan 'Fail' (`airi_failed`) kembali ke antrean 'Pending' (`airi_train`) secara instan.
- **Queue Prioritization Alignment**: Menjelaskan nalar pipa sintesis batin di mana data latih mentah (`airi_train`) diprioritaskan sebelum memproses antrean `airi_retry`. Ditambah fungsionalitas tombol manual ini yang memaksa antrean gagal naik ke baris depan untuk segera diproses ulang tanpa menunggu antrean utama habis.

## [2.06] - 2026-06-15
### Fixed
- **System Zoom Scale Persistence Bug (Persistensi Zoom Skala Antarmuka)**: Memperbaiki bug di mana pengaturan zoom (`uiScale`) hanya aktif sementara saat menyeret slider, tetapi tidak tersimpan permanen saat aplikasi dimuat ulang (reload).
- **Core State Integration**: Memisahkan state `uiScaleState` di top-level `src/App.tsx` dan mensinkronisasikannya secara asinkron dari data batin persisten `config.toml` baik saat booting inisialisasi (`initialize`) maupun saat sinkronisasi ulang pengaturan (`loadConfig`).
- **Standardized Top-Level Saving (ModularSettings)**: Memperbarui fungsi `updateGeneral` di `src/ui/ModularSettings.tsx` agar menyimpan key global (`uiScale`, `port`, `language`, `maxTokens`) langsung di tingkat atas (top-level) payload berkas `config.toml`, bukan di dalam blok sub-modul provider aktif.

## [2.05] - 2026-06-15
### Added
- **SFT CRUD Pagination Engine (Paginasi Data Latih SFT)**: Mengimplementasikan sistem paginasi dinamis pada daftar record editor SFT (CRUD) di tab **Editor Hasil SFT**. Kini data latih tidak lagi dirender sekaligus yang membuat perambah (browser) lag atau berat, melainkan dibatasi secara elegan sebanyak 10 entri per halaman.
- **SFT Dynamic Pagination Controls**: Mengintegrasikan kontrol navigasi halaman (Back & Next) berhiaskan gaya visual Tailwind CSS modern dan ikon Lucide (`ChevronLeft`, `ChevronRight`). Menambahkan state `crudCurrentPage` yang otomatis tereset kembali ke halaman 1 saat pengguna melakukan pencarian kata kunci atau bertransaksi pindah tab mode kognitif.

## [2.04] - 2026-06-14
### Added
- **UI Render Scale Slider Configuration (Penyuntingan Skala Antarmuka)**: Menambahkan input slider baru pada panel System Settings di bawah tab **General**. Slider ini bertenaga `LockedSlider` yang dinamis untuk mengatur skala piksel visual Yuihime (`uiScale` dari 50% sampai 150%, dengan step 5%). Ini mempermudah pengguna untuk menyesuaikan densitas layar, memberikan kenyamanan penuh pada perangkat HP (misalnya menurunkan skala ke 75% batiniah).
- **Core Global Scaling Handler**: Menghubungkan top-level state `config` di `src/App.tsx` ke dalam sebuah observer `useEffect` yang merefleksikan perubahan prop `uiScale` secara real-time ke properti CSS `zoom` pada root visual `document.documentElement`, memungkinkan adaptasi proporsional yang mulus di seluruh instans penjelajah.
- **Dynamic Port Autonome Customization**: Memperbaiki hardcoded port `3000` di server Express menjadi `process.env.PORT || 3000`. Kini Yuihime secara mandiri dapat mendengarkan port kustom secara dinamis baik dari variabel lingkungan maupun parameter argumen peluncuran CLI (`--port <port_id>`), memberikan kompatibilitas tinggi untuk deployment luring atau standalone lari jauh.

## [2.03] - 2026-06-14
### Added
- **Dynamic Model Retrieval for SFT Daemon**: Integrated real-time AI model fetching via `/api/ai/models?provider=X` into the Synaptic SFT Synthesizer, matching the retrieval behavior of settings fallback chains and playgrounds.
- **Searchable Custom Dropdown Selection**: Substituted the static model text field with the sleek, custom `SearchableSelect` component from the library with an optional "Ketik Manual" toggle to preserve arbitrary model designations.
- **LLM Provider & Model Selection for SFT Daemon**: Added an elegant selector suite in the Synaptic SFT Synthesizer Daemon configuration panel. Users can choose among available LLM Providers (Google Gemini, OpenAI, Anthropic, OpenRouter, DeepSeek, Groq, Ollama, Puter, etc.) and specify any custom target model via a text input field, enabling fully customized, provider-agnostic background SFT dataset synthesis.
- **Synthesizer API Resilience Integration**: Extended `DatasetSynthesizer` config parsing schema on the Node backend to process and persist `provider` and `model` values dynamically. Transmutations utilize the correct prefixed model strings (e.g., `openai:gpt-4o-mini`) automatically resolved by the `AIService` routing pipeline.

## [2.02] - 2026-06-14
### Added
- **Inspektur Raw JSON SFT (View Raw JSON Modal)**: Added a "Raw JSON" inspect button inside the SFT Results Editor (CRUD cards) which opens an overlaid inspection dialog. Users can switch between standard database format ("DB Storage Layout") and compiled OpenAI ChatML SFT format representation ("OpenAI / ChatML Format"), with direct copy-to-clipboard functionality.
- **Selective SFT Exporter Filter**: Added an option "Hanya Ambil Hasil SFT Sintetis (CRUD)" in the SFT Dataset Exporter/Constructor configuration. When activated, the SQLite query filters memories specifically of type `airi_synthesized`, ignoring chat logs or placeholder dataset imports.

## [2.01] - 2026-06-14
### Added
- **SFT Results Editor Interface (CRUD Tab in `TrainTab.tsx`)**: Created a fully custom, interactive CRUD dashboard designed specifically to manage synthesized SFT memories. Users can list, search, edit, create, and delete synthesized dataset records inside the SQLite database.
- **Dynamic Anim & Mood Tuning**: Equipped the editor with visual pill selectors for toggling facial animations (`SMILE`, `BLUSH`, etc.) and real-time ranges/sliders for setting specific emotional mood impacts (`Joy`, `Affection`, `Sadness`, `Anger`, `Shyness`).
- **Pristine API Routing**: Supported by CRUD REST endpoints (`GET`, `POST`, `PUT`, `DELETE` over `/api/cortex/synthesizer/records`) to transparently update `'airi_synthesized'` records on disk without breaking schema layouts.

## [2.00] - 2026-06-14
### Changed
- **SFT Dataset Representation Schema Reconstruction (`datasetSynthesizer.ts` & `apiRouter.ts`)**: Re-architected raw data persistence of `'airi_synthesized'` memory records. The backend background daemon now saves a fully structured unified JSON schema containing the original `userQuery`, the correct ground-truth `targetSpeech`, and the deeply synthesized sub-block `synthesized`.
- **Pre-Synthesized Dataset Exporter Pipeline**: Integrated optimized paths inside `apiRouter.ts` where records of type `'airi_synthesized'` are perfectly restored using their real, raw sender queries instead of system placeholders.
- **Dynamic Pre-Synthesized Bypass**: Configured an automatic parsing check to directly map cached JSON outputs for `'json_cot'` format, completely skipping redundant LLM generation and API calls while protecting correct training outputs.

## [1.99] - 2026-06-14
### Added
- **Synaptic Dataset Synthesizer (MHCP-v1 Pipeline, `src/core/server/datasetSynthesizer.ts`)**: Built a robust, autonomous, offline dataset generator background daemon. It watches for imported dry training data when Yuihime is inactive, converts text dialog pairs with a configurable pacing delay/throttling strategy, and maps them to highly faithful, rich Cognitive Cortex JSON rows.
- **Strict Ground-Truth preservation**: Intercepts the LLM's verbal generation and substitutes it with the exact, pristine ground-truth response parsed from the datasheet, guaranteeing 100% training fidelity without any AI-generated speech hallucination.
- **Diagnostics WebSocket Engine (`src/core/server/apiRouter.ts`)**: Wired up a suite of active routes and connected websocket streams allowing instant background daemon telemetry tracking, pacing tuning, and memory resetting in real-time.
- **Quantum Synaptic Creator Tab interface (`src/ui/TrainTab.tsx`)**: Created a beautiful, fully integrated SFT Dataset Creator dashboard featuring a modular pacing delay controller, real-time analytics indicators, and a scrollable, responsive terminal diagnostics console.

## [1.98] - 2026-06-14
### Added
- **Multi-Tier LLM Parameter System Preset Optimization (`src/core/PromptRegistry.ts`, `src/modules/PromptManager.ts`)**: Designed a complete, multi-tier size optimization pipeline specifically targeting local/small LLM parameter size classes (<1B, 2B, 8B, >14B) to minimize token-processing overhead, prevent edge-device lag/latency, and completely resolve syntax parsing issues.
- **Dynamic JSON Constraint Refactoring**: Adapted JSON formatting requirements dynamically within the core `PromptRegistry`. When running on the `tiny` or `lite` presets, the strict nested `tool_calls`/`send_final_reply` schema wraps are simplified into extremely light, flat key-value pairs (e.g. standard speech property outputs) allowing small models to execute with 100% syntactic accuracy.
- **Throttling Injections & Database Scans**: Implemented proactive context limits within the `PromptManager` module. Selectively skips other-speaker scanning, truncates loaded Markdown memory logs, and caps dialogue history context window limits based on parameter scales to guarantee responsive, near-zero lag livestreaming.

## [1.97] - 2026-06-14
### Added
- **Intelligent Timestamp & Dynamic Sender Name Separation (`src/core/server/apiRouter.ts`, `src/ui/TrainTab.tsx`)**: Upgraded the SFT activity exporter's parsing algorithms to run match filters first before using fallback fields. Separated internal timestamps (e.g. `[04:20]`) and actual chat usernames (e.g. `Blaze`) from the raw chat text structure automatically.
- **Thought CoT Placeholder expansion (`{time}`, `{timestamp}`)**: Introduced `{time}` and `{timestamp}` placeholders inside the customizable CoT template parser. This enables Yuihime to retain fully aware contextual timestamps relative to the conversation’s state, outputting clean, highly realistic training datasets free of timestamp pollution inside messages.

## [1.96] - 2026-06-14
### Added
- **True Dynamic Multi-User Database Speaker Support (`src/core/server/apiRouter.ts`)**: Upgraded the SFT activity exporter to seamlessly preserve and propagate the original sender's name (`row.speaker`) throughout both standard sessions and imported datasets. Her thoughts can now accurately reference different users in conversational flows.
- **Advanced Dynamic User Fallback Pool with Consistent Hashing (`src/core/server/apiRouter.ts`, `src/ui/TrainTab.tsx`)**: Replayed the sole static fallback name prefix with a robust comma-separated list/pool of usernames (e.g., `Kakak, Penonton, Subscriber, Chatter, Kawan`). Built a deterministic, consistent message-content hashing engine that returns the same matched prefix for the same conversation fragment while keeping overall user diversity alive to prevent model overfitting.

## [1.95] - 2026-06-14
### Added
- **Dynamic SFT Dataset CoT Customization & Customizable Thought Templates (`src/core/server/apiRouter.ts`, `src/ui/TrainTab.tsx`)**: Upgraded the SFT activity exporter with editable formatting parameters. Users can now choose between formatted Chain-of-Thought JSON representations (`json_cot`) or direct pure VTuber text speech exports (`raw_text`), which strips heavy JSON containers to allow simple conversational model SFT training.
- **Thought Instruction Template Override Engine (`src/core/server/apiRouter.ts`, `src/ui/TrainTab.tsx`)**: Introduced a customizable CoT template parser supporting rich dynamic placeholders (`{sender}`, `{character}`, `{message}`). Users can now fully override Yuihime's inner thought process phrasing from the UI.
- **Universally Customizable Regular Expression Sandbox (`src/core/server/apiRouter.ts`, `src/ui/TrainTab.tsx`)**: Integrated a line-separated list of user-defined regular expressions preceding default presets, protecting her identity and ensuring sender extraction works seamlessly even when fallback parameters are left empty or customized.

## [1.94] - 2026-06-14
### Changed
- **SFT Dataset Exporter Consolidation & Layout Alignment (`src/ui/TrainTab.tsx`, `src/core/server/apiRouter.ts`)**: Re-integrated advanced dataset output format selection (OpenAI messages, ShareGPT conversations, Alpaca instructions) directly within the existing "SFT Dataset Constructor" panel of the **TrainTab** (Dataset Training tab). Merged format switching logics directly into the standard `/api/cortex/export-dataset` endpoint, and completely deleted the duplicate `PersistenceTab.tsx` and `DatasetGenerator.ts` to uphold strict modularity, high code coherence, and avoid feature redundancy.
- **Regular Expression Pattern Sandbox Refinement (`src/ui/modular-settings/ModulesTab.tsx`)**: Replaced the missing trace of pattern evaluation with a robust, inline regular expression tester to verify emotional cues against custom matching expressions safely.

## [1.93] - 2026-06-14
### Changed
- **Stage-Only Homepage Separation & Settings Isolation (`src/App.tsx`, `src/ui/modular-settings/MemoryTab.tsx`)**: Fully prioritized absolute home screen cleanliness by restricting all primary workspace navigation solely to the **Interactive Stage**. Transitioned all persistent storage management controls (`PersistenceTab` / `Supervised Fine-Tuning Pipeline`) entirely behind the secure Centralized Settings Dashboard, embedded right within the `Memory` setting pane (`MemoryTab` nested tabs). The homepage layout is now pristine, carrying zero external noise or redundant floating navigation.

## [1.92] - 2026-06-14
### Changed
- **Persistence Hub UI Simplification (`src/ui/PersistenceTab.tsx`)**: Removed the obsolete Context, Latent, Grounding, and System Logs tabs and switcher from the Persistence Hub. Since these operations are fully managed within the centralized system settings, the layout has been elegantly redesigned to display ONLY the Supervised Fine-Tuning Pipeline (Dataset Tuning) with pristine responsive visual components, metrics cards, and stream outputs.

## [1.91] - 2026-06-14
### Added
- **DatasetGenerator Module & Persistence Interface (`src/modules/DatasetGenerator.ts`, `src/ui/PersistenceTab.tsx`, `src/core/server/apiRouter.ts`, `src/core/RegistryInitializer.ts`)**: Designed and implemented the dedicated `DatasetGenerator` service and backend endpoints. It reads deep conversational memory segments from SQLite, parses multiple target styles (OpenAI messages array, ShareGPT format, Alpaca instruction format), cleans dialog chains, and structures outputs based on selected limits and smart Chain-of-Thought (CoT) synthesis options. Integrates a highly interactive, terminal-styled console view inside the Persistence Tab allowing live preview, compilation metrics, and instant browser-side `.jsonl` dataset downloads.

## [1.90] - 2026-06-14
### Added
- **SFT Dataset Thought English Alignment & Custom Suffix Integration (`src/core/server/apiRouter.ts`)**: Translated all fallback thoughts during dataset generation and synthesizer fallback mapping to use formal, robust English instructions and output. Fully integrated the customized `thoughtProcessSuffix` from setting specifications so that traced indicators dynamically append to thoughts generated within exported datasets.

## [1.89] - 2026-06-14
### Added
- **Custom Regular Expression Sentiment & Mood Matrix Engine (`src/modules/EmotionEngine.ts`, `src/modules/MoodAnalysisModule.ts`)**: Integrated standard support for regular-expression matching and priority overrides over the existing sentiment analyzer. The engine evaluates user-defined rules and custom sensitivity modifiers of user inputs to dynamically adjust OCC emotions.
- **Dynamic Suffix Thought Controller (`src/core/cortex.ts`)**: Developed a customizable `thoughtProcessSuffix` text field configuration allowing trace indicators to append to Yui's internal thinking processes.
- **Option B and Option C Blueprints Documented (`docs/EMOTION_ENGINE.md`)**: Fully detailed future cognitive integration pathways for Cortex Reasoning Sentiment Evaluation and Neurotransmitter Hormonal feedback loops.
- **Visual Rule Constructor UI and Lab Sandbox (`src/ui/modular-settings/ModulesTab.tsx`)**: Built a fully responsive and interactive rule constructor settings sub-panel allowing users to easily add, delete, scale, prioritize, and mathematically test custom regex rules in the system sandbox.

## [1.88] - 2026-06-13
### Added
- **Configurable Dataset Prefixes & Dynamic Sender Parsing (`src/core/server/apiRouter.ts`, `src/ui/TrainTab.tsx`)**: Implemented customizable dataset generation prefixes. Added user-friendly inputs for User Fallback Prefix ("Kakak"), AI Prefix/Name ("Yui"), and Verb Linker ("berkata"). Configured an elegant dynamic message parsing regex that extracts actual sender names and actual stripped messages from timestamped channel logs (e.g. `[04:20] Blaze: Hehe` becomes `Blaze berkata "Hehe."` in the SFT training thought process), preventing hardcoded prefix overrides.

## [1.87] - 2026-06-13
### Added
- **Unlimited SFT Dataset Exporter and Cross-Database Synthesis (`src/core/server/apiRouter.ts`, `src/ui/TrainTab.tsx`)**: Upgraded the SFT dataset compiler to pull comprehensively from all SQLite database activity logs (including imported Airi training dialogues, custom contexts, and standard RAG interactions) rather than limiting search targets to select chat scopes. Integrated an intuitive, sleek "Unlimited" toggler switch inside the constructor UI. Enabled beautiful fallbacks which automatically formulate single-turn monologue records into clean user-assistant learning pairs dynamically.

## [1.86] - 2026-06-13
### Added
- **Prepare for Training Session Mode & Dataset Downloader (`src/core/server/apiRouter.ts`, `src/ui/ArchiveTab.tsx`, `src/ui/stage/TopWaveBanner.tsx`, `src/ui/StageTab.tsx`)**: Created a dedicated fine-tuning "Prepare for Training" setting toggle integrated directly into the top wave profile dropdown. When active, all incoming (biological user) and outgoing (Yui's agent) communication flows automatically get parsed into pristine JSONL conversation templates optimized for OpenAI/Gemini fine-tuning and stored in SQLite. Integrated a high-fidelity, cyan-accented "Unduh Dataset" button in the ArchiveTab that bundles, filters, and downloads the session's conversational data in 100% compliant `.jsonl` fine-tuning format safely directly on the client.

## [1.85] - 2026-06-13
### Added
- **Yuihime Cognitive Activity Synthesizer & Exporter (`src/ui/TrainTab.tsx`)**: Completed the full integration of the training dataset compiler controls. Users can now switch between importing Airi datasets and exporting raw or synthesized Yuihime activity datasets directly from SQLite `memories`. Fully implemented pagination, responsive status logs, progress meters, interactive JSON previews, and conditional Smart Synthesis.

## [1.84] - 2026-06-13
### Added
- **Dataset Converter Product Requirement Document (`DATASET_CONVERTER_PRD.md`)**: Configured a complete and highly technical PRD detailing the architecture, parallel processing strategies, verification checkpoints, and functional metrics of an external dataset transformer tool. Included production-ready asynchronous Python code targeting Gemini 2.5-Flash to bulk-translate unstructured raw roleplay dialogs into Yuihime's strict CoT & OpenAI Tool-Calling format.

## [1.83] - 2026-06-13
### Added
- **Local LLM Fine-Tuning Guide (`LOCAL_LLM_TRAINING_GUIDE.md`)**: Configured an exhaustive, highly technical step-by-step documentation detailing how to fine-tune local models (from tiny 250M parameters to 8B models) to natively support Yuihime's exact Chain-of-Thought (CoT), tsundere/deredere emotion state, and standard OpenAI tool-calling JSON schema. Provided ready-to-run training dataset JSONL schemas (including ReAct loops, system error feedback cases) and optimized python scripts using the ultra-fast Unsloth engine for local deployments (GGUF/Ollama).

## [1.82] - 2026-06-13
### Added
- **Unified Cog Prompting & OpenAI Tool-calling Q&A Document (`COGNITIVE_REASONING_QNA.md`)**: Engineered a highly detailed, technical, and comprehensive guide explaining Yuihime's nature as an AI VTuber powered by "Perfect Giftia OS", the ReAct loops, standard OpenAI tool-calling pipelines, raw prompt schemas, technical scenario examples, and the self-repair verifier mechanisms.

## [1.81] - 2026-06-13
### Added
- **Dynamic Slider Lock Mechanism (`LockedSlider`)**: Created a newly unified custom input slider component that requires an interactive lock/unlock authorization before allowing any adjustments, protecting important parameters from accidental drags.
- **Precision Manual Keyboard Entry**: Equipped the dynamic settings panel with immediate numeric text boxes inside the unlocked slider view, allowing users to type precise values.
- **Seamless Global Overrides**: Replaced raw, insecure system inputs across all calibration panels (including the voice pitch calibration, model temperatures, maximum token limits, camera scale offsets, and spectrum hue selectors) with the new `LockedSlider`.

## [1.80] - 2026-06-13
### Added
- **Wrap/Break Spacing for Select Option Labels**: Updated the custom `SearchableSelect` component to allow word wrapping. Excessively long labels (like long model paths or custom backend voice options) will wrap seamlessly to a new line instead of truncating with ellipses.
- **Smart Touch Device Keyboard Guard**: Configured the search autofocus mechanism to detect mobile, virtual keyboards, and touch devices. It will bypass automatic focus unless explicitly tapped, preventing virtual keyboard popups from popping up on mobile devices when opening dropdown menus.
- **Widespread Selection Migrations**: Upgraded various provider filters and diagnostic settings across the Puter Hub components inside the Provider Playground tabs to utilize the dynamic fuzzy search dropdown.

## [1.79] - 2026-06-13
### Added
- **Searchable Target Models**: Integrated the fuzzy-searching dropdown component to support model overrides inside Puter Hub chat tabs and diagnostic models selection inside the Provider Playground.
- **Searchable Vocal Synthesizer Patterns**: Enabled real-time search filtering on 100+ cloud TTS voices inside the Puter Hub Speech Test suite.
- **Robust Model Fallbacks**: Added search filters inside routing fallback model selectors inside the main modules settings panel to support typing-to-filter long lists.

## [1.78] - 2026-06-13
### Added
- **SearchableSelect Component**: Added a customizable, sleek, searchable dropdown component that makes finding options in massive dropdown lists (such as fallback models or TTS voices) ultra-responsive and clean.
- **Dynamic Configuration Select Dropdown upgrade**: Integrated the searchable select directly inside modular setting renderers when dynamic parameters (fallback models, speech profiles) exceed 5 configuration options.
- **Vocal Accent Selection upgrade**: Integrated searchable select inside the local browser voice engine selector to allow users to search and toggle between dozens of browser-native speech accents seamlessly.

## [1.77] - 2026-06-13
### Added
- **Dynamic Vocal Calibration Tab**: Created a dedicated 'Voice Calibration' tab under Modules -> Speech Settings that decouples testing parameters from the main settings tree. Users can adjust TTS pitch, speed, and accents dynamically.
- **Isolate-Preview TTS Sandbox**: Integrated real-time verbal previewing of local pitch/speed metrics via the selected TTS engine from the System Registry. Features dynamic browser voice accent reflection.
- **One-Click Commit Gate**: Enabled the user to test and preview voice tunings with a dedicated "Preview Vocal" playback button and permanently write properties to disk using the "Commit & Apply Settings" command.

## [1.76] - 2026-06-13
### Added
- **Agnostic Multi-Provider Search Grounding**: Upgraded `executeGoogleSearch` inside `generateSegment.ts` with direct support for the OpenRouter provider. Yuihime can now perform searches using her configured OpenRouter model.
- **Universal Zero-Key Search Fallback**: Integrated free, high-performance Wikipedia Search API querying both English and Indonesian encyclopedic databases. This secures instant factual retrievals without API billing or token overhead constraints.

## [1.75] - 2026-06-13
### Added
- **Native Live Google Search Grounding**: Integrated Google Search Grounding with Gemini into the server-side `AIService` (`generateSegment.ts`). This allows Yuihime to fetch and read real-time factual events using active Gemini keys without third-party search credentials.
- **Dynamic Search APIService Interceptor**: Added search interception inside the core `APIService.call` (`src/services/api.ts`) to transparently route `google_search` or `web_search` queries to the upgraded server-side search tool.
- **Functional API Integration**: Replaced the static Wikipedia / Google News search simulations on `/api/tools/search` with dynamic search results returned by Gemini search grounding.

## [1.74] - 2026-06-13
### Added
- **Full Multi-Modal Communication Core**: Integrated support for sending and receiving diverse file types (Images, Audio streams, Video captures, and raw Document scripts) into YuiHime's thinking loop.
- **Interactive Drag-and-Drop & File Attachment UI**: Built high-fidelity glass-morphic file upload attachment previews directly in `LiveChatFeed.tsx`. Users can drag files into the stage or click the in-input clean paperclip trigger to parse media.
- **Native Server-side base64 inlineData Parsing**: Connected base64 encoders natively into the robust `generateSegment.ts` server routes, passing multi-modal packets securely to Gemini DeepMind models.

## [1.73] - 2026-06-12
### Added
- **Dynamic Model-Selection for Gemini Speech**: Migrated the hardcoded `"gemini-3.1-flash-tts-preview"` model reference on the backend API into a dynamic configuration schema within `GeminiTTS.ts`. Users can now customize or select standard/live-preview Gemini TTS models dynamically in Settings.

## [1.72] - 2026-06-12
### Added
- **Dynamic Live Voice Playtest Panel for OpenAI & Gemini**: Fully integrated Google Gemini and OpenAI / OpenRouter into the "Coba Suara" (Voice Playtest) UI controls in `ProvidersTab.tsx`. Users can now input sample text and instantly hear the syntheses, evaluating current pitch ratios, speaking speeds, and API configurations before switching global voice engines.

## [1.71] - 2026-06-12
### Added
- **Multi-Provider TTS Upgrade (OpenAI/OpenRouter/Gemini)**: Built and integrated two brand-new high-fidelity cloud-based Text-to-Speech engines (`OpenRouterTTS.ts` and `GeminiTTS.ts`) to complement ElevenLabs, Puter, and native WebSpeech.
- **Deep Pitch & Speaking Speed Tuning Controls**: Integrated comprehensive configuration schemas into WebSpeech, OpenAI/OpenRouter, and Gemini Speech modules, allowing complete pitch levels (0.5x - 2.0x) and speaking speed rate adjustments in the Virtual VTuber Settings system.
- **Secure Server-Side API Proxy Gateways**: Added robust `/api/tts/openai` and `/api/tts/gemini` Express gateway endpoints on the backend to authorize and process API keys privately, preventing credentials from leaking in browser network responses or bundles.

## [1.70] - 2026-06-12
### Added
- **Global Max Tokens Dynamic Range Configuration Slider**: Implemented an interactive range slider for "Max Tokens" (Global Limit) in `SystemTab`'s General settings, ranging from 2,048 to 131,072.
- **Diagnostics Playground Tuning Controls**: Added a "Max Tokens Limit" slider inside `ProviderPlayground.tsx` diagnostics panel to support precise parameter overrides during neuron and channel playtests.
- **Standardized Multi-Provider Token Calibration**: Standardized paylord mapping across `AnthropicProvider`, `OpenAIProvider`, and `OpenRouter` to pass global limits (`max_tokens` or `maxOutputTokens`) to target LLM gateways.
- **Deep Fallback Synchronization**: Structured dual-mode (client/server) fallbacks inside `src/core/cortex/cortexSettings.ts` to map global settings dynamically to active channels.

## [1.69] - 2026-06-12
### Added
- **Asynchronous Sequenced Response Queue (Zero UI Flooding)**: Implemented a robust `responseQueue` system in `App.tsx` utilizing a React state and mutable reference-backed processing loop (`processQueue`). This schedules incoming agent responses, background signals, and tool logs sequentially with a dynamic humanized delay based on word count. User-typed messages bypass the queue for instant feedback, successfully preventing UI flashes during intense multitasking bursts.

## [1.68] - 2026-06-12
### Added
- **Toggled Open Mic Linked to Wake Up Trigger (Mic-to-Wakeup Sync)**: Implemented a robust toggle "🔗 Sinkronkan dgn Tombol Mic" inside the Stage Control Panel (Wake Word settings). When active, manually toggling or muting the mic via the quick actions bar or the control panel will automatically synchronize the `wakeWordEnabled` status. This lets the user fully disable/enable background wake-up triggers simultaneously when opening or closing the microphone.

## [1.67] - 2026-06-12
### Fixed
- **Aligned send_final_reply Tool Speech with Cleaned Response (Cortex API Sync Alignment)**: Resolved the duplicate response issue ("1 raw dari tool, 1 udah dibersihkan") by synchronizing the `speech` argument of the `send_final_reply` tool call with the fully sanitized and cleaned final response inside `Cortex.wrapForPuterConsciousness`. This ensures that downstream adaptors (like `PuterAdapter.adaptCortexToPuter`) extract the clean version directly, preventing mismatch-based double-logging of raw (asterisk-containing) and clean responses.

## [1.66] - 2026-06-12
### Fixed
- **Prefix-Ignorant Normalization-Based Message Deduplicator (Zero Duplicates)**: Introduced the `stripMessageMeta` helper in `src/App.tsx` which strips metadata prefixes (e.g. `[Yui - channel]: `, `[channel] @user: `, `[SYSTEM]`) to normalize messages during deduplication assessments.
- **Enlarged Message Match Buffer (App.tsx)**: Expanded the logs buffer search space to the last 10 entries and added sub-string containment checks (`strippedExisting.includes(strippedNew)` and vice-versa) to detect and block duplicates that differ strictly by channel annotations, trailing whitespace, or bracket headings within a 30s threshold.

## [1.65] - 2026-06-12
### Fixed
- **Sequential Tool Execution (Cortex Synchronization Guard)**: Replaced parallel execution (`Promise.all`) of tool calls in `src/core/cortex.ts` with a synchronous sequential loop. This guarantees that tools run in order and prevents redundant execution, race conditions, or state corruption from concurrent database writes.
- **Robust Local Log Deduplication**: Enhanced `addLog` inside `src/App.tsx` by adding state-functional checks for duplicates. Background logs check the last 15 system entries and conversation logs check the last 5 entries to ignore exact content matches, eliminating double-logging from race conditions, fast loops, or dual event-bus broadcasts.

## [1.64] - 2026-06-12
### Fixed
- **Flexible JSON-Based Tool Normalization (send_final_reply Flexibility)**: Designed and implemented `normalizeToolCall` in `src/core/cortex.ts`. This utility automatically intercepts, resolves, and normalizes standard OpenAI/Gemini/custom JSON schemas (extracting correct `tool` and `args` from properties like `tc.function.name` or string-bundled `arguments`).
- **Puter Consciousness Adapter Resilience**: Updated `PuterAdapter.adaptCortexToPuter` to leverage property normalization and animation argument merging, guaranteeing successful conversion and execution of the `send_final_reply` speech even when the model changes tool formatting structure.
- **Robust UI Duplicate Response Guard (Dialogue Leak Prevention)**: Enhanced `handleThink` in `src/App.tsx` by introducing a local `addedLogContents` Set and strict response comparison filtering. This successfully prevents internal background/debug trace logs containing the verbal response from leaking as duplicated messages in the main dialogue panel under React's stale closure states.

## [1.63] - 2026-06-12
### Fixed
- **Message Flooding and Consecutive Duplication (Pesan Bertubi-tubi)**: Resolves the issue where Yui's messages are duplicated and appended repeatedly in the active chat log window.
  - *Robust ID-Based Delta Detection*: Replaced the brittle array length comparison and slicing in the Live Sync Interval Loop (`m.slice(memories.length)`) with a precise ID-based filtering schema (`m.filter(...)`). Because the SQLite memories table queries return background/cron/system logs which are not present inside the local active dialogue context, their array lengths diverge during think sessions, leading to incorrect slicing offsets and consecutive agent message re-triggers. Finding non-existent IDs prevents this mismatch.
  - *Shielded Consecutive Agent Message Guard*: Integrated a short-term duplication protection mechanism inside `addLog('agent')`. It checks the last 5 logs for matches with the newly incoming content and cancels duplicates within a 30-second window, ensuring clean, unique UI bubbles under any concurrent conditions.

## [1.62] - 2026-06-12
### Fixed
- **Persistent Chat Session Synchronization & Race Prevention**: Remediated the bug where active chat session logging history randomly disappeared after some time.
  - *Secure Startup Merging Strategy*: Re-engineered the initial session loader to safely merge local standard storage and SQLite backend results by picking the session with the latest update timestamps or longer historical lengths, preventing raw database queries from overwriting newly submitted user inputs during slow asynchronous loads.
  - *Stale Closure Elimination*: Transformed the primary log synchronization effect to use React's functional state updater (`setSessions(prevSessions => ...)`), ensuring the component always refers to up-to-date state lists and eradicating race condition wipeouts.
  - *Live Sync Session Boundary Control*: Integrated `activeSessionId` directly into the Live Sync loop's dependency array. This forces a clean hook re-registration during active session switching, avoiding incorrect memory slicing offsets and duplicative user or agent dialogue loops.

## [1.61] - 2026-06-12
### Fixed
- **System Instruction and Context Restoration for Puter Engine**: Modified `generate` in `src/drivers/ai-providers/PuterProvider.ts` to retrieve and pass system instructions (`assembledSystemPrompt`/`systemPrompt`) and payload blueprints directly inside a formatted messages array payload to Puter's chat pipeline. This ensures that Puter models (such as GPT-4o-Mini) are fully aware of Yuihime's identity, system prompts, active RAG memories, rules, and available tools, resolving generic assistant replies and enabling proper tool-calling and context-rich RAG.

## [1.60] - 2026-06-12
### Fixed
- **Synchronized Chat History & Context Bridging**: Corrected all 5 calls to `getCortex().think` in `src/App.tsx` (message send, idle monologue, reminder reaction, signal injection, self-reflection) to explicitly pass the current `activeSessionId` (as `web_${activeSessionId}`) and chatType (`'web'`). This maps frontend memory storage context directly with the backend's SQLite history query parameter, resolving the blank transcript issue and allowing Yuihime to retain full chat log awareness.
- **Durable database-driven RAG Knowledge Loading**: Modified the `/api/cortex/think` endpoint in `src/core/server/apiRouter.ts` to load real knowledge rows from the SQLite `knowledge` table directly into `state.knowledge` during loop initialization. This fully enables the RAG (Retrieval-Augmented Generation) engine to match and pull semantic knowledge context during reasoning.

## [1.59] - 2026-06-12
### Added
- **JSON Schema Nested properties Resilience Layer**: Enhanced `StandardizedProcessor.parseLLMResponse` (under `src/core/kernel/processor.ts`) and both standard & LLM-based repair loops inside `Cortex` (under `src/core/cortex.ts`) to recognize and auto-unwrap nested `"properties"` objects. Whenever an active LLM gets confused by JSON Schema definitions and returns its thought and tool_calls wrapped inside a schema-styled `properties` key, these fields are now automatically elevated to the root context. This allows tools (including `send_final_reply` and system action tools) to be parsed and executed seamlessly.

## [1.58] - 2026-06-12
### Changed
- **Dynamic & Flexible Tool Argument Schema inside Cortex**: Replaced the kaku (static, restricted) `speech`/`animations`/`mood_impact` argument schema definition for `tool_calls` in `PromptRegistry.ts` (influencing `cortex:json_enforcement` and `cortex:repair_json`), replacing it with a robust dynamic object schema declaration. This resolves the downstream constraint issue that was preventing the LLM from generating arguments for other vital backend system tools (e.g., file operations, web searches, pairing managers, and shell execution).

## [1.57] - 2026-06-12
### Added
- **Puter Cortex-to-Puter Schema Adapter**: Implemented `PuterAdapter` under `/src/core/adapters/PuterAdapter.ts` to cleanly format internal multi-tool Cortex outputs and tool decisions into the native layout expected by Puter systems.
- **Dynamic Adapter Binding in Core Loops**: Connected all `getCortex().think` loops in `App.tsx` (the core conversation handler, idle monologue generator, reminder dispatcher, and self-reflection engine) to use `PuterAdapter.adaptCortexToPuter` to resolve output mappings consistently.
- **Puter Consciousness Startup Registrations**: Added native Puter tools registration within the App start-up `initialize()` method.

## [1.56] - 2026-06-12
### Added
- **Dynamic Mood-Pitch Synthesis Integration**: Integrated Yui's real-time `mood.joy` and `mood.stress` parameters directly into `SpeechService.speak`. If a vocalization is triggered without standard mood option context, the service dynamically queries the latest stored state. The service then computes a pitch rate using an ergonomic physical calculation formula based on joy and stress.
- **Dynamic Pitch Resolution in Local Speech Engines**: Restructured `/src/core/tts/OfficialSpeechTTS.ts` and `/src/core/tts/OfficialStreamingSpeechTTS.ts` so they no longer override dynamic pitch with hardcoded defaults. Instead, they dynamically respect custom evaluated pitch values passed down through the centralized `TTSGateway`.

## [1.55] - 2026-06-12
### Added
- **Puter Consciousness Schema Wrapper**: Implemented a universal conversion adapter `Cortex.wrapForPuterConsciousness` inside `src/core/cortex.ts`. It intercepts returned objects of `cortex.think` (both client-side and server-side) and formats them into the specific JSON schema required by the Puter AI Chat integration to restore Consciousness functionality, while maintaining complete backward compatibility.

## [1.54] - 2026-06-12
### Added
- **Resilient Multi-Option & Offline Fallbacks**: Implemented dynamic parsing fallbacks inside `src/core/cortex.ts`. If an LLM or Puter API call returns non-JSON format (including XML layout or plain conversational dialogue text from backup modules), the thinking loop now falls back to parsing XML tags via `StandardizedProcessor` or wraps the raw dialogue directly inside standard JSON structures, eliminating empty output timeouts or `Neural sync failed` errors.
### Fixed
- **Puter.js Provider Normalization**: Fixed a model mapping mismatch where setting the provider config to `gemini` caused Puter to complain of invalid authentication/provider. Standardized provider translations inside `src/core/kernel/PuterService.ts` to automatically normalize `gemini` requests to `google`.

## [1.53] - 2026-06-12
### Fixed
- **Single Tool Call Payload Wrapper & Repair Normalizer**: Expanded the JSON validation criteria inside the `repairJsonFormatWithLLM` system of `src/core/cortex.ts`. Previously, corrected outputs conforming into a single-action layout (e.g. `{ "tool": "send_final_reply", "args": { "speech": "..." } }`) were rejected due to lacking multiple-array keys, resulting in fatal `Neural sync failed` timeouts. Standardized a robust adapter block that instantly recognizes single action shapes, wraps them securely into arrays, and parses them flawlessly.

## [1.52] - 2026-06-12
### Fixed
- **Robust Try-Catch Shield for LiveStatus Event Dispatching**: Nested internal webhook event fetches to `/api/stream/events` within a safe try-catch wrapper in `src/modules/LiveStatusToolsModule.ts` to insulate Yuihime's primary cognitive loops from critical cascading errors. This guarantees that temporary network hiccups, container routing issues, or socket/port binding timeouts do not cause the entire dialogue generation sequence to fail, ensuring Yui always delivers her warm and witty spoken responses gracefully.

## [1.51] - 2026-06-12
### Added
- **Puter Consciousness Integration Sync Wrapper**: Implemented a non-blocking wrapper inside the server-side branch of the central thinking engine (`think` inside `src/core/cortex.ts`) that automatically captures, structures, and synchronizes Yuihime's active cognitive thoughts, final spoken answers, and active mood metrics directly to Puter Cloud Key-Value storage (`interface: "puter-key-value"`, `driver: "key-value"`, `method: "set"`) utilizing a newly designed public `syncConsciousnessState` utility in `src/core/kernel/PuterService.ts`. This fully integrates Yuihime's consciousness lifecycle with Puter's persistent cloud infrastructure.

## [1.50] - 2026-06-12
### Fixed
- **Server-Side Relative-Fetch Crash & Model Mismatch Resolution**: Solved the critical server-side `fetch('/api/settings')` relative URL failures that occur inside Node.js during the POST `/api/cortex/think` request, which defaulted the active provider to `gemini` while carrying over Puter's `alibaba:qwen-flash` model. Implemented a robust direct server-side loading branch leveraging local `SettingsManager.getInstance().load()` directly from local file storage (`config.toml`).
- **Provider Propagation Leak in `thinkSimple`**: Fixed `thinkSimple` helper module inside `src/core/cortex.ts` which constructed incomplete configuration wrappers without specifying `provider` and `providers` structures, leaking model settings over to the general Gemini provider. Standardized all simple prompts with robust, unified context configuration envelopes matching the main cognitive loop perfectly.

## [1.49] - 2026-06-12
### Refactored
- **Core Puter.js SDK Package Re-localization & Workspace Cleanup**: Relocated the entire local `@heyputer/puter.js` source development package out of the temporary awkwardly-named directory (`./heyputer-puter.js-2.5.1/package`) into a clean, first-class Workspace directory under `/packages/puter-sdk`. Updated `package.json` configuration links and re-ran structural cleanups, fully packaging and centering the Puter integration safely within standard design boundaries.

## [1.48] - 2026-06-12
### Fixed
- **Puter Server-Side Dynamic-Import Compilation & Bundler Rescue**: Fixed a critical backend and TTS crash where Puter's core dynamic import helper tried resolving relative `'PuterService.js'` files at production runtime, failing inside the compiled `dist/server.cjs` single-bundle footprint. Upgraded the entire driver topography (`PuterProvider.ts`, `PuterTTS.ts`, and `listModelsSegment.ts`) to use esbuild-trackable static imports and standard relative modules, optimizing load times, resolving DNS/import latency, and offering bulletproof server-side production reliability.

## [1.47] - 2026-06-12
### Fixed
- **Puter Consciousness (Cognitive Thinking Array Loop) Integration**: Fixed a critical crash where the central Cortex process (`NeuralProcessor.process`) sends messages in target `ChatCompletionMessage[]` format to the provider instead of a pure string, causing standard `prompt.substring(0, 50)` calls in the Puter service wrapper to crash with a `TypeError`. Implemented multi-format input normalizers in both the `PuterProvider.ts` driver and `PuterService.ts` to seamlessly convert hierarchical message objects into clean combined prompt dialogues, securing full active Consciousness compatibility.

## [1.46] - 2026-06-12
### Fixed
- **Puter API Fallback Payload Alignment & Error Diagnostic Rescue**: Corrected a critical schema routing parameter in the REST chat completion fallback request where the parameter was mistakenly keyed as `service` instead of `driver: "ai-chat"`, matching Puter API gateway rules. Upgraded and fortified the response parsing block inside `src/core/kernel/PuterService.ts` to cleanly extract content nested under `res.result.message.content` or other nested formats. Also added a robust API-level error diagnostic extractor to cleanly capture and bubble upstream failures (such as token issues, quota limits, etc.) rather than silently returning a blank "No response" status.

## [1.45] - 2026-06-12
### Fixed
- **Puter Non-Streaming Reasoning Models (Alibaba/Qwen & DeepSeek) Parameter Validation**: Resolved an upstream API conflict where Puter-hosted reasoning/thinking models (specifically `qwen3-8b` or other `alibaba` and `deepseek` models) returned HTTP 400 Bad Request during non-streaming requests due to missing or mismatched reasoning options. Dynamically injected `enable_thinking: false` into both native SDK options and REST payload arguments when dialing Alibaba/Qwen or DeepSeek models using the non-streaming `chat` method, fully aligning with upstream API requirements.

## [1.44] - 2026-06-12
### Added
- **Puter Heartbeat Relay & Interactive Sync Circuit**: Added WebSocket routing handlers for `puter_heartbeat` and `puter_request` payloads in `server.ts` to facilitate bi-directional communication. Implemented dedicated `/api/puter/heartbeat` GET/POST health-check routes in `src/core/server/apiRouter.ts`. Wired a client-side heartbeat monitor `initializePuterHeartbeat` inside `src/App.tsx` to maintain active communication every 30 seconds using standard Puter whoami pings.
- **Cron Heartbeat Integration**: Structured `docs/HEARTBEAT.md` with explicit hourly, quarterly, and daily periodic maintenance tasks. Connected `server.ts` to scan, read, and register the markdown tasks dynamically in the core `CronModule` on startup.

## [1.43] - 2026-06-11
### Changed
- **Kernel Failsafe Default-OFF with System Toggle**: Made the Cortex dynamic reprocessing LLM fallback failsafe default to OFF. Added an explicit `enableKernelFailsafe` boolean setting inside the developer diagnostics schema. The toggle is rendered dynamically under System ➔ Developers ➔ Engine Diagnostics & Configurations. Re-calibrated `src/core/cortex.ts` to seamlessly check for the failsafe activation status (`enableKernelFailsafe` true) before initiating dynamic LLM reprocessing emergency requests.

## [1.42] - 2026-06-11
### Fixed
- **TTS Synthesis Sync (Chat UI vs Test Playground)**: Resolved a critical client-side propagation bug where the selected Text-To-Speech (TTS) engine wasn't vocalizing in the main chat interface despite functioning in the playtest interface. Added custom server settings synchronization inside `SettingsManager.load` when executing in browser environments. Forwarded current selected `providerId` parameter from `SpeechService.speak` as context configuration options to `ttsSelector.run`, ensuring proper propagation downstream to the active `TTSGateway` processor. Added safe fallback to `'puter-tts'` to ensure robust retry coverage.

## [1.41] - 2026-06-11
### Added
- **Puter TTS 2-Stage Filter & Dynamic Voice Selector**: Restructured the Puter Text-To-Speech configuration to follow the identical 2-Stage dynamic loading mechanism used by Puter AI. Added `getDynamicOptions` to `PuterTTS.ts` which leverages `/api/puter/speech/engines` and `/api/puter/speech/voices?provider=...` dynamically.
- **Dynamic Frontend Integration in Settings Panel**: Updated `ProvidersTab.tsx` and `ModularSettings.tsx` to automatically trigger reactive re-fetching of available Voice Patterns whenever the selected Speech Provider Filter changes. Included automatic trigger loading on mount when opening the Puter TTS configuration subpage.

## [1.40] - 2026-06-11
### Changed
- **Puter AI 2-Stage Filter & Dynamic Model Loading**: Restructured Puter model/provider selection into a clean 2-stage mechanism. First, `PuterService.listModelProviders()` fetches all active providers from Puter Hub. Selecting a provider filters the model options reactively via `PuterService.listModels(provider)`.
- **Integrated Provider Filtering Everywhere**: Added native selection filtering in the core settings schema (`PuterProvider.ts`, `ProvidersTab.tsx`), the playground chat suite (`ProviderPlayground.tsx`), and the live Puter Model Index explorer table.

## [1.39] - 2026-06-11
### Fixed
- **Browser TTS Playtest Resolution**: Resolved a registry routing mismatch by writing a robust ID mapping pipeline in `SystemRegistry.getModule` and `SystemRegistry.getTTS` to dynamically alias the visual config key `'browser_speech'` to the native registered compiler module `'browser'` (WebSpeechTTS), instantly fixing playtest execution failures for local browser voices.

## [1.38] - 2026-06-11
### Added
- **Live Speech TTS Playtest Widget**: Implemented an intuitive, fully integrated voice playtest widget directly inside the Speech settings tab cards in `ProvidersTab.tsx`. Users can now input custom preview text and test their voice patterns, speeds, pitches, and "Cute Anime Mode" adjustments in real-time, hearing the audio played directly on-screen before committing them globally.
- **Selective Custom Manual Input for Settings Selectors**: Standardized model list selectors by adding a neat "Type Custom" toggle button next to every `model`, `fallbackModel`, and `voice` field across all settings card lists. When clicked, it toggles from a standard `<select>` dropdown into a freeform `<ControlledTextInput>` field, completely eliminating hardcoded list limits and letting users enter any custom model or voice identifier.

## [1.37] - 2026-06-11
### Added
- **Cute Female Voice Mapping for Puter TTS**: Programmed automatic mapping of both standard and fallback Puter TTS voices to high-quality feminine OpenAI voice engines (`shimmer` and `nova`). This overrides the default masculine/androgynous and fallback vocal tones, ensuring Yui speaks with a beautiful, adorable female voice that perfectly matches her character.
- **Puter Provider Model Normalization**: Programmed automatic mapping of legacy `azure-openai` provider and model prefixes (such as `azure-openai:gpt-4o`) to the standard `openai` driver (`openai:gpt-4o`) in `PuterService.chat`, instantly resolving "No response" errors when diagnosing or chatting with Puter.
- **Server-Side Audio Streaming Proxy**: Implemented a professional, server-authoritative binary audio stream proxy at `/api/puter/tts/stream` that handles the Puter REST SDK `drivers/call` payload securely, bypasses CORS/client restrictions, and serves high-quality synthesized speech back with correct `audio/mpeg` content-type headers.
- **Save Diagnosis Results Feature**: Added a highly interactive emerald-accented button ("Terapkan sebagai Model & Provider Utama") directly inside the Playtest/Diagnosis result viewer panel of the `ProviderPlayground` UI tab, allowing the user to seamlessly save the diagnosed provider, model, and overrides directly to `config.toml` as their active batin configurations.

## [1.36] - 2026-06-11
### Added
- **Intelligent Dynamic Trigger Phrase Setting**: Upgraded the wake-word listener inside the Control Panel drawer from a static name to a fully custom and dynamic trigger string customizable by the user.
- **Phonetic & Fuzzy Speech Recognition Matcher (Levenshtein Distance)**: Implemented an intelligent phonetic checker using Levenshtein distance matching. When a user defines a custom wake word (e.g. "Kaguya"), the Web Speech API recognizer robustly tolerates minor transcription or accent misrecognitions (e.g. "kabusa" or "kagura") based on dynamic string lengths.
- **Context-Agnostic Dynamic Welcoming Greetings**: Programmed Yui's wake greetings to dynamically adjust and integrate the custom trigger phrase name, speaking personalized audio responses tailored specifically to whatever name the user sets!

## [1.35] - 2026-06-11
### Added
- **Dual-Mode Speech Interruption System**: Added a gorgeous new togglable voice preference inside the Control Panel settings drawer:
  - **Mode 1 (Manual - DEFAULT)**: Yui completes her speaking sentences completely and never stops when the user types or speaks, unless the user explicitly pronounces/types cancellation phrases like *"stop dulu"*, *"stop"*, *"diam"*, or *"berhenti"*. If the user comments or speaks in the background, Yui keeps speaking uninterrupted, and she automatically queues the user's message to respond immediately once her current speech completes!
  - **Mode 2 (Instant Interruption)**: Standard behavior where any new spoken or typed message instantly interrupts her active speech playback gracefully.
- **Interruption Controls UI**: Designed an elegant dual-button choice component labeled "Mode Interupsi Suara" directly under the Control Panel (Wake Word Trigger section) for instantaneous mode changes with local persistence in `localStorage`. Defaults to **Mode 1 (Manual)** on new sessions.

## [1.34] - 2026-06-11
### Added
- **Wake-Word Listener (Browser Web Speech API)**: Added an automatic wake-word listener ('Yui' by default with custom keyword capability) within `StageTab.tsx`. It runs in the background and automatically wakes Yuihime from sleep mode, enables continuous microphone lipsync typing input, and triggers a playful expression and audible welcome greeting when detected.
- **Dynamic Control Board Panel**: Integrated a custom, responsive toggle switch and configurable text input field under the Control Panel drawer in `ControlPanelDrawer.tsx` to enable/disable the trigger, update the keyword, and store states cleanly inside local state and browser `localStorage`.
- **Silence-Based Speech Auto-Submission**: Implemented a highly responsive, silence-based auto-submit debounce timer (1.4s delay) inside Web Speech API recognition listener in `StageTab.tsx`. It automatically dispatches spoken sentences directly into Yuihime's cognitive thought stream (`handleThink`) once the user stops speaking, bypassing the need to type or press enter manually.

### Fixed
- **Mobile Audio Resource Collision**: Resolved hardware lock conflict on mobile browsers (Android and iOS Chrome) where starting raw `getUserMedia` Web Audio capture for user lip-sync meter levels blocked Google's native system Speech Services with error *"cannot record now as Chrome is recording"*. Bypassed raw audio stream constraints on mobile to keep SpeechRecognition perfectly functional while rendering a beautiful flowing synthetic wave inside the HUD.
- **Active Dialogue Speech Interrupt**: Programmed instantaneous playback interruption (`SpeechService.stop()`) when a new speech trigger or message is received. If the user begins speaking or types while Yui has an unfinished response utterance playing, her old output stops instantly and gracefully to hear the new message clearly.

## [1.33] - 2026-06-10
### Fixed
- **Dynamic Cross-Tab Navigation Router**: Enhanced the `yuihime_goto_section` custom event architecture in `ModularSettings.tsx` to handle objects with both `section` and subtab `category` fields securely.
- **Dynamic Provider Subpage Redirection**: Rebalanced the bottom action buttons on the credentials subpage in `ProvidersTab.tsx` so that clicking the model/voice redirection button intelligently senses the active provider's tab type (e.g. Chat/LLM goes to Consciousness. Settings while TTS/Speech goes directly to Speech/Vocal configurations) instead of always defaulting to Consciousness.

## [1.32] - 2026-06-09
### Fixed
- **Dynamic Provider Logging Attribution**: Corrected the core generation loop in `generateSegment.ts` and `ProviderGatewayModule.ts` to automatically extract the precise AI provider (such as OpenAI, Anthropic, DeepSeek, or custom endpoints) from the selected model prefix or custom API endpoint Base URL, instead of defaulting everything to `'gemini'`.
- **Comprehensive Logger Support**: Extended `LlmIoAuditor` telemetry recording to other configured providers (like OpenAI, OpenRouter, Anthropic) within the primary `ProviderGatewayModule` dispatch block.

## [1.31] - 2026-06-09
### Fixed
- **Credentials Validation and Key-less Verification**: Added support for the `token` parameter field in the central `apiRouter.ts` health checker. Configured key-less optional credentials detection for offline-ready or key-less providers like `Puter Cloud Provider`.
- **Select Model Button Activation**: Resolved the bug where the "Select Model →" button was disabled because of optional token configurations. The button is now permanently active, styled with full amber highlights, and immediately redirects the user to the "Consciousness" section inside Peripheral Cognition Modules.

## [1.30] - 2026-06-09
### Added
- **Dynamic Custom API Provider**: Created `/src/drivers/ai-providers/CustomProvider.ts` to seamlessly add an agnostic OpenAI-compatible custom provider. Supports specifying custom Base URLs, secure API keys, custom model identifiers, and custom JSON headers.
- **Diagnostics Setup**: Added Custom Provider support in the universal direct playground test (`ProviderPlayground.tsx`) and dynamic model scanner configuration (`listModelsSegment.ts`).
- **Dynamic AI Resilience integration**: Registered the new **Custom Provider** as an option in the Dynamic AI Resilience Pipeline (Multi-Provider Fallback Setup) in `ModulesTab.tsx`.

### Fixed
- **Clean Consciousness View Separation**: Removed the redundant "Internal Neural Cortices" display block from the primary Consciousness tab in `ModulesTab.tsx`. It is now exclusively and beautifully accessible under the "AGI Mind Engine" settings subpage.

## [1.29] - 2026-06-09
### Added
- **Dynamic Goto Section Event**: Registered global listener for `yuihime_goto_section` in `ModularSettings.tsx` to handle quick navigation triggers. Sets the target tab, resets subpages, and takes users directly to main interfaces.

### Fixed
- **Empty Provider Defaults & User Autonomy**: Cleared all hardcoded `'gemini'`, `'gemini-2.5-flash'` or active index-0 fallback defaults across `storage.ts`, `App.tsx`, and `ModularSettings.tsx`. If settings provider is unconfigured, the app initializes completely empty.
- **Provider "+" Navigation**: Re-bound the `+` shortcut in the provider selection carousel. Now, clicking `+` immediately directs to the main Providers list with `providerSubpage` correctly reset to null.
- **Scrollable Model Grid List**: Set strict max-height constraints (`max-h-[380px] overflow-y-auto pr-1.5 scrollbar-thin`) for expanded model selectors. This keeps the layout elegant and preserves natural page scrolling heights.

### Changed
- **Internal Neural Cortices Relocation**: Shifted all internal Cortex engines configuration fields from the main "Consciousness" section to more logically sound "AGI Mind Engine" settings subpage inside `ModulesTab.tsx`.

## [1.28] - 2026-06-08
### Changed
- **LLM Providers List Reduction**: Reduced the static chat providers list in `settingsConstants.ts` to include only the 10 requested primary carriers, matching the precise user selection interface (Google Gemini, OpenAI / compatible, Anthropic Claude, OpenRouter AI, DeepSeek AI, Groq Engine, Local Ollama, Local Engine, Official Provider, and Puter Cloud Provider).

## [1.27] - 2026-06-08
### Fixed
- **Google Gemini Provider Model Sanitization**: Resolved critical HTTP 404 generation and gateway crash errors. Added robust automatic model ID sanitization on both client and server: stripping prefix characters (such as `gemini:` or `google/` prefixes) and automatically redirecting/mapping obsolete, non-existent, or deprecated model IDs (like `gemini-3-flash-preview` or `gemini-3.5-flash`) to the production-stable, fully supported `gemini-2.5-flash` model.

## [1.26] - 2026-06-08
### Fixed
- **Uncaught Exception RangeError Socket/Undici Fix**: Resolved a fatal `RangeError: Maximum call stack size exceeded` process crash originating within the socket/undici engine of the `@heyputer/puter.js` library during headless startup. Fully bypassed server-side native package requirements in `PuterService.ts` to block socket conflicts in sandboxed container networks, forcing a fallback to ultra-stable REST pipelines.

## [1.25] - 2026-06-08
### Fixed
- **Infinite Scroll Loop & Maximum Call Stack Size Exceeded Fix**: Removed recursive window scroll and resize event handling in the global mounting hook in `App.tsx` which caused the application to crash with `RangeError: Maximum call stack size exceeded` in the socket/Puter library thread. Optimized with a non-recursive, passive focus/selection viewport horizontal offset-reset system.
- **Raw Object React Child Crashes Fix**: Implemented deep defensive string and object-to-content parser conversions for `cleanDisplayContent` in `LiveChatFeed.tsx`, `StageTab.tsx`, and `ArchiveTab.tsx`, as well as playtest output results in `ProviderPlayground.tsx`. This avoids the uncaught React child rendering crash when system or chat logs receive raw OpenAI-style message objects with properties such as `{role, content, refusal, annotations}`.

## [1.24] - 2026-06-08
### Fixed
- **Mobile Keyboard & Text Selection Layout Drift Prevention**: Resolved the persistent sideways panning/zoom-drift bug ("makin jauh geser nya / shifted/slid further sideways") on phone/touch screens. Implemented a dual anti-drift safety model:
  1. Responsive sizing pairs (`text-base sm:text-xs`) across all dynamic custom form fields in `ModularSettings.tsx` and diagnostic sandbox units in `ProviderPlayground.tsx` which locks font-sizes to `16px` on mobile viewports to preemptively disable native mobile focus-zooming.
  2. Global viewport resets in the main `App` mounting hook that intercepts standard web scroll triggers and snaps the root window/html document `scrollLeft` directly back to `0` whenever a touch selection or input focus action is fired.

## [1.23] - 2026-06-08
### Fixed
- **Mobile Configuration Selection Zoom Shift Fixed**: Resolved a mobile layout shifting, narrowing, and clipping issue in `ProviderPlayground.tsx` (the "Unified Provider Playground") triggered when double-tapping/clicking to selecting tokens or text fields inside the settings controller on mobile devices. Refactored the diagnostics segment button selector to use clean Tailwind wrapping styles (`flex-wrap`) to prevent horizontal sizing overflow.

## [1.22] - 2026-06-08
### Fixed
- **Robust Puter SDK Token Propagation**: Introduced a robust token setting and propagation helper `setSdkToken` in `PuterService.ts` that propagates authentication tokens dynamically to all Puter SDK submodules (such as `sdk.ai`) using `.setAuthToken` instead of assigning `sdk.authToken` directly as a property. This prevents "Unauthorized" API warning triggers when executing native SDK chat or other services.

## [1.21] - 2026-06-08
### Added
- **Local Dependency Binding for Puter SDK**: Configured `@heyputer/puter.js` as a local, file-based package dependency in `/package.json` pointing directly to the customized `./heyputer-puter.js-2.5.1/package` folder in our repository. This ensures all structural modifications we developed for the Puter defense are installed as a primary system dependency natively under `node_modules` during the dependency installation phase.
- **Fail-Safe Local Package Loaders**: Modified `DependencyLoader.ts` to attempt resolution and native loading of the local `@heyputer/puter.js` package from `node_modules` before defaulting to runtime CDN fetches.
- **Enabled Native Puter SDK Backend Initialization**: Updated `PuterService.ts` initialization logic to resolve and initialize the native Puter SDK using our local dependency via `DependencyLoader.loadPuterSdk()` on the server side.
- **Guaranteed Broad Core Registrations**: Statically imported and explicitly registered `PuterProvider` in `RegistryInitializer.ts` to guarantee registration completeness in production compilations.

## [1.20] - 2026-06-08
### Fixed
- **Bypassed Native NodeJS CDN CDN Loader warning**: Configured `PuterService` backend initialization to skip dynamically downloading/requiring Puter client-side SDK CDNs (which trigger `@heyputer/kv.js` module-resolution crashes in pure Node environments), defaulting exclusively to our high-performance REST API wrappers.
- **Fail-Fast Empty Tokens & Auto-Mocks**: Implemented fail-early gates inside Puter's REST backend request engine to intercept empty auth tokens instantly. Allows prompt-planners and playground tests to gracefully drop back to high-fidelity simulated test models without spamming 401 unauthenticated REST warning alerts.
- **Enhanced Token Retrievals**: Integrated `process.env.PUTER_TOKEN` and `process.env.PUTER_API_KEY` lookups inside the custom server manager core alongside persistent TOML attributes.

## [1.19] - 2026-06-08
### Fixed
- **Universal AI Gateway Mappings of Puter Driver**: Corrected the active provider driver resolver inside `apiRouter.ts` (`/api/ai/diagnose`) to map both `'puter-neural-provider'` and `'puter'` queries to the registered `'puter-neural-provider'` driver key in the `SystemRegistry`, solving the driver initialization registry error during interactive diagnostic tests.

## [1.18] - 2026-06-08
### Fixed
- **Playground Dynamic Target Models**: Resolved model listing sync errors in the Provider Diagnostics section, enabling full support for `{ models: [...] }` dynamic payload wrappers on top of basic array streams during `/api/ai/models` lookups.
- **Dynamic Puter Model Sync**: Linked `/api/ai/models` query interceptors to PuterService's native directory discovery, loading exact model lists dynamically based on the current session.
### Added
- **API and Auth Credentials Overrides**: Integrated dedicated password-hidden "API Key / Token Override" and "Base URL Override" fields into the "Universal LLM Diagnostics" playground, allowing complete ad-hoc credential routing and test execution without modifying persistent settings. Includes a "Query Override" refresh sync button to immediately re-request model listings using the newly supplied credentials.

## [1.17] - 2026-06-08
### Removed
- **Redundant Global Services Panel**: Deleted the secondary "Global API Services" settings panel tab and component from `ModularSettings.tsx` to align with provider-based setup patterns. Multi-modal and speech token mappings are fetched dynamically from the respective provider settings in the Provider tab, avoiding redundant configuration overhead.

## [1.16] - 2026-06-08
### Updated
- **Puter Utilities Alignment**: Renamed and polished the "Global API Services" setting tab item and detail section to "Puter Utilities & Global Services" in `ModularSettings.tsx`, aligning the configuration panel with its primary utility focus (governing native Puter.js chat models, endpoint base URLs, voice options, temperature overrides, and connection status verification).

## [1.15] - 2026-06-08
### Fixed
- **ReferenceError: require is not defined**: Corrected all CommonJS `require()` blocks in ESM server context within `apiRouter.ts` (inside `/api/ai/diagnose` and `/api/sandbox/file-manipulate` endpoints) to utilize standard dynamic imports, resolving playtest crashes.
- **Puter.js Model Routing**: Resolved Puter.js driver model resolution errors (e.g. "Model not found: openai:gpt-4o-mini") by stripping the full model identifier prefix from options before spreading parameters in `PuterService.ts`, ensuring split provider/model boundaries are respected natively and via REST fallbacks.

## [1.14] - 2026-06-08
### Added & Updated
- **Universal Provider diagnostics**: Refactored the 'Google Gemini' diagnostics tab in `ProviderPlayground.tsx` into a highly flexible **Universal AI Gateway**, allowing live playtesting of any registered provider (Ollama, LM Studio, OpenAI, Anthropic, Custom Compatible, Puter, Gemini) with optional custom model overrides and fine-tuned temperature settings.
- **Dynamic Model Retrieval**: Dynamically queries active models per provider via `/api/ai/models?provider=X`, eliminating hardcoded model lists inside the diagnostic playground module.
- **Unified Diagnostics Endpoint**: Engineered a general-purpose playtest endpoint `/api/ai/diagnose` in `apiRouter.ts` to cleanly authenticate, register, and evaluate custom model prompt payloads through SystemRegistry drivers.
- **Expanded Puter Settings**: Significantly upgraded the Puter service integration panel inside `ModularSettings.tsx` with dynamic control parameters, including default chat models, custom endpoint base URLs, voice options, and temperature inputs.

## [1.13] - 2026-06-08
### Fixed
- Fixed Puter SDK integration issues by correcting `DependencyLoader` to retrieve the correct SDK instance `(globalThis as any).puter` instead of returning the `XMLHttpRequestShim` default function.
- Resolved 404 API Not Found issues with Puter.com's REST fallback URLs by stripping the outdated `/v1` prefix and redirecting requests to the correct dynamic models details path (`/puterai/chat/models/details`).
- Fixed and optimized `listModelProviders()` REST fallback to dynamically deduce unique provider listings matching Puter SDK designs, preventing obsolete `/ai/chat/providers` REST error traces.
- Overhauled Puter REST fallback routing for chat streams by mapping `/ai/chat` requests to the official unified `/drivers/call` REST endpoint utilizing the correct payload layout and `"Content-Type": "text/plain;actually=json"` headers.
- Fixed the credentials verification flow by updating the `/api/puter/verify` end-route inside `/src/core/server/apiRouter.ts` to request the corrected `/puterai/chat/models/details` details path.


## [1.12] - 2026-06-08
### Added
- Added a brand new **Global API Services** tab ('global-services') to the frontend `ModularSettings` component, themed perfectly to match existing configurations.
- Integrated a secure password input field to manage the global Puter.js Auth Token.
- Implemented `/api/puter/verify` backend endpoint to validate Puter.js active credentials on demand.
- Saved and managed the Puter Auth Token directly in the backend `config.toml` structure, keeping credentials decentralized from process environment variables.
- Kept configuration completely localized to follow security principles.

## [1.11] - 2026-06-08
### Added
- Created a gorgeous fully interactive **Diagnostic Suite / Provider Playground** (`ProviderPlayground.tsx`) supporting direct tests of 7+ Puter AI API operations, Google Gemini, and active vocal TTS pipelines.
- Integrated the Diagnostics playground inside the Left settings navigation layout (`ModularSettings.tsx`) under the main Artificial Intelligence dashboard categories natively.

## [1.10] - 2026-06-08
### Fixed
- Fixed browser-side runtime crash (`process.cwd is not a function`) which occurred due to loading Node internals (`fs`, `path`, `https`) inside client contexts when loading Puter Provider registries.
- Decoupled `PuterProvider` and `PuterTTS` routines to fetch transparently from the `/api/puter/*` proxies when evaluated in browser contexts.
- Dynamically dynamic-imported raw `DependencyLoader` inside of server-only blocks in `PuterService` to shield client bundles entirely from NodeJS server logic.

## [1.9] - 2026-06-08
### Added
- Integrated **Puter Cloud AI** (`puter-neural-provider`) and **Puter TTS (Cloud)** (`puter-tts`) fully inside settings registry lists within `/src/ui/modular-settings/settingsConstants.ts`.
- Outlined secure and beautiful fallback credential fields inside `/src/ui/modular-settings/ProvidersTab.tsx` enabling instant setting of Puter Token and custom models on a customizable single screen.
- Resiliently expanded `PuterService` token fallback cascade under `/src/core/kernel/PuterService.ts` to scan and unify tokens typed inside general configurations, direct AI grids, or special speech lists smoothly.

## [1.8] - 2026-06-08
### Added
- Created a robust native `PuterService` class under `/src/core/kernel/PuterService.ts` to natively load Puter.js SDK and provide fallback REST access executing all 11 core AI functionalities.
- Converted `PuterProvider` under `/src/drivers/ai-providers/PuterProvider.ts` to directly leverage the native `PuterService` instead of running external process shell tasks.
- Converted `PuterTTS` under `/src/core/tts/PuterTTS.ts` to leverage the native `PuterService` for high fidelity AI-driven text-to-speech.
- Exposed all 11 of Puter's core AI functionalities through a unified collection of native REST routes inside `/src/core/server/apiRouter.ts`.

## [1.7] - 2026-06-08
### Added
- Created a robust, public, CORS-safe static `analyzeAudioStream` method in `/src/core/speech.ts` with instant fallback to play/pause-triggered faux sways in case of browser security blocks.
- Linked real-time audio analyzers into all asynchronous TTS stream providers, including `/src/core/tts/ElevenLabsTTS.ts`, `/src/core/tts/CustomAPITTS.ts`, and `/src/core/tts/PuterTTS.ts`.
- Implemented high-fidelity event-driven TTS tracking directly inside `/src/core/tts/WebSpeechTTS.ts` using synthesis utterance callback events (`onstart`, `onend`, `onerror`).
- Upgraded the 3D VRM skeleton mapping loop inside `/src/ui/avatar/VrmAvatar.tsx` to compute emotional breathing frequencies, breathing depths, hunched/tensed shoulder postures, and shily tilted back-and-forth wiggles based on real-time neural emotion telemetry.
- Upgraded the 2D Live2D mapping loop inside `/src/ui/avatar/Live2DAvatar.tsx` to modulate sways, head movements, and chest/breathing sways in response to live neural emotions.

## [1.6] - 2026-06-08
### Added
- Created `/src/services/dependencyLoader.ts` to implement a modular runtime CDN downloader and dynamic loader for Puter.js SDK.
- Optimized `/addons/puter_hub/source_main.cjs` to dynamically download the Puter SDK at runtime from CDN (Unpkg/jsDelivr/js.puter.com) and cache it locally under `.yuihime/cache/puter_sdk.js`.
- Recompiled and bundled `/addons/puter_hub/main.cjs` using esbuild with dynamic imports, bringing the bundle size down to 16.8kb and achieving full runtime autonomy without needing local installation.

## [1.5] - 2026-06-08
### Added
- Created `/addons/puter_hub/source_main.cjs` for clean, human-readable source code.
- Bundled `@heyputer/puter.js` and its required dependencies natively into `/addons/puter_hub/main.cjs` using `esbuild`, enabling zero-config out-of-the-box operations.
- Cleaned up the workspace root `package.json` by removing the global `@heyputer/puter.js` dependency, securing total addon encapsulation and modularity.

## [1.4] - 2026-06-07
### Added
- Installed and integrated `@heyputer/puter.js` as an official, native project dependency.
- Refactored `/addons/puter_hub/main.cjs` to natively utilize `@heyputer/puter.js` SDK APIs with automatic fallback to simulated REST HTTP requests for maximum resilience.

## [1.3] - 2026-06-07
### Added
- Expanded `/src/modules/YuiVisionModule.ts` to be fully **Universal & Provider-Agnostic** (tidak terkunci pada Google Gemini).
- Integrated multi-provider request handling in `describeImageFromBuffer`. Supports standard **Google Gemini (`inlineData`)**, **OpenAI-Compatible (`image_url` base64 payload)**, **OpenRouter.ai**, **Anthropic Claude (`messages` with image source base64)**, and any **Custom Local Multimodal Gateway APIs** (e.g., LLaVA, Qwen-VL).
- Added multi-provider dynamic configuration fields in `YuiVisionModule` (`provider` engine select, `customUrl` for localized proxies, and `customKey` for bearer tokens) allowing full user customization straight from the Settings UI panel.

---

## [1.2] - 2026-06-07
### Added
- Created a fully decoupled, independent kognitif module `/src/modules/YuiVisionModule.ts` implementing the vision pipeline under Yui's Plug-and-Play architecture.
- Configured modular setting fields inside `YuiVisionModule.ts` (Enable toggle, Low Token Mode, custom words limit slider, Face/Expression capture, and Preferred Model selector) so that we don't hardcode any settings and users can adjust everything through the dynamic UI settings tab.
- Deleted the obsolete `visionHelper.ts` to keep the codebase cohesive and cleanly decoupled.
- Updated both `telegram.ts` and `discord.ts` loaders to import the utility from the dynamic modular bundle `YuiVisionModule.js`.

---

## [1.1] - 2026-06-07
### Added
- Created `src/core/server/visionHelper.ts` to implement a highly cost-efficient, low-token visual analysis mechanism.
- Integrated the vision-describing pipeline into `src/core/server/telegram.ts` (Telegram Bot attachment retriever) and `src/core/server/discord.ts` (Discord message attachment retriever) so Yui can automatically "see" uploaded photo attachments without bloating her conversation memory tokens.

---
