using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FileManagementAPI.Models
{
    public class FileStatisticsModel
    {
        public int TotalFiles { get; set; }
        public long TotalSize { get; set; }
        public string TotalSizeFormatted { get; set; }
        public int DeletedFiles { get; set; }
        public int ImageFiles { get; set; }
        public int DocumentFiles { get; set; }
        public int VideoFiles { get; set; }
        public int AudioFiles { get; set; }
        public int OtherFiles { get; set; }
    }
}