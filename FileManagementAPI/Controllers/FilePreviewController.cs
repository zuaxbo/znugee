using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Web.Http;
using System.Web.Http.Cors;
using System.Web.Hosting;
using FileManagementAPI.Models;
using FileManagementAPI.Services;
using FileManagementAPI.Data;

namespace FileManagementAPI.Controllers
{
    //[EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/filepreview")]
    public class FilePreviewController : ApiController
    {
        private readonly IFileService _fileService;
        private readonly ApplicationDbContext _context;

        public FilePreviewController()
        {
            _fileService = new FileService();
            _context = new ApplicationDbContext();
        }

        public FilePreviewController(IFileService fileService, ApplicationDbContext context)
        {
            _fileService = fileService;
            _context = context;
        }

        // GET: api/filepreview/{id}
        [HttpGet]
        [Route("{id:int}")]
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

        // GET: api/filepreview/thumbnail/{id}
        [HttpGet]
        [Route("thumbnail/{id:int}")]
        public HttpResponseMessage GetThumbnail(int id)
        {
            try
            {
                var file = _context.Files.FirstOrDefault(f => f.Id == id && !f.IsDeleted);
                if (file == null)
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound, "檔案不存在");
                }

                string thumbnailPath = null;

                // 如果有縮圖
                if (!string.IsNullOrEmpty(file.ThumbnailPath))
                {
                    thumbnailPath = HostingEnvironment.MapPath(file.ThumbnailPath);
                }
                // 如果是圖片檔案，直接使用原檔案
                else if (IsImageFile(file.FileExtension))
                {
                    thumbnailPath = HostingEnvironment.MapPath(file.FilePath);
                }

                // 如果找到檔案
                if (!string.IsNullOrEmpty(thumbnailPath) && File.Exists(thumbnailPath))
                {
                    var fileBytes = File.ReadAllBytes(thumbnailPath);
                    var response = Request.CreateResponse(HttpStatusCode.OK);
                    response.Content = new ByteArrayContent(fileBytes);
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
                    response.Content.Headers.ContentLength = fileBytes.Length;

                    // 設定快取標頭
                    response.Headers.CacheControl = new CacheControlHeaderValue
                    {
                        Public = true,
                        MaxAge = TimeSpan.FromDays(7)
                    };

                    return response;
                }

                // 回傳預設圖示
                return GetDefaultIcon(file.FileExtension);
            }
            catch (Exception ex)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, "取得縮圖失敗：" + ex.Message);
            }
        }

        // GET: api/filepreview/content/{id}
        [HttpGet]
        [Route("content/{id:int}")]
        public HttpResponseMessage GetContent(int id)
        {
            try
            {
                var file = _context.Files.FirstOrDefault(f => f.Id == id && !f.IsDeleted);
                if (file == null)
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound, "檔案不存在");
                }

                var filePath = HostingEnvironment.MapPath(file.FilePath);
                if (!File.Exists(filePath))
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound, "實體檔案不存在");
                }

                // 檢查是否可預覽
                if (!CanPreviewFile(file.FileExtension))
                {
                    return Request.CreateResponse(HttpStatusCode.BadRequest, "此檔案類型不支援預覽");
                }

                var fileBytes = File.ReadAllBytes(filePath);
                var response = Request.CreateResponse(HttpStatusCode.OK);
                response.Content = new ByteArrayContent(fileBytes);
                response.Content.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
                response.Content.Headers.ContentLength = fileBytes.Length;

                // 設定檔案名稱
                response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("inline")
                {
                    FileName = file.FileName
                };

                return response;
            }
            catch (Exception ex)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, "取得檔案內容失敗：" + ex.Message);
            }
        }

        #region Helper Methods

        private bool IsImageFile(string extension)
        {
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg" };
            return imageExtensions.Contains(extension.ToLower());
        }

        private bool CanPreviewFile(string extension)
        {
            var previewableExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".pdf" };
            return previewableExtensions.Contains(extension.ToLower());
        }

        private HttpResponseMessage GetDefaultIcon(string extension)
        {
            try
            {
                // 嘗試取得對應的圖示檔案
                var iconPath = HostingEnvironment.MapPath($"~/Content/images/file-icons/{extension.TrimStart('.').ToLower()}.png");

                // 如果圖示不存在，使用預設圖示
                if (!File.Exists(iconPath))
                {
                    iconPath = HostingEnvironment.MapPath("~/Content/images/file-icons/default.png");
                }

                if (File.Exists(iconPath))
                {
                    var fileBytes = File.ReadAllBytes(iconPath);
                    var response = Request.CreateResponse(HttpStatusCode.OK);
                    response.Content = new ByteArrayContent(fileBytes);
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
                    response.Content.Headers.ContentLength = fileBytes.Length;
                    return response;
                }

                return Request.CreateResponse(HttpStatusCode.NotFound, "找不到圖示");
            }
            catch
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, "取得預設圖示失敗");
            }
        }

        #endregion

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                if (_fileService is IDisposable disposableService)
                {
                    disposableService.Dispose();
                }
                _context?.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
