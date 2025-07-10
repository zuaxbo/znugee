using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;

namespace UserAuthAPI.Helpers
{
    public static class ConfigHelper
    {
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

        public static int PasswordMinLength => GetAppSettingInt("PasswordMinLength", 6);
        public static int SessionTimeout => GetAppSettingInt("SessionTimeout", 30);
    }
}