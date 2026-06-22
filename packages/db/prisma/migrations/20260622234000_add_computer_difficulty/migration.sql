-- AlterTable
ALTER TABLE `Game`
    ADD COLUMN `difficulty` ENUM('EASY', 'MEDIUM', 'HARD', 'EXPERT') NULL AFTER `status`;
