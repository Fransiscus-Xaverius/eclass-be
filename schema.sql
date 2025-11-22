-- Database Schema for E-Class System
-- Run this file to create all tables

USE eclass;

CREATE TABLE IF NOT EXISTS `users` (
  `id_user` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `nis` VARCHAR(20),
  `nisn` VARCHAR(20),
  `gender` TINYINT COMMENT '0 = Laki-laki, 1 = Perempuan',
  `tgl_lahir` VARCHAR(20),
  `tempat_lahir` VARCHAR(100),
  `agama` VARCHAR(50),
  `alamat` TEXT,
  `nama_ayah` VARCHAR(100),
  `nama_ibu` VARCHAR(100),
  `telp` VARCHAR(20),
  `telp_ortu` VARCHAR(20),
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1 = Aktif, 0 = Tidak Aktif',
  `profile_picture` TEXT,
  `otp_code` VARCHAR(255),
  `otp_expires` DATETIME,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `tahun_ajaran` (
  `id_tahun_ajaran` INT AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(50) NOT NULL,
  `is_aktif` TINYINT NOT NULL DEFAULT 0 COMMENT '1 = Aktif, 0 = Tidak Aktif',
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `kelas` (
  `id_kelas` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_kelas` VARCHAR(100) NOT NULL,
  `tingkat` VARCHAR(10) NOT NULL,
  `jurusan` VARCHAR(100) NOT NULL,
  `wali_kelas` INT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  FOREIGN KEY (`wali_kelas`) REFERENCES `users`(`id_user`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `pelajaran` (
  `id_pelajaran` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_pelajaran` VARCHAR(150) NOT NULL,
  `kode_pelajaran` VARCHAR(20),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `kelas_tahun_ajaran` (
  `id_kelas_tahun_ajaran` INT AUTO_INCREMENT PRIMARY KEY,
  `id_tahun_ajaran` INT NOT NULL,
  `id_kelas` INT NOT NULL,
  `id_pelajaran` INT NOT NULL,
  `guru_pengampu` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran`(`id_tahun_ajaran`),
  FOREIGN KEY (`id_kelas`) REFERENCES `kelas`(`id_kelas`),
  FOREIGN KEY (`id_pelajaran`) REFERENCES `pelajaran`(`id_pelajaran`),
  FOREIGN KEY (`guru_pengampu`) REFERENCES `users`(`id_user`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `pengumuman` (
  `id_pengumuman` INT AUTO_INCREMENT PRIMARY KEY,
  `judul` VARCHAR(200) NOT NULL,
  `isi` TEXT,
  `file` VARCHAR(255),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  `status` TINYINT NOT NULL DEFAULT 1,
  `id_kelas_tahun_ajaran` INT,
  FOREIGN KEY (`id_kelas_tahun_ajaran`) REFERENCES `kelas_tahun_ajaran`(`id_kelas_tahun_ajaran`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `komentar` (
  `id_komentar` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pengumuman` INT NOT NULL,
  `komentar` TEXT NOT NULL,
  `id_created_by` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  FOREIGN KEY (`id_pengumuman`) REFERENCES `pengumuman`(`id_pengumuman`) ON DELETE CASCADE,
  FOREIGN KEY (`id_created_by`) REFERENCES `users`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `jadwal_pelajaran` (
  `id_jadwal` INT AUTO_INCREMENT PRIMARY KEY,
  `id_kelas_tahun_ajaran` INT NOT NULL,
  `hari` ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu') NOT NULL,
  `jam_mulai` TIME NOT NULL,
  `jam_selesai` TIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_kelas_tahun_ajaran`) REFERENCES `kelas_tahun_ajaran`(`id_kelas_tahun_ajaran`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `kelas_siswa` (
  `id_kelas_siswa` INT AUTO_INCREMENT PRIMARY KEY,
  `id_kelas` INT NOT NULL,
  `id_tahun_ajaran` INT NOT NULL,
  `id_siswa` INT NOT NULL,
  `rapor_tengah_ganjil` TEXT,
  `rapor_akhir_ganjil` TEXT,
  `rapor_tengah_genap` TEXT,
  `rapor_akhir_genap` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  FOREIGN KEY (`id_kelas`) REFERENCES `kelas`(`id_kelas`) ON DELETE CASCADE,
  FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran`(`id_tahun_ajaran`) ON DELETE CASCADE,
  FOREIGN KEY (`id_siswa`) REFERENCES `users`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `materi` (
  `id_materi` INT AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(255) NOT NULL,
  `pertemuan` VARCHAR(255) NOT NULL,
  `deskripsi` TEXT,
  `file` TEXT,
  `id_kelas_tahun_ajaran` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  FOREIGN KEY (`id_kelas_tahun_ajaran`) REFERENCES `kelas_tahun_ajaran`(`id_kelas_tahun_ajaran`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `berita_acara` (
  `id_berita_acara` INT AUTO_INCREMENT PRIMARY KEY,
  `id_kelas_tahun_ajaran` INT NOT NULL,
  `id_created_by` INT NOT NULL,
  `judul` VARCHAR(255) NOT NULL,
  `deskripsi` TEXT,
  `tanggal` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_kelas_tahun_ajaran`) REFERENCES `kelas_tahun_ajaran`(`id_kelas_tahun_ajaran`),
  FOREIGN KEY (`id_created_by`) REFERENCES `users`(`id_user`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `presensi` (
  `id_presensi` INT AUTO_INCREMENT PRIMARY KEY,
  `id_berita_acara` INT NOT NULL,
  `id_siswa` INT NOT NULL,
  `status` ENUM('Hadir', 'Izin', 'Sakit', 'Alpha') NOT NULL DEFAULT 'Alpha',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_berita_acara`) REFERENCES `berita_acara`(`id_berita_acara`),
  FOREIGN KEY (`id_siswa`) REFERENCES `users`(`id_user`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `modul` (
  `id_modul` INT AUTO_INCREMENT PRIMARY KEY,
  `id_kelas_tahun_ajaran` INT NOT NULL,
  `nama_modul` VARCHAR(255) NOT NULL,
  `jenis_modul` VARCHAR(255) NOT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `keterangan` TEXT,
  `tipe_file_modul` VARCHAR(255) NOT NULL,
  `sifat_pengumpulan` VARCHAR(255) NOT NULL,
  `status_modul` VARCHAR(255) NOT NULL,
  `id_created_by` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  FOREIGN KEY (`id_kelas_tahun_ajaran`) REFERENCES `kelas_tahun_ajaran`(`id_kelas_tahun_ajaran`),
  FOREIGN KEY (`id_created_by`) REFERENCES `users`(`id_user`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `pengumpulan_modul` (
  `id_pengumpulan_modul` INT AUTO_INCREMENT PRIMARY KEY,
  `id_modul` INT NOT NULL,
  `id_siswa` INT NOT NULL,
  `file_pengumpulan` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  FOREIGN KEY (`id_modul`) REFERENCES `modul`(`id_modul`),
  FOREIGN KEY (`id_siswa`) REFERENCES `users`(`id_user`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `ujian` (
  `id_ujian` INT AUTO_INCREMENT PRIMARY KEY,
  `id_kelas_tahun_ajaran` INT NOT NULL,
  `jenis_ujian` VARCHAR(255) NOT NULL,
  `list_siswa` JSON NOT NULL COMMENT 'Array of id_user yang diizinkan ikut ujian',
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  FOREIGN KEY (`id_kelas_tahun_ajaran`) REFERENCES `kelas_tahun_ajaran`(`id_kelas_tahun_ajaran`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `soal` (
  `id_soal` INT AUTO_INCREMENT PRIMARY KEY,
  `id_ujian` INT NOT NULL,
  `jenis_soal` VARCHAR(255) NOT NULL,
  `text_soal` TEXT NOT NULL,
  `list_jawaban` JSON,
  `jawaban_benar` TEXT,
  `gambar` VARCHAR(255),
  `score` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  FOREIGN KEY (`id_ujian`) REFERENCES `ujian`(`id_ujian`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `jawaban_ujian` (
  `id_jawaban` INT AUTO_INCREMENT PRIMARY KEY,
  `id_soal` INT NOT NULL,
  `id_user` INT NOT NULL,
  `jawaban` TEXT,
  `status` VARCHAR(50),
  `keterangan` TEXT,
  `nilai` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  FOREIGN KEY (`id_soal`) REFERENCES `soal`(`id_soal`) ON DELETE CASCADE,
  FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `nilai` (
  `id_nilai` INT AUTO_INCREMENT PRIMARY KEY,
  `id_kelas_tahun_ajaran` INT NOT NULL,
  `id_siswa` INT NOT NULL,
  `id_modul` INT,
  `id_ujian` INT,
  `nama` VARCHAR(255) NOT NULL,
  `nilai` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  FOREIGN KEY (`id_kelas_tahun_ajaran`) REFERENCES `kelas_tahun_ajaran`(`id_kelas_tahun_ajaran`) ON DELETE CASCADE,
  FOREIGN KEY (`id_siswa`) REFERENCES `users`(`id_user`) ON DELETE CASCADE,
  FOREIGN KEY (`id_modul`) REFERENCES `modul`(`id_modul`) ON DELETE SET NULL
) ENGINE=InnoDB;
