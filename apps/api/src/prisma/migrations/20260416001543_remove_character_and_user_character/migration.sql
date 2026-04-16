/*
  Warnings:

  - You are about to drop the `characters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_characters` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `user_characters` DROP FOREIGN KEY `user_characters_character_code_fkey`;

-- DropForeignKey
ALTER TABLE `user_characters` DROP FOREIGN KEY `user_characters_user_id_fkey`;

-- DropTable
DROP TABLE `characters`;

-- DropTable
DROP TABLE `user_characters`;
