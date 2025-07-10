using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using UserAuthAPI.Models;
using UserAuthAPI.Services;

namespace UserAuthAPI.Data
{
    public static class DatabaseSeeder
    {
        public static void SeedTestData(ApplicationDbContext context)
        {
            try
            {
                // 檢查是否已有測試資料
                if (context.Users.Any())
                    return;

                var passwordService = new PasswordService();

                // 建立測試使用者
                var testUsers = new[]
                {
                    new { Username = "testuser1", Email = "test1@example.com", Password = "test123", FullName = "測試使用者1" },
                    new { Username = "testuser2", Email = "test2@example.com", Password = "test123", FullName = "測試使用者2" },
                    new { Username = "demo", Email = "demo@example.com", Password = "demo123", FullName = "展示帳號" }
                };

                foreach (var testUser in testUsers)
                {
                    string salt;
                    string passwordHash = passwordService.HashPassword(testUser.Password, out salt);

                    var user = new User
                    {
                        Username = testUser.Username,
                        Email = testUser.Email,
                        PasswordHash = passwordHash,
                        PasswordSalt = salt,
                        FullName = testUser.FullName,
                        IsActive = true,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };

                    context.Users.Add(user);
                }

                context.SaveChanges();
                System.Diagnostics.Debug.WriteLine("Test data seeded successfully");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Test data seeding failed: " + ex.Message);
            }
        }

        public static void ClearAllData(ApplicationDbContext context)
        {
            try
            {
                // 清除所有使用者資料（除了管理員）
                var usersToDelete = context.Users.Where(u => u.Username != "admin").ToList();
                context.Users.RemoveRange(usersToDelete);
                context.SaveChanges();

                System.Diagnostics.Debug.WriteLine("All data cleared except admin account");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Data clearing failed: " + ex.Message);
            }
        }
    }
}