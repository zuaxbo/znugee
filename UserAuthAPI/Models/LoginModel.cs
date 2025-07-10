using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;

namespace UserAuthAPI.Models
{
    public class LoginModel
    {
        [Required(ErrorMessage = "使用者名稱是必填項目")]
        [StringLength(50, ErrorMessage = "使用者名稱長度不能超過50個字元")]
        public string Username { get; set; }

        [Required(ErrorMessage = "密碼是必填項目")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "密碼長度必須在6到100個字元之間")]
        public string Password { get; set; }
    }
}