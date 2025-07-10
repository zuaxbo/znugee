using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Routing;
using UserAuthAPI.Data;

namespace UserAuthAPI
{
    public class WebApiApplication : HttpApplication
    {
        protected void Application_Start()
        {
            // Web API 設定
            GlobalConfiguration.Configure(WebApiConfig.Register);

            // 自動建立資料庫 (自動初始化) (手動建立請註解)
            // InitializeDatabase();
        }

        //private void InitializeDatabase()
        //{
        //    try
        //    {
        //        using (var context = new ApplicationDbContext())
        //        {
        //            // 觸發資料庫建立
        //            context.Database.Initialize(force: false);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        System.Diagnostics.Debug.WriteLine("Database initialization failed: " + ex.Message);
        //    }
        //}

        protected void Application_Error()
        {
            var exception = Server.GetLastError();
            if (exception != null)
            {
                System.Diagnostics.Debug.WriteLine("Application Error: " + exception.Message);
            }
        }

        protected void Session_Start()
        {
            // Session 開始時的處理
        }

        protected void Session_End()
        {
            // Session 結束時的處理
        }
    }
}
