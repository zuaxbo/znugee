using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Formatting;
using System.Web.Http;
using System.Web.Http.Cors;
using System.Web.Http.Filters;

namespace FileManagementAPI
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // 啟用 CORS
            var cors = new EnableCorsAttribute("*", "*", "*");
            config.EnableCors(cors);

            // 路由設定
            config.MapHttpAttributeRoutes();

            // 預設路由
            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            // JSON 序列化設定
            var jsonFormatter = config.Formatters.JsonFormatter;
            jsonFormatter.SerializerSettings.DateFormatString = "yyyy-MM-dd HH:mm:ss";
            jsonFormatter.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
            jsonFormatter.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;

            // 移除 XML 格式化器，只使用 JSON
            config.Formatters.Remove(config.Formatters.XmlFormatter);

            // 自訂錯誤處理
            config.Filters.Add(new GlobalExceptionFilterAttribute());
        }
    }

    // 全域異常過濾器
    public class GlobalExceptionFilterAttribute : ExceptionFilterAttribute
    {
        public override void OnException(HttpActionExecutedContext context)
        {
            var exception = context.Exception;

            // 記錄異常
            System.Diagnostics.Debug.WriteLine($"API Exception: {exception.Message}");

            // 建立統一的錯誤回應
            var errorResponse = new
            {
                Success = false,
                Message = "系統發生錯誤",
                Error = exception.Message,
                Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };

            // 設定回應
            // 設定回應 - 使用正確的擴充方法
            context.Response = new HttpResponseMessage(HttpStatusCode.InternalServerError)
            {
                Content = new ObjectContent(errorResponse.GetType(), errorResponse, new JsonMediaTypeFormatter())
            };

            base.OnException(context);
        }
    }
}
