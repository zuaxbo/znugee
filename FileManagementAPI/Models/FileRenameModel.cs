using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;

namespace FileManagementAPI.Models
{
    public class FileRenameModel
    {
        [Required(ErrorMessage = "檔案ID是必填項目")]
        public int FileId { get; set; }

        [Required(ErrorMessage = "新檔案名稱是必填項目")]
        [StringLength(255, ErrorMessage = "檔案名稱長度不能超過255個字元")]
        public string NewFileName { get; set; }
    }
}