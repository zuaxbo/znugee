using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using System.Web.Http.Cors;
using System.Net;
using System.Net.Http;
using System.Net.Http.Formatting;

namespace UserAuthAPI
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // 啟用 CORS
            var cors = new EnableCorsAttribute("*", "*", "*");

            // 啟用 CORS - 使用具體的設定
            //var cors = new EnableCorsAttribute(
            //    origins: "http://localhost:63898",  // 前端網址
            //    headers: "Content-Type, Accept, Authorization",
            //    methods: "GET, POST, PUT, DELETE, OPTIONS"
            //);
            
            config.EnableCors(cors);

            // Web API 設定和服務

            // Web API 路由
            config.MapHttpAttributeRoutes();

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
        }
    }
}
