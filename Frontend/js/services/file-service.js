/**
 * 檔案管理服務
 * 提供檔案的 CRUD 操作和相關功能
 */

const FileService = {

    // ==========================================
    // 檔案列表相關
    // ==========================================

    /**
     * 獲取檔案列表
     * @param {object} params - 查詢參數
     * @returns {Promise<object>} 檔案列表數據
     */
    async getFiles(params = {}) {
        const {
            page = 1,
            pageSize = API_CONFIG.pagination.pageSize,
            search = '',
            sortBy = 'uploadedAt',
            sortDirection = 'desc',
            fileType = 'all',
            startDate = null,
            endDate = null
        } = params;

        try {
            console.log('📂 獲取檔案列表:', { page, pageSize, search, sortBy, sortDirection });

            const response = await axios.get(API_CONFIG.buildUrl(API_CONFIG.endpoints.files), {
                params: {
                    page,
                    pageSize,
                    search: search.trim(),
                    sortBy,
                    sortDirection,
                    fileType: fileType !== 'all' ? fileType : undefined,
                    startDate,
                    endDate
                },
                timeout: API_CONFIG.request.timeout
            });

            console.log('✅ 檔案列表獲取成功:', response.data);

            return {
                success: true,
                data: response.data,
                files: response.data.files || [],
                totalCount: response.data.totalCount || 0,
                currentPage: response.data.currentPage || page,
                totalPages: response.data.totalPages || 1,
                hasMore: response.data.hasMore || false
            };

        } catch (error) {
            console.error('❌ 獲取檔案列表失敗:', error);

            // 檢查是否為網路連接錯誤或後端未啟動
            if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' ||
                error.response?.status === 404 || !error.response) {
                return {
                    success: false,
                    error: 'BACKEND_NOT_AVAILABLE',
                    message: CONSTANTS.ERROR_MESSAGES.BACKEND_NOT_AVAILABLE,
                    files: [],
                    totalCount: 0,
                    isBackendDown: true
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'UNKNOWN_ERROR',
                message: error.response?.data?.message || CONSTANTS.ERROR_MESSAGES.NETWORK_ERROR,
                files: [],
                totalCount: 0
            };
        }
    },

    /**
     * 搜尋檔案
     * @param {string} query - 搜尋關鍵字
     * @param {object} options - 搜尋選項
     * @returns {Promise<object>} 搜尋結果
     */
    async searchFiles(query, options = {}) {
        const {
            page = 1,
            pageSize = API_CONFIG.pagination.pageSize,
            fileType = 'all',
            sortBy = 'relevance'
        } = options;

        // 驗證搜尋關鍵字
        const validation = ValidationUtils.validateSearchQuery(query);
        if (!validation.isValid) {
            return {
                success: false,
                error: 'INVALID_SEARCH_QUERY',
                message: validation.message,
                files: []
            };
        }

        try {
            console.log('🔍 搜尋檔案:', { query: validation.query, options });

            const response = await axios.get(API_CONFIG.buildUrl(API_CONFIG.endpoints.fileSearch), {
                params: {
                    q: validation.query,
                    page,
                    pageSize,
                    fileType: fileType !== 'all' ? fileType : undefined,
                    sortBy
                },
                timeout: API_CONFIG.request.timeout
            });

            console.log('✅ 檔案搜尋成功:', response.data);

            return {
                success: true,
                data: response.data,
                files: response.data.files || [],
                totalCount: response.data.totalCount || 0,
                searchQuery: validation.query,
                hasMore: response.data.hasMore || false
            };

        } catch (error) {
            console.error('❌ 檔案搜尋失敗:', error);

            if (this._isBackendUnavailable(error)) {
                return {
                    success: false,
                    error: 'BACKEND_NOT_AVAILABLE',
                    message: CONSTANTS.ERROR_MESSAGES.BACKEND_NOT_AVAILABLE,
                    files: [],
                    isBackendDown: true
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'SEARCH_FAILED',
                message: error.response?.data?.message || '搜尋失敗，請稍後再試',
                files: []
            };
        }
    },

    // ==========================================
    // 單一檔案操作
    // ==========================================

    /**
     * 獲取單一檔案資訊
     * @param {string|number} fileId - 檔案 ID
     * @returns {Promise<object>} 檔案資訊
     */
    async getFileById(fileId) {
        if (!fileId) {
            return {
                success: false,
                error: 'INVALID_FILE_ID',
                message: '檔案 ID 不能為空'
            };
        }

        try {
            console.log('📄 獲取檔案資訊:', fileId);

            const response = await axios.get(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.fileById, { id: fileId }),
                { timeout: API_CONFIG.request.timeout }
            );

            console.log('✅ 檔案資訊獲取成功:', response.data);

            return {
                success: true,
                data: response.data,
                file: response.data.file || response.data
            };

        } catch (error) {
            console.error('❌ 獲取檔案資訊失敗:', error);

            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'FILE_NOT_FOUND',
                    message: CONSTANTS.ERROR_MESSAGES.FILE_NOT_FOUND
                };
            }

            if (this._isBackendUnavailable(error)) {
                return {
                    success: false,
                    error: 'BACKEND_NOT_AVAILABLE',
                    message: CONSTANTS.ERROR_MESSAGES.BACKEND_NOT_AVAILABLE,
                    isBackendDown: true
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'GET_FILE_FAILED',
                message: error.response?.data?.message || '獲取檔案資訊失敗'
            };
        }
    },

    /**
     * 重命名檔案
     * @param {string|number} fileId - 檔案 ID
     * @param {string} newName - 新檔案名稱
     * @returns {Promise<object>} 操作結果
     */
    async renameFile(fileId, newName) {
        // 驗證檔案 ID
        if (!fileId) {
            return {
                success: false,
                error: 'INVALID_FILE_ID',
                message: '檔案 ID 不能為空'
            };
        }

        // 驗證檔案名稱
        const validation = ValidationUtils.validateFileName(newName);
        if (!validation.isValid) {
            return {
                success: false,
                error: 'INVALID_FILE_NAME',
                message: validation.message
            };
        }

        try {
            console.log('📝 重命名檔案:', { fileId, newName: validation.message ? newName : newName });

            const response = await axios.put(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.fileById, { id: fileId }),
                {
                    fileName: newName.trim()
                },
                {
                    headers: API_CONFIG.request.defaultHeaders,
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 檔案重命名成功:', response.data);

            return {
                success: true,
                data: response.data,
                message: CONSTANTS.SUCCESS_MESSAGES.RENAME_SUCCESS,
                file: response.data.file || response.data
            };

        } catch (error) {
            console.error('❌ 檔案重命名失敗:', error);

            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'FILE_NOT_FOUND',
                    message: CONSTANTS.ERROR_MESSAGES.FILE_NOT_FOUND
                };
            }

            if (error.response?.status === 409) {
                return {
                    success: false,
                    error: 'FILE_NAME_EXISTS',
                    message: '檔案名稱已存在，請使用其他名稱'
                };
            }

            if (this._isBackendUnavailable(error)) {
                return {
                    success: false,
                    error: 'BACKEND_NOT_AVAILABLE',
                    message: CONSTANTS.ERROR_MESSAGES.BACKEND_NOT_AVAILABLE,
                    isBackendDown: true
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'RENAME_FAILED',
                message: error.response?.data?.message || '檔案重命名失敗'
            };
        }
    },

    /**
     * 刪除檔案（移至回收筒）
     * @param {string|number} fileId - 檔案 ID
     * @returns {Promise<object>} 操作結果
     */
    async deleteFile(fileId) {
        if (!fileId) {
            return {
                success: false,
                error: 'INVALID_FILE_ID',
                message: '檔案 ID 不能為空'
            };
        }

        try {
            console.log('🗑️ 刪除檔案:', fileId);

            const response = await axios.delete(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.fileById, { id: fileId }),
                { timeout: API_CONFIG.request.timeout }
            );

            console.log('✅ 檔案刪除成功:', response.data);

            return {
                success: true,
                data: response.data,
                message: CONSTANTS.SUCCESS_MESSAGES.DELETE_SUCCESS
            };

        } catch (error) {
            console.error('❌ 檔案刪除失敗:', error);

            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'FILE_NOT_FOUND',
                    message: CONSTANTS.ERROR_MESSAGES.FILE_NOT_FOUND
                };
            }

            if (error.response?.status === 403) {
                return {
                    success: false,
                    error: 'PERMISSION_DENIED',
                    message: CONSTANTS.ERROR_MESSAGES.PERMISSION_DENIED
                };
            }

            if (this._isBackendUnavailable(error)) {
                return {
                    success: false,
                    error: 'BACKEND_NOT_AVAILABLE',
                    message: CONSTANTS.ERROR_MESSAGES.BACKEND_NOT_AVAILABLE,
                    isBackendDown: true
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'DELETE_FAILED',
                message: error.response?.data?.message || '檔案刪除失敗'
            };
        }
    },

    // ==========================================
    // 批量操作
    // ==========================================

    /**
     * 批量刪除檔案
     * @param {Array} fileIds - 檔案 ID 陣列
     * @returns {Promise<object>} 操作結果
     */
    async deleteFiles(fileIds) {
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return {
                success: false,
                error: 'INVALID_FILE_IDS',
                message: '請選擇要刪除的檔案'
            };
        }

        try {
            console.log('🗑️ 批量刪除檔案:', fileIds);

            const response = await axios.post(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.files + '/batch-delete'),
                {
                    fileIds: fileIds
                },
                {
                    headers: API_CONFIG.request.defaultHeaders,
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 批量刪除成功:', response.data);

            const { successful = [], failed = [] } = response.data;

            return {
                success: true,
                data: response.data,
                message: `成功刪除 ${successful.length} 個檔案${failed.length > 0 ? `，${failed.length} 個失敗` : ''}`,
                successful: successful,
                failed: failed
            };

        } catch (error) {
            console.error('❌ 批量刪除失敗:', error);

            if (this._isBackendUnavailable(error)) {
                return {
                    success: false,
                    error: 'BACKEND_NOT_AVAILABLE',
                    message: CONSTANTS.ERROR_MESSAGES.BACKEND_NOT_AVAILABLE,
                    isBackendDown: true
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'BATCH_DELETE_FAILED',
                message: error.response?.data?.message || '批量刪除失敗'
            };
        }
    },

    // ==========================================
    // 檔案分享和連結
    // ==========================================

    /**
     * 獲取檔案熱連結
     * @param {string|number} fileId - 檔案 ID
     * @param {object} options - 分享選項
     * @returns {Promise<object>} 熱連結資訊
     */
    async getHotLink(fileId, options = {}) {
        if (!fileId) {
            return {
                success: false,
                error: 'INVALID_FILE_ID',
                message: '檔案 ID 不能為空'
            };
        }

        const { expiresIn = 7 * 24 * 60 * 60 } = options; // 預設 7 天過期

        try {
            console.log('🔗 獲取檔案熱連結:', { fileId, expiresIn });

            const response = await axios.post(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.hotlink, { id: fileId }),
                {
                    expiresIn: expiresIn
                },
                {
                    headers: API_CONFIG.request.defaultHeaders,
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 熱連結獲取成功:', response.data);

            return {
                success: true,
                data: response.data,
                hotLinkUrl: response.data.hotLinkUrl || response.data.url,
                token: response.data.token,
                expiresAt: response.data.expiresAt,
                message: '熱連結生成成功'
            };

        } catch (error) {
            console.error('❌ 獲取熱連結失敗:', error);

            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'FILE_NOT_FOUND',
                    message: CONSTANTS.ERROR_MESSAGES.FILE_NOT_FOUND
                };
            }

            if (this._isBackendUnavailable(error)) {
                return {
                    success: false,
                    error: 'BACKEND_NOT_AVAILABLE',
                    message: CONSTANTS.ERROR_MESSAGES.BACKEND_NOT_AVAILABLE,
                    isBackendDown: true
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'GET_HOTLINK_FAILED',
                message: error.response?.data?.message || '獲取熱連結失敗'
            };
        }
    },

    /**
     * 複製熱連結到剪貼板
     * @param {string|number} fileId - 檔案 ID
     * @returns {Promise<object>} 操作結果
     */
    async copyHotLink(fileId) {
        try {
            const result = await this.getHotLink(fileId);

            if (!result.success) {
                return result;
            }

            // 複製到剪貼板
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(result.hotLinkUrl);

                return {
                    success: true,
                    message: CONSTANTS.SUCCESS_MESSAGES.COPY_LINK_SUCCESS,
                    hotLinkUrl: result.hotLinkUrl
                };
            } else {
                // 降級方案：使用 execCommand (適用於較舊的瀏覽器)
                const textArea = document.createElement('textarea');
                textArea.value = result.hotLinkUrl;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    return {
                        success: true,
                        message: CONSTANTS.SUCCESS_MESSAGES.COPY_LINK_SUCCESS,
                        hotLinkUrl: result.hotLinkUrl
                    };
                } else {
                    return {
                        success: false,
                        error: 'COPY_FAILED',
                        message: '複製失敗，請手動複製連結',
                        hotLinkUrl: result.hotLinkUrl
                    };
                }
            }

        } catch (error) {
            console.error('❌ 複製熱連結失敗:', error);

            return {
                success: false,
                error: 'COPY_HOTLINK_FAILED',
                message: '複製熱連結失敗'
            };
        }
    },

    // ==========================================
    // 工具方法
    // ==========================================

    /**
     * 檢查後端是否可用
     * @returns {Promise<boolean>} 後端可用性
     */
    async checkBackendHealth() {
        try {
            const response = await axios.get(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.health),
                { timeout: 5000 }
            );

            return response.status === 200;

        } catch (error) {
            console.warn('🔍 後端健康檢查失敗:', error.message);
            return false;
        }
    },

    /**
     * 檢查錯誤是否為後端不可用
     * @param {Error} error - 錯誤物件
     * @returns {boolean} 是否為後端不可用
     * @private
     */
    _isBackendUnavailable(error) {
        return (
            error.code === 'ECONNREFUSED' ||
            error.code === 'ERR_NETWORK' ||
            error.code === 'NETWORK_ERROR' ||
            !error.response ||
            error.response?.status === 404 ||
            error.response?.status >= 500
        );
    },

    /**
     * 重試機制包裝器
     * @param {Function} fn - 要重試的函數
     * @param {number} retries - 重試次數
     * @param {number} delay - 重試延遲（毫秒）
     * @returns {Promise<any>} 函數執行結果
     * @private
     */
    async _retryWrapper(fn, retries = API_CONFIG.request.retryCount, delay = API_CONFIG.request.retryDelay) {
        for (let i = 0; i <= retries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === retries || !this._isRetryableError(error)) {
                    throw error;
                }

                console.warn(`🔄 重試第 ${i + 1} 次，${delay}ms 後重試...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // 指數退避
            }
        }
    },

    /**
     * 檢查錯誤是否可重試
     * @param {Error} error - 錯誤物件
     * @returns {boolean} 是否可重試
     * @private
     */
    _isRetryableError(error) {
        if (!error.response) return true; // 網路錯誤可重試

        const status = error.response.status;
        return status >= 500 || status === 408 || status === 429; // 伺服器錯誤、超時、限流可重試
    }
};

// 導出到全域
window.FileService = FileService;