using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;
using UserAuthAPI.Models;
using UserAuthAPI.Services;

namespace UserAuthAPI.Data
{
    public class DatabaseInitializer : CreateDatabaseIfNotExists<ApplicationDbContext>
    {
        protected override void Seed(ApplicationDbContext context)
        {
            try
            {
                // 建立預設管理員帳號（可選）
                CreateDefaultAdmin(context);

                base.Seed(context);
            }
            catch (Exception ex)
            {
                // 記錄錯誤但不中斷程式執行
                System.Diagnostics.Debug.WriteLine("Database initialization error: " + ex.Message);
            }
        }

        private void CreateDefaultAdmin(ApplicationDbContext context)
        {
            // 檢查是否已有管理員帳號
            var existingAdmin = context.Users.FirstOrDefault(u => u.Username == "admin");
            if (existingAdmin != null)
                return;

            // 建立預設管理員帳號
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
    }
}