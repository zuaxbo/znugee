using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;
using UserAuthAPI.Models;
using FileManagementAPI.Models;

namespace FileManagementAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext() : base("DefaultConnection")
        {
            // 自動建立資料庫 (自動初始化)
            // Database.SetInitializer(new DatabaseInitializer());

            // 採用現有資料庫 (不重新初始化)
            // Database.SetInitializer<ApplicationDbContext>(null);
        }

        // 包含 Users (用於外鍵關聯，但不管理建立)
        public DbSet<User> Users { get; set; }

        // 管理 Files 實體
        public DbSet<FileInfo> Files { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            // 設定 Users (但不建立資料表，因為已存在)
            ConfigureUserEntity(modelBuilder);

            // 設定 Files 並建立外鍵關聯
            ConfigureFileEntity(modelBuilder);

            base.OnModelCreating(modelBuilder);
        }

        private void ConfigureUserEntity(DbModelBuilder modelBuilder)
        {
            // 設定 User 實體結構，但不會重新建立資料表
            var userEntity = modelBuilder.Entity<User>();

            userEntity.HasKey(e => e.Id);
            userEntity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            userEntity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            userEntity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
            userEntity.Property(e => e.PasswordSalt).IsRequired().HasMaxLength(255);
            userEntity.Property(e => e.FullName).HasMaxLength(100);
            userEntity.Property(e => e.IsActive).IsRequired();
            userEntity.Property(e => e.CreatedAt).IsRequired();
            userEntity.Property(e => e.UpdatedAt).IsRequired();

            userEntity.ToTable("Users");
        }

        private void ConfigureFileEntity(DbModelBuilder modelBuilder)
        {
            var fileEntity = modelBuilder.Entity<FileInfo>();

            fileEntity.HasKey(e => e.Id);

            fileEntity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
            fileEntity.Property(e => e.OriginalFileName).IsRequired().HasMaxLength(255);
            fileEntity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
            fileEntity.Property(e => e.FileExtension).IsRequired().HasMaxLength(10);
            fileEntity.Property(e => e.ContentType).IsRequired().HasMaxLength(100);
            fileEntity.Property(e => e.FileSize).IsRequired();
            fileEntity.Property(e => e.ThumbnailPath).HasMaxLength(500);
            fileEntity.Property(e => e.UploadedByUserId).IsRequired();
            fileEntity.Property(e => e.UploadedByUsername).HasMaxLength(50);
            fileEntity.Property(e => e.UploadedAt).IsRequired();
            fileEntity.Property(e => e.UpdatedAt).IsRequired();
            fileEntity.Property(e => e.IsDeleted).IsRequired();
            fileEntity.Property(e => e.IsPublic).IsRequired();
            fileEntity.Property(e => e.PublicUrl).HasMaxLength(255);

            // 設定外鍵關聯
            fileEntity.HasRequired(f => f.UploadedBy)
                .WithMany()
                .HasForeignKey(f => f.UploadedByUserId)
                .WillCascadeOnDelete(false);

            fileEntity.ToTable("Files");
        }
    }
}