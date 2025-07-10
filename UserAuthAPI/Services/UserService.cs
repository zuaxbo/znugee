using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using UserAuthAPI.Data;
using UserAuthAPI.Models;
using UserAuthAPI.Services;

namespace UserAuthAPI.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordService _passwordService;

        public UserService()
        {
            _context = new ApplicationDbContext();
            _passwordService = new PasswordService();
        }

        public UserService(ApplicationDbContext context, IPasswordService passwordService)
        {
            _context = context;
            _passwordService = passwordService;
        }

        public ApiResponse<LoginResponseModel> Login(LoginModel model)
        {
            try
            {
                // 檢查輸入資料
                if (model == null || string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
                {
                    return ApiResponse<LoginResponseModel>.ErrorResult("使用者名稱和密碼不能為空");
                }

                // 查詢使用者
                var user = GetUserByUsername(model.Username);
                if (user == null)
                {
                    return ApiResponse<LoginResponseModel>.ErrorResult("使用者名稱或密碼錯誤");
                }

                // 檢查帳號是否啟用
                if (!user.IsActive)
                {
                    return ApiResponse<LoginResponseModel>.ErrorResult("帳號已被停用");
                }

                // 驗證密碼
                if (!_passwordService.VerifyPassword(model.Password, user.PasswordHash, user.PasswordSalt))
                {
                    return ApiResponse<LoginResponseModel>.ErrorResult("使用者名稱或密碼錯誤");
                }

                // 更新最後登入時間
                user.LastLoginAt = DateTime.Now;
                _context.SaveChanges();

                // 設定 Session
                SetUserSession(user);

                // 回傳登入成功資訊
                var response = new LoginResponseModel
                {
                    UserId = user.Id,
                    Username = user.Username,
                    FullName = user.FullName,
                    Message = "登入成功"
                };

                return ApiResponse<LoginResponseModel>.SuccessResult(response, "登入成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<LoginResponseModel>.ErrorResult("登入過程發生錯誤：" + ex.Message);
            }
        }

        public ApiResponse Register(RegisterModel model)
        {
            try
            {
                // 檢查使用者名稱是否已存在
                if (IsUsernameExists(model.Username))
                {
                    return ApiResponse.ErrorResult("使用者名稱已存在");
                }

                // 檢查電子郵件是否已存在
                if (IsEmailExists(model.Email))
                {
                    return ApiResponse.ErrorResult("電子郵件已被註冊");
                }

                // 加密密碼
                string salt;
                string passwordHash = _passwordService.HashPassword(model.Password, out salt);

                // 建立新使用者
                var user = new User
                {
                    Username = model.Username.Trim(),
                    Email = model.Email.Trim().ToLower(),
                    PasswordHash = passwordHash,
                    PasswordSalt = salt,
                    FullName = string.IsNullOrWhiteSpace(model.FullName) ? null : model.FullName.Trim(),
                    IsActive = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                // 儲存到資料庫
                _context.Users.Add(user);
                _context.SaveChanges();

                return ApiResponse.SuccessResult("註冊成功");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult("註冊過程發生錯誤：" + ex.Message);
            }
        }

        public void Logout()
        {
            try
            {
                // 清除 Session
                HttpContext.Current?.Session?.Clear();
                HttpContext.Current?.Session?.Abandon();
            }
            catch (Exception)
            {
                // 忽略登出錯誤
            }
        }

        public bool IsUserLoggedIn()
        {
            try
            {
                return HttpContext.Current?.Session?["UserId"] != null;
            }
            catch
            {
                return false;
            }
        }

        public User GetUserByUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return null;

            return _context.Users.FirstOrDefault(u => u.Username == username);
        }

        public User GetUserByEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return null;

            return _context.Users.FirstOrDefault(u => u.Email == email.ToLower());
        }

        public bool IsUsernameExists(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return false;

            return _context.Users.Any(u => u.Username == username);
        }

        public bool IsEmailExists(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            return _context.Users.Any(u => u.Email == email.ToLower());
        }

        private void SetUserSession(User user)
        {
            if (HttpContext.Current?.Session != null)
            {
                HttpContext.Current.Session["UserId"] = user.Id;
                HttpContext.Current.Session["Username"] = user.Username;
                HttpContext.Current.Session["FullName"] = user.FullName;
            }
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}