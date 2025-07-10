using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using FileManagementAPI.Models;
using UserAuthAPI.Models;

namespace FileManagementAPI.Data
{
    public static class DatabaseSeeder
    {
        public static void SeedFileTestData(ApplicationDbContext context)
        {
            try
            {
                // 檢查是否已有檔案測試資料
                if (context.Files.Any())
                    return;

                // 取得管理員使用者
                var admin = context.Users.FirstOrDefault(u => u.Username == "admin");
                if (admin == null)
                    return;

                // 建立各種類型的測試檔案
                var testFiles = new[]
                {
                    // 圖片檔案
                    CreateTestFile("風景照片.jpg", ".jpg", "image/jpeg", 1024000, admin, DateTime.Now.AddDays(-10)),
                    CreateTestFile("產品圖片.png", ".png", "image/png", 512000, admin, DateTime.Now.AddDays(-8)),
                    
                    // 文件檔案
                    CreateTestFile("使用者手冊.pdf", ".pdf", "application/pdf", 2048000, admin, DateTime.Now.AddDays(-7)),
                    CreateTestFile("會議記錄.docx", ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 256000, admin, DateTime.Now.AddDays(-5)),
                    CreateTestFile("財務報表.xlsx", ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 512000, admin, DateTime.Now.AddDays(-3)),
                    
                    // 其他檔案
                    CreateTestFile("程式碼備份.zip", ".zip", "application/zip", 5120000, admin, DateTime.Now.AddDays(-2)),
                    CreateTestFile("設定檔.txt", ".txt", "text/plain", 1024, admin, DateTime.Now.AddDays(-1)),
                    
                    // 已刪除的檔案
                    CreateDeletedTestFile("舊版文件.pdf", ".pdf", "application/pdf", 1024000, admin, DateTime.Now.AddDays(-15))
                };

                foreach (var file in testFiles)
                {
                    context.Files.Add(file);
                }

                context.SaveChanges();
                System.Diagnostics.Debug.WriteLine("File test data seeded successfully");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("File test data seeding failed: " + ex.Message);
            }
        }

        private static FileInfo CreateTestFile(string fileName, string extension, string contentType, long fileSize, User uploader, DateTime uploadTime)
        {
            var uniqueId = Guid.NewGuid().ToString("N").Substring(0, 8);
            var uniqueFileName = $"{System.IO.Path.GetFileNameWithoutExtension(fileName)}_{uploadTime:yyyyMMdd_HHmmss}_{uniqueId}{extension}";

            return new FileInfo
            {
                FileName = fileName,
                OriginalFileName = fileName,
                FilePath = $"~/Uploads/{uniqueFileName}",
                FileExtension = extension,
                ContentType = contentType,
                FileSize = fileSize,
                ThumbnailPath = IsImageFile(extension) ? $"~/Uploads/thumbnails/thumb_{uniqueId}.jpg" : null,
                UploadedByUserId = uploader.Id,
                UploadedByUsername = uploader.Username,
                UploadedAt = uploadTime,
                UpdatedAt = uploadTime,
                IsDeleted = false,
                IsPublic = true,
                PublicUrl = $"http://localhost/api/files/download/{uniqueFileName}"
            };
        }

        private static FileInfo CreateDeletedTestFile(string fileName, string extension, string contentType, long fileSize, User uploader, DateTime uploadTime)
        {
            var file = CreateTestFile(fileName, extension, contentType, fileSize, uploader, uploadTime);
            file.IsDeleted = true;
            file.DeletedAt = DateTime.Now.AddDays(-5);
            return file;
        }

        private static bool IsImageFile(string extension)
        {
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg" };
            return imageExtensions.Contains(extension.ToLower());
        }

        public static void ClearAllFileData(ApplicationDbContext context)
        {
            try
            {
                var filesToDelete = context.Files.ToList();
                context.Files.RemoveRange(filesToDelete);
                context.SaveChanges();

                System.Diagnostics.Debug.WriteLine("All file data cleared");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("File data clearing failed: " + ex.Message);
            }
        }
    }
}