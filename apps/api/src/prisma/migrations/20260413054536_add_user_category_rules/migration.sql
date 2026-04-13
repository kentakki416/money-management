-- CreateTable
CREATE TABLE `user_category_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `keyword` VARCHAR(200) NOT NULL,
    `match_type` ENUM('PARTIAL', 'EXACT') NOT NULL DEFAULT 'PARTIAL',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_category_rules_user_id_idx`(`user_id`),
    INDEX `user_category_rules_category_id_idx`(`category_id`),
    INDEX `user_category_rules_priority_idx`(`priority`),
    UNIQUE INDEX `user_category_rules_user_id_keyword_key`(`user_id`, `keyword`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_category_rules` ADD CONSTRAINT `user_category_rules_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_category_rules` ADD CONSTRAINT `user_category_rules_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
