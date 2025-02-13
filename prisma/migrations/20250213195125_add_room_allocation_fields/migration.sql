-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_propertyId_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `properties` DROP FOREIGN KEY `properties_ownerId_fkey`;

-- AlterTable
ALTER TABLE `properties` ADD COLUMN `currentOccupants` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `gender` ENUM('MALE', 'FEMALE', 'ANY') NOT NULL DEFAULT 'ANY',
    ADD COLUMN `maxOccupants` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `religion` ENUM('CHRISTIAN', 'MUSLIM', 'HINDU', 'BUDDHIST', 'JEWISH', 'ANY', 'OTHER') NOT NULL DEFAULT 'ANY',
    ADD COLUMN `sharing` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `gender` ENUM('MALE', 'FEMALE', 'ANY') NULL,
    ADD COLUMN `religion` ENUM('CHRISTIAN', 'MUSLIM', 'HINDU', 'BUDDHIST', 'JEWISH', 'ANY', 'OTHER') NULL;

-- CreateTable
CREATE TABLE `occupants` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
    `numberOfRooms` INTEGER NOT NULL DEFAULT 1,
    `totalPrice` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `occupants_userId_idx`(`userId`),
    INDEX `occupants_propertyId_idx`(`propertyId`),
    UNIQUE INDEX `occupants_userId_propertyId_status_key`(`userId`, `propertyId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `properties_status_sharing_gender_religion_idx` ON `properties`(`status`, `sharing`, `gender`, `religion`);

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `occupants` ADD CONSTRAINT `occupants_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `occupants` ADD CONSTRAINT `occupants_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `images` RENAME INDEX `images_propertyId_fkey` TO `images_propertyId_idx`;

-- RenameIndex
ALTER TABLE `messages` RENAME INDEX `messages_propertyId_fkey` TO `messages_propertyId_idx`;

-- RenameIndex
ALTER TABLE `messages` RENAME INDEX `messages_senderId_fkey` TO `messages_senderId_idx`;

-- RenameIndex
ALTER TABLE `properties` RENAME INDEX `properties_ownerId_fkey` TO `properties_ownerId_idx`;
