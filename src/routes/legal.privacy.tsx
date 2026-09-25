// FINAL PRODUCT DRAFT — requires Indonesian legal counsel sign-off before public commercial launch.
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Kebijakan Privasi · NANTI" },
      {
        name: "description",
        content: "Kebijakan Privasi NANTI dan cara NANTI memproses data pribadi.",
      },
    ],
  }),
  component: PrivacyPage,
});

export function PrivacyPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="eyebrow text-[var(--accent-emerald)]">Legal</p>
        <h1 className="display-lg mt-5 text-foreground">Kebijakan Privasi</h1>
        <p className="mt-5 text-[14px] text-muted-foreground">
          Terakhir diperbarui: 25 September 2026
        </p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              1. Siapa yang mengendalikan data
            </h2>
            <p>
              NANTI (&quot;kami&quot;) bertindak sebagai pengendali data pribadi untuk data yang
              diproses guna menyediakan layanan NANTI. Pertanyaan atau permintaan terkait privasi
              dapat dikirim ke{" "}
              <a
                href="mailto:privacy@nanti.app"
                className="text-[var(--accent-emerald)] underline underline-offset-2"
              >
                privacy@nanti.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              2. Data yang kami proses
            </h2>
            <p>Kami dapat memproses:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>data akun seperti nama, email, dan pengaturan pengguna;</li>
              <li>
                percakapan, teks, dan screenshot yang kamu pilih untuk ditempel atau diunggah;
              </li>
              <li>
                hasil terstruktur seperti tugas, komitmen, tanggal, orang, proyek, reminder, dan
                Waiting items;
              </li>
              <li>
                data kalender yang kamu izinkan melalui Google Calendar, termasuk judul, waktu, dan
                konteks acara yang diperlukan untuk fitur jadwal;
              </li>
              <li>
                data teknis untuk push notification seperti subscription endpoint dan kunci
                perangkat yang diperlukan untuk pengiriman;
              </li>
              <li>
                data operasional seperti event penggunaan, status pengiriman, error, dan log
                keamanan yang diperlukan untuk menjaga layanan tetap berjalan.
              </li>
            </ul>
            <p className="mt-3">
              Konten yang kamu kirim dapat memuat data pribadi orang lain. Kamu harus memastikan
              bahwa kamu memiliki dasar yang sah untuk membagikan dan memproses data tersebut.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              3. Dari mana data berasal
            </h2>
            <p>
              Data terutama berasal dari kamu, perangkatmu, dan integrasi yang kamu pilih untuk
              hubungkan. NANTI tidak secara otomatis membaca seluruh riwayat WhatsApp kamu. Untuk
              versi peluncuran saat ini, percakapan dianalisis ketika kamu menempel teks atau
              mengunggah screenshot ke NANTI.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              4. Tujuan dan dasar pemrosesan
            </h2>
            <p>Kami memproses data untuk:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>menjalankan akun dan memberikan fitur yang kamu minta;</li>
              <li>mengekstrak tugas, komitmen, tanggal, orang, dan konteks menggunakan AI;</li>
              <li>memberikan reminder, briefing, Waiting/follow-up, dan konteks kalender;</li>
              <li>mengamankan akun, mencegah penyalahgunaan, dan mendiagnosis kegagalan;</li>
              <li>memenuhi kewajiban hukum dan menanggapi permintaan hak subjek data.</li>
            </ul>
            <p className="mt-3">
              Dasar pemrosesan dapat berupa pelaksanaan layanan yang kamu minta, persetujuan yang
              kamu berikan untuk fitur opsional, kepentingan sah yang diperbolehkan hukum untuk
              keamanan dan keandalan layanan, serta kewajiban hukum yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              5. Pemrosesan AI
            </h2>
            <p>
              NANTI menggunakan Google Gemini untuk fitur AI. Input yang relevan dapat dikirim ke
              Google untuk menghasilkan ekstraksi atau jawaban. NANTI tidak secara sukarela
              membagikan dataset percakapan pengguna kepada Google untuk pelatihan model.
            </p>
            <p className="mt-3">
              Penanganan prompt dan respons oleh Google bergantung pada tier proyek Gemini yang
              digunakan. Sebelum pendaftaran publik dibuka, deployment produksi NANTI diwajibkan
              memakai proyek Gemini dengan billing/paid-tier data treatment. Jika konfigurasi atau
              praktik penyedia berubah secara material, kebijakan ini akan diperbarui.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              6. Penyedia layanan
            </h2>
            <p>Kami menggunakan penyedia yang diperlukan untuk menjalankan layanan, termasuk:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                <strong>Supabase</strong> untuk database dan autentikasi;
              </li>
              <li>
                <strong>Google Gemini</strong> untuk pemrosesan AI;
              </li>
              <li>
                <strong>Google Calendar API</strong> untuk integrasi kalender opsional;
              </li>
              <li>
                <strong>Vercel</strong> untuk hosting dan compute aplikasi;
              </li>
              <li>
                <strong>Have I Been Pwned Pwned Passwords</strong> untuk pemeriksaan password
                bocor menggunakan hash-prefix k-anonymity, bukan password utuh.
              </li>
            </ul>
            <p className="mt-3">
              Penyedia memproses data sesuai fungsi yang kami gunakan dan ketentuan yang berlaku
              pada layanan mereka.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              7. Pemrosesan lintas negara
            </h2>
            <p>
              Sebagian penyedia layanan dapat memproses atau menyimpan data di luar Indonesia.
              Untuk transfer lintas negara, NANTI akan menerapkan dasar dan pelindungan yang
              diwajibkan hukum Indonesia, termasuk pelindungan kontraktual, teknis, atau persetujuan
              jika diperlukan.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              8. Retensi
            </h2>
            <p>
              Data akun dan memori kerja disimpan selama akun aktif atau selama masih diperlukan
              untuk tujuan layanan. Saat kamu menghapus akun, NANTI memulai penghapusan data
              milik akun dari sistem aktif. Salinan terbatas dapat tetap berada sementara pada
              backup, log keamanan, atau sistem penyedia sesuai siklus retensi mereka dan kewajiban
              hukum yang berlaku, kemudian dihapus atau dibuat tidak dapat dikaitkan lagi sesuai
              proses yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              9. Keamanan
            </h2>
            <p>
              Kami menggunakan kontrol akses berbasis akun, row-level security pada database,
              koneksi terenkripsi, pembatasan akses service credentials, dan langkah operasional
              lain untuk melindungi data. Tidak ada sistem yang sepenuhnya bebas risiko, sehingga
              kami tidak dapat menjamin keamanan absolut.
            </p>
            <p className="mt-3">
              Jika terjadi kegagalan pelindungan data pribadi yang mewajibkan pemberitahuan, kami
              akan melakukan penanganan dan pemberitahuan sesuai jangka waktu dan persyaratan hukum
              yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              10. Hak kamu
            </h2>
            <p>
              Sesuai hukum yang berlaku, kamu dapat memiliki hak untuk mengakses, memperoleh salinan,
              memperbaiki, melengkapi, menghapus, menarik persetujuan, membatasi pemrosesan, dan
              mengajukan keberatan atau permintaan terkait pemrosesan otomatis. NANTI menyediakan
              ekspor data dan penghapusan akun melalui Settings untuk sebagian hak tersebut.
            </p>
            <p className="mt-3">
              Untuk permintaan lain, hubungi{" "}
              <a
                href="mailto:privacy@nanti.app"
                className="text-[var(--accent-emerald)] underline underline-offset-2"
              >
                privacy@nanti.app
              </a>
              . Kami dapat meminta verifikasi identitas sebelum memenuhi permintaan.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              11. Keputusan otomatis
            </h2>
            <p>
              NANTI menggunakan AI untuk menyarankan struktur tugas dan reminder, tetapi pengguna
              dapat mengedit, mengabaikan, menjadwal ulang, atau menghapus hasil tersebut. NANTI
              tidak dirancang untuk membuat keputusan otomatis yang menimbulkan akibat hukum atau
              dampak signifikan terhadap seseorang.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              12. Penyimpanan lokal dan cookie
            </h2>
            <p>
              NANTI dapat menggunakan cookie atau penyimpanan browser yang diperlukan untuk sesi
              login, keamanan, dan preferensi aplikasi. NANTI tidak menjual data kepada pengiklan
              dan tidak menggunakan cookie iklan pihak ketiga sebagai bagian dari produk inti saat
              ini.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              13. Pengguna di bawah umur
            </h2>
            <p>
              NANTI ditujukan untuk pengguna berusia 18 tahun atau lebih. Jangan membuat akun atau
              mengirimkan data anak melalui NANTI kecuali kamu memiliki kewenangan dan dasar hukum
              yang sesuai serta pemrosesan tersebut memang diperlukan.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              14. Perubahan Kebijakan
            </h2>
            <p>
              Kami dapat memperbarui Kebijakan ini karena perubahan produk, penyedia, atau hukum.
              Perubahan material akan diberitahukan melalui layanan atau sarana kontak yang tersedia
              jika diwajibkan hukum.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              15. Kontak dan dokumen terkait
            </h2>
            <p>
              Pertanyaan privasi dapat dikirim ke{" "}
              <a
                href="mailto:privacy@nanti.app"
                className="text-[var(--accent-emerald)] underline underline-offset-2"
              >
                privacy@nanti.app
              </a>
              . Lihat juga{" "}
              <Link
                to="/legal/terms"
                className="text-[var(--accent-emerald)] underline underline-offset-2"
              >
                Ketentuan Layanan
              </Link>
              .
            </p>
          </section>
        </div>
      </section>
    </MarketingLayout>
  );
}
