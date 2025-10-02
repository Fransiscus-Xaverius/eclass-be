const express = require("express");
const router = express.Router();

const Pelajaran = require("../model/Pelajaran");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

// ========================== CREATE ==========================
router.post(
  "/",
  authenticateToken,
  authorizeRole(["Admin"]),
  async (req, res) => {
    try {
      const { nama_pelajaran, kode_pelajaran } = req.body;

      if (!nama_pelajaran) {
        return res.status(400).send({ message: "Nama pelajaran wajib diisi" });
      }

      const pelajaran = await Pelajaran.create({
        nama_pelajaran,
        kode_pelajaran: kode_pelajaran || null, // boleh null
        created_at: new Date(),
        updated_at: new Date(),
      });

      return res
        .status(201)
        .send({ message: "Pelajaran berhasil dibuat", pelajaran });
    } catch (err) {
      return res
        .status(500)
        .send({ message: "Terjadi kesalahan", error: err.message });
    }
  }
);

// ========================== GET ALL ==========================
router.get("/", authenticateToken, async (req, res) => {
  try {
    const pelajaran = await Pelajaran.findAll({
      attributes: { exclude: ["deleted_at"] },
    });

    res.json({
      message: "Berhasil ambil data pelajaran",
      data: pelajaran,
    });
  } catch (err) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: err.message,
    });
  }
});

// ========================== GET BY ID ==========================
router.get("/:id_pelajaran", authenticateToken, async (req, res) => {
  try {
    const { id_pelajaran } = req.params;
    const pelajaran = await Pelajaran.findByPk(id_pelajaran);

    if (!pelajaran) {
      return res.status(404).send({ message: "Pelajaran tidak ditemukan" });
    }

    return res.status(200).send({ message: "success", data: pelajaran });
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Terjadi kesalahan", error: err.message });
  }
});

// ========================== UPDATE ==========================
router.put(
  "/:id_pelajaran",
  authenticateToken,
  authorizeRole(["Admin"]),
  async (req, res) => {
    try {
      const { id_pelajaran } = req.params;
      const pelajaran = await Pelajaran.findByPk(id_pelajaran);

      if (!pelajaran) {
        return res.status(404).send({ message: "Pelajaran tidak ditemukan" });
      }

      const updateData = {
        ...req.body,
        updated_at: new Date(),
      };

      await pelajaran.update(updateData);

      return res
        .status(200)
        .send({ message: "Pelajaran berhasil diupdate", pelajaran });
    } catch (err) {
      return res
        .status(500)
        .send({ message: "Terjadi kesalahan", error: err.message });
    }
  }
);

// ========================== DELETE ==========================
router.delete(
  "/:id_pelajaran",
  authenticateToken,
  authorizeRole(["Admin"]),
  async (req, res) => {
    try {
      const { id_pelajaran } = req.params;
      const pelajaran = await Pelajaran.findByPk(id_pelajaran);

      if (!pelajaran) {
        return res.status(404).send({ message: "Pelajaran tidak ditemukan" });
      }

      await pelajaran.destroy();

      return res.status(200).send({ message: "Pelajaran berhasil dihapus" });
    } catch (err) {
      return res
        .status(500)
        .send({ message: "Terjadi kesalahan", error: err.message });
    }
  }
);

module.exports = router;
