// assets/js/utils/api.js
const API = {
    // 基礎請求方法
    async request(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' // 包含 cookies/session
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(API_CONFIG.BASE_URL + url, finalOptions);

            // 處理非 JSON 回應（如檔案下載）
            if (finalOptions.responseType === 'blob') {
                return response;
            }

            const data = await response.json();

            // 統一處理 API 回應格式
            if (data && typeof data === 'object') {
                return data;
            }

            throw new Error('無效的回應格式');
        } catch (error) {
            console.error('API 請求錯誤:', error);
            throw new Error(error.message || MESSAGES.ERROR.NETWORK_ERROR);
        }
    },

    // GET 請求
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl);
    },

    // POST 請求
    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // PUT 請求
    async put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // DELETE 請求
    async delete(url) {
        return this.request(url, {
            method: 'DELETE'
        });
    },

    // 檔案上傳請求
    async upload(url, formData) {
        return this.request(url, {
            method: 'POST',
            headers: {}, // 移除 Content-Type，讓瀏覽器自動設定
            body: formData
        });
    },

    // 下載檔案
    async download(url) {
        return this.request(url, {
            responseType: 'blob'
        });
    }
};

// 使用者認證 API
const AuthAPI = {
    // 使用者登入
    async login(username, password) {
        try {
            const response = await API.post(`${API_CONFIG.AUTH_API}/login`, {
                Username: username,
                Password: password
            });

            if (response.Success && response.Data) {
                Auth.setLoginState(response.Data);
                return { success: true, data: response.Data, message: response.Message };
            } else {
                return { success: false, message: response.Message || MESSAGES.ERROR.LOGIN_FAILED };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 使用者註冊
    async register(userData) {
        try {
            const response = await API.post(`${API_CONFIG.AUTH_API}/register`, {
                Username: userData.username,
                Email: userData.email,
                Password: userData.password,
                ConfirmPassword: userData.confirmPassword,
                FullName: userData.fullName
            });

            if (response.Success) {
                return { success: true, message: response.Message || MESSAGES.SUCCESS.REGISTER };
            } else {
                return { success: false, message: response.Message || MESSAGES.ERROR.REGISTER_FAILED, errors: response.Errors };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 使用者登出
    async logout() {
        try {
            await API.post(`${API_CONFIG.AUTH_API}/logout`);
            Auth.logout();
            return { success: true };
        } catch (error) {
            Auth.logout(); // 即使 API 失敗也要清除本地狀態
            return { success: true };
        }
    }
};

// 檔案管理 API
const FileAPI = {
    // 取得檔案列表
    async getFiles(searchParams = {}) {
        try {
            const params = {
                Page: searchParams.page || 1,
                PageSize: searchParams.pageSize || FILE_CONFIG.PAGE_SIZE,
                FileName: searchParams.fileName || '',
                FileExtension: searchParams.fileExtension || '',
                SortBy: searchParams.sortBy || 'UploadedAt',
                SortOrder: searchParams.sortOrder || 'desc'
            };

            // 移除空值參數
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            const response = await API.get(`${API_CONFIG.FILES_API}/list`, params);

            if (response.Success && response.Data) {
                return {
                    success: true,
                    data: response.Data.Data || [],
                    totalCount: response.Data.TotalCount || 0,
                    totalPages: response.Data.TotalPages || 1,
                    currentPage: response.Data.Page || 1
                };
            } else {
                return { success: false, message: response.Message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 上傳檔案
    async uploadFile(file, customFileName = '') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (customFileName) {
                formData.append('customFileName', customFileName);
            }

            const response = await API.upload(`${API_CONFIG.FILES_API}/upload`, formData);

            if (response.Success && response.Data) {
                return { success: true, data: response.Data, message: response.Message || MESSAGES.SUCCESS.UPLOAD };
            } else {
                return { success: false, message: response.Message || MESSAGES.ERROR.UPLOAD_FAILED };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 重新命名檔案
    async renameFile(fileId, newFileName) {
        try {
            const response = await API.put(`${API_CONFIG.FILES_API}/rename/${fileId}`, {
                FileId: fileId,
                NewFileName: newFileName
            });

            if (response.Success) {
                return { success: true, message: response.Message || MESSAGES.SUCCESS.RENAME };
            } else {
                return { success: false, message: response.Message || MESSAGES.ERROR.RENAME_FAILED };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 刪除檔案
    async deleteFile(fileId) {
        try {
            const response = await API.delete(`${API_CONFIG.FILES_API}/${fileId}`);

            if (response.Success) {
                return { success: true, message: response.Message || MESSAGES.SUCCESS.DELETE };
            } else {
                return { success: false, message: response.Message || MESSAGES.ERROR.DELETE_FAILED };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 批量操作檔案
    async batchOperation(fileIds, operation) {
        try {
            const response = await API.post(`${API_CONFIG.FILES_API}/batch-operation`, {
                FileIds: fileIds,
                Operation: operation
            });

            if (response.Success) {
                return { success: true, message: response.Message };
            } else {
                return { success: false, message: response.Message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 取得檔案預覽資訊
    async getFilePreview(fileId) {
        try {
            const response = await API.get(`${API_CONFIG.FILES_API}/preview/${fileId}`);

            if (response.Success && response.Data) {
                return { success: true, data: response.Data };
            } else {
                return { success: false, message: response.Message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 取得檔案統計
    async getStatistics() {
        try {
            const response = await API.get(`${API_CONFIG.FILES_API}/statistics`);

            if (response.Success && response.Data) {
                return { success: true, data: response.Data };
            } else {
                return { success: false, message: response.Message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 取得檔案下載連結
    getDownloadUrl(fileId) {
        return `${API_CONFIG.BASE_URL}${API_CONFIG.FILES_API}/download/${fileId}`;
    },

    // 下載檔案
    async downloadFile(fileId, fileName) {
        try {
            const url = this.getDownloadUrl(fileId);
            Utils.downloadFile(url, fileName);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

// 資源回收筒 API
const RecycleAPI = {
    // 取得已刪除檔案列表
    async getDeletedFiles(searchParams = {}) {
        try {
            const params = {
                Page: searchParams.page || 1,
                PageSize: searchParams.pageSize || FILE_CONFIG.PAGE_SIZE,
                FileName: searchParams.fileName || '',
                SortBy: searchParams.sortBy || 'DeletedAt',
                SortOrder: searchParams.sortOrder || 'desc'
            };

            // 移除空值參數
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            const response = await API.get(`${API_CONFIG.RECYCLE_API}/list`, params);

            if (response.Success && response.Data) {
                return {
                    success: true,
                    data: response.Data.Data || [],
                    totalCount: response.Data.TotalCount || 0,
                    totalPages: response.Data.TotalPages || 1,
                    currentPage: response.Data.Page || 1
                };
            } else {
                return { success: false, message: response.Message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 還原檔案
    async restoreFile(fileId) {
        try {
            const response = await API.post(`${API_CONFIG.RECYCLE_API}/restore/${fileId}`);

            if (response.Success) {
                return { success: true, message: response.Message || MESSAGES.SUCCESS.RESTORE };
            } else {
                return { success: false, message: response.Message || MESSAGES.ERROR.RESTORE_FAILED };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 永久刪除檔案
    async permanentDelete(fileId) {
        try {
            const response = await API.delete(`${API_CONFIG.RECYCLE_API}/permanent/${fileId}`);

            if (response.Success) {
                return { success: true, message: response.Message };
            } else {
                return { success: false, message: response.Message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // 清理資源回收筒
    async cleanup() {
        try {
            const response = await API.post(`${API_CONFIG.RECYCLE_API}/cleanup`);

            if (response.Success) {
                return { success: true, message: response.Message };
            } else {
                return { success: false, message: response.Message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

// 檔案預覽 API
const PreviewAPI = {
    // 取得檔案縮圖 URL
    getThumbnailUrl(fileId) {
        return `${API_CONFIG.BASE_URL}${API_CONFIG.PREVIEW_API}/thumbnail/${fileId}`;
    },

    // 取得檔案內容 URL（用於預覽）
    getContentUrl(fileId) {
        return `${API_CONFIG.BASE_URL}${API_CONFIG.PREVIEW_API}/content/${fileId}`;
    },

    // 取得檔案預覽資訊
    async getPreviewInfo(fileId) {
        try {
            const response = await API.get(`${API_CONFIG.PREVIEW_API}/${fileId}`);

            if (response.Success && response.Data) {
                return { success: true, data: response.Data };
            } else {
                return { success: false, message: response.Message };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

// 匯出 API 物件
window.AuthAPI = AuthAPI;
window.FileAPI = FileAPI;
window.RecycleAPI = RecycleAPI;
window.PreviewAPI = PreviewAPI;