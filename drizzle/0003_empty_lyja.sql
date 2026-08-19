ALTER TABLE `email_verifications` MODIFY COLUMN `purpose` enum('register','reset_password') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `sessionVersion` int DEFAULT 0 NOT NULL;