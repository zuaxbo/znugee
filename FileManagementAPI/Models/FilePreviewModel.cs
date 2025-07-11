using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FileManagementAPI.Models
{
    public class FilePreviewModel
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public string FileExtension { get; set; }
        public string ContentType { get; set; }
        public long FileSize { get; set; }
        public string FileSizeFormatted { get; set; }
        public string PreviewUrl { get; set; }
        public string DownloadUrl { get; set; }
        public bool CanPreview { get; set; }
        public string PreviewType { get; set; } // image, pdf, office, text, video, audio
        public string UploadedByUsername { get; set; }
        public string UploadedAt { get; set; }
    }
}