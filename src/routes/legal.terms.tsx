// FINAL PRODUCT DRAFT — requires Indonesian legal counsel sign-off before public commercial launch.
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/nanti/marketing";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Ketentuan Layanan · NANTI" },
      {
        name: "description",
        content: "Ketentuan Layanan NANTI untuk penggunaan aplikasi dan fitur AI.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="eyebrow text-[var(--accent-emerald)]">Legal</p>
        <h1 className="display-lg mt-5 text-foreground">Ketentuan Layanan</h1>
        <p className="mt-5 text-[14px] text-muted-foreground">
          Terakhir diperbarui: 25 September 2026
        </p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              1. Persetujuan dan kelayakan
            </h2>
            <p>
              Dengan membuat akun atau menggunakan NANTI, kamu menyetujui Ketentuan Layanan ini dan
              Kebijakan Privasi NANTI. NANTI ditujukan untuk pengguna berusia 18 tahun atau lebih.
              Jika kamu menggunakan NANTI untuk organisasi, kamu menyatakan memiliki kewenangan untuk
              menggunakan layanan atas nama organisasi tersebut.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              2. Apa yang dilakukan NANTI
            </h2>
            <p>
              NANTI adalah asisten kerja berbasis AI untuk membantu mengubah percakapan dan input
              yang kamu pilih menjadi tugas, komitmen, pengingat, follow-up, Waiting items, dan
              konteks kerja. NANTI dapat menerima teks yang kamu tempel serta screenshot yang kamu
              unggah. NANTI tidak membaca seluruh akun WhatsApp kamu secara otomatis.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              3. AI dapat salah
            </h2>
            <p>
              Hasil AI, klasifikasi, tanggal, reminder, ringkasan, dan saran NANTI dapat keliru,
              tidak lengkap, atau salah memahami konteks. Kamu tetap bertanggung jawab untuk
              memeriksa informasi penting dan mengambil keputusan sendiri. Jangan mengandalkan NANTI
              sebagai satu-satunya sarana untuk tenggat kritis, keselamatan, kewajiban hukum,
              keuangan, medis, atau keadaan darurat.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              4. Konten yang kamu kirim
            </h2>
            <p>
              Kamu tetap memiliki hak atas konten yang kamu kirim. Kamu memberi NANTI izin terbatas
              untuk menyimpan, memproses, menyalin secara teknis, dan mengirimkan konten tersebut ke
              penyedia layanan yang diperlukan semata-mata untuk menjalankan fitur yang kamu minta.
              Kamu bertanggung jawab memastikan bahwa kamu berhak membagikan percakapan, screenshot,
              data kontak, atau data milik orang lain kepada NANTI.
            </p>
            <p className="mt-3">
              Jangan mengunggah data pribadi sensitif atau rahasia yang tidak diperlukan untuk
              tujuan penggunaan NANTI, terutama jika kamu tidak memiliki dasar hukum atau izin yang
              sesuai untuk memprosesnya.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              5. Akun dan keamanan
            </h2>
            <p>
              Kamu bertanggung jawab menjaga keamanan akun dan perangkatmu serta memberikan informasi
              akun yang akurat. Jangan membagikan password atau akses akun. NANTI dapat meminta
              verifikasi tambahan, membatasi akses, atau menangguhkan akun jika terdapat indikasi
              penyalahgunaan, akses tidak sah, atau risiko keamanan.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              6. Integrasi pihak ketiga
            </h2>
            <p>
              Fitur tertentu menggunakan layanan pihak ketiga seperti Supabase, Vercel, Google
              Gemini, dan Google Calendar. Google Calendar bersifat opsional dan akses kalender yang
              diminta NANTI digunakan untuk memberi konteks jadwal. Ketersediaan integrasi dapat
              berubah mengikuti kebijakan atau gangguan penyedia terkait.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              7. Penggunaan yang dilarang
            </h2>
            <p>Kamu tidak boleh menggunakan NANTI untuk:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>melanggar hukum, hak privasi, hak kekayaan intelektual, atau hak pihak lain;</li>
              <li>mengakses, menguji, atau mengganggu sistem tanpa izin;</li>
              <li>menyebarkan malware, spam, penipuan, atau konten ilegal;</li>
              <li>mengunggah data pihak lain yang tidak berhak kamu proses atau bagikan;</li>
              <li>menghindari pembatasan keamanan, kuota, atau kontrol akses NANTI.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              8. Pengingat dan notifikasi
            </h2>
            <p>
              Pengingat, push notification, dan briefing merupakan fitur bantuan. Pengiriman dapat
              terlambat atau gagal karena koneksi, browser, perangkat, izin notifikasi, sistem
              operasi, atau layanan pihak ketiga. Untuk kewajiban penting, gunakan sistem cadangan
              yang sesuai.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              9. Data, ekspor, dan penghapusan akun
            </h2>
            <p>
              Kamu dapat mengekspor data NANTI dan meminta penghapusan akun melalui Settings.
              Pengolahan data lebih lanjut dijelaskan dalam{" "}
              <Link
                to="/legal/privacy"
                className="text-[var(--accent-emerald)] underline underline-offset-2"
              >
                Kebijakan Privasi
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              10. Kekayaan intelektual NANTI
            </h2>
            <p>
              Perangkat lunak, desain, merek, dokumentasi, dan materi NANTI selain konten pengguna
              dilindungi oleh hak yang berlaku. Ketentuan ini tidak memindahkan kepemilikan atas
              teknologi atau merek NANTI kepada pengguna.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              11. Perubahan dan ketersediaan layanan
            </h2>
            <p>
              NANTI dapat memperbaiki, menambah, mengurangi, atau menghentikan fitur untuk alasan
              produk, keamanan, hukum, atau operasional. Kami berupaya menjaga layanan tetap tersedia,
              tetapi tidak menjamin layanan tanpa gangguan atau kesalahan.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              12. Penghentian penggunaan
            </h2>
            <p>
              Kamu dapat berhenti menggunakan NANTI dan menghapus akun kapan saja. NANTI dapat
              membatasi atau menghentikan akses jika kamu melanggar Ketentuan ini, menimbulkan risiko
              keamanan, atau jika diwajibkan oleh hukum.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              13. Penyangkalan jaminan dan tanggung jawab
            </h2>
            <p>
              Sejauh diizinkan hukum, NANTI disediakan sebagaimana adanya dan tidak menjamin bahwa
              setiap hasil AI, reminder, integrasi, atau informasi akan selalu akurat atau tersedia.
              Tidak ada bagian dari Ketentuan ini yang membatasi hak konsumen atau tanggung jawab
              yang tidak dapat dikesampingkan berdasarkan hukum yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              14. Hukum yang berlaku
            </h2>
            <p>
              Ketentuan ini diatur oleh hukum Republik Indonesia. Para pihak akan terlebih dahulu
              berupaya menyelesaikan perselisihan secara wajar dan itikad baik sebelum menggunakan
              mekanisme penyelesaian sengketa yang tersedia berdasarkan hukum Indonesia.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">
              15. Perubahan Ketentuan
            </h2>
            <p>
              Kami dapat memperbarui Ketentuan ini untuk mencerminkan perubahan layanan, hukum, atau
              risiko. Jika perubahan bersifat material, kami akan memberikan pemberitahuan yang
              wajar melalui layanan atau sarana kontak yang tersedia sebelum perubahan berlaku jika
              diwajibkan hukum.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-foreground">16. Kontak</h2>
            <p>
              Pertanyaan tentang Ketentuan ini dapat dikirim ke{" "}
              <a
                href="mailto:support@nanti.app"
                className="text-[var(--accent-emerald)] underline underline-offset-2"
              >
                support@nanti.app
              </a>
              .
            </p>
          </section>
        </div>
      </section>
    </MarketingLayout>
  );
}
