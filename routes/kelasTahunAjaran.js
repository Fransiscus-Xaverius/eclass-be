const express = require("express");
const router = express.Router();
const KelasTahunAjaran = require("../model/KelasTahunAjaran");
const Kelas = require("../model/Kelas");
const TahunAjaran = require("../model/TahunAjaran");
const Pelajaran = require("../model/Pelajaran");
const User = require("../model/User");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

// ================== CREATE ==================
router.post("/", authenticateToken, authorizeRole("Admin"), async (req, res) => {
  try {
    const { id_tahun_ajaran, id_kelas, id_pelajaran, guru_pengampu } = req.body;

    const newData = await KelasTahunAjaran.create({
      id_tahun_ajaran,
      id_kelas,
      id_pelajaran,
      guru_pengampu,
    });

    return res.status(201).send({ message: "success", data: newData });
  } catch (err) {
    return res.status(500).send({ message: "Terjadi kesalahan", error: err.message });
  }
});

// ================== GET ALL ==================
router.get("/", authenticateToken, async (req, res) => {
  try {
    const data = await KelasTahunAjaran.findAll({
      where: { deleted_at: null },
      include: [
        { model: Kelas, as: "kelas", attributes: ["id_kelas", "nama_kelas"] },
        { model: TahunAjaran, as: "tahunAjaran", attributes: ["id_tahun_ajaran", "nama", "semester"] },
        { model: Pelajaran, as: "pelajaran", attributes: ["id_pelajaran", "nama_pelajaran"] },
        { model: User, as: "guru", attributes: ["id_user", "nama"] },
      ],
    });

    return res.status(200).send({ message: "success", data });
  } catch (err) {
    return res.status(500).send({ message: "Terjadi kesalahan", error: err.message });
  }
});

// ================== GET BY ID ==================
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const data = await KelasTahunAjaran.findOne({
      where: { id_kelas_tahun_ajaran: req.params.id, deleted_at: null },
      include: [
        { model: Kelas, as: "kelas", attributes: ["id_kelas", "nama_kelas"] },
        { model: TahunAjaran, as: "tahunAjaran", attributes: ["id_tahun_ajaran", "nama", "semester"] },
        { model: Pelajaran, as: "pelajaran", attributes: ["id_pelajaran", "nama_pelajaran"] },
        { model: User, as: "guru", attributes: ["id_user", "nama"] },
      ],
    });

    if (!data) return res.status(404).send({ message: "Data tidak ditemukan" });

    return res.status(200).send({ message: "success", data });
  } catch (err) {
    return res.status(500).send({ message: "Terjadi kesalahan", error: err.message });
  }
});

// ================== UPDATE ==================
router.put("/:id", authenticateToken, authorizeRole("Admin"), async (req, res) => {
  try {
    const { id_tahun_ajaran, id_kelas, id_pelajaran, guru_pengampu } = req.body;

    const [updated] = await KelasTahunAjaran.update(
      { id_tahun_ajaran, id_kelas, id_pelajaran, guru_pengampu },
      { where: { id_kelas_tahun_ajaran: req.params.id } }
    );

    if (!updated) return res.status(404).send({ message: "Data tidak ditemukan" });

    return res.status(200).send({ message: "success" });
  } catch (err) {
    return res.status(500).send({ message: "Terjadi kesalahan", error: err.message });
  }
});

// ================== DELETE (Soft Delete) ==================
router.delete("/:id", authenticateToken, authorizeRole("Admin"), async (req, res) => {
  try {
    const [deleted] = await KelasTahunAjaran.update(
      { deleted_at: new Date() },
      { where: { id_kelas_tahun_ajaran: req.params.id } }
    );

    if (!deleted) return res.status(404).send({ message: "Data tidak ditemukan" });

    return res.status(200).send({ message: "success" });
  } catch (err) {
    return res.status(500).send({ message: "Terjadi kesalahan", error: err.message });
  }
});

module.exports = router;
