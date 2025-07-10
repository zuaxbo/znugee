using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Web.Hosting;
using FileManagementAPI.Helpers;

namespace FileManagementAPI.Helpers
{
    public static class PathHelper
    {
        public static string GetUploadPath()
        {
            return ConfigHelper.GetAppSetting("UploadPath", "~/Uploads/");
        }

        public static string GetThumbnailPath()
        {
            return ConfigHelper.GetAppSetting("ThumbnailPath", "~/Uploads/thumbnails/");
        }

        public static string GetTempPath()
        {
            return "~/Uploads/temp/";
        }

        public static string GetFileIconPath()
        {
            return "~/Content/images/file-icons/";
        }

        public static string GetPhysicalUploadPath()
        {
            return HostingEnvironment.MapPath(GetUploadPath());
        }

        public static string GetPhysicalThumbnailPath()
        {
            return HostingEnvironment.MapPath(GetThumbnailPath());
        }

        public static string GetPhysicalTempPath()
        {
            return HostingEnvironment.MapPath(GetTempPath());
        }

        public static string GetPhysicalFileIconPath()
        {
            return HostingEnvironment.MapPath(GetFileIconPath());
        }

        public static string GetFileUrl(string fileName)
        {
            var baseUrl = GetBaseUrl();
            return $"{baseUrl}/Uploads/{fileName}";
        }

        public static string GetThumbnailUrl(string fileName)
        {
            var baseUrl = GetBaseUrl();
            return $"{baseUrl}/Uploads/thumbnails/{fileName}";
        }

        public static string GetFileIconUrl(string extension)
        {
            var baseUrl = GetBaseUrl();
            var iconName = extension.TrimStart('.').ToLower();
            return $"{baseUrl}/Content/images/file-icons/{iconName}.png";
        }

        public static string GetDefaultFileIconUrl()
        {
            var baseUrl = GetBaseUrl();
            return $"{baseUrl}/Content/images/file-icons/default.png";
        }

        private static string GetBaseUrl()
        {
            var request = System.Web.HttpContext.Current?.Request;
            if (request != null)
            {
                return request.Url.GetLeftPart(UriPartial.Authority);
            }
            return "http://localhost";
        }

        public static void InitializeDirectories()
        {
            FileHelper.EnsureDirectoryExists(GetPhysicalUploadPath());
            FileHelper.EnsureDirectoryExists(GetPhysicalThumbnailPath());
            FileHelper.EnsureDirectoryExists(GetPhysicalTempPath());
            FileHelper.EnsureDirectoryExists(GetPhysicalFileIconPath());
        }
    }
}