using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;
using System.IO;
using System.Web.Hosting;
using UserAuthAPI.Models;
using UserAuthAPI.Services;
using FileManagementAPI.Models;


namespace FileManagementAPI.Data
{
    public class DatabaseInitializer : CreateDatabaseIfNotExists<ApplicationDbContext>
    {
        protected override void Seed(ApplicationDbContext context)
        {
            try
            {
                // 建立預設管理員帳號
                CreateDefaultAdmin(context);

                // 建立上傳目錄
                CreateUploadDirectories();

                // 建立測試檔案資料（可選）
                CreateTestFileData(context);

                base.Seed(context);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Database initialization error: " + ex.Message);
            }
        }

        private void CreateDefaultAdmin(ApplicationDbContext context)
        {
            var existingAdmin = context.Users.FirstOrDefault(u => u.Username == "admin");
            if (existingAdmin != null)
                return;

            var passwordService = new PasswordService();
            string salt;
            string passwordHash = passwordService.HashPassword("admin123", out salt);

            var admin = new User
            {
                Username = "admin",
                Email = "admin@example.com",
                PasswordHash = passwordHash,
                PasswordSalt = salt,
                FullName = "系統管理員",
                IsActive = true,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            context.Users.Add(admin);
            context.SaveChanges();

            System.Diagnostics.Debug.WriteLine("Default admin account created: admin/admin123");
        }

        private void CreateUploadDirectories()
        {
            try
            {
                var uploadPath = HostingEnvironment.MapPath("~/Uploads/");
                var thumbnailPath = HostingEnvironment.MapPath("~/Uploads/thumbnails/");
                var tempPath = HostingEnvironment.MapPath("~/Uploads/temp/");
                var iconPath = HostingEnvironment.MapPath("~/Content/images/file-icons/");

                if (!Directory.Exists(uploadPath))
                {
                    Directory.CreateDirectory(uploadPath);
                    System.Diagnostics.Debug.WriteLine("Created upload directory: " + uploadPath);
                }

                if (!Directory.Exists(thumbnailPath))
                {
                    Directory.CreateDirectory(thumbnailPath);
                    System.Diagnostics.Debug.WriteLine("Created thumbnail directory: " + thumbnailPath);
                }

                if (!Directory.Exists(tempPath))
                {
                    Directory.CreateDirectory(tempPath);
                    System.Diagnostics.Debug.WriteLine("Created temp directory: " + tempPath);
                }

                if (!Directory.Exists(iconPath))
                {
                    Directory.CreateDirectory(iconPath);
                    System.Diagnostics.Debug.WriteLine("Created file-icons directory: " + iconPath);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Create upload directories failed: " + ex.Message);
            }
        }

        private void CreateTestFileData(ApplicationDbContext context)
        {
            try
            {
                // 檢查是否已有檔案資料
                if (context.Files.Any())
                    return;

                // 確保有管理員使用者
                var admin = context.Users.FirstOrDefault(u => u.Username == "admin");
                if (admin == null)
                    return;

                // 建立一些測試檔案記錄（不建立實體檔案）
                var testFiles = new[]
                {
                    new FileManagementAPI.Models.FileInfo
                    {
                        FileName = "sample-document.pdf",
                        OriginalFileName = "sample-document.pdf",
                        FilePath = "~/Uploads/sample-document_20250101_120000_12345678.pdf",
                        FileExtension = ".pdf",
                        ContentType = "application/pdf",
                        FileSize = 1024000, // 1MB
                        UploadedByUserId = admin.Id,
                        UploadedByUsername = admin.Username,
                        UploadedAt = DateTime.Now.AddDays(-7),
                        UpdatedAt = DateTime.Now.AddDays(-7),
                        IsDeleted = false,
                        IsPublic = true,
                        PublicUrl = "http://localhost/api/files/download/sample-document_20250101_120000_12345678.pdf"
                    },
                    new FileManagementAPI.Models.FileInfo
                    {
                        FileName = "sample-image.jpg",
                        OriginalFileName = "sample-image.jpg",
                        FilePath = "~/Uploads/sample-image_20250101_120000_87654321.jpg",
                        FileExtension = ".jpg",
                        ContentType = "image/jpeg",
                        FileSize = 512000, // 512KB
                        ThumbnailPath = "~/Uploads/thumbnails/thumb_sample-image_87654321.jpg",
                        UploadedByUserId = admin.Id,
                        UploadedByUsername = admin.Username,
                        UploadedAt = DateTime.Now.AddDays(-3),
                        UpdatedAt = DateTime.Now.AddDays(-3),
                        IsDeleted = false,
                        IsPublic = true,
                        PublicUrl = "http://localhost/api/files/download/sample-image_20250101_120000_87654321.jpg"
                    }
                };

                foreach (var file in testFiles)
                {
                    context.Files.Add(file);
                }

                context.SaveChanges();
                System.Diagnostics.Debug.WriteLine("Test file data created");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Test file data creation failed: " + ex.Message);
            }
        }
    }
}