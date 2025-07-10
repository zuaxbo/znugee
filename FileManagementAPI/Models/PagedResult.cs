using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FileManagementAPI.Models
{
    public class PagedResult<T>
    {
        public List<T> Data { get; set; }
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }

        public PagedResult()
        {
            Data = new List<T>();
        }

        public PagedResult(List<T> data, int totalCount, int page, int pageSize)
        {
            Data = data ?? new List<T>();
            TotalCount = totalCount;
            Page = page;
            PageSize = pageSize;
            TotalPages = (int)System.Math.Ceiling((double)totalCount / pageSize);
            HasNextPage = page < TotalPages;
            HasPreviousPage = page > 1;
        }
    }
}