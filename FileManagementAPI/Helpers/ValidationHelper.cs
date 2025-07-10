using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text.RegularExpressions;

namespace FileManagementAPI.Helpers
{
    public static class ValidationHelper
    {
        // 原有的驗證方法
        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                var emailRegex = new Regex(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
                return emailRegex.IsMatch(email);
            }
            catch
            {
                return false;
            }
        }

        public static bool IsValidUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return false;

            var usernameRegex = new Regex(@"^[a-zA-Z0-9_]{3,50}$");
            return usernameRegex.IsMatch(username);
        }

        public static bool IsValidPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return false;

            return password.Length >= 6;
        }

        // 新增檔案相關驗證方法
        public static bool IsValidFileName(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                return false;

            // 檢查檔案名稱長度
            if (fileName.Length > 255)
                return false;

            // 檢查是否包含非法字元
            var invalidChars = System.IO.Path.GetInvalidFileNameChars();
            foreach (var invalidChar in invalidChars)
            {
                if (fileName.Contains(invalidChar.ToString()))
                    return false;
            }

            // 檢查是否為保留名稱
            var reservedNames = new[] { "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9" };
            var fileNameWithoutExtension = System.IO.Path.GetFileNameWithoutExtension(fileName).ToUpper();

            foreach (var reservedName in reservedNames)
            {
                if (fileNameWithoutExtension == reservedName)
                    return false;
            }

            return true;
        }

        public static bool IsValidFileSize(long fileSize)
        {
            var maxFileSize = ConfigHelper.GetAppSettingLong("MaxFileSize", 50 * 1024 * 1024); // 預設 50MB
            return fileSize > 0 && fileSize <= maxFileSize;
        }

        public static bool IsValidFileExtension(string extension)
        {
            if (string.IsNullOrWhiteSpace(extension))
                return false;

            return FileHelper.IsAllowedFileType(extension);
        }

        public static bool IsValidUploadedFile(HttpPostedFile file)
        {
            if (file == null)
                return false;

            if (file.ContentLength == 0)
                return false;

            if (!IsValidFileSize(file.ContentLength))
                return false;

            var extension = System.IO.Path.GetExtension(file.FileName);
            if (!IsValidFileExtension(extension))
                return false;

            var fileName = System.IO.Path.GetFileName(file.FileName);
            if (!IsValidFileName(fileName))
                return false;

            return true;
        }

        public static string GetFileValidationError(HttpPostedFile file)
        {
            if (file == null)
                return "請選擇要上傳的檔案";

            if (file.ContentLength == 0)
                return "檔案不能為空";

            if (!IsValidFileSize(file.ContentLength))
            {
                var maxSize = ConfigHelper.GetAppSettingLong("MaxFileSize", 50 * 1024 * 1024);
                return $"檔案大小不能超過 {FileHelper.FormatFileSize(maxSize)}";
            }

            var extension = System.IO.Path.GetExtension(file.FileName);
            if (!IsValidFileExtension(extension))
                return $"不支援的檔案類型：{extension}";

            var fileName = System.IO.Path.GetFileName(file.FileName);
            if (!IsValidFileName(fileName))
                return "檔案名稱包含非法字元或為系統保留名稱";

            return null; // 驗證通過
        }
    }
}