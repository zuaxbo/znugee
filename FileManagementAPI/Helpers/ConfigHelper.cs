using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;

namespace FileManagementAPI.Helpers
{
    public static class ConfigHelper
    {
        // 原有的方法
        public static string GetConnectionString(string name = "DefaultConnection")
        {
            return ConfigurationManager.ConnectionStrings[name]?.ConnectionString;
        }

        public static string GetAppSetting(string key, string defaultValue = "")
        {
            return ConfigurationManager.AppSettings[key] ?? defaultValue;
        }

        public static int GetAppSettingInt(string key, int defaultValue = 0)
        {
            var value = ConfigurationManager.AppSettings[key];
            return int.TryParse(value, out int result) ? result : defaultValue;
        }

        public static bool GetAppSettingBool(string key, bool defaultValue = false)
        {
            var value = ConfigurationManager.AppSettings[key];
            return bool.TryParse(value, out bool result) ? result : defaultValue;
        }

        // 新增檔案管理相關的設定方法
        public static long GetAppSettingLong(string key, long defaultValue = 0)
        {
            var value = ConfigurationManager.AppSettings[key];
            return long.TryParse(value, out long result) ? result : defaultValue;
        }

        // 使用者設定
        public static int PasswordMinLength => GetAppSettingInt("PasswordMinLength", 6);
        public static int SessionTimeout => GetAppSettingInt("SessionTimeout", 30);

        // 檔案上傳設定
        public static long MaxFileSize => GetAppSettingLong("MaxFileSize", 52428800); // 50MB
        public static string UploadPath => GetAppSetting("UploadPath", "~/Uploads/");
        public static string ThumbnailPath => GetAppSetting("ThumbnailPath", "~/Uploads/thumbnails/");
        public static string AllowedFileTypes => GetAppSetting("AllowedFileTypes", ".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip");

        // 檔案清理設定
        public static int RecycleBinRetentionDays => GetAppSettingInt("RecycleBinRetentionDays", 30);
        public static int FileRetentionDays => GetAppSettingInt("FileRetentionDays", 365);
        public static bool EnableAutoCleanup => GetAppSettingBool("EnableAutoCleanup", true);

        // 縮圖設定
        public static int ThumbnailWidth => GetAppSettingInt("ThumbnailWidth", 200);
        public static int ThumbnailHeight => GetAppSettingInt("ThumbnailHeight", 200);
        public static int ThumbnailQuality => GetAppSettingInt("ThumbnailQuality", 80);
    }
}