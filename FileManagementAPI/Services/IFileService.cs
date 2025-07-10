using FileManagementAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace FileManagementAPI.Services
{
    public interface IFileService : IDisposable
    {
        ApiResponse<FileListModel> UploadFile(HttpPostedFile file, string customFileName, int userId, string username);
        ApiResponse<PagedResult<FileListModel>> GetFiles(FileSearchModel searchModel);
        ApiResponse<PagedResult<FileListModel>> GetDeletedFiles(FileSearchModel searchModel);
        ApiResponse<FilePreviewModel> GetFilePreview(int fileId);
        ApiResponse RenameFile(int fileId, string newFileName, int userId);
        ApiResponse DeleteFile(int fileId, int userId);
        ApiResponse RestoreFile(int fileId, int userId);
        ApiResponse PermanentDeleteFile(int fileId, int userId);
        ApiResponse BatchOperation(List<int> fileIds, string operation, int userId);
        string GetFileDownloadUrl(int fileId);
        string GetFilePublicUrl(int fileId);
        FileStatisticsModel GetFileStatistics();
        void CleanupOldFiles();
    }
}
