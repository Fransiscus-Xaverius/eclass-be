const express = require("express");
const router = express.Router();
const Nilai = require("../model/Nilai");
const User = require("../model/User");
const KelasTahunAjaran = require("../model/KelasTahunAjaran");
const { authenticateToken } = require("../middleware/auth");
const Modul = require("../model/Modul");
const KelasSiswa = require("../model/KelasSiswa");
const Pelajaran = require("../model/Pelajaran");

// ================== CREATE (Single or Multiple) ==================
router.post("/", authenticateToken, async (req, res) => {
  try {
    let data = req.body.data || req.body;

    if (!data) {
      return res.status(400).send({ message: "Data tidak boleh kosong" });
    }

    // Pastikan data selalu array
    if (!Array.isArray(data)) {
      data = [data];
    }

    // Validasi nilai antara 0–100
    for (const n of data) {
      if (n.nilai < 0 || n.nilai > 100) {
        return res.status(400).send({
          message: `Nilai untuk siswa ${n.nama || n.id_siswa} harus antara 0 dan 100`,
        });
      }
    }

    const created = await Nilai.bulkCreate(data, { returning: true });
    return res.status(201).send({
      message: "Berhasil menambahkan data nilai",
      data: created,
    });
  } catch (err) {
    console.error("Create nilai error:", err);
    return res
      .status(500)
      .send({ message: "Terjadi kesalahan", error: err.message });
  }
});

// ================== UPDATE (Single or Multiple) ==================
router.put("/", authenticateToken, async (req, res) => {
  try {
    let data = Array.isArray(req.body) ? req.body : [req.body];

    if (data.length === 0) {
      return res.status(400).send({ message: "Data tidak boleh kosong" });
    }

    for (const n of data) {
      if (typeof n.nilai !== "number" || n.nilai < 0 || n.nilai > 100) {
        return res.status(400).send({
          message: `Nilai untuk siswa ${n.nama || n.id_siswa} harus antara 0 dan 100`,
        });
      }

      if (!n.id_nilai) {
        console.warn(`Lewati siswa ${n.nama || n.id_siswa}, tidak ada id_nilai`);
        continue;
      }

      await Nilai.update(
        {
          id_kelas_tahun_ajaran: n.id_kelas_tahun_ajaran,
          id_siswa: n.id_siswa,
          id_modul: n.id_modul || null,
          id_ujian: n.id_ujian || null,
          nama: n.nama,
          nilai: n.nilai,
        },
        { where: { id_nilai: n.id_nilai } }
      );
    }

    return res.status(200).send({ message: "Berhasil memperbarui data nilai" });
  } catch (err) {
    console.error("Update nilai error:", err);
    return res.status(500).send({
      message: "Terjadi kesalahan",
      error: err.message,
    });
  }
});

// ================== GET ALL ==================
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { id_kelas_tahun_ajaran, id_modul, id_ujian } = req.query;
    const whereClause = { deleted_at: null };

    if (id_kelas_tahun_ajaran)
      whereClause.id_kelas_tahun_ajaran = id_kelas_tahun_ajaran;

    if (id_modul) whereClause.id_modul = id_modul;
    if (id_ujian) whereClause.id_ujian = id_ujian;

    const list = await Nilai.findAll({
      where: whereClause,
      include: [
        { model: User, as: "siswa", attributes: ["id_user", "nama", "email"] },
        { model: KelasTahunAjaran, as: "kelasTahunAjaran" },
      ],
      order: [["id_nilai", "DESC"]],
    });

    return res.status(200).send({
      message: "success",
      data: list,
    });
  } catch (err) {
    console.error("Get all nilai error:", err);
    return res
      .status(500)
      .send({ message: "Terjadi kesalahan", error: err.message });
  }
});

// ================== GET NILAI BY KELAS (UNTUK GURU) ==================
router.get("/guru/:id_kelas_tahun_ajaran", authenticateToken, async (req, res) => {
  try {
    const { id_kelas_tahun_ajaran } = req.params;

    // Ambil semua siswa di kelas tersebut
    const kelasData = await KelasTahunAjaran.findByPk(id_kelas_tahun_ajaran, {
      include: [
        {
          model: KelasSiswa,
          as: "SiswaKelas",
          include: [
            {
              model: User,
              as: "Siswa",
              attributes: ["id_user", "nama"],
            },
          ],
        },
      ],
    });

    if (!kelasData) {
      return res.status(404).send({ message: "Kelas tidak ditemukan" });
    }

    // Ambil siswa unik (hindari duplikasi id_user)
    const siswaList = [
      ...new Map(
        (kelasData.SiswaKelas || [])
          .map((ks) => ks.Siswa)
          .filter(Boolean)
          .map((s) => [s.id_user, s])
      ).values(),
    ];

    // Ambil semua modul (termasuk ujian) yang terkait dengan kelas tersebut
    const modulList = await Modul.findAll({
      where: { id_kelas_tahun_ajaran, deleted_at: null },
      attributes: ["id_modul", "jenis_modul", "nama_modul"],
      order: [["id_modul", "ASC"]],
    });

    // Ambil semua nilai
    const listNilai = await Nilai.findAll({
      where: { id_kelas_tahun_ajaran, deleted_at: null },
      include: [
        {
          model: User,
          as: "siswa",
          attributes: ["id_user", "nama"],
        },
        {
          model: Modul,
          as: "modul",
          attributes: ["id_modul"],
        },
      ],
    });

    // Siapkan peta nilai per siswa & modul
    const nilaiMap = {};
    for (const n of listNilai) {
      const idUser = n.siswa?.id_user;
      const idModul = n.modul?.id_modul;
      if (idUser && idModul) {
        if (!nilaiMap[idUser]) nilaiMap[idUser] = {};
        nilaiMap[idUser][idModul] = n.nilai;
      }
    }

    // Buat header tabel
    const headers = [
      { field: "nama", label: "Nama Siswa", width: "300px" },
      ...modulList.map((m) => ({
        field: `modul_${m.id_modul}`,
        label: m.jenis_modul || m.nama_modul || `Modul ${m.id_modul}`,
        width: "150px",
      })),
    ];

    // Buat rows per siswa
    const rows = siswaList.map((s) => {
      const row = { nama: s.nama };
      for (const m of modulList) {
        row[`modul_${m.id_modul}`] = nilaiMap[s.id_user]?.[m.id_modul] ?? "-";
      }
      return row;
    });

    return res.status(200).send({
      message: "success",
      headers,
      rows,
    });
  } catch (err) {
    console.error("Get nilai guru error:", err);
    return res.status(500).send({
      message: "Terjadi kesalahan",
      error: err.message,
    });
  }
});

