using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;

namespace FileManagementAPI.Models
{
    public class FileUploadModel
    {
        [Required(ErrorMessage = "請選擇要上傳的檔案")]
        public HttpPostedFile File { get; set; }

        [StringLength(255, ErrorMessage = "檔案名稱長度不能超過255個字元")]
        public string CustomFileName { get; set; }
    }
}