const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

class KelasSiswa extends Model {}

KelasSiswa.init(
  {
    id_kelas_siswa: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    id_kelas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "kelas",
        key: "id_kelas",
      },
      onDelete: "CASCADE",
    },
    id_tahun_ajaran: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tahun_ajaran",
        key: "id_tahun_ajaran",
      },
      onDelete: "CASCADE",
    },
    id_siswa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id_user",
      },
      onDelete: "CASCADE",
    },
    rapor_tengah_ganjil: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rapor_akhir_ganjil: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rapor_tengah_genap: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rapor_akhir_genap: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "KelasSiswa",
    tableName: "kelas_siswa",
    timestamps: false,
    name: {
      singular: "KelasSiswa",
      plural: "KelasSiswa",
    },
  }
);

module.exports = KelasSiswa;
