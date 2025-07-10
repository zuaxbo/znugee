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
    [RoutePrefix("api/files")]
    public class FilesController : ApiController
    {
        private readonly IFileService _fileService;

        public FilesController()
        {
            _fileService = new FileService();
        }

        public FilesController(IFileService fileService)
        {
            _fileService = fileService;
        }

        // POST: api/files/upload
        [HttpPost]
        [Route("upload")]
        public IHttpActionResult Upload()
        {
            try
            {
                // 檢查使用者是否登入
                if (!IsUserLoggedIn())
                {
                    return Ok(ApiResponse<FileListModel>.ErrorResult("請先登入"));
                }

                // 檢查是否有檔案
                var httpRequest = HttpContext.Current.Request;
                if (httpRequest.Files.Count == 0)
                {
                    return Ok(ApiResponse<FileListModel>.ErrorResult("請選擇要上傳的檔案"));
                }

                var file = httpRequest.Files[0];
                var customFileName = httpRequest.Form["customFileName"];

                var userId = GetCurrentUserId();
                var username = GetCurrentUsername();

                var result = _fileService.UploadFile(file, customFileName, userId, username);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse<FileListModel>.ErrorResult("檔案上傳失敗：" + ex.Message));
            }
        }

        // GET: api/files/list
        [HttpGet]
        [Route("list")]
        public IHttpActionResult GetFiles([FromUri] FileSearchModel searchModel = null)
        {
            try
            {
                if (searchModel == null)
                {
                    searchModel = new FileSearchModel();
                }

                var result = _fileService.GetFiles(searchModel);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse<PagedResult<FileListModel>>.ErrorResult("取得檔案列表失敗：" + ex.Message));
            }
        }

        // GET: api/files/statistics
        [HttpGet]
        [Route("statistics")]
        public IHttpActionResult GetStatistics()
        {
            try
            {
                var statistics = _fileService.GetFileStatistics();
                return Ok(ApiResponse<FileStatisticsModel>.SuccessResult(statistics, "取得檔案統計成功"));
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse<FileStatisticsModel>.ErrorResult("取得檔案統計失敗：" + ex.Message));
            }
        }

        // GET: api/files/download/{id}
        [HttpGet]
        [Route("download/{id:int}")]
        public IHttpActionResult Download(int id)
        {
            try
            {
                // 這裡需要實作檔案下載邏輯
                // 簡化版本回傳下載 URL
                var downloadUrl = _fileService.GetFileDownloadUrl(id);
                if (string.IsNullOrEmpty(downloadUrl))
                {
                    return Ok(ApiResponse.ErrorResult("檔案不存在"));
                }

                return Ok(ApiResponse<string>.SuccessResult(downloadUrl, "取得下載連結成功"));
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse<string>.ErrorResult("取得下載連結失敗：" + ex.Message));
            }
        }

        // GET: api/files/preview/{id}
        [HttpGet]
        [Route("preview/{id:int}")]
        public IHttpActionResult GetPreview(int id)
        {
            try
            {
                var result = _fileService.GetFilePreview(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse<FilePreviewModel>.ErrorResult("取得檔案預覽失敗：" + ex.Message));
            }
        }

        // PUT: api/files/rename/{id}
        [HttpPut]
        [Route("rename/{id:int}")]
        public IHttpActionResult Rename(int id, FileRenameModel model)
        {
            try
            {
                // 檢查使用者是否登入
                if (!IsUserLoggedIn())
                {
                    return Ok(ApiResponse.ErrorResult("請先登入"));
                }

                // 檢查模型驗證
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    return Ok(ApiResponse.ErrorResult("資料驗證失敗", errors));
                }

                var userId = GetCurrentUserId();
                var result = _fileService.RenameFile(id, model.NewFileName, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse.ErrorResult("檔案重新命名失敗：" + ex.Message));
            }
        }

        // DELETE: api/files/{id}
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Delete(int id)
        {
            try
            {
                // 檢查使用者是否登入
                if (!IsUserLoggedIn())
                {
                    return Ok(ApiResponse.ErrorResult("請先登入"));
                }

                var userId = GetCurrentUserId();
                var result = _fileService.DeleteFile(id, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse.ErrorResult("刪除檔案失敗：" + ex.Message));
            }
        }

        // POST: api/files/batch-operation
        [HttpPost]
        [Route("batch-operation")]
        public IHttpActionResult BatchOperation(FileOperationModel model)
        {
            try
            {
                // 檢查使用者是否登入
                if (!IsUserLoggedIn())
                {
                    return Ok(ApiResponse.ErrorResult("請先登入"));
                }

                // 檢查模型驗證
                if (!ModelState.IsValid || model.FileIds == null || !model.FileIds.Any())
                {
                    return Ok(ApiResponse.ErrorResult("請選擇要操作的檔案"));
                }

                var userId = GetCurrentUserId();
                var result = _fileService.BatchOperation(model.FileIds, model.Operation, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(ApiResponse.ErrorResult("批量操作失敗：" + ex.Message));
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

        private string GetCurrentUsername()
        {
            try
            {
                return HttpContext.Current?.Session?["Username"]?.ToString() ?? "";
            }
            catch
            {
                return "";
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
