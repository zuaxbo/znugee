using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;

namespace FileManagementAPI.Models
{
    public class FileSearchModel
    {
        [StringLength(255)]
        public string FileName { get; set; }

        [StringLength(50)]
        public string FileExtension { get; set; }

        public DateTime? UploadDateFrom { get; set; }

        public DateTime? UploadDateTo { get; set; }

        [StringLength(50)]
        public string UploadedBy { get; set; }

        public int Page { get; set; } = 1;

        public int PageSize { get; set; } = 50;

        public string SortBy { get; set; } = "UploadedAt";

        public string SortOrder { get; set; } = "desc";

        public bool IncludeDeleted { get; set; } = false;
    }
}