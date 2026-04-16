-- AlterTable: add created_at / updated_at to csv_uploads
-- 既存行には CURRENT_TIMESTAMP を入れてから NOT NULL 制約を適用する
ALTER TABLE `csv_uploads`
  ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
