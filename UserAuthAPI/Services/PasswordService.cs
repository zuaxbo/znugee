using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using BCrypt.Net;
using UserAuthAPI.Services;

namespace UserAuthAPI.Services
{
    public class PasswordService : IPasswordService
    {
        public string HashPassword(string password, out string salt)
        {
            // 產生鹽值
            salt = BCrypt.Net.BCrypt.GenerateSalt(12);

            // 使用 BCrypt 加密密碼
            string hash = BCrypt.Net.BCrypt.HashPassword(password, salt);

            return hash;
        }

        public bool VerifyPassword(string password, string hash, string salt)
        {
            try
            {
                // 使用 BCrypt 驗證密碼
                return BCrypt.Net.BCrypt.Verify(password, hash);
            }
            catch
            {
                return false;
            }
        }

        public string GenerateSalt()
        {
            return BCrypt.Net.BCrypt.GenerateSalt(12);
        }
    }
}