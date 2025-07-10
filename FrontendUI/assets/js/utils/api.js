// assets/js/utils/api.js

const API = {
    // 基礎請求方法 - 支援不同的基礎 URL
    async request(url, options = {}, baseUrl = null) {
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

        // 如果 URL 已經是完整 URL，直接使用；否則加上基礎 URL
        const fullUrl = url.startsWith('http') ? url : (baseUrl || API_CONFIG.FILES_BASE_URL) + url;

        try {
            console.log(`🌐 API 請求: ${finalOptions.method} ${fullUrl}`);

            const response = await fetch(fullUrl, finalOptions);

            // 處理非 JSON 回應（如檔案下載）
            if (finalOptions.responseType === 'blob') {
                return response;
            }

            const data = await response.json();

            console.log(`📨 API 回應: ${response.status}`, data);

            // 統一處理 API 回應格式
            if (data && typeof data === 'object') {
                return data;
            }

            throw new Error('無效的回應格式');
        } catch (error) {
            console.error('💥 API 請求錯誤:', error);
            console.error('請求 URL:', fullUrl);
            console.error('請求選項:', finalOptions);

            // 根據錯誤類型提供更詳細的錯誤訊息
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(`無法連接到服務器 (${fullUrl})`);
            }

            throw new Error(error.message || MESSAGES.ERROR.NETWORK_ERROR);
        }
    },

    // GET 請求
    async get(url, params = {}, baseUrl = null) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, {}, baseUrl);
    },

    // POST 請求
    async post(url, data = {}, baseUrl = null) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        }, baseUrl);
    },

    // PUT 請求
    async put(url, data = {}, baseUrl = null) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, baseUrl);
    },

    // DELETE 請求
    async delete(url, baseUrl = null) {
        return this.request(url, {
            method: 'DELETE'
        }, baseUrl);
    },

    // 檔案上傳請求
    async upload(url, formData, baseUrl = null) {
        return this.request(url, {
            method: 'POST',
            headers: {}, // 移除 Content-Type，讓瀏覽器自動設定
            body: formData
        }, baseUrl);
    },

    // 下載檔案
    async download(url, baseUrl = null) {
        return this.request(url, {
            responseType: 'blob'
        }, baseUrl);
    }
};

// 使用者認證 API - 使用認證服務端點
const AuthAPI = {
    // 使用者登入
    async login(username, password) {
        try {
            console.log('🔐 使用者登入請求');

            const response = await API.post('/api/auth/login', {
                Username: username,
                Password: password
            }, API_CONFIG.AUTH_BASE_URL);

            if (response.Success && response.Data) {
                Auth.setLoginState(response.Data);
                return { success: true, data: response.Data, message: response.Message };
            } else {
                return { success: false, message: response.Message || MESSAGES.ERROR.LOGIN_FAILED };
            }
        } catch (error) {
            console.error('登入錯誤:', error);
            return {
                success: false,
                message: error.message.includes('連接') ? MESSAGES.ERROR.AUTH_API_ERROR : error.message
            };
        }
    },

    // 使用者註冊
    async register(userData) {
        try {
            console.log('📝 使用者註冊請求');

            const response = await API.post('/api/auth/register', {
                Username: userData.username,
                Email: userData.email,
                Password: userData.password,
                ConfirmPassword: userData.confirmPassword,
                FullName: userData.fullName
            }, API_CONFIG.AUTH_BASE_URL);

            if (response.Success) {
                return { success: true, message: response.Message || MESSAGES.SUCCESS.REGISTER };
            } else {
                return {
                    success: false,
                    message: response.Message || MESSAGES.ERROR.REGISTER_FAILED,
                    errors: response.Errors
                };
            }
        } catch (error) {
            console.error('註冊錯誤:', error);
            return {
                success: false,
                message: error.message.includes('連接') ? MESSAGES.ERROR.AUTH_API_ERROR : error.message
            };
        }
    },

    // 使用者登出
    async logout() {
        try {
            await API.post('/api/auth/logout', {}, API_CONFIG.AUTH_BASE_URL);
            Auth.logout();
            return { success: true };
        } catch (error) {
            Auth.logout(); // 即使 API 失敗也要清除本地狀態
            return { success: true };
        }
    }
};

