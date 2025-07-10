using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;
using UserAuthAPI.Models;

namespace FileManagementAPI.Models
{
    public class FileInfo
    {
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        public string FileName { get; set; }

        [Required]
        [StringLength(255)]
        public string OriginalFileName { get; set; }

        [Required]
        [StringLength(500)]
        public string FilePath { get; set; }

        [Required]
        [StringLength(10)]
        public string FileExtension { get; set; }

        [Required]
        [StringLength(100)]
        public string ContentType { get; set; }

        public long FileSize { get; set; }

        [StringLength(500)]
        public string ThumbnailPath { get; set; }

        [Required]
        public int UploadedByUserId { get; set; }

        [StringLength(50)]
        public string UploadedByUsername { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        public bool IsDeleted { get; set; } = false;

        public DateTime? DeletedAt { get; set; }

        public bool IsPublic { get; set; } = true;

        [StringLength(255)]
        public string PublicUrl { get; set; }

        // 導航屬性
        public virtual User UploadedBy { get; set; }
    }
}