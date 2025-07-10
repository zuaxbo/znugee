using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Cors;
using UserAuthAPI.Models;
using UserAuthAPI.Services;


namespace UserAuthAPI.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/auth")]
    public class AuthController : ApiController
    {
        private readonly IUserService _userService;

        public AuthController()
        {
            _userService = new UserService();
        }

        public AuthController(IUserService userService)
        {
            _userService = userService;
        }

        // POST: api/auth/register
        [HttpPost]
        [Route("register")]
        public IHttpActionResult Register(RegisterModel model)
        {
            try
            {
                // 檢查模型驗證
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    return Ok(ApiResponse.ErrorResult("資料驗證失敗", errors));
                }

                // 執行註冊
                var result = _userService.Register(model);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse.ErrorResult("註冊過程發生錯誤：" + ex.Message));
            }
        }

        // POST: api/auth/login
        [HttpPost]
        [Route("login")]
        public IHttpActionResult Login(LoginModel model)
        {
            try
            {
                // 檢查模型驗證
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    return Ok(ApiResponse<LoginResponseModel>.ErrorResult("資料驗證失敗", errors));
                }

                // 執行登入
                var result = _userService.Login(model);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse<LoginResponseModel>.ErrorResult("登入過程發生錯誤：" + ex.Message));
            }
        }

        // POST: api/auth/logout
        [HttpPost]
        [Route("logout")]
        public IHttpActionResult Logout()
        {
            try
            {
                _userService.Logout();
                return Ok(ApiResponse.SuccessResult("登出成功"));
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse.ErrorResult("登出過程發生錯誤：" + ex.Message));
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing && _userService is IDisposable disposableService)
            {
                disposableService.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
