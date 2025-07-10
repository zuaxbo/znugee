using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UserAuthAPI.Models;

namespace UserAuthAPI.Services
{
    public interface IUserService
    {
        ApiResponse<LoginResponseModel> Login(LoginModel model);
        ApiResponse Register(RegisterModel model);
        void Logout();
        bool IsUserLoggedIn();
        User GetUserByUsername(string username);
        User GetUserByEmail(string email);
        bool IsUsernameExists(string username);
        bool IsEmailExists(string email);
    }
}
