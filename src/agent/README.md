# Character Configuration

Berisi data mentah (Markdown) yang mendefinisikan jati diri, sejarah, dan instruksi sistem untuk Agent.

## File Utama

### 1. `character.md`
Mendefinisikan kepribadian, gaya bicara, kesukaan, dan ketidaksukaan. LLM menggunakan ini untuk menentukan "suara" dalam setiap respon.

### 2. `lore.md`
Dunia atau latar belakang cerita dari Agent. Digunakan untuk memberikan kedalaman pada percakapan yang bersifat naratif.

### 3. `system_prompt.md`
Instruksi teknis tingkat tinggi yang menentukan bagaimana Agent berperilaku sebagai sistem asisten/VTuber.

## Aturan Modifikasi
- **Consistency**: Jika mengubah kepribadian di `character.md`, pastikan tidak bertabrakan dengan batasan teknis di `system_prompt.md`.
- **Markdown structure**: Gunakan header (#, ##) dengan jelas karena Cortex memparse file ini untuk dimasukkan ke dalam prompt.
- **Language**: Secara default, gunakan bahasa yang diinginkan untuk output Agent (Indonesia/English).
