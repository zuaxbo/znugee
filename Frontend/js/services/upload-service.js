/**
 * 檔案上傳服務
 * 提供檔案上傳、進度追蹤和管理功能
 */

const UploadService = {

    // 上傳任務管理
    _uploadTasks: new Map(), // 儲存進行中的上傳任務
    _uploadHistory: [],      // 上傳歷史記錄
    _nextTaskId: 1,          // 下一個任務 ID

    // ==========================================
    // 單檔案上傳
    // ==========================================

    /**
     * 上傳單一檔案
     * @param {File} file - 檔案物件
     * @param {object} options - 上傳選項
     * @returns {Promise<object>} 上傳結果
     */
    async uploadFile(file, options = {}) {
        const {
            onProgress = null,
            onSuccess = null,
            onError = null,
            validateFile = true,
            generateThumbnail = true,
            overwrite = false
        } = options;

        // 驗證檔案
        if (validateFile) {
            const validation = ValidationUtils.validateFile(file);
            if (!validation.isValid) {
                const result = {
                    success: false,
                    error: 'FILE_VALIDATION_FAILED',
                    message: validation.message,
                    file: file
                };
                if (onError) onError(result);
                return result;
            }
        }

        // 建立上傳任務
        const taskId = this._generateTaskId();
        const uploadTask = this._createUploadTask(taskId, file, options);

        try {
            console.log('📤 開始上傳檔案:', {
                taskId,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            });

            // 準備表單數據
            const formData = new FormData();
            formData.append('file', file);
            formData.append('generateThumbnail', generateThumbnail);
            formData.append('overwrite', overwrite);

            // 執行上傳
            const response = await axios.post(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.upload),
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 0, // 上傳不設定超時
                    onUploadProgress: (progressEvent) => {
                        const progress = this._calculateProgress(progressEvent);
                        this._updateTaskProgress(taskId, progress);

                        if (onProgress) {
                            onProgress(progress, uploadTask);
                        }
                    }
                }
            );

            console.log('✅ 檔案上傳成功:', response.data);

            // 更新任務狀態
            uploadTask.status = CONSTANTS.UPLOAD_STATUS.SUCCESS;
            uploadTask.endTime = new Date();
            uploadTask.result = response.data;

            const result = {
                success: true,
                data: response.data,
                file: response.data.file || response.data,
                message: CONSTANTS.SUCCESS_MESSAGES.UPLOAD_SUCCESS,
                taskId: taskId,
                uploadTask: uploadTask
            };

            // 移至歷史記錄
            this._moveTaskToHistory(taskId);

            if (onSuccess) onSuccess(result);
            return result;

        } catch (error) {
            console.error('❌ 檔案上傳失敗:', error);

            // 更新任務狀態
            uploadTask.status = CONSTANTS.UPLOAD_STATUS.ERROR;
            uploadTask.endTime = new Date();
            uploadTask.error = error;

            const result = this._handleUploadError(error, file, taskId);
            this._moveTaskToHistory(taskId);

            if (onError) onError(result);
            return result;
        }
    },

    /**
     * 上傳多個檔案
     * @param {FileList|Array} files - 檔案列表
     * @param {object} options - 上傳選項
     * @returns {Promise<object>} 上傳結果
     */
    async uploadFiles(files, options = {}) {
        const {
            maxConcurrent = API_CONFIG.upload.maxConcurrentUploads,
            onProgress = null,
            onFileSuccess = null,
            onFileError = null,
            onComplete = null,
            validateFiles = true,
            stopOnError = false
        } = options;

        const fileArray = Array.from(files);

        // 驗證檔案列表
        if (validateFiles) {
            const validation = ValidationUtils.validateFiles(fileArray);
            if (!validation.isValid) {
                const result = {
                    success: false,
                    error: 'FILES_VALIDATION_FAILED',
                    message: validation.message,
                    invalidFiles: validation.invalidFiles || []
                };
                if (onComplete) onComplete(result);
                return result;
            }
        }

        console.log('📤 開始批量上傳:', {
            fileCount: fileArray.length,
            maxConcurrent,
            totalSize: fileArray.reduce((sum, file) => sum + file.size, 0)
        });

        const results = {
            successful: [],
            failed: [],
            total: fileArray.length,
            startTime: new Date(),
            endTime: null
        };

        // 分批上傳
        const batches = this._createUploadBatches(fileArray, maxConcurrent);
        let completedCount = 0;

        for (const batch of batches) {
            const batchPromises = batch.map(file =>
                this.uploadFile(file, {
                    ...options,
                    onProgress: (progress, task) => {
                        if (onProgress) {
                            const overallProgress = this._calculateOverallProgress(
                                completedCount,
                                results.total,
                                progress.percentage
                            );
                            onProgress(overallProgress, task, results);
                        }
                    },
                    onSuccess: (result) => {
                        results.successful.push(result);
                        completedCount++;
                        if (onFileSuccess) onFileSuccess(result, results);
                    },
                    onError: (result) => {
                        results.failed.push(result);
                        completedCount++;
                        if (onFileError) onFileError(result, results);
                    }
                })
            );

            // 等待當前批次完成
            await Promise.all(batchPromises);

            // 如果設定了遇錯即停且有失敗的檔案
            if (stopOnError && results.failed.length > 0) {
                console.warn('⚠️ 遇到錯誤，停止後續上傳');
                break;
            }
        }

        results.endTime = new Date();
        results.duration = results.endTime - results.startTime;

        const finalResult = {
            success: results.failed.length === 0,
            data: results,
            message: `上傳完成：成功 ${results.successful.length} 個，失敗 ${results.failed.length} 個`,
            successful: results.successful,
            failed: results.failed,
            totalCount: results.total,
            successCount: results.successful.length,
            failedCount: results.failed.length
        };

        console.log('📊 批量上傳完成:', finalResult);

        if (onComplete) onComplete(finalResult);
        return finalResult;
    },

    // ==========================================
    // 上傳任務管理
    // ==========================================

    /**
     * 取消上傳任務
     * @param {string} taskId - 任務 ID
     * @returns {boolean} 是否成功取消
     */
    cancelUpload(taskId) {
        const task = this._uploadTasks.get(taskId);
        if (!task) {
            console.warn('⚠️ 找不到上傳任務:', taskId);
            return false;
        }

        try {
            // 取消 axios 請求
            if (task.cancelToken) {
                task.cancelToken.cancel('用戶取消上傳');
            }

            // 更新任務狀態
            task.status = CONSTANTS.UPLOAD_STATUS.CANCELLED;
            task.endTime = new Date();

            console.log('⏹️ 上傳任務已取消:', taskId);

            // 移至歷史記錄
            this._moveTaskToHistory(taskId);

            return true;

        } catch (error) {
            console.error('❌ 取消上傳失敗:', error);
            return false;
        }
    },

    /**
     * 暫停上傳任務
     * @param {string} taskId - 任務 ID
     * @returns {boolean} 是否成功暫停
     */
    pauseUpload(taskId) {
        const task = this._uploadTasks.get(taskId);
        if (!task) {
            return false;
        }

        // 目前的實作不支援暫停，可以在未來版本中實現
        console.warn('⚠️ 暫停功能尚未實現，建議取消後重新上傳');
        return false;
    },

    /**
     * 獲取上傳任務狀態
     * @param {string} taskId - 任務 ID
     * @returns {object|null} 任務資訊
     */
    getUploadTask(taskId) {
        return this._uploadTasks.get(taskId) ||
            this._uploadHistory.find(task => task.id === taskId) ||
            null;
    },

    /**
     * 獲取所有進行中的上傳任務
     * @returns {Array} 上傳任務列表
     */
    getActiveUploadTasks() {
        return Array.from(this._uploadTasks.values());
    },

    /**
     * 獲取上傳歷史記錄
     * @param {number} limit - 記錄數量限制
     * @returns {Array} 歷史記錄
     */
    getUploadHistory(limit = 50) {
        return this._uploadHistory
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
    },

    /**
     * 清除上傳歷史記錄
     * @param {number} olderThanDays - 清除多少天前的記錄
     */
    clearUploadHistory(olderThanDays = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const originalCount = this._uploadHistory.length;
        this._uploadHistory = this._uploadHistory.filter(
            task => task.startTime > cutoffDate
        );

        const clearedCount = originalCount - this._uploadHistory.length;
        console.log(`🧹 清除了 ${clearedCount} 條上傳歷史記錄`);

        return clearedCount;
    },

    // ==========================================
    // 進度和統計
    // ==========================================

    /**
     * 獲取上傳統計資訊
     * @returns {object} 統計資訊
     */
    getUploadStatistics() {
        const activeTasks = this.getActiveUploadTasks();
        const history = this._uploadHistory;

        const stats = {
            active: {
                count: activeTasks.length,
                totalSize: activeTasks.reduce((sum, task) => sum + task.file.size, 0),
                uploading: activeTasks.filter(task => task.status === CONSTANTS.UPLOAD_STATUS.UPLOADING).length,
                pending: activeTasks.filter(task => task.status === CONSTANTS.UPLOAD_STATUS.PENDING).length
            },
            today: this._getTodayStatistics(history),
            total: {
                count: history.length,
                successful: history.filter(task => task.status === CONSTANTS.UPLOAD_STATUS.SUCCESS).length,
                failed: history.filter(task => task.status === CONSTANTS.UPLOAD_STATUS.ERROR).length,
                cancelled: history.filter(task => task.status === CONSTANTS.UPLOAD_STATUS.CANCELLED).length
            }
        };

        return stats;
    },

    /**
     * 計算整體上傳進度
     * @param {number} completedCount - 已完成數量
     * @param {number} totalCount - 總數量
     * @param {number} currentProgress - 當前檔案進度
     * @returns {object} 整體進度資訊
     */
    _calculateOverallProgress(completedCount, totalCount, currentProgress = 0) {
        const completedPercentage = (completedCount / totalCount) * 100;
        const currentFilePercentage = (currentProgress / totalCount);
        const overallPercentage = Math.min(completedPercentage + currentFilePercentage, 100);

        return {
            percentage: Math.round(overallPercentage),
            completedCount: completedCount,
            totalCount: totalCount,
            currentFileProgress: currentProgress,
            isComplete: completedCount === totalCount
        };
    },

    // ==========================================
    // 私有方法
    // ==========================================

    /**
     * 生成任務 ID
     * @returns {string} 任務 ID
     * @private
     */
    _generateTaskId() {
        return `upload_${this._nextTaskId++}_${Date.now()}`;
    },

    /**
     * 建立上傳任務物件
     * @param {string} taskId - 任務 ID
     * @param {File} file - 檔案物件
     * @param {object} options - 選項
     * @returns {object} 任務物件
     * @private
     */
    _createUploadTask(taskId, file, options = {}) {
        const task = {
            id: taskId,
            file: file,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            status: CONSTANTS.UPLOAD_STATUS.PENDING,
            progress: 0,
            startTime: new Date(),
            endTime: null,
            error: null,
            result: null,
            options: options,
            cancelToken: axios.CancelToken.source()
        };

        this._uploadTasks.set(taskId, task);
        return task;
    },

    /**
     * 計算上傳進度
     * @param {object} progressEvent - 進度事件
     * @returns {object} 進度資訊
     * @private
     */
    _calculateProgress(progressEvent) {
        const { loaded, total } = progressEvent;
        const percentage = total ? Math.round((loaded / total) * 100) : 0;

        return {
            loaded: loaded,
            total: total,
            percentage: percentage,
            loadedText: FileUtils.formatFileSize(loaded),
            totalText: FileUtils.formatFileSize(total),
            remainingText: FileUtils.formatFileSize(total - loaded),
            isComplete: percentage === 100
        };
    },

    /**
     * 更新任務進度
     * @param {string} taskId - 任務 ID
     * @param {object} progress - 進度資訊
     * @private
     */
    _updateTaskProgress(taskId, progress) {
        const task = this._uploadTasks.get(taskId);
        if (task) {
            task.status = CONSTANTS.UPLOAD_STATUS.UPLOADING;
            task.progress = progress.percentage;
            task.progressInfo = progress;
        }
    },

    /**
     * 處理上傳錯誤
     * @param {Error} error - 錯誤物件
     * @param {File} file - 檔案物件
     * @param {string} taskId - 任務 ID
     * @returns {object} 錯誤結果
     * @private
     */
    _handleUploadError(error, file, taskId) {
        let errorMessage = CONSTANTS.ERROR_MESSAGES.UPLOAD_FAILED;
        let errorCode = 'UPLOAD_FAILED';

        if (axios.isCancel(error)) {
            errorMessage = '上傳已取消';
            errorCode = 'UPLOAD_CANCELLED';
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
            errorMessage = CONSTANTS.ERROR_MESSAGES.BACKEND_NOT_AVAILABLE;
            errorCode = 'BACKEND_NOT_AVAILABLE';
        } else {
            switch (error.response?.status) {
                case 400:
                    errorMessage = error.response.data?.message || '檔案格式不正確';
                    errorCode = 'INVALID_FILE';
                    break;
                case 413:
                    errorMessage = CONSTANTS.ERROR_MESSAGES.FILE_TOO_LARGE;
                    errorCode = 'FILE_TOO_LARGE';
                    break;
                case 415:
                    errorMessage = CONSTANTS.ERROR_MESSAGES.FILE_TYPE_NOT_ALLOWED;
                    errorCode = 'FILE_TYPE_NOT_ALLOWED';
                    break;
                case 409:
                    errorMessage = '檔案名稱已存在';
                    errorCode = 'FILE_EXISTS';
                    break;
                case 500:
                    errorMessage = CONSTANTS.ERROR_MESSAGES.SERVER_ERROR;
                    errorCode = 'SERVER_ERROR';
                    break;
                default:
                    errorMessage = error.response?.data?.message || errorMessage;
            }
        }

        return {
            success: false,
            error: errorCode,
            message: errorMessage,
            file: file,
            taskId: taskId,
            httpStatus: error.response?.status,
            isBackendDown: errorCode === 'BACKEND_NOT_AVAILABLE'
        };
    },

    /**
     * 將任務移至歷史記錄
     * @param {string} taskId - 任務 ID
     * @private
     */
    _moveTaskToHistory(taskId) {
        const task = this._uploadTasks.get(taskId);
        if (task) {
            this._uploadTasks.delete(taskId);
            this._uploadHistory.push(task);

            // 限制歷史記錄數量
            if (this._uploadHistory.length > 100) {
                this._uploadHistory = this._uploadHistory.slice(-100);
            }
        }
    },

    /**
     * 建立上傳批次
     * @param {Array} files - 檔案陣列
     * @param {number} batchSize - 批次大小
     * @returns {Array} 批次陣列
     * @private
     */
    _createUploadBatches(files, batchSize) {
        const batches = [];
        for (let i = 0; i < files.length; i += batchSize) {
            batches.push(files.slice(i, i + batchSize));
        }
        return batches;
    },

    /**
     * 獲取今日統計資訊
     * @param {Array} history - 歷史記錄
     * @returns {object} 今日統計
     * @private
     */
    _getTodayStatistics(history) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTasks = history.filter(task =>
            task.startTime >= today
        );

        return {
            count: todayTasks.length,
            successful: todayTasks.filter(task => task.status === CONSTANTS.UPLOAD_STATUS.SUCCESS).length,
            failed: todayTasks.filter(task => task.status === CONSTANTS.UPLOAD_STATUS.ERROR).length,
            totalSize: todayTasks.reduce((sum, task) => sum + task.file.size, 0)
        };
    }
};

// 導出到全域
window.UploadService = UploadService;