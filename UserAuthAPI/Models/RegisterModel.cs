using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;

namespace UserAuthAPI.Models
{
    public class RegisterModel
    {
        [Required(ErrorMessage = "使用者名稱是必填項目")]
        [StringLength(50, ErrorMessage = "使用者名稱長度不能超過50個字元")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "使用者名稱只能包含字母、數字和底線")]
        public string Username { get; set; }

        [Required(ErrorMessage = "電子郵件是必填項目")]
        [StringLength(100, ErrorMessage = "電子郵件長度不能超過100個字元")]
        [EmailAddress(ErrorMessage = "電子郵件格式不正確")]
        public string Email { get; set; }

        [Required(ErrorMessage = "密碼是必填項目")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "密碼長度必須在6到100個字元之間")]
        public string Password { get; set; }

        [Required(ErrorMessage = "確認密碼是必填項目")]
        [Compare("Password", ErrorMessage = "密碼與確認密碼不符")]
        public string ConfirmPassword { get; set; }

        [StringLength(100, ErrorMessage = "姓名長度不能超過100個字元")]
        public string FullName { get; set; }
    }
}