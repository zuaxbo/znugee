using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;

namespace FileManagementAPI.Models
{
    public class FileOperationModel
    {
        [Required(ErrorMessage = "檔案ID列表是必填項目")]
        public List<int> FileIds { get; set; }

        public string Operation { get; set; } // delete, restore, permanent_delete
    }
}