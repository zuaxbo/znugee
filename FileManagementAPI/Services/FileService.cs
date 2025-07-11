// Services/FileService.cs (修正版)
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Hosting;
using FileManagementAPI.Data;
using FileManagementAPI.Models;

namespace FileManagementAPI.Services
{
    public class FileService : IFileService
    {
        private readonly ApplicationDbContext _context;
        private readonly string _uploadPath;
        private readonly string _baseUrl;

        public FileService()
        {
            _context = new ApplicationDbContext();
            _uploadPath = HostingEnvironment.MapPath("~/Uploads/");
            _baseUrl = HttpContext.Current?.Request?.Url?.GetLeftPart(UriPartial.Authority) ?? "";

            // 確保上傳目錄存在
            EnsureUploadDirectoryExists();
        }

        public ApiResponse<FileListModel> UploadFile(HttpPostedFile file, string customFileName, int userId = 1, string username = "demo")
        {
            try
            {
                // 檢查檔案
                if (file == null || file.ContentLength == 0)
                {
                    return ApiResponse<FileListModel>.ErrorResult("請選擇要上傳的檔案");
                }
              
                // 檢查檔案大小 (50MB 限制)
                if (file.ContentLength > 50 * 1024 * 1024)
                {
                    return ApiResponse<FileListModel>.ErrorResult("檔案大小不能超過50MB");
                }

                // 取得檔案資訊
                var originalFileName = Path.GetFileName(file.FileName);
                var fileExtension = Path.GetExtension(originalFileName).ToLower();
                var fileName = string.IsNullOrWhiteSpace(customFileName) ? originalFileName : customFileName + fileExtension;

                // 檢查檔案類型
                if (!IsAllowedFileType(fileExtension))
                {
                    return ApiResponse<FileListModel>.ErrorResult("不支援的檔案類型：" + fileExtension);
                }

                // 產生唯一檔案名稱
                var uniqueFileName = GenerateUniqueFileName(fileName);
                var filePath = Path.Combine(_uploadPath, uniqueFileName);

                // 儲存檔案
                file.SaveAs(filePath);

                // 產生縮圖
                var thumbnailPath = GenerateThumbnail(filePath, fileExtension);
                // 使用固定的展示用使用者資訊
               

                // 儲存到資料庫 - 明確指定類型避免衝突
                var fileInfo = new FileManagementAPI.Models.FileInfo
                {
                    FileName = fileName,
                    OriginalFileName = originalFileName,
                    FilePath = "~/Uploads/" + uniqueFileName,
                    FileExtension = fileExtension,
                    ContentType = file.ContentType,
                    FileSize = file.ContentLength,
                    ThumbnailPath = thumbnailPath,
                    UploadedByUserId = userId,   // 現在會使用預設值 1
                    UploadedByUsername = username, // 現在會使用預設值 "demo"
                    UploadedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    IsPublic = true,
                    PublicUrl = $"{_baseUrl}/api/files/download/{uniqueFileName}"
                };

                _context.Files.Add(fileInfo);
                _context.SaveChanges();

                // 回傳結果
                var result = ConvertToFileListModel(fileInfo);
                return ApiResponse<FileListModel>.SuccessResult(result, "檔案上傳成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<FileListModel>.ErrorResult("檔案上傳失敗：" + ex.Message);
            }
        }

        public ApiResponse<PagedResult<FileListModel>> GetFiles(FileSearchModel searchModel)
        {
            try
            {
                var query = _context.Files.Where(f => !f.IsDeleted);

                // 套用搜尋條件
                query = ApplySearchFilters(query, searchModel);

                // 計算總數
                var totalCount = query.Count();

                // 套用排序
                query = ApplySorting(query, searchModel.SortBy, searchModel.SortOrder);

                // 套用分頁
                var files = query
                    .Skip((searchModel.Page - 1) * searchModel.PageSize)
                    .Take(searchModel.PageSize)
                    .ToList();

                // 轉換為顯示模型 - 明確指定類型
                var fileModels = files.Select(f => ConvertToFileListModel(f)).ToList();

                var result = new PagedResult<FileListModel>(fileModels, totalCount, searchModel.Page, searchModel.PageSize);
                return ApiResponse<PagedResult<FileListModel>>.SuccessResult(result, "取得檔案列表成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<PagedResult<FileListModel>>.ErrorResult("取得檔案列表失敗：" + ex.Message);
            }
        }

        public ApiResponse<PagedResult<FileListModel>> GetDeletedFiles(FileSearchModel searchModel)
        {
            try
            {
                var query = _context.Files.Where(f => f.IsDeleted);

                // 套用搜尋條件
                query = ApplySearchFilters(query, searchModel);

                // 計算總數
                var totalCount = query.Count();

                // 套用排序
                query = ApplySorting(query, searchModel.SortBy, searchModel.SortOrder);

                // 套用分頁
                var files = query
                    .Skip((searchModel.Page - 1) * searchModel.PageSize)
                    .Take(searchModel.PageSize)
                    .ToList();

                // 轉換為顯示模型 - 明確指定類型
                var fileModels = files.Select(f => ConvertToFileListModel(f)).ToList();

                var result = new PagedResult<FileListModel>(fileModels, totalCount, searchModel.Page, searchModel.PageSize);
                return ApiResponse<PagedResult<FileListModel>>.SuccessResult(result, "取得資源回收筒檔案列表成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<PagedResult<FileListModel>>.ErrorResult("取得資源回收筒檔案列表失敗：" + ex.Message);
            }
        }

        public ApiResponse<FilePreviewModel> GetFilePreview(int fileId)
        {
            try
            {
                var file = _context.Files.FirstOrDefault(f => f.Id == fileId && !f.IsDeleted);
                if (file == null)
                {
                    return ApiResponse<FilePreviewModel>.ErrorResult("檔案不存在");
                }

                var previewModel = new FilePreviewModel
                {
                    Id = file.Id,
                    FileName = file.FileName,
                    FileExtension = file.FileExtension,
                    ContentType = file.ContentType,
                    FileSize = file.FileSize,
                    FileSizeFormatted = FormatFileSize(file.FileSize),
                    PreviewUrl = GetPreviewUrl(file),
                    DownloadUrl = file.PublicUrl,
                    CanPreview = CanPreviewFile(file.FileExtension),
                    PreviewType = GetPreviewType(file.FileExtension),
                    UploadedByUsername = file.UploadedByUsername,
                    UploadedAt = file.UploadedAt.ToString("yyyy-MM-dd HH:mm:ss")
                };

                return ApiResponse<FilePreviewModel>.SuccessResult(previewModel, "取得檔案預覽資訊成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<FilePreviewModel>.ErrorResult("取得檔案預覽資訊失敗：" + ex.Message);
            }
        }

        public ApiResponse RenameFile(int fileId, string newFileName, int userId)
        {
            try
            {
                var file = _context.Files.FirstOrDefault(f => f.Id == fileId && !f.IsDeleted);
                if (file == null)
                {
                    return ApiResponse.ErrorResult("檔案不存在");
                }

                // 檢查權限（可選，這裡假設所有使用者都可以重新命名檔案）

                // 保留副檔名
                var newFileNameWithExtension = newFileName;
                if (!newFileName.EndsWith(file.FileExtension, StringComparison.OrdinalIgnoreCase))
                {
                    newFileNameWithExtension += file.FileExtension;
                }

                file.FileName = newFileNameWithExtension;
                file.UpdatedAt = DateTime.Now;
                _context.SaveChanges();

                return ApiResponse.SuccessResult("檔案重新命名成功");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult("檔案重新命名失敗：" + ex.Message);
            }
        }

        public ApiResponse DeleteFile(int fileId, int userId)
        {
            try
            {
                var file = _context.Files.FirstOrDefault(f => f.Id == fileId && !f.IsDeleted);
                if (file == null)
                {
                    return ApiResponse.ErrorResult("檔案不存在");
                }

                // 軟刪除
                file.IsDeleted = true;
                file.DeletedAt = DateTime.Now;
                file.UpdatedAt = DateTime.Now;
                _context.SaveChanges();

                return ApiResponse.SuccessResult("檔案已移至資源回收筒");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult("刪除檔案失敗：" + ex.Message);
            }
        }

        public ApiResponse RestoreFile(int fileId, int userId)
        {
            try
            {
                var file = _context.Files.FirstOrDefault(f => f.Id == fileId && f.IsDeleted);
                if (file == null)
                {
                    return ApiResponse.ErrorResult("檔案不存在於資源回收筒");
                }

                // 還原檔案
                file.IsDeleted = false;
                file.DeletedAt = null;
                file.UpdatedAt = DateTime.Now;
                _context.SaveChanges();

                return ApiResponse.SuccessResult("檔案還原成功");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult("檔案還原失敗：" + ex.Message);
            }
        }

        public ApiResponse PermanentDeleteFile(int fileId, int userId)
        {
            try
            {
                var file = _context.Files.FirstOrDefault(f => f.Id == fileId);
                if (file == null)
                {
                    return ApiResponse.ErrorResult("檔案不存在");
                }

                // 刪除實體檔案
                DeletePhysicalFile(file.FilePath);
                if (!string.IsNullOrEmpty(file.ThumbnailPath))
                {
                    DeletePhysicalFile(file.ThumbnailPath);
                }

                // 從資料庫移除
                _context.Files.Remove(file);
                _context.SaveChanges();

                return ApiResponse.SuccessResult("檔案永久刪除成功");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult("永久刪除檔案失敗：" + ex.Message);
            }
        }

        public ApiResponse BatchOperation(List<int> fileIds, string operation, int userId = 0)
        {
            try
            {
                int successCount = 0;
                int failCount = 0;

                foreach (var fileId in fileIds)
                {
                    try
                    {
                        switch (operation.ToLower())
                        {
                            case "delete":
                                DeleteFile(fileId, userId);
                                break;
                            case "restore":
                                RestoreFile(fileId, userId);
                                break;
                            case "permanent_delete":
                                PermanentDeleteFile(fileId, userId);
                                break;
                        }
                        successCount++;
                    }
                    catch
                    {
                        failCount++;
                    }
                }

                return ApiResponse.SuccessResult($"批量操作完成：成功 {successCount} 個，失敗 {failCount} 個");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult("批量操作失敗：" + ex.Message);
            }
        }

        public string GetFileDownloadUrl(int fileId)
        {
            return $"{_baseUrl}/api/files/download/{fileId}";
        }

        public string GetFilePublicUrl(int fileId)
        {
            var file = _context.Files.FirstOrDefault(f => f.Id == fileId && !f.IsDeleted);
            return file?.PublicUrl ?? "";
        }

        public FileStatisticsModel GetFileStatistics()
        {
            try
            {
                var totalFiles = _context.Files.Count(f => !f.IsDeleted);
                var totalSize = _context.Files.Where(f => !f.IsDeleted).Sum(f => f.FileSize);
                var deletedFiles = _context.Files.Count(f => f.IsDeleted);

                var imageFiles = _context.Files.Count(f => !f.IsDeleted && IsImageFile(f.FileExtension));
                var documentFiles = _context.Files.Count(f => !f.IsDeleted && IsDocumentFile(f.FileExtension));
                var videoFiles = _context.Files.Count(f => !f.IsDeleted && IsVideoFile(f.FileExtension));
                var audioFiles = _context.Files.Count(f => !f.IsDeleted && IsAudioFile(f.FileExtension));
                var otherFiles = totalFiles - imageFiles - documentFiles - videoFiles - audioFiles;

                return new FileStatisticsModel
                {
                    TotalFiles = totalFiles,
                    TotalSize = totalSize,
                    TotalSizeFormatted = FormatFileSize(totalSize),
                    DeletedFiles = deletedFiles,
                    ImageFiles = imageFiles,
                    DocumentFiles = documentFiles,
                    VideoFiles = videoFiles,
                    AudioFiles = audioFiles,
                    OtherFiles = otherFiles
                };
            }
            catch
            {
                return new FileStatisticsModel();
            }
        }

        public void CleanupOldFiles()
        {
            try
            {
                // 清理30天前刪除的檔案
                var cutoffDate = DateTime.Now.AddDays(-30);
                var oldDeletedFiles = _context.Files
                    .Where(f => f.IsDeleted && f.DeletedAt.HasValue && f.DeletedAt < cutoffDate)
                    .ToList();

                foreach (var file in oldDeletedFiles)
                {
                    PermanentDeleteFile(file.Id, 0);
                }

                // 清理365天前的所有檔案
                var yearCutoffDate = DateTime.Now.AddDays(-365);
                var oldFiles = _context.Files
                    .Where(f => f.UploadedAt < yearCutoffDate)
                    .ToList();

                foreach (var file in oldFiles)
                {
                    PermanentDeleteFile(file.Id, 0);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Clean up old files failed: " + ex.Message);
            }
        }

        #region Private Helper Methods

        private void EnsureUploadDirectoryExists()
        {
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
            }

            var thumbnailPath = Path.Combine(_uploadPath, "thumbnails");
            if (!Directory.Exists(thumbnailPath))
            {
                Directory.CreateDirectory(thumbnailPath);
            }
        }

        private bool IsAllowedFileType(string extension)
        {
            var allowedExtensions = new[] {
                ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", // 圖片
                ".pdf", // PDF
                ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", // Office
                ".txt", ".csv", ".xml", ".json", // 文字
                ".mp4", ".avi", ".mov", ".wmv", // 影片
                ".mp3", ".wav", ".flac", ".aac", // 音訊
                ".zip", ".rar", ".7z" // 壓縮檔
            };

            return allowedExtensions.Contains(extension.ToLower());
        }

        private string GenerateUniqueFileName(string originalFileName)
        {
            var fileName = Path.GetFileNameWithoutExtension(originalFileName);
            var extension = Path.GetExtension(originalFileName);
            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            var guid = Guid.NewGuid().ToString("N").Substring(0, 8);

            return $"{fileName}_{timestamp}_{guid}{extension}";
        }

        private string GenerateThumbnail(string filePath, string extension)
        {
            // 這裡可以實作縮圖生成邏輯
            // 簡化版本，只針對圖片檔案
            if (IsImageFile(extension))
            {
                // 實際實作需要使用圖片處理庫
                return "~/Uploads/thumbnails/" + Path.GetFileName(filePath);
            }

            return null;
        }

        private IQueryable<FileManagementAPI.Models.FileInfo> ApplySearchFilters(IQueryable<FileManagementAPI.Models.FileInfo> query, FileSearchModel searchModel)
        {
            if (!string.IsNullOrWhiteSpace(searchModel.FileName))
            {
                query = query.Where(f => f.FileName.Contains(searchModel.FileName) ||
                                        f.OriginalFileName.Contains(searchModel.FileName));
            }

            if (!string.IsNullOrWhiteSpace(searchModel.FileExtension))
            {
                query = query.Where(f => f.FileExtension == searchModel.FileExtension);
            }

            if (searchModel.UploadDateFrom.HasValue)
            {
                query = query.Where(f => f.UploadedAt >= searchModel.UploadDateFrom.Value);
            }

            if (searchModel.UploadDateTo.HasValue)
            {
                query = query.Where(f => f.UploadedAt <= searchModel.UploadDateTo.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchModel.UploadedBy))
            {
                query = query.Where(f => f.UploadedByUsername.Contains(searchModel.UploadedBy));
            }

            return query;
        }

        private IQueryable<FileManagementAPI.Models.FileInfo> ApplySorting(IQueryable<FileManagementAPI.Models.FileInfo> query, string sortBy, string sortOrder)
        {
            var isDescending = sortOrder?.ToLower() == "desc";

            switch (sortBy?.ToLower())
            {
                case "filename":
                    query = isDescending ? query.OrderByDescending(f => f.FileName) : query.OrderBy(f => f.FileName);
                    break;
                case "filesize":
                    query = isDescending ? query.OrderByDescending(f => f.FileSize) : query.OrderBy(f => f.FileSize);
                    break;
                case "uploadedat":
                default:
                    query = isDescending ? query.OrderByDescending(f => f.UploadedAt) : query.OrderBy(f => f.UploadedAt);
                    break;
            }

            return query;
        }

        private FileListModel ConvertToFileListModel(FileManagementAPI.Models.FileInfo file)
        {
            return new FileListModel
            {
                Id = file.Id,
                FileName = file.FileName,
                OriginalFileName = file.OriginalFileName,
                FileExtension = file.FileExtension,
                ContentType = file.ContentType,
                FileSize = file.FileSize,
                FileSizeFormatted = FormatFileSize(file.FileSize),
                ThumbnailUrl = GetThumbnailUrl(file),
                PublicUrl = file.PublicUrl,
                UploadedByUsername = file.UploadedByUsername,
                UploadedAt = file.UploadedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                UpdatedAt = file.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                IsImage = IsImageFile(file.FileExtension),
                IsPdf = file.FileExtension.ToLower() == ".pdf",
                IsOfficeDoc = IsOfficeDocument(file.FileExtension)
            };
        }

        private string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }

        private string GetThumbnailUrl(FileManagementAPI.Models.FileInfo file)
        {
            if (!string.IsNullOrEmpty(file.ThumbnailPath))
            {
                return $"{_baseUrl}/Uploads/thumbnails/{Path.GetFileName(file.ThumbnailPath)}";
            }

            // 根據檔案類型回傳預設圖示
            return GetDefaultIcon(file.FileExtension);
        }

        private string GetPreviewUrl(FileManagementAPI.Models.FileInfo file)
        {
            if (IsImageFile(file.FileExtension) || file.FileExtension.ToLower() == ".pdf")
            {
                return file.PublicUrl;
            }

            return null;
        }

        private bool CanPreviewFile(string extension)
        {
            var previewableExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".pdf" };
            return previewableExtensions.Contains(extension.ToLower());
        }

        private string GetPreviewType(string extension)
        {
            if (IsImageFile(extension)) return "image";
            if (extension.ToLower() == ".pdf") return "pdf";
            if (IsOfficeDocument(extension)) return "office";
            if (IsVideoFile(extension)) return "video";
            if (IsAudioFile(extension)) return "audio";
            return "unknown";
        }

        private string GetDefaultIcon(string extension)
        {
            // 回傳預設圖示 URL
            return $"{_baseUrl}/Content/images/file-icons/{extension.TrimStart('.').ToLower()}.png";
        }

        private bool IsImageFile(string extension)
        {
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg" };
            return imageExtensions.Contains(extension.ToLower());
        }

        private bool IsDocumentFile(string extension)
        {
            var docExtensions = new[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv" };
            return docExtensions.Contains(extension.ToLower());
        }

        private bool IsVideoFile(string extension)
        {
            var videoExtensions = new[] { ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv" };
            return videoExtensions.Contains(extension.ToLower());
        }

        private bool IsAudioFile(string extension)
        {
            var audioExtensions = new[] { ".mp3", ".wav", ".flac", ".aac", ".ogg" };
            return audioExtensions.Contains(extension.ToLower());
        }

        private bool IsOfficeDocument(string extension)
        {
            var officeExtensions = new[] { ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx" };
            return officeExtensions.Contains(extension.ToLower());
        }

        private void DeletePhysicalFile(string filePath)
        {
            try
            {
                var physicalPath = HostingEnvironment.MapPath(filePath);
                if (File.Exists(physicalPath))
                {
                    File.Delete(physicalPath);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Delete physical file failed: " + ex.Message);
            }
        }

        #endregion

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}