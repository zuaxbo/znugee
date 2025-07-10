using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web;
using System.Web.Http.Cors;
using FileManagementAPI.Models;
using FileManagementAPI.Services;

namespace FileManagementAPI.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/recyclebin")]
    public class RecycleBinController : ApiController
    {
        private readonly IFileService _fileService;

        public RecycleBinController()
        {
            _fileService = new FileService();
        }

        public RecycleBinController(IFileService fileService)
        {
            _fileService = fileService;
        }

        // GET: api/recyclebin/list
        [HttpGet]
        [Route("list")]
        public IHttpActionResult GetDeletedFiles([FromUri] FileSearchModel searchModel = null)
        {
            try
            {
                if (searchModel == null)
                {
                    searchModel = new FileSearchModel();
                }

                var result = _fileService.GetDeletedFiles(searchModel);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse<PagedResult<FileListModel>>.ErrorResult("取得資源回收筒檔案列表失敗：" + ex.Message));
            }
        }

        // POST: api/recyclebin/restore/{id}
        [HttpPost]
        [Route("restore/{id:int}")]
        public IHttpActionResult Restore(int id)
        {
            try
            {
                // 檢查使用者是否登入
                if (!IsUserLoggedIn())
                {
                    return Ok(ApiResponse.ErrorResult("請先登入"));
                }

                var userId = GetCurrentUserId();
                var result = _fileService.RestoreFile(id, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse.ErrorResult("還原檔案失敗：" + ex.Message));
            }
        }

        // DELETE: api/recyclebin/permanent/{id}
        [HttpDelete]
        [Route("permanent/{id:int}")]
        public IHttpActionResult PermanentDelete(int id)
        {
            try
            {
                // 檢查使用者是否登入
                if (!IsUserLoggedIn())
                {
                    return Ok(ApiResponse.ErrorResult("請先登入"));
                }

                var userId = GetCurrentUserId();
                var result = _fileService.PermanentDeleteFile(id, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse.ErrorResult("永久刪除檔案失敗：" + ex.Message));
            }
        }

        // POST: api/recyclebin/cleanup
        [HttpPost]
        [Route("cleanup")]
        public IHttpActionResult Cleanup()
        {
            try
            {
                // 檢查使用者是否登入
                if (!IsUserLoggedIn())
                {
                    return Ok(ApiResponse.ErrorResult("請先登入"));
                }

                _fileService.CleanupOldFiles();
                return Ok(ApiResponse.SuccessResult("資源回收筒清理完成"));
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse.ErrorResult("清理資源回收筒失敗：" + ex.Message));
            }
        }

        #region Helper Methods

        private bool IsUserLoggedIn()
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

        private int GetCurrentUserId()
        {
            try
            {
                var userId = HttpContext.Current?.Session?["UserId"];
                return userId != null ? (int)userId : 0;
            }
            catch
            {
                return 0;
            }
        }

        #endregion

        protected override void Dispose(bool disposing)
        {
            if (disposing && _fileService is IDisposable disposableService)
            {
                disposableService.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
