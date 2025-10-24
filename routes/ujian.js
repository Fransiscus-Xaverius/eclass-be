const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const Ujian = require("../model/Ujian");
const KelasTahunAjaran = require("../model/KelasTahunAjaran");
const KelasSiswa = require("../model/KelasSiswa");
const User = require("../model/User");
const Soal = require("../model/Soal");
const { authenticateToken, authorizeRole } = require("../middleware/auth");
const JawabanUjian = require("../model/JawabanUjian");
const Pelajaran = require("../model/Pelajaran");

const getImageUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/uploads/soal/${filename}`;
};

// ================== CREATE ==================
router.post("/", authenticateToken, authorizeRole(["Admin", "Guru"]), async (req, res) => {
  try {
    const { id_kelas_tahun_ajaran, jenis_ujian, list_siswa, start_date, end_date } = req.body;

    if (!id_kelas_tahun_ajaran || !jenis_ujian || !list_siswa || !start_date || !end_date) {
      return res.status(400).send({
        message: "Field wajib: id_kelas_tahun_ajaran, jenis_ujian, list_siswa, start_date, end_date",
      });
    }

    // Pastikan list_siswa berupa array
    let parsedList = list_siswa;
    if (typeof list_siswa === "string") {
      try {
        parsedList = JSON.parse(list_siswa);
      } catch {
        parsedList = [];
      }
    }
    if (!Array.isArray(parsedList) || parsedList.length === 0) {
      return res.status(400).send({ message: "Minimal harus ada 1 siswa di list_siswa" });
    }

    // Cek duplikat ujian
    const existing = await Ujian.findOne({
      where: {
        id_kelas_tahun_ajaran,
        jenis_ujian,
        deleted_at: null,
      },
    });

    if (existing) {
      return res.status(400).send({
        message: "Ujian dengan jenis yang sama sudah ada pada kelas ini",
      });
    }

    const ujian = await Ujian.create({
      id_kelas_tahun_ajaran,
      jenis_ujian,
      list_siswa: parsedList,
      start_date,
      end_date,
      id_created_by: req.user.id_user,
    });

    return res.status(201).send({
      message: "Ujian berhasil dibuat",
      data: ujian,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      message: "Terjadi kesalahan",
      error: error.message,
    });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { id_kelas_tahun_ajaran } = req.query;
    const userId = req.user?.id_user; // 🔹 ambil id user dari token
    const whereClause = { deleted_at: null };

    if (id_kelas_tahun_ajaran)
      whereClause.id_kelas_tahun_ajaran = id_kelas_tahun_ajaran;

    const ujianList = await Ujian.findAll({
      where: whereClause,
      include: [{ model: KelasTahunAjaran, as: "kelasTahunAjaran" }],
      order: [
        ["start_date", "DESC"],
        ["id_ujian", "DESC"],
      ],
    });

    const dataWithCount = await Promise.all(
      ujianList.map(async (ujian) => {
        const ujianJson = ujian.toJSON();

        // Hitung total siswa di kelas & tahun ajaran
        const totalSiswa = await KelasSiswa.count({
          where: {
            id_kelas: ujian.kelasTahunAjaran.id_kelas,
            id_tahun_ajaran: ujian.kelasTahunAjaran.id_tahun_ajaran,
            deleted_at: null,
          },
        });

        // Parse list siswa ujian
        let listSiswa = [];
        try {
          listSiswa = ujianJson.list_siswa
            ? JSON.parse(ujianJson.list_siswa)
            : [];
        } catch {
          listSiswa = [];
        }

        // Default
        let status = false;
        let notes = "Tidak terdaftar";

        // 🔹 Cek apakah user ini terdaftar dalam ujian
        const isUserTerdaftar = listSiswa.includes(userId);

        if (isUserTerdaftar) {
          // Hitung total soal untuk ujian ini
          const totalSoal = await Soal.count({
            where: { id_ujian: ujian.id_ujian, deleted_at: null },
          });

          // Hitung jumlah jawaban yang dibuat oleh user ini
          const jawabanCount = await JawabanUjian.count({
            include: [
              {
                model: Soal,
                as: "Soal",
                where: { id_ujian: ujian.id_ujian, deleted_at: null },
                attributes: [],
              },
            ],
            where: { id_user: userId, deleted_at: null },
          });

          // Jika user sudah jawab semua soal
          const sudahMengerjakan =
            totalSoal > 0 && jawabanCount >= totalSoal;

          if (sudahMengerjakan) {
            status = false;
            notes = "Sudah mengerjakan";
          } else {
            status = true;
            notes = null;
          }
        }

        return {
          ...ujianJson,
          totalSiswa,
          status,
          notes,
        };
      })
    );

    return res.status(200).send({ message: "success", data: dataWithCount });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ message: "Terjadi kesalahan", error: err.message });
  }
});

// ================== GET PERIKSA UJIAN ==================
router.get("/:id_ujian/periksa", authenticateToken, authorizeRole(["Guru", "Admin"]), async (req, res) => {
  try {
    const { id_ujian } = req.params;

    // Ambil ujian beserta relasi Kelas, Pelajaran & Soal
    const ujian = await Ujian.findOne({
      where: { id_ujian, deleted_at: null },
      include: [
        {
          model: KelasTahunAjaran,
          as: "kelasTahunAjaran",
          include: [
            {
              model: Pelajaran,
              as: "Pelajaran", 
              attributes: ["id_pelajaran", "nama_pelajaran"],
              required: false,
            },
          ],
        },
        {
          model: Soal,
          as: "soalList",
          where: { deleted_at: null },
          required: false,
          attributes: ["id_soal", "score", "jawaban_benar"],
        },
      ],
    });

    if (!ujian) {
      return res.status(404).send({ message: "Ujian tidak ditemukan" });
    }

    // Parse list siswa dari ujian
    let listSiswa = [];
    try {
      listSiswa = Array.isArray(ujian.list_siswa)
        ? ujian.list_siswa
        : JSON.parse(ujian.list_siswa || "[]");
    } catch {
      listSiswa = [];
    }

    if (listSiswa.length === 0) {
      return res.status(200).send({
        message: "success",
        data: {
          ujian,
          siswa: [],
        },
      });
    }

    // Ambil detail siswa
    const siswaList = await User.findAll({
      where: { id_user: listSiswa, deleted_at: null },
      attributes: ["id_user", "nis", "nisn", "nama"],
    });

    // Ambil semua jawaban ujian
    const jawabanList = await JawabanUjian.findAll({
      include: [
        {
          model: Soal,
          as: "Soal",
          where: { id_ujian, deleted_at: null },
          attributes: ["id_soal", "score", "jawaban_benar"],
        },
      ],
      where: { id_user: listSiswa, deleted_at: null },
    });

    // Hitung nilai total per siswa
    const nilaiMap = {};
    jawabanList.forEach((jawaban) => {
      const userId = jawaban.id_user;
      if (!nilaiMap[userId]) nilaiMap[userId] = 0;
      nilaiMap[userId] += jawaban.nilai || 0;
    });

    // Susun hasil akhir
    const hasil = siswaList.map((s) => ({
      id_user: s.id_user,
      nis: s.nis,
      nisn: s.nisn,
      nama: s.nama,
      nilai: nilaiMap[s.id_user] || 0,
    }));

    // Response akhir
    return res.status(200).send({
      message: "success",
      data: {
        ujian: {
          id_ujian: ujian.id_ujian,
          jenis_ujian: ujian.jenis_ujian,
          start_date: ujian.start_date,
          end_date: ujian.end_date,
          total_soal: ujian.soalList.length,
          kelas_tahun_ajaran: ujian.kelasTahunAjaran,
          nama_pelajaran: ujian.kelasTahunAjaran?.Pelajaran?.nama_pelajaran || null,
        },
        siswa: hasil,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      message: "Terjadi kesalahan",
      error: err.message,
    });
  }
});

// ================== GET BY ID ==================
router.get("/:id_ujian", authenticateToken, async (req, res) => {
  try {
    const { id_ujian } = req.params;
    const userRole = req.user?.role || null;
    const idUser = req.user?.id_user;

    const ujian = await Ujian.findOne({
      where: { id_ujian, deleted_at: null },
      include: [
        { model: KelasTahunAjaran, as: "kelasTahunAjaran" },
        {
          model: Soal,
          as: "soalList",
          attributes: [
            "id_soal",
            "jenis_soal",
            "text_soal",
            "list_jawaban",
            "jawaban_benar",
            "gambar",
            "score",
          ],
          where: { deleted_at: null },
          required: false,
        },
      ],
    });

    if (!ujian)
      return res.status(404).send({ message: "Ujian tidak ditemukan" });

    // Dapatkan daftar siswa dari list_siswa
    const siswaList = Array.isArray(ujian.list_siswa) ? ujian.list_siswa : [];
    const siswaDetail = await User.findAll({
      where: { id_user: siswaList },
      attributes: ["id_user", "nama", "email"],
    });

    // Hitung jumlah total soal
    const jumlahTotalSoal = (ujian.soalList || []).length;

    // Jika role = siswa, hitung jumlah soal dijawab oleh siswa tersebut
    let jumlahSoalDijawab = 0;
    if (userRole?.toLowerCase() === "siswa") {
      jumlahSoalDijawab = await JawabanUjian.count({
        where: {
          id_user: idUser,
          id_soal: ujian.soalList.map((s) => s.id_soal),
          deleted_at: null,
        },
      });
    }

    // Siapkan daftar soal (dengan URL gambar hanya untuk guru)
    let soalWithUrl = [];
    if (userRole?.toLowerCase() === "guru") {
      soalWithUrl = (ujian.soalList || []).map((soal) => ({
        ...soal.toJSON(),
        gambar_url: soal.gambar ? getImageUrl(req, soal.gambar) : null,
      }));
    }

    // Susun respons
    const responseData = {
      ...ujian.toJSON(),
      soalList: userRole?.toLowerCase() === "guru" ? soalWithUrl : undefined,
      jumlah_total_soal: jumlahTotalSoal,
      jumlah_soal_dijawab: jumlahSoalDijawab,
      jumlah_siswa: siswaDetail.length,
      siswa_detail: siswaDetail,
    };

    return res.status(200).send({
      message: "success",
      data: responseData,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ message: "Terjadi kesalahan", error: err.message });
  }
});

// ================== UPDATE ==================
router.put("/:id_ujian", authenticateToken, authorizeRole(["Admin", "Guru"]), async (req, res) => {
  try {
    const { id_ujian } = req.params;
    const ujian = await Ujian.findOne({ where: { id_ujian, deleted_at: null } });

    if (!ujian) return res.status(404).send({ message: "Ujian tidak ditemukan" });

    const { id_kelas_tahun_ajaran, jenis_ujian, list_siswa, start_date, end_date } = req.body;

    // Cek duplikat ujian
    if (
      (jenis_ujian && jenis_ujian !== ujian.jenis_ujian) ||
      (id_kelas_tahun_ajaran && id_kelas_tahun_ajaran !== ujian.id_kelas_tahun_ajaran)
    ) {
      const existing = await Ujian.findOne({
        where: {
          id_kelas_tahun_ajaran: id_kelas_tahun_ajaran || ujian.id_kelas_tahun_ajaran,
          jenis_ujian: jenis_ujian || ujian.jenis_ujian,
          id_ujian: { [Op.ne]: id_ujian },
          deleted_at: null,
        },
      });
      if (existing)
        return res.status(400).send({ message: "Ujian dengan jenis yang sama sudah ada pada kelas ini" });
    }

    let parsedList = list_siswa;
    if (typeof list_siswa === "string") {
      try {
        parsedList = JSON.parse(list_siswa);
      } catch {
        parsedList = ujian.list_siswa;
      }
    }

    await ujian.update({
      id_kelas_tahun_ajaran: id_kelas_tahun_ajaran || ujian.id_kelas_tahun_ajaran,
      jenis_ujian: jenis_ujian || ujian.jenis_ujian,
      list_siswa: parsedList || ujian.list_siswa,
      start_date: start_date || ujian.start_date,
      end_date: end_date || ujian.end_date,
      updated_at: new Date(),
    });

    return res.status(200).send({ message: "Ujian berhasil diperbarui", data: ujian });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Terjadi kesalahan", error: err.message });
  }
});

// ================== SOFT DELETE ==================
router.delete("/:id_ujian", authenticateToken, authorizeRole(["Admin", "Guru"]), async (req, res) => {
  try {
    const { id_ujian } = req.params;
    const ujian = await Ujian.findOne({ where: { id_ujian, deleted_at: null } });

    if (!ujian) return res.status(404).send({ message: "Ujian tidak ditemukan" });

    await ujian.update({ deleted_at: new Date() });

    return res.status(200).send({ message: "Ujian berhasil dihapus (soft delete)" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Terjadi kesalahan", error: err.message });
  }
});

module.exports = router;
