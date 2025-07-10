using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Routing;
using FileManagementAPI.Data;
using FileManagementAPI.Helpers;
using FileManagementAPI.Tasks;

namespace FileManagementAPI
{
    public class WebApiApplication : HttpApplication
    {
        protected void Application_Start()
        {
            // Web API 設定
            GlobalConfiguration.Configure(WebApiConfig.Register);

            // 自動建立資料庫 (自動初始化) (手動建立請註解)
            // InitializeDatabase();

            // 初始化檔案系統目錄
            InitializeFileSystem();

            // 啟動檔案清理任務
            StartFileCleanupTask();
        }

        //private void InitializeDatabase()
        //{
        //    try
        //    {
        //        using (var context = new ApplicationDbContext())
        //        {
        //            // 觸發資料庫建立
        //            context.Database.Initialize(force: false);

        //            // 填充測試資料（開發環境）
        //#if DEBUG
        //            DatabaseSeeder.SeedFileTestData(context);
        //#endif
        //        }

        //        System.Diagnostics.Debug.WriteLine("Database initialization completed successfully");
        //    }
        //    catch (Exception ex)
        //    {
        //        System.Diagnostics.Debug.WriteLine("Database initialization failed: " + ex.Message);

        //        // 記錄到事件日誌或其他日誌系統
        //        LogError("Database initialization failed", ex);
        //    }
        //}

        private void InitializeFileSystem()
        {
            try
            {
                // 初始化所有必要的目錄
                PathHelper.InitializeDirectories();

                System.Diagnostics.Debug.WriteLine("File system directories initialized successfully");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("File system initialization failed: " + ex.Message);
                LogError("File system initialization failed", ex);
            }
        }

        private void StartFileCleanupTask()
        {
            try
            {
                if (ConfigHelper.EnableAutoCleanup)
                {
                    // 啟動定期檔案清理任務
                    FileCleanupTask.ScheduleCleanup();
                    System.Diagnostics.Debug.WriteLine("File cleanup task scheduled successfully");
                }
                else
                {
                    System.Diagnostics.Debug.WriteLine("File cleanup task is disabled in configuration");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("File cleanup task startup failed: " + ex.Message);
                LogError("File cleanup task startup failed", ex);
            }
        }

        protected void Application_Error()
        {
            var exception = Server.GetLastError();
            if (exception != null)
            {
                System.Diagnostics.Debug.WriteLine("Application Error: " + exception.Message);
                LogError("Application Error", exception);

                // 清除錯誤，避免顯示預設錯誤頁面
                Server.ClearError();

                // 可以重導向到自訂錯誤頁面
                // Response.Redirect("~/Error.html");
            }
        }

        protected void Session_Start()
        {
            // Session 開始時的處理
            var sessionId = Session.SessionID;
            System.Diagnostics.Debug.WriteLine($"New session started: {sessionId}");
        }

        protected void Session_End()
        {
            // Session 結束時的處理
            var sessionId = Session.SessionID;
            System.Diagnostics.Debug.WriteLine($"Session ended: {sessionId}");
        }

        protected void Application_End()
        {
            // 應用程式結束時的清理工作
            System.Diagnostics.Debug.WriteLine("Application is shutting down");

            try
            {
                // 執行最後一次檔案清理
                if (ConfigHelper.EnableAutoCleanup)
                {
                    FileCleanupTask.RunCleanup();
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Final cleanup failed: " + ex.Message);
            }
        }

        // 處理 CORS 預檢請求
        protected void Application_BeginRequest(object sender, EventArgs e)
        {
            var request = HttpContext.Current.Request;
            var response = HttpContext.Current.Response;

            // 處理 CORS 預檢請求 (OPTIONS)
            if (request.HttpMethod == "OPTIONS")
            {
                response.AddHeader("Access-Control-Allow-Origin", "*");
                response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
                response.AddHeader("Access-Control-Max-Age", "3600");
                response.End();
            }
        }

        // 統一錯誤記錄方法
        private void LogError(string message, Exception ex)
        {
            try
            {
                // 這裡可以整合到日誌系統 (如 log4net, NLog 等)
                var logMessage = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}: {ex.Message}";

                // 寫入到事件日誌
                System.Diagnostics.EventLog.WriteEntry("FileManagementAPI", logMessage,
                    System.Diagnostics.EventLogEntryType.Error);

                // 或寫入到檔案 (確保 Logs 目錄存在)
                var logPath = Server.MapPath("~/Logs/");
                if (!System.IO.Directory.Exists(logPath))
                {
                    System.IO.Directory.CreateDirectory(logPath);
                }

                var logFile = System.IO.Path.Combine(logPath, $"error_{DateTime.Now:yyyyMMdd}.log");
                var logEntry = $"{logMessage}{Environment.NewLine}Stack Trace: {ex.StackTrace}{Environment.NewLine}{Environment.NewLine}";

                System.IO.File.AppendAllText(logFile, logEntry);
            }
            catch
            {
                // 如果記錄錯誤也失敗，只能忽略
            }
        }
    }
}
