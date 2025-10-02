const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const Pengumuman = require("./Pengumuman");
const User = require("./User"); // <-- tambahkan import User

class Komentar extends Model {}

Komentar.init(
  {
    id_komentar: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_pengumuman: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "pengumuman",
        key: "id_pengumuman",
      },
      onDelete: "CASCADE",
    },
    komentar: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    id_created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",       // pastikan tabel users ada
        key: "id",            // sesuaikan dengan primary key di tabel users
      },
      onDelete: "CASCADE",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Komentar",
    tableName: "komentar",
    timestamps: false,
  }
);

module.exports = Komentar;
