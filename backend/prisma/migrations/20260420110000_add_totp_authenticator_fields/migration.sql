-- Add fields for authenticator app (TOTP) support
ALTER TABLE `User`
  ADD COLUMN `twoFactorMethod` VARCHAR(191) NULL DEFAULT 'email',
  ADD COLUMN `twoFactorSecret` TEXT NULL,
  ADD COLUMN `twoFactorTempSecret` TEXT NULL;