// 檔案管理 API - 使用檔案管理服務端點
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

            const response = await API.get('/api/files/list', params, API_CONFIG.FILES_BASE_URL);

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
            console.error('取得檔案列表錯誤:', error);
            return {
                success: false,
                message: error.message.includes('連接') ? MESSAGES.ERROR.FILES_API_ERROR : error.message
            };
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

            const response = await API.upload('/api/files/upload', formData, API_CONFIG.FILES_BASE_URL);

            if (response.Success && response.Data) {
                return { success: true, data: response.Data, message: response.Message || MESSAGES.SUCCESS.UPLOAD };
            } else {
                return { success: false, message: response.Message || MESSAGES.ERROR.UPLOAD_FAILED };
            }
        } catch (error) {
            console.error('檔案上傳錯誤:', error);
            return {
                success: false,
                message: error.message.includes('連接') ? MESSAGES.ERROR.FILES_API_ERROR : error.message
            };
        }
    },

    // 重新命名檔案
    async renameFile(fileId, newFileName) {
        try {
            const response = await API.put(`/api/files/rename/${fileId}`, {
                FileId: fileId,
                NewFileName: newFileName
            }, API_CONFIG.FILES_BASE_URL);

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
            const response = await API.delete(`/api/files/${fileId}`, API_CONFIG.FILES_BASE_URL);

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
            const response = await API.post('/api/files/batch-operation', {
                FileIds: fileIds,
                Operation: operation
            }, API_CONFIG.FILES_BASE_URL);

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
            const response = await API.get(`/api/files/preview/${fileId}`, {}, API_CONFIG.FILES_BASE_URL);

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
            const response = await API.get('/api/files/statistics', {}, API_CONFIG.FILES_BASE_URL);

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
        return `${API_CONFIG.FILES_BASE_URL}/api/files/download/${fileId}`;
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

// 資源回收筒 API - 使用檔案管理服務端點
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

            const response = await API.get('/api/recyclebin/list', params, API_CONFIG.FILES_BASE_URL);

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
            const response = await API.post(`/api/recyclebin/restore/${fileId}`, {}, API_CONFIG.FILES_BASE_URL);

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
            const response = await API.delete(`/api/recyclebin/permanent/${fileId}`, API_CONFIG.FILES_BASE_URL);

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
            const response = await API.post('/api/recyclebin/cleanup', {}, API_CONFIG.FILES_BASE_URL);

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

// 檔案預覽 API - 使用檔案管理服務端點
const PreviewAPI = {
    // 取得檔案縮圖 URL
    getThumbnailUrl(fileId) {
        return `${API_CONFIG.FILES_BASE_URL}/api/filepreview/thumbnail/${fileId}`;
    },

    // 取得檔案內容 URL（用於預覽）
    getContentUrl(fileId) {
        return `${API_CONFIG.FILES_BASE_URL}/api/filepreview/content/${fileId}`;
    },

    // 取得檔案預覽資訊
    async getPreviewInfo(fileId) {
        try {
            const response = await API.get(`/api/filepreview/${fileId}`, {}, API_CONFIG.FILES_BASE_URL);

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

// API 連線測試
const APITest = {
    // 測試認證服務連線
    async testAuthService() {
        try {
            console.log('🔍 測試認證服務連線...');
            const response = await fetch(`${API_CONFIG.AUTH_BASE_URL}/api/auth/test`, {
                method: 'GET',
                timeout: 5000
            });

            const result = response.ok;
            console.log(result ? '✅ 認證服務連線正常' : '❌ 認證服務連線失敗');
            return result;
        } catch (error) {
            console.error('❌ 認證服務連線失敗:', error);
            return false;
        }
    },

    // 測試檔案服務連線
    async testFilesService() {
        try {
            console.log('🔍 測試檔案服務連線...');
            const response = await fetch(`${API_CONFIG.FILES_BASE_URL}/api/files/statistics`, {
                method: 'GET',
                timeout: 5000
            });

            const result = response.ok;
            console.log(result ? '✅ 檔案服務連線正常' : '❌ 檔案服務連線失敗');
            return result;
        } catch (error) {
            console.error('❌ 檔案服務連線失敗:', error);
            return false;
        }
    },

    // 測試所有服務
    async testAllServices() {
        console.log('🚀 開始 API 服務連線測試...');

        const authOk = await this.testAuthService();
        const filesOk = await this.testFilesService();

        const overall = authOk && filesOk;

        console.log('📊 API 服務測試結果:');
        console.log(`- UserAuthAPI (${API_CONFIG.AUTH_BASE_URL}): ${authOk ? '✅ 正常' : '❌ 異常'}`);
        console.log(`- FileManagementAPI (${API_CONFIG.FILES_BASE_URL}): ${filesOk ? '✅ 正常' : '❌ 異常'}`);
        console.log(`- 整體狀態: ${overall ? '✅ 所有服務正常' : '❌ 部分服務異常'}`);

        return { auth: authOk, files: filesOk, overall };
    }
};

// 匯出 API 物件
window.AuthAPI = AuthAPI;
window.FileAPI = FileAPI;
window.RecycleAPI = RecycleAPI;
window.PreviewAPI = PreviewAPI;
window.APITest = APITest;

// 在開發環境下自動進行連線測試
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', async function () {
        // 延遲一秒後進行測試，確保頁面載入完成
        setTimeout(async () => {
            await APITest.testAllServices();
        }, 1000);
    });
}







//const API = {
//    // 基礎請求方法
//    async request(url, options = {}) {
//        const defaultOptions = {
//            method: 'GET',
//            headers: {
//                'Content-Type': 'application/json',
//            },
//            credentials: 'include' // 包含 cookies/session
//        };

//        const finalOptions = {
//            ...defaultOptions,
//            ...options,
//            headers: {
//                ...defaultOptions.headers,
//                ...options.headers
//            }
//        };

//        try {
//            const response = await fetch(API_CONFIG.BASE_URL + url, finalOptions);

//            // 處理非 JSON 回應（如檔案下載）
//            if (finalOptions.responseType === 'blob') {
//                return response;
//            }

//            const data = await response.json();

//            // 統一處理 API 回應格式
//            if (data && typeof data === 'object') {
//                return data;
//            }

//            throw new Error('無效的回應格式');
//        } catch (error) {
//            console.error('API 請求錯誤:', error);
//            throw new Error(error.message || MESSAGES.ERROR.NETWORK_ERROR);
//        }
//    },

//    // GET 請求
//    async get(url, params = {}) {
//        const queryString = new URLSearchParams(params).toString();
//        const fullUrl = queryString ? `${url}?${queryString}` : url;
//        return this.request(fullUrl);
//    },

//    // POST 請求
//    async post(url, data = {}) {
//        return this.request(url, {
//            method: 'POST',
//            body: JSON.stringify(data)
//        });
//    },

//    // PUT 請求
//    async put(url, data = {}) {
//        return this.request(url, {
//            method: 'PUT',
//            body: JSON.stringify(data)
//        });
//    },

//    // DELETE 請求
//    async delete(url) {
//        return this.request(url, {
//            method: 'DELETE'
//        });
//    },

//    // 檔案上傳請求
//    async upload(url, formData) {
//        return this.request(url, {
//            method: 'POST',
//            headers: {}, // 移除 Content-Type，讓瀏覽器自動設定
//            body: formData
//        });
//    },

//    // 下載檔案
//    async download(url) {
//        return this.request(url, {
//            responseType: 'blob'
//        });
//    }
//};

//// 使用者認證 API
//const AuthAPI = {
//    // 使用者登入
//    async login(username, password) {
//        try {
//            const response = await API.post(`${API_CONFIG.AUTH_API}/login`, {
//                Username: username,
//                Password: password
//            });

//            if (response.Success && response.Data) {
//                Auth.setLoginState(response.Data);
//                return { success: true, data: response.Data, message: response.Message };
//            } else {
//                return { success: false, message: response.Message || MESSAGES.ERROR.LOGIN_FAILED };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 使用者註冊
//    async register(userData) {
//        try {
//            const response = await API.post(`${API_CONFIG.AUTH_API}/register`, {
//                Username: userData.username,
//                Email: userData.email,
//                Password: userData.password,
//                ConfirmPassword: userData.confirmPassword,
//                FullName: userData.fullName
//            });

//            if (response.Success) {
//                return { success: true, message: response.Message || MESSAGES.SUCCESS.REGISTER };
//            } else {
//                return { success: false, message: response.Message || MESSAGES.ERROR.REGISTER_FAILED, errors: response.Errors };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 使用者登出
//    async logout() {
//        try {
//            await API.post(`${API_CONFIG.AUTH_API}/logout`);
//            Auth.logout();
//            return { success: true };
//        } catch (error) {
//            Auth.logout(); // 即使 API 失敗也要清除本地狀態
//            return { success: true };
//        }
//    }
//};

//// 檔案管理 API
//const FileAPI = {
//    // 取得檔案列表
//    async getFiles(searchParams = {}) {
//        try {
//            const params = {
//                Page: searchParams.page || 1,
//                PageSize: searchParams.pageSize || FILE_CONFIG.PAGE_SIZE,
//                FileName: searchParams.fileName || '',
//                FileExtension: searchParams.fileExtension || '',
//                SortBy: searchParams.sortBy || 'UploadedAt',
//                SortOrder: searchParams.sortOrder || 'desc'
//            };

//            // 移除空值參數
//            Object.keys(params).forEach(key => {
//                if (!params[key]) delete params[key];
//            });

//            const response = await API.get(`${API_CONFIG.FILES_API}/list`, params);

//            if (response.Success && response.Data) {
//                return {
//                    success: true,
//                    data: response.Data.Data || [],
//                    totalCount: response.Data.TotalCount || 0,
//                    totalPages: response.Data.TotalPages || 1,
//                    currentPage: response.Data.Page || 1
//                };
//            } else {
//                return { success: false, message: response.Message };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 上傳檔案
//    async uploadFile(file, customFileName = '') {
//        try {
//            const formData = new FormData();
//            formData.append('file', file);
//            if (customFileName) {
//                formData.append('customFileName', customFileName);
//            }

//            const response = await API.upload(`${API_CONFIG.FILES_API}/upload`, formData);

//            if (response.Success && response.Data) {
//                return { success: true, data: response.Data, message: response.Message || MESSAGES.SUCCESS.UPLOAD };
//            } else {
//                return { success: false, message: response.Message || MESSAGES.ERROR.UPLOAD_FAILED };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 重新命名檔案
//    async renameFile(fileId, newFileName) {
//        try {
//            const response = await API.put(`${API_CONFIG.FILES_API}/rename/${fileId}`, {
//                FileId: fileId,
//                NewFileName: newFileName
//            });

//            if (response.Success) {
//                return { success: true, message: response.Message || MESSAGES.SUCCESS.RENAME };
//            } else {
//                return { success: false, message: response.Message || MESSAGES.ERROR.RENAME_FAILED };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 刪除檔案
//    async deleteFile(fileId) {
//        try {
//            const response = await API.delete(`${API_CONFIG.FILES_API}/${fileId}`);

//            if (response.Success) {
//                return { success: true, message: response.Message || MESSAGES.SUCCESS.DELETE };
//            } else {
//                return { success: false, message: response.Message || MESSAGES.ERROR.DELETE_FAILED };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 批量操作檔案
//    async batchOperation(fileIds, operation) {
//        try {
//            const response = await API.post(`${API_CONFIG.FILES_API}/batch-operation`, {
//                FileIds: fileIds,
//                Operation: operation
//            });

//            if (response.Success) {
//                return { success: true, message: response.Message };
//            } else {
//                return { success: false, message: response.Message };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 取得檔案預覽資訊
//    async getFilePreview(fileId) {
//        try {
//            const response = await API.get(`${API_CONFIG.FILES_API}/preview/${fileId}`);

//            if (response.Success && response.Data) {
//                return { success: true, data: response.Data };
//            } else {
//                return { success: false, message: response.Message };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 取得檔案統計
//    async getStatistics() {
//        try {
//            const response = await API.get(`${API_CONFIG.FILES_API}/statistics`);

//            if (response.Success && response.Data) {
//                return { success: true, data: response.Data };
//            } else {
//                return { success: false, message: response.Message };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 取得檔案下載連結
//    getDownloadUrl(fileId) {
//        return `${API_CONFIG.BASE_URL}${API_CONFIG.FILES_API}/download/${fileId}`;
//    },

//    // 下載檔案
//    async downloadFile(fileId, fileName) {
//        try {
//            const url = this.getDownloadUrl(fileId);
//            Utils.downloadFile(url, fileName);
//            return { success: true };
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    }
//};

//// 資源回收筒 API
//const RecycleAPI = {
//    // 取得已刪除檔案列表
//    async getDeletedFiles(searchParams = {}) {
//        try {
//            const params = {
//                Page: searchParams.page || 1,
//                PageSize: searchParams.pageSize || FILE_CONFIG.PAGE_SIZE,
//                FileName: searchParams.fileName || '',
//                SortBy: searchParams.sortBy || 'DeletedAt',
//                SortOrder: searchParams.sortOrder || 'desc'
//            };

//            // 移除空值參數
//            Object.keys(params).forEach(key => {
//                if (!params[key]) delete params[key];
//            });

//            const response = await API.get(`${API_CONFIG.RECYCLE_API}/list`, params);

//            if (response.Success && response.Data) {
//                return {
//                    success: true,
//                    data: response.Data.Data || [],
//                    totalCount: response.Data.TotalCount || 0,
//                    totalPages: response.Data.TotalPages || 1,
//                    currentPage: response.Data.Page || 1
//                };
//            } else {
//                return { success: false, message: response.Message };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 還原檔案
//    async restoreFile(fileId) {
//        try {
//            const response = await API.post(`${API_CONFIG.RECYCLE_API}/restore/${fileId}`);

//            if (response.Success) {
//                return { success: true, message: response.Message || MESSAGES.SUCCESS.RESTORE };
//            } else {
//                return { success: false, message: response.Message || MESSAGES.ERROR.RESTORE_FAILED };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 永久刪除檔案
//    async permanentDelete(fileId) {
//        try {
//            const response = await API.delete(`${API_CONFIG.RECYCLE_API}/permanent/${fileId}`);

//            if (response.Success) {
//                return { success: true, message: response.Message };
//            } else {
//                return { success: false, message: response.Message };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    },

//    // 清理資源回收筒
//    async cleanup() {
//        try {
//            const response = await API.post(`${API_CONFIG.RECYCLE_API}/cleanup`);

//            if (response.Success) {
//                return { success: true, message: response.Message };
//            } else {
//                return { success: false, message: response.Message };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    }
//};

//// 檔案預覽 API
//const PreviewAPI = {
//    // 取得檔案縮圖 URL
//    getThumbnailUrl(fileId) {
//        return `${API_CONFIG.BASE_URL}${API_CONFIG.PREVIEW_API}/thumbnail/${fileId}`;
//    },

//    // 取得檔案內容 URL（用於預覽）
//    getContentUrl(fileId) {
//        return `${API_CONFIG.BASE_URL}${API_CONFIG.PREVIEW_API}/content/${fileId}`;
//    },

//    // 取得檔案預覽資訊
//    async getPreviewInfo(fileId) {
//        try {
//            const response = await API.get(`${API_CONFIG.PREVIEW_API}/${fileId}`);

//            if (response.Success && response.Data) {
//                return { success: true, data: response.Data };
//            } else {
//                return { success: false, message: response.Message };
//            }
//        } catch (error) {
//            return { success: false, message: error.message };
//        }
//    }
//};

//// 匯出 API 物件
//window.AuthAPI = AuthAPI;
//window.FileAPI = FileAPI;
//window.RecycleAPI = RecycleAPI;
//window.PreviewAPI = PreviewAPI;