// ================== GET NILAI BY KELAS (UNTUK SISWA) ==================
router.get("/siswa/:id_tahun_ajaran", authenticateToken, async (req, res) => {
  try {
    const { id_tahun_ajaran } = req.params;
    const id_user = req.user.id_user;

    // Ambil semua kelas siswa di tahun ajaran tersebut
    const kelasSiswaList = await KelasSiswa.findAll({
      where: {
        id_siswa: id_user,
        id_tahun_ajaran,
      },
      include: [
        {
          model: KelasTahunAjaran,
          as: "KelasTahunAjaranRef", // sesuai alias di model
          include: [
            {
              model: Pelajaran,
              attributes: ["nama_pelajaran"],
            },
          ],
          attributes: ["id_kelas_tahun_ajaran", "id_pelajaran"],
        },
      ],
    });

    if (!kelasSiswaList.length) {
      return res
        .status(404)
        .send({ message: "Siswa belum terdaftar di kelas manapun untuk tahun ajaran ini" });
    }

    const kelasIds = kelasSiswaList.map(
      (k) => k.KelasTahunAjaranRef?.id_kelas_tahun_ajaran
    ).filter(Boolean);

    // Ambil semua modul untuk kelas yang dimaksud
    const modulList = await Modul.findAll({
      where: { id_kelas_tahun_ajaran: kelasIds, deleted_at: null },
      attributes: ["id_modul", "id_kelas_tahun_ajaran", "jenis_modul", "nama_modul"],
      order: [["id_modul", "ASC"]],
    });

    // Ambil nilai siswa untuk semua modul
    const nilaiList = await Nilai.findAll({
      where: {
        id_kelas_tahun_ajaran: kelasIds,
        id_siswa: id_user,
        deleted_at: null,
      },
      include: [
        {
          model: Modul,
          as: "modul",
          attributes: ["id_modul", "id_kelas_tahun_ajaran"],
        },
      ],
    });

    // Kelompokkan hasil berdasarkan nama pelajaran
    const hasil = {};

    for (const kelas of kelasSiswaList) {
      const kelasTA = kelas.KelasTahunAjaranRef;
      if (!kelasTA) continue;

      const idKelasTA = kelasTA.id_kelas_tahun_ajaran;
      const namaPelajaran = kelasTA.Pelajaran?.nama_pelajaran || "Tanpa Nama";

      // Ambil semua modul pada kelas ini
      const modulKelas = modulList.filter((m) => m.id_kelas_tahun_ajaran === idKelasTA);

      // Buat header
      const headers = modulKelas.map((m) => ({
        field: `modul_${m.id_modul}`,
        label: m.jenis_modul || m.nama_modul || `Modul ${m.id_modul}`,
        width: "150px",
      }));

      // Buat row nilai
      const row = {};
      for (const m of modulKelas) {
        const nilai = nilaiList.find((n) => n.id_modul === m.id_modul);
        row[`modul_${m.id_modul}`] = nilai ? nilai.nilai : "-";
      }

      hasil[namaPelajaran] = {
        headers,
        rows: [row],
      };
    }

    // Return hasil
    return res.status(200).send({
      message: "success",
      ...hasil,
    });
  } catch (err) {
    console.error("Get nilai siswa error:", err);
    return res.status(500).send({
      message: "Terjadi kesalahan",
      error: err.message,
    });
  }
});

// ================== GET BY ID ==================
router.get("/:id_nilai", authenticateToken, async (req, res) => {
  try {
    const { id_nilai } = req.params;

    const nilai = await Nilai.findOne({
      where: { id_nilai, deleted_at: null },
      include: [
        { model: User, as: "siswa", attributes: ["id_user", "nama", "email"] },
        { model: KelasTahunAjaran, as: "kelasTahunAjaran" },
      ],
    });

    if (!nilai) {
      return res.status(404).send({ message: "Data nilai tidak ditemukan" });
    }

    return res.status(200).send({ message: "success", data: nilai });
  } catch (err) {
    console.error("Get nilai by id error:", err);
    return res
      .status(500)
      .send({ message: "Terjadi kesalahan", error: err.message });
  }
});

// ================== DELETE (Soft Delete) ==================
router.delete("/:id_nilai", authenticateToken, async (req, res) => {
  try {
    const { id_nilai } = req.params;
    const nilai = await Nilai.findByPk(id_nilai);

    if (!nilai) {
      return res.status(404).send({ message: "Data nilai tidak ditemukan" });
    }

    await nilai.update({ deleted_at: new Date() });

    return res.status(200).send({ message: "Berhasil menghapus data nilai" });
  } catch (err) {
    console.error("Delete nilai error:", err);
    return res
      .status(500)
      .send({ message: "Terjadi kesalahan", error: err.message });
  }
});

module.exports = router;
