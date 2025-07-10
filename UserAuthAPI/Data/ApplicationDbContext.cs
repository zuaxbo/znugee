using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;
using UserAuthAPI.Models;

namespace UserAuthAPI.Data
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

        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            ConfigureUserEntity(modelBuilder);
            base.OnModelCreating(modelBuilder);
        }

        private void ConfigureUserEntity(DbModelBuilder modelBuilder)
        {
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
    }
}