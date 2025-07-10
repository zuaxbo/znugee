using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Threading.Tasks;
using FileManagementAPI.Services;
using FileManagementAPI.Helpers;

namespace FileManagementAPI.Tasks
{
    public static class FileCleanupTask
    {
        public static void RunCleanup()
        {
            try
            {
                if (!ConfigHelper.EnableAutoCleanup)
                {
                    System.Diagnostics.Debug.WriteLine("Auto cleanup is disabled");
                    return;
                }

                using (var fileService = new FileService())
                {
                    fileService.CleanupOldFiles();
                    System.Diagnostics.Debug.WriteLine("File cleanup task completed successfully");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"File cleanup task failed: {ex.Message}");
            }
        }

        public static async Task RunCleanupAsync()
        {
            await Task.Run(() => RunCleanup());
        }

        // 可以搭配 Hangfire 或 Windows Service 定期執行
        public static void ScheduleCleanup()
        {
            // 這裡可以實作定期清理的邏輯
            // 例如每天執行一次
            var timer = new System.Threading.Timer(
                callback: _ => RunCleanup(),
                state: null,
                dueTime: TimeSpan.FromHours(24), // 24小時後開始
                period: TimeSpan.FromHours(24)   // 每24小時執行一次
            );
        }
    }
}