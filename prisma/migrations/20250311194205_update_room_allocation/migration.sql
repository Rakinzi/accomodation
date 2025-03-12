/*
  Warnings:

  - You are about to drop the column `numberOfRooms` on the `occupants` table. All the data in the column will be lost.
  - You are about to drop the column `maxOccupants` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `sharing` on the `properties` table. All the data in the column will be lost.
  - Added the required column `roomNumber` to the `occupants` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `properties_status_sharing_gender_religion_idx` ON `properties`;

-- AlterTable
ALTER TABLE `occupants` DROP COLUMN `numberOfRooms`,
    ADD COLUMN `depositPaid` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `depositPaidAt` DATETIME(3) NULL,
    ADD COLUMN `depositStatus` ENUM('PENDING', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `roomNumber` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `properties` DROP COLUMN `maxOccupants`,
    DROP COLUMN `sharing`,
    ADD COLUMN `deposit` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `roomSharing` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tenantsPerRoom` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX `occupants_roomNumber_idx` ON `occupants`(`roomNumber`);

-- CreateIndex
CREATE INDEX `properties_status_roomSharing_gender_religion_idx` ON `properties`(`status`, `roomSharing`, `gender`, `religion`);
