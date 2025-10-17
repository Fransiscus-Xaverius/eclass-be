const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

class Nilai extends Model {}

Nilai.init(
  {
    id_nilai: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    id_kelas_tahun_ajaran: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "kelas_tahun_ajaran",
        key: "id_kelas_tahun_ajaran",
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
    id_modul: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "modul",
        key: "id_modul",
      },
      onDelete: "SET NULL",
    },
    id_ujian: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // foreign key akan ditambahkan nanti setelah tabel ujian dibuat
    },
    nama: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nilai: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Nilai minimal adalah 0",
        },
        max: {
          args: [100],
          msg: "Nilai maksimal adalah 100",
        },
      },
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
    modelName: "Nilai",
    tableName: "nilai",
    timestamps: false,
    name: {
      singular: "Nilai",
      plural: "Nilai",
    },
  }
);

module.exports = Nilai;
