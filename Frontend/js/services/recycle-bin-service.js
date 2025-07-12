/**
 * 回收筒服務
 * 提供已刪除檔案的管理、還原和永久刪除功能
 */

const RecycleBinService = {

    // ==========================================
    // 回收筒檔案列表
    // ==========================================

    /**
     * 獲取回收筒檔案列表
     * @param {object} params - 查詢參數
     * @returns {Promise<object>} 已刪除檔案列表
     */
    async getDeletedFiles(params = {}) {
        const {
            page = 1,
            pageSize = API_CONFIG.pagination.pageSize,
            search = '',
            sortBy = 'deletedAt',
            sortDirection = 'desc',
            fileType = 'all',
            deletedAfter = null,
            deletedBefore = null
        } = params;

        try {
            console.log('🗑️ 獲取回收筒檔案列表:', { page, pageSize, search, sortBy, sortDirection });

            const response = await axios.get(API_CONFIG.buildUrl(API_CONFIG.endpoints.recycleBin), {
                params: {
                    page,
                    pageSize,
                    search: search.trim(),
                    sortBy,
                    sortDirection,
                    fileType: fileType !== 'all' ? fileType : undefined,
                    deletedAfter,
                    deletedBefore
                },
                timeout: API_CONFIG.request.timeout
            });

            console.log('✅ 回收筒檔案列表獲取成功:', response.data);

            return {
                success: true,
                data: response.data,
                files: response.data.files || [],
                totalCount: response.data.totalCount || 0,
                currentPage: response.data.currentPage || page,
                totalPages: response.data.totalPages || 1,
                hasMore: response.data.hasMore || false,
                totalSize: response.data.totalSize || 0,
                oldestDeletedAt: response.data.oldestDeletedAt,
                newestDeletedAt: response.data.newestDeletedAt
            };

        } catch (error) {
            console.error('❌ 獲取回收筒檔案列表失敗:', error);

            // 檢查是否為網路連接錯誤或後端未啟動
            if (this._isBackendUnavailable(error)) {
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
                error: error.response?.data?.error || 'GET_DELETED_FILES_FAILED',
                message: error.response?.data?.message || '獲取回收筒檔案失敗',
                files: [],
                totalCount: 0
            };
        }
    },

    /**
     * 搜尋回收筒檔案
     * @param {string} query - 搜尋關鍵字
     * @param {object} options - 搜尋選項
     * @returns {Promise<object>} 搜尋結果
     */
    async searchDeletedFiles(query, options = {}) {
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
            console.log('🔍 搜尋回收筒檔案:', { query: validation.query, options });

            const response = await axios.get(API_CONFIG.buildUrl(API_CONFIG.endpoints.recycleBin + '/search'), {
                params: {
                    q: validation.query,
                    page,
                    pageSize,
                    fileType: fileType !== 'all' ? fileType : undefined,
                    sortBy
                },
                timeout: API_CONFIG.request.timeout
            });

            console.log('✅ 回收筒檔案搜尋成功:', response.data);

            return {
                success: true,
                data: response.data,
                files: response.data.files || [],
                totalCount: response.data.totalCount || 0,
                searchQuery: validation.query,
                hasMore: response.data.hasMore || false
            };

        } catch (error) {
            console.error('❌ 回收筒檔案搜尋失敗:', error);

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
                error: error.response?.data?.error || 'SEARCH_DELETED_FILES_FAILED',
                message: error.response?.data?.message || '搜尋回收筒檔案失敗',
                files: []
            };
        }
    },

    // ==========================================
    // 檔案還原
    // ==========================================

    /**
     * 還原單一檔案
     * @param {string|number} fileId - 檔案 ID
     * @param {object} options - 還原選項
     * @returns {Promise<object>} 還原結果
     */
    async restoreFile(fileId, options = {}) {
        if (!fileId) {
            return {
                success: false,
                error: 'INVALID_FILE_ID',
                message: '檔案 ID 不能為空'
            };
        }

        const {
            newName = null,
            overwrite = false
        } = options;

        try {
            console.log('♻️ 還原檔案:', { fileId, newName, overwrite });

            const requestData = {};
            if (newName) requestData.newName = newName;
            if (overwrite) requestData.overwrite = overwrite;

            const response = await axios.put(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.restore, { id: fileId }),
                requestData,
                {
                    headers: API_CONFIG.request.defaultHeaders,
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 檔案還原成功:', response.data);

            return {
                success: true,
                data: response.data,
                message: CONSTANTS.SUCCESS_MESSAGES.RESTORE_SUCCESS,
                file: response.data.file || response.data,
                restoredToName: response.data.restoredToName || newName
            };

        } catch (error) {
            console.error('❌ 檔案還原失敗:', error);

            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'FILE_NOT_FOUND',
                    message: '檔案不存在或已被永久刪除'
                };
            }

            if (error.response?.status === 409) {
                return {
                    success: false,
                    error: 'FILE_NAME_CONFLICT',
                    message: '檔案名稱衝突，請使用其他名稱或選擇覆蓋',
                    conflictFileName: error.response.data?.conflictFileName
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
                error: error.response?.data?.error || 'RESTORE_FAILED',
                message: error.response?.data?.message || '檔案還原失敗'
            };
        }
    },

    /**
     * 批量還原檔案
     * @param {Array} fileIds - 檔案 ID 陣列
     * @param {object} options - 還原選項
     * @returns {Promise<object>} 批量還原結果
     */
    async restoreFiles(fileIds, options = {}) {
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return {
                success: false,
                error: 'INVALID_FILE_IDS',
                message: '請選擇要還原的檔案'
            };
        }

        const {
            overwrite = false,
            skipConflicts = false
        } = options;

        try {
            console.log('♻️ 批量還原檔案:', { fileIds, overwrite, skipConflicts });

            const response = await axios.post(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.recycleBin + '/batch-restore'),
                {
                    fileIds: fileIds,
                    overwrite: overwrite,
                    skipConflicts: skipConflicts
                },
                {
                    headers: API_CONFIG.request.defaultHeaders,
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 批量還原成功:', response.data);

            const { successful = [], failed = [], conflicts = [] } = response.data;

            return {
                success: true,
                data: response.data,
                message: `還原完成：成功 ${successful.length} 個${failed.length > 0 ? `，失敗 ${failed.length} 個` : ''}${conflicts.length > 0 ? `，衝突 ${conflicts.length} 個` : ''}`,
                successful: successful,
                failed: failed,
                conflicts: conflicts,
                totalCount: fileIds.length,
                successCount: successful.length,
                failedCount: failed.length,
                conflictCount: conflicts.length
            };

        } catch (error) {
            console.error('❌ 批量還原失敗:', error);

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
                error: error.response?.data?.error || 'BATCH_RESTORE_FAILED',
                message: error.response?.data?.message || '批量還原失敗'
            };
        }
    },

    // ==========================================
    // 永久刪除
    // ==========================================

    /**
     * 永久刪除單一檔案
     * @param {string|number} fileId - 檔案 ID
     * @returns {Promise<object>} 刪除結果
     */
    async permanentDeleteFile(fileId) {
        if (!fileId) {
            return {
                success: false,
                error: 'INVALID_FILE_ID',
                message: '檔案 ID 不能為空'
            };
        }

        try {
            console.log('🔥 永久刪除檔案:', fileId);

            const response = await axios.delete(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.permanentDelete, { id: fileId }),
                { timeout: API_CONFIG.request.timeout }
            );

            console.log('✅ 檔案永久刪除成功:', response.data);

            return {
                success: true,
                data: response.data,
                message: '檔案已永久刪除'
            };

        } catch (error) {
            console.error('❌ 永久刪除檔案失敗:', error);

            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'FILE_NOT_FOUND',
                    message: '檔案不存在或已被刪除'
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
                error: error.response?.data?.error || 'PERMANENT_DELETE_FAILED',
                message: error.response?.data?.message || '永久刪除失敗'
            };
        }
    },

    /**
     * 批量永久刪除檔案
     * @param {Array} fileIds - 檔案 ID 陣列
     * @returns {Promise<object>} 批量刪除結果
     */
    async permanentDeleteFiles(fileIds) {
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return {
                success: false,
                error: 'INVALID_FILE_IDS',
                message: '請選擇要永久刪除的檔案'
            };
        }

        try {
            console.log('🔥 批量永久刪除檔案:', fileIds);

            const response = await axios.post(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.recycleBin + '/batch-permanent-delete'),
                {
                    fileIds: fileIds
                },
                {
                    headers: API_CONFIG.request.defaultHeaders,
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 批量永久刪除成功:', response.data);

            const { successful = [], failed = [] } = response.data;

            return {
                success: true,
                data: response.data,
                message: `永久刪除完成：成功 ${successful.length} 個${failed.length > 0 ? `，失敗 ${failed.length} 個` : ''}`,
                successful: successful,
                failed: failed,
                totalCount: fileIds.length,
                successCount: successful.length,
                failedCount: failed.length
            };

        } catch (error) {
            console.error('❌ 批量永久刪除失敗:', error);

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
                error: error.response?.data?.error || 'BATCH_PERMANENT_DELETE_FAILED',
                message: error.response?.data?.message || '批量永久刪除失敗'
            };
        }
    },

    // ==========================================
    // 回收筒管理
    // ==========================================

    /**
     * 清空回收筒
     * @param {object} options - 清空選項
     * @returns {Promise<object>} 清空結果
     */
    async emptyRecycleBin(options = {}) {
        const {
            olderThanDays = null,
            fileType = 'all',
            confirm = false
        } = options;

        if (!confirm) {
            return {
                success: false,
                error: 'CONFIRMATION_REQUIRED',
                message: '請確認清空回收筒操作'
            };
        }

        try {
            console.log('🧹 清空回收筒:', { olderThanDays, fileType });

            const response = await axios.post(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.recycleBin + '/empty'),
                {
                    olderThanDays: olderThanDays,
                    fileType: fileType !== 'all' ? fileType : undefined
                },
                {
                    headers: API_CONFIG.request.defaultHeaders,
                    timeout: API_CONFIG.request.timeout * 2 // 清空操作可能需要更長時間
                }
            );

            console.log('✅ 回收筒清空成功:', response.data);

            return {
                success: true,
                data: response.data,
                message: `回收筒已清空，共刪除 ${response.data.deletedCount || 0} 個檔案`,
                deletedCount: response.data.deletedCount || 0,
                freedSpace: response.data.freedSpace || 0
            };

        } catch (error) {
            console.error('❌ 清空回收筒失敗:', error);

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
                error: error.response?.data?.error || 'EMPTY_RECYCLE_BIN_FAILED',
                message: error.response?.data?.message || '清空回收筒失敗'
            };
        }
    },

    /**
     * 獲取回收筒統計資訊
     * @returns {Promise<object>} 統計資訊
     */
    async getRecycleBinStatistics() {
        try {
            console.log('📊 獲取回收筒統計資訊');

            const response = await axios.get(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.recycleBin + '/statistics'),
                { timeout: API_CONFIG.request.timeout }
            );

            console.log('✅ 回收筒統計資訊獲取成功:', response.data);

            return {
                success: true,
                data: response.data,
                statistics: {
                    totalFiles: response.data.totalFiles || 0,
                    totalSize: response.data.totalSize || 0,
                    oldestFile: response.data.oldestFile,
                    newestFile: response.data.newestFile,
                    fileTypes: response.data.fileTypes || {},
                    autoDeleteDate: response.data.autoDeleteDate, // 自動清理日期
                    autoDeleteCount: response.data.autoDeleteCount || 0 // 即將自動刪除的檔案數
                }
            };

        } catch (error) {
            console.error('❌ 獲取回收筒統計失敗:', error);

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
                error: error.response?.data?.error || 'GET_STATISTICS_FAILED',
                message: error.response?.data?.message || '獲取統計資訊失敗',
                statistics: {
                    totalFiles: 0,
                    totalSize: 0,
                    fileTypes: {}
                }
            };
        }
    },

    /**
     * 設定自動清理規則
     * @param {object} rules - 清理規則
     * @returns {Promise<object>} 設定結果
     */
    async setAutoCleanupRules(rules = {}) {
        const {
            enabled = true,
            retentionDays = 365,
            maxFiles = null,
            maxSize = null
        } = rules;

        try {
            console.log('⚙️ 設定自動清理規則:', { enabled, retentionDays, maxFiles, maxSize });

            const response = await axios.put(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.recycleBin + '/auto-cleanup'),
                {
                    enabled: enabled,
                    retentionDays: retentionDays,
                    maxFiles: maxFiles,
                    maxSize: maxSize
                },
                {
                    headers: API_CONFIG.request.defaultHeaders,
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 自動清理規則設定成功:', response.data);

            return {
                success: true,
                data: response.data,
                message: '自動清理規則已更新',
                rules: response.data.rules || rules
            };

        } catch (error) {
            console.error('❌ 設定自動清理規則失敗:', error);

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
                error: error.response?.data?.error || 'SET_AUTO_CLEANUP_FAILED',
                message: error.response?.data?.message || '設定自動清理規則失敗'
            };
        }
    },

    // ==========================================
    // 工具方法
    // ==========================================

    /**
     * 計算檔案在回收筒中的剩餘天數
     * @param {string} deletedAt - 刪除時間
     * @param {number} retentionDays - 保留天數（預設365天）
     * @returns {number} 剩餘天數
     */
    calculateRemainingDays(deletedAt, retentionDays = 365) {
        if (!deletedAt) return 0;

        const deletedDate = new Date(deletedAt);
        const expirationDate = new Date(deletedDate.getTime() + (retentionDays * 24 * 60 * 60 * 1000));
        const now = new Date();

        const remainingTime = expirationDate.getTime() - now.getTime();
        const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));

        return Math.max(0, remainingDays);
    },

    /**
     * 檢查檔案是否即將到期
     * @param {string} deletedAt - 刪除時間
     * @param {number} retentionDays - 保留天數
     * @param {number} warningDays - 警告天數（預設7天）
     * @returns {boolean} 是否即將到期
     */
    isFileExpiringSoon(deletedAt, retentionDays = 365, warningDays = 7) {
        const remainingDays = this.calculateRemainingDays(deletedAt, retentionDays);
        return remainingDays > 0 && remainingDays <= warningDays;
    },

    /**
     * 檢查檔案是否已過期
     * @param {string} deletedAt - 刪除時間
     * @param {number} retentionDays - 保留天數
     * @returns {boolean} 是否已過期
     */
    isFileExpired(deletedAt, retentionDays = 365) {
        const remainingDays = this.calculateRemainingDays(deletedAt, retentionDays);
        return remainingDays <= 0;
    },

    /**
     * 格式化回收筒檔案顯示資訊
     * @param {object} file - 檔案物件
     * @returns {object} 格式化後的檔案資訊
     */
    formatDeletedFileInfo(file) {
        if (!file) return null;

        const remainingDays = this.calculateRemainingDays(file.deletedAt);
        const isExpiringSoon = this.isFileExpiringSoon(file.deletedAt);
        const isExpired = this.isFileExpired(file.deletedAt);

        return {
            ...file,
            formattedDeletedAt: FormatUtils.formatDate(file.deletedAt, 'short'),
            remainingDays: remainingDays,
            isExpiringSoon: isExpiringSoon,
            isExpired: isExpired,
            expirationText: isExpired ? '已過期' :
                isExpiringSoon ? `${remainingDays}天後刪除` :
                    `${remainingDays}天後自動刪除`,
            statusClass: isExpired ? 'text-danger' :
                isExpiringSoon ? 'text-warning' :
                    'text-muted'
        };
    },

    /**
     * 檢查後端是否不可用
     * @param {Error} error - 錯誤物件
     * @returns {boolean} 是否不可用
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
    }
};

// 導出到全域
window.RecycleBinService = RecycleBinService;