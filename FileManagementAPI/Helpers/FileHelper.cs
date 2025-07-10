using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Web.Hosting;

namespace FileManagementAPI.Helpers
{
    public static class FileHelper
    {
        private static readonly string[] ImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg" };
        private static readonly string[] DocumentExtensions = { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv" };
        private static readonly string[] VideoExtensions = { ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv" };
        private static readonly string[] AudioExtensions = { ".mp3", ".wav", ".flac", ".aac", ".ogg" };
        private static readonly string[] ArchiveExtensions = { ".zip", ".rar", ".7z", ".tar", ".gz" };

        public static bool IsImageFile(string extension)
        {
            return ImageExtensions.Contains(extension.ToLower());
        }

        public static bool IsDocumentFile(string extension)
        {
            return DocumentExtensions.Contains(extension.ToLower());
        }

        public static bool IsVideoFile(string extension)
        {
            return VideoExtensions.Contains(extension.ToLower());
        }

        public static bool IsAudioFile(string extension)
        {
            return AudioExtensions.Contains(extension.ToLower());
        }

        public static bool IsArchiveFile(string extension)
        {
            return ArchiveExtensions.Contains(extension.ToLower());
        }

        public static bool IsOfficeDocument(string extension)
        {
            var officeExtensions = new[] { ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx" };
            return officeExtensions.Contains(extension.ToLower());
        }

        public static bool CanPreviewFile(string extension)
        {
            var previewableExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".pdf" };
            return previewableExtensions.Contains(extension.ToLower());
        }

        public static string GetFileCategory(string extension)
        {
            if (IsImageFile(extension)) return "image";
            if (IsDocumentFile(extension)) return "document";
            if (IsVideoFile(extension)) return "video";
            if (IsAudioFile(extension)) return "audio";
            if (IsArchiveFile(extension)) return "archive";
            return "other";
        }

        public static string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }

        public static string GenerateUniqueFileName(string originalFileName)
        {
            var fileName = Path.GetFileNameWithoutExtension(originalFileName);
            var extension = Path.GetExtension(originalFileName);
            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            var guid = Guid.NewGuid().ToString("N").Substring(0, 8);

            return $"{fileName}_{timestamp}_{guid}{extension}";
        }

        public static bool IsAllowedFileType(string extension)
        {
            var allAllowedExtensions = ImageExtensions
                .Concat(DocumentExtensions)
                .Concat(VideoExtensions)
                .Concat(AudioExtensions)
                .Concat(ArchiveExtensions)
                .ToArray();

            return allAllowedExtensions.Contains(extension.ToLower());
        }

        public static string GetContentType(string extension)
        {
            var contentTypes = new System.Collections.Generic.Dictionary<string, string>
            {
                // 圖片
                { ".jpg", "image/jpeg" },
                { ".jpeg", "image/jpeg" },
                { ".png", "image/png" },
                { ".gif", "image/gif" },
                { ".bmp", "image/bmp" },
                { ".svg", "image/svg+xml" },
                
                // 文件
                { ".pdf", "application/pdf" },
                { ".doc", "application/msword" },
                { ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
                { ".xls", "application/vnd.ms-excel" },
                { ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
                { ".ppt", "application/vnd.ms-powerpoint" },
                { ".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
                { ".txt", "text/plain" },
                { ".csv", "text/csv" },
                
                // 影片
                { ".mp4", "video/mp4" },
                { ".avi", "video/x-msvideo" },
                { ".mov", "video/quicktime" },
                { ".wmv", "video/x-ms-wmv" },
                
                // 音訊
                { ".mp3", "audio/mpeg" },
                { ".wav", "audio/wav" },
                { ".flac", "audio/flac" },
                { ".aac", "audio/aac" },
                
                // 壓縮檔
                { ".zip", "application/zip" },
                { ".rar", "application/x-rar-compressed" },
                { ".7z", "application/x-7z-compressed" }
            };

            return contentTypes.TryGetValue(extension.ToLower(), out string contentType)
                ? contentType
                : "application/octet-stream";
        }

        public static void EnsureDirectoryExists(string path)
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
        }

        public static bool DeleteFileIfExists(string filePath)
        {
            try
            {
                var physicalPath = HostingEnvironment.MapPath(filePath);
                if (File.Exists(physicalPath))
                {
                    File.Delete(physicalPath);
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }
    }
}