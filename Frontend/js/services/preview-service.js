/**
 * 檔案預覽服務
 * 提供檔案預覽、縮圖生成和下載功能
 */

const PreviewService = {

    // 預覽快取
    _previewCache: new Map(),
    _thumbnailCache: new Map(),

    // ==========================================
    // 檔案預覽
    // ==========================================

    /**
     * 獲取檔案預覽資訊
     * @param {string|number} fileId - 檔案 ID
     * @param {object} options - 預覽選項
     * @returns {Promise<object>} 預覽資訊
     */
    async getPreview(fileId, options = {}) {
        if (!fileId) {
            return {
                success: false,
                error: 'INVALID_FILE_ID',
                message: '檔案 ID 不能為空'
            };
        }

        const {
            width = API_CONFIG.preview.maxWidth,
            height = API_CONFIG.preview.maxHeight,
            quality = 85,
            format = 'auto',
            useCache = true
        } = options;

        // 檢查快取
        const cacheKey = `${fileId}_${width}_${height}_${quality}_${format}`;
        if (useCache && this._previewCache.has(cacheKey)) {
            console.log('📖 使用預覽快取:', cacheKey);
            return this._previewCache.get(cacheKey);
        }

        try {
            console.log('📖 獲取檔案預覽:', { fileId, width, height, quality, format });

            const response = await axios.get(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.preview + `/${fileId}`),
                {
                    params: {
                        width: width !== API_CONFIG.preview.maxWidth ? width : undefined,
                        height: height !== API_CONFIG.preview.maxHeight ? height : undefined,
                        quality: quality !== 85 ? quality : undefined,
                        format: format !== 'auto' ? format : undefined
                    },
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 預覽資訊獲取成功:', response.data);

            const result = {
                success: true,
                data: response.data,
                previewUrl: response.data.previewUrl || response.data.url,
                originalUrl: response.data.originalUrl,
                thumbnailUrl: response.data.thumbnailUrl,
                fileInfo: response.data.fileInfo || {},
                canPreview: response.data.canPreview !== false,
                previewType: response.data.previewType || this._detectPreviewType(response.data.fileInfo)
            };

            // 存入快取
            if (useCache) {
                this._previewCache.set(cacheKey, result);

                // 設定快取過期
                setTimeout(() => {
                    this._previewCache.delete(cacheKey);
                }, API_CONFIG.cache.thumbnailCacheDuration);
            }

            return result;

        } catch (error) {
            console.error('❌ 獲取預覽失敗:', error);

            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'FILE_NOT_FOUND',
                    message: CONSTANTS.ERROR_MESSAGES.FILE_NOT_FOUND
                };
            }

            if (error.response?.status === 415) {
                return {
                    success: false,
                    error: 'PREVIEW_NOT_SUPPORTED',
                    message: '此檔案類型不支援預覽',
                    canPreview: false
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
                error: error.response?.data?.error || 'PREVIEW_FAILED',
                message: error.response?.data?.message || '獲取預覽失敗',
                canPreview: false
            };
        }
    },

    /**
     * 獲取檔案縮圖
     * @param {string|number} fileId - 檔案 ID
     * @param {object} options - 縮圖選項
     * @returns {Promise<object>} 縮圖資訊
     */
    async getThumbnail(fileId, options = {}) {
        if (!fileId) {
            return {
                success: false,
                error: 'INVALID_FILE_ID',
                message: '檔案 ID 不能為空'
            };
        }

        const {
            size = 150,
            quality = 80,
            useCache = true
        } = options;

        // 檢查快取
        const cacheKey = `thumbnail_${fileId}_${size}_${quality}`;
        if (useCache && this._thumbnailCache.has(cacheKey)) {
            console.log('🖼️ 使用縮圖快取:', cacheKey);
            return this._thumbnailCache.get(cacheKey);
        }

        try {
            console.log('🖼️ 獲取檔案縮圖:', { fileId, size, quality });

            const response = await axios.get(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.thumbnail + `/${fileId}`),
                {
                    params: {
                        size: size !== 150 ? size : undefined,
                        quality: quality !== 80 ? quality : undefined
                    },
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 縮圖獲取成功:', response.data);

            const result = {
                success: true,
                data: response.data,
                thumbnailUrl: response.data.thumbnailUrl || response.data.url,
                width: response.data.width || size,
                height: response.data.height || size,
                fileSize: response.data.fileSize
            };

            // 存入快取
            if (useCache) {
                this._thumbnailCache.set(cacheKey, result);

                // 設定快取過期
                setTimeout(() => {
                    this._thumbnailCache.delete(cacheKey);
                }, API_CONFIG.cache.thumbnailCacheDuration);
            }

            return result;

        } catch (error) {
            console.error('❌ 獲取縮圖失敗:', error);

            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'FILE_NOT_FOUND',
                    message: CONSTANTS.ERROR_MESSAGES.FILE_NOT_FOUND
                };
            }

            if (error.response?.status === 415) {
                return {
                    success: false,
                    error: 'THUMBNAIL_NOT_SUPPORTED',
                    message: '此檔案類型不支援縮圖',
                    hasThumbnail: false
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
                error: error.response?.data?.error || 'THUMBNAIL_FAILED',
                message: error.response?.data?.message || '獲取縮圖失敗',
                hasThumbnail: false
            };
        }
    },

    /**
     * 檢查檔案是否支援預覽
     * @param {string} filename - 檔案名稱
     * @param {string} mimeType - MIME 類型
     * @returns {object} 支援資訊
     */
    checkPreviewSupport(filename, mimeType = null) {
        const extension = FileUtils.getFileExtension(filename);
        const category = CONSTANTS.getFileCategory(extension);

        const supportInfo = {
            canPreview: false,
            previewType: 'none',
            supportedFeatures: [],
            limitations: []
        };

        switch (category) {
            case 'image':
                supportInfo.canPreview = true;
                supportInfo.previewType = 'image';
                supportInfo.supportedFeatures = ['zoom', 'rotation', 'fullscreen'];
                break;

            case 'document':
                if (['pdf'].includes(extension)) {
                    supportInfo.canPreview = true;
                    supportInfo.previewType = 'pdf';
                    supportInfo.supportedFeatures = ['pagination', 'zoom', 'search'];
                } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
                    supportInfo.canPreview = true;
                    supportInfo.previewType = 'office';
                    supportInfo.supportedFeatures = ['pagination', 'zoom'];
                    supportInfo.limitations = ['需要 Office Online 支援'];
                }
                break;

            case 'text':
                supportInfo.canPreview = true;
                supportInfo.previewType = 'text';
                supportInfo.supportedFeatures = ['syntax-highlight', 'line-numbers'];
                break;

            case 'video':
                supportInfo.canPreview = true;
                supportInfo.previewType = 'video';
                supportInfo.supportedFeatures = ['play', 'pause', 'seek', 'volume'];
                supportInfo.limitations = ['依賴瀏覽器編解碼器支援'];
                break;

            case 'audio':
                supportInfo.canPreview = true;
                supportInfo.previewType = 'audio';
                supportInfo.supportedFeatures = ['play', 'pause', 'seek', 'volume'];
                break;
        }

        return supportInfo;
    },

    // ==========================================
    // 檔案下載
    // ==========================================

    /**
     * 下載檔案
     * @param {string|number} fileId - 檔案 ID
     * @param {object} options - 下載選項
     * @returns {Promise<object>} 下載結果
     */
    async downloadFile(fileId, options = {}) {
        if (!fileId) {
            return {
                success: false,
                error: 'INVALID_FILE_ID',
                message: '檔案 ID 不能為空'
            };
        }

        const {
            forceDownload = true,
            filename = null
        } = options;

        try {
            console.log('💾 開始下載檔案:', { fileId, forceDownload, filename });

            const downloadUrl = API_CONFIG.buildUrl(API_CONFIG.endpoints.download + `/${fileId}`);
            const params = new URLSearchParams();

            if (forceDownload) {
                params.append('attachment', '1');
            }
            if (filename) {
                params.append('filename', filename);
            }

            const finalUrl = params.toString() ? `${downloadUrl}?${params}` : downloadUrl;

            // 使用隱藏的 iframe 或 a 標籤觸發下載
            if (forceDownload) {
                const link = document.createElement('a');
                link.href = finalUrl;
                link.download = filename || '';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                window.open(finalUrl, '_blank');
            }

            console.log('✅ 檔案下載已觸發');

            return {
                success: true,
                message: '檔案下載已開始',
                downloadUrl: finalUrl
            };

        } catch (error) {
            console.error('❌ 檔案下載失敗:', error);

            return {
                success: false,
                error: 'DOWNLOAD_FAILED',
                message: '檔案下載失敗，請稍後再試'
            };
        }
    },

    // ==========================================
    // 快取管理
    // ==========================================

    /**
     * 清除預覽快取
     * @param {string} fileId - 特定檔案 ID（可選）
     */
    clearPreviewCache(fileId = null) {
        if (fileId) {
            // 清除特定檔案的快取
            const keysToDelete = [];
            for (const key of this._previewCache.keys()) {
                if (key.startsWith(`${fileId}_`)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => this._previewCache.delete(key));

            console.log(`🧹 清除檔案 ${fileId} 的預覽快取，共 ${keysToDelete.length} 項`);
        } else {
            // 清除所有快取
            const count = this._previewCache.size;
            this._previewCache.clear();
            console.log(`🧹 清除所有預覽快取，共 ${count} 項`);
        }
    },

    /**
     * 清除縮圖快取
     * @param {string} fileId - 特定檔案 ID（可選）
     */
    clearThumbnailCache(fileId = null) {
        if (fileId) {
            // 清除特定檔案的快取
            const keysToDelete = [];
            for (const key of this._thumbnailCache.keys()) {
                if (key.includes(`_${fileId}_`)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => this._thumbnailCache.delete(key));

            console.log(`🧹 清除檔案 ${fileId} 的縮圖快取，共 ${keysToDelete.length} 項`);
        } else {
            // 清除所有快取
            const count = this._thumbnailCache.size;
            this._thumbnailCache.clear();
            console.log(`🧹 清除所有縮圖快取，共 ${count} 項`);
        }
    },

    /**
     * 獲取快取統計資訊
     * @returns {object} 快取統計
     */
    getCacheStatistics() {
        return {
            preview: {
                count: this._previewCache.size,
                memoryUsage: this._estimateCacheMemoryUsage(this._previewCache)
            },
            thumbnail: {
                count: this._thumbnailCache.size,
                memoryUsage: this._estimateCacheMemoryUsage(this._thumbnailCache)
            }
        };
    },

    // ==========================================
    // 私有方法
    // ==========================================

    /**
     * 檢測預覽類型
     * @param {object} fileInfo - 檔案資訊
     * @returns {string} 預覽類型
     * @private
     */
    _detectPreviewType(fileInfo) {
        if (!fileInfo || !fileInfo.fileName) return 'none';

        const extension = FileUtils.getFileExtension(fileInfo.fileName);
        const category = CONSTANTS.getFileCategory(extension);

        switch (category) {
            case 'image': return 'image';
            case 'video': return 'video';
            case 'audio': return 'audio';
            case 'text': return 'text';
            case 'document':
                if (extension === 'pdf') return 'pdf';
                return 'office';
            default: return 'none';
        }
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
            !error.response ||
            error.response?.status >= 500
        );
    },

    /**
     * 估算快取記憶體使用量
     * @param {Map} cache - 快取物件
     * @returns {string} 記憶體使用量估算
     * @private
     */
    _estimateCacheMemoryUsage(cache) {
        // 粗略估算，每個快取項目約 1-5KB
        const estimatedSize = cache.size * 3 * 1024; // 平均 3KB per item
        return FileUtils.formatFileSize(estimatedSize);
    }
};

// 導出到全域
window.PreviewService = PreviewService;