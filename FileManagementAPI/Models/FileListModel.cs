using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;

namespace FileManagementAPI.Models
{
    public class FileListModel
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public string OriginalFileName { get; set; }
        public string FileExtension { get; set; }
        public string ContentType { get; set; }
        public long FileSize { get; set; }
        public string FileSizeFormatted { get; set; }
        public string ThumbnailUrl { get; set; }
        public string PublicUrl { get; set; }
        public string UploadedByUsername { get; set; }
        public string UploadedAt { get; set; }
        public string UpdatedAt { get; set; }
        public bool IsImage { get; set; }
        public bool IsPdf { get; set; }
        public bool IsOfficeDoc { get; set; }
    }
}