<!-- FrontendUI/assets/js/components/FileUpload.vue -->
<template>
    <div class="file-upload-container">
        <!-- 拖放上傳區域 -->
        <div class="upload-dropzone"
             :class="{
             'dragover' : isDragOver,
             'has-files' : selectedFiles.length>
            0,
            'uploading': isUploading
            }"
            @dragenter.prevent="onDragEnter"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
            @click="openFileDialog">

            <!-- 拖放提示 -->
            <div v-if="selectedFiles.length === 0" class="upload-prompt">
                <div class="upload-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <h5 class="upload-title">拖放檔案到此處上傳</h5>
                <p class="upload-subtitle text-muted">
                    或 <span class="text-primary">點擊選擇檔案</span>
                </p>
                <div class="upload-info">
                    <small class="text-muted">
                        支援格式：{{ allowedTypesText }}<br>
                        檔案大小限制：{{ formatFileSize(maxFileSize) }}
                    </small>
                </div>
            </div>

            <!-- 已選擇的檔案列表 -->
            <div v-else class="selected-files">
                <h6 class="mb-3">
                    <i class="fas fa-file-alt me-2"></i>
                    已選擇 {{ selectedFiles.length }} 個檔案
                </h6>

                <div class="file-list">
                    <div v-for="(file, index) in selectedFiles"
                         :key="index"
                         class="file-item"
                         :class="{
                            'upload-success': file.uploadStatus === 'success',
                            'upload-error': file.uploadStatus === 'error',
                            'uploading': file.uploadStatus === 'uploading'
                        }">

                        <div class="file-info">
                            <div class="file-icon">
                                <i :class="getFileIcon(file.name)"></i>
                            </div>
                            <div class="file-details">
                                <div class="file-name" :title="file.name">{{ file.name }}</div>
                                <div class="file-size">{{ formatFileSize(file.size) }}</div>
                            </div>
                        </div>

                        <div class="file-actions">
                            <!-- 上傳進度 -->
                            <div v-if="file.uploadStatus === 'uploading'" class="upload-progress">
                                <div class="progress">
                                    <div class="progress-bar progress-bar-striped progress-bar-animated"
                                         :style="{ width: file.progress + '%' }">
                                    </div>
                                </div>
                                <small class="text-muted">{{ file.progress }}%</small>
                            </div>

                            <!-- 上傳狀態圖示 -->
                            <div v-else-if="file.uploadStatus === 'success'" class="status-icon text-success">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div v-else-if="file.uploadStatus === 'error'" class="status-icon text-danger">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>

                            <!-- 移除按鈕 -->
                            <button v-if="!file.uploadStatus || file.uploadStatus === 'error'"
                                    type="button"
                                    class="btn btn-outline-danger btn-sm"
                                    @click.stop="removeFile(index)"
                                    title="移除檔案">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 重新選擇檔案 -->
                <div class="text-center mt-3">
                    <button type="button"
                            class="btn btn-outline-secondary btn-sm"
                            @click="openFileDialog"
                            :disabled="isUploading">
                        <i class="fas fa-plus me-1"></i>
                        添加更多檔案
                    </button>
                </div>
            </div>
        </div>

        <!-- 檔案選擇輸入 -->
        <input ref="fileInput"
               type="file"
               :multiple="allowMultiple"
               :accept="acceptTypes"
               @change="onFileSelect"
               style="display: none;">

        <!-- 自訂檔案名稱 -->
        <div v-if="showCustomFileName && selectedFiles.length === 1" class="custom-filename mt-3">
            <label class="form-label">自訂檔案名稱（可選）</label>
            <input type="text"
                   class="form-control"
                   v-model="customFileName"
                   :placeholder="selectedFiles[0].name"
                   maxlength="255">
            <div class="form-text">
                保留原始副檔名，只修改檔案名稱部分
            </div>
        </div>

        <!-- 上傳控制按鈕 -->
        <div v-if="selectedFiles.length > 0" class="upload-controls mt-4">
            <div class="d-flex justify-content-between align-items-center">
                <div class="upload-summary">
                    <small class="text-muted">
                        總計：{{ selectedFiles.length }} 個檔案，{{ formatFileSize(totalSize) }}
                    </small>
                </div>

                <div class="btn-group">
                    <button type="button"
                            class="btn btn-outline-secondary"
                            @click="clearFiles"
                            :disabled="isUploading">
                        <i class="fas fa-times me-1"></i>
                        清除全部
                    </button>
                    <button type="button"
                            class="btn btn-primary"
                            @click="startUpload"
                            :disabled="isUploading || !hasValidFiles">
                        <span v-if="isUploading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="fas fa-upload me-1"></i>
                        {{ isUploading ? '上傳中...' : '開始上傳' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- 上傳結果摘要 -->
        <div v-if="uploadResults.length > 0" class="upload-results mt-3">
            <div class="alert" :class="uploadResultClass">
                <h6 class="alert-heading">
                    <i :class="uploadResultIcon" class="me-2"></i>
                    上傳完成
                </h6>
                <p class="mb-0">
                    成功：{{ successCount }} 個檔案，失敗：{{ errorCount }} 個檔案
                </p>
                <div v-if="errorFiles.length > 0" class="mt-2">
                    <small>失敗檔案：{{ errorFiles.join(', ') }}</small>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'FileUpload',
    props: {
        // 上傳設定
        maxFileSize: {
            type: Number,
            default: 50 * 1024 * 1024 // 50MB
        },
        allowMultiple: {
            type: Boolean,
            default: true
        },
        allowedTypes: {
            type: Array,
            default: () => [
                'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml',
                'application/pdf',
                'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain', 'text/csv',
                'video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv',
                'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac',
                'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
            ]
        },
        showCustomFileName: {
            type: Boolean,
            default: true
        },
        autoUpload: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            selectedFiles: [],
            isDragOver: false,
            isUploading: false,
            customFileName: '',
            uploadResults: []
        }
    },

    computed: {
        // 接受的檔案類型字串
        acceptTypes() {
            return this.allowedTypes.join(',');
        },

        // 允許類型的顯示文字
        allowedTypesText() {
            const types = ['圖片', 'PDF', 'Office文件', '文字檔', '影片', '音訊', '壓縮檔'];
            return types.join('、');
        },

        // 總檔案大小
        totalSize() {
            return this.selectedFiles.reduce((total, file) => total + file.size, 0);
        },

        // 是否有有效檔案
        hasValidFiles() {
            return this.selectedFiles.some(file => !file.error);
        },

        // 上傳結果樣式
        uploadResultClass() {
            const hasErrors = this.uploadResults.some(result => !result.success);
            return hasErrors ? 'alert-warning' : 'alert-success';
        },

        // 上傳結果圖示
        uploadResultIcon() {
            const hasErrors = this.uploadResults.some(result => !result.success);
            return hasErrors ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';
        },

        // 成功數量
        successCount() {
            return this.uploadResults.filter(result => result.success).length;
        },

        // 錯誤數量
        errorCount() {
            return this.uploadResults.filter(result => !result.success).length;
        },

        // 錯誤檔案列表
        errorFiles() {
            return this.uploadResults
                .filter(result => !result.success)
                .map(result => result.fileName);
        }
    },

    methods: {
        // 拖放事件處理
        onDragEnter(e) {
            this.isDragOver = true;
        },

        onDragOver(e) {
            this.isDragOver = true;
        },

        onDragLeave(e) {
            // 檢查是否真的離開了拖放區域
            if (!e.currentTarget.contains(e.relatedTarget)) {
                this.isDragOver = false;
            }
        },

        onDrop(e) {
            this.isDragOver = false;
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        },

        // 開啟檔案選擇對話框
        openFileDialog() {
            this.$refs.fileInput.click();
        },

        // 檔案選擇處理
        onFileSelect(e) {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
            // 清除input值，允許重複選擇同一檔案
            e.target.value = '';
        },

        // 處理選擇的檔案
        handleFiles(files) {
            const validFiles = [];

            files.forEach(file => {
                const fileObj = {
                    ...file,
                    id: this.generateId(),
                    error: null,
                    uploadStatus: null,
                    progress: 0
                };

                // 驗證檔案
                const validation = this.validateFile(file);
                if (!validation.isValid) {
                    fileObj.error = validation.errors.join(', ');
                }

                validFiles.push(fileObj);
            });

            // 添加或替換檔案
            if (this.allowMultiple) {
                this.selectedFiles.push(...validFiles);
            } else {
                this.selectedFiles = validFiles.slice(0, 1);
            }

            // 自動上傳
            if (this.autoUpload && this.hasValidFiles) {
                this.startUpload();
            }

            this.$emit('files-selected', this.selectedFiles);
        },

        // 驗證檔案
        validateFile(file) {
            const errors = [];

            // 檢查檔案大小
            if (file.size > this.maxFileSize) {
                errors.push(`檔案大小超過限制 (${this.formatFileSize(this.maxFileSize)})`);
            }

            // 檢查檔案類型
            if (!this.allowedTypes.includes(file.type)) {
                errors.push('不支援的檔案類型');
            }

            return {
                isValid: errors.length === 0,
                errors: errors
            };
        },

        // 移除檔案
        removeFile(index) {
            this.selectedFiles.splice(index, 1);
            this.$emit('files-changed', this.selectedFiles);
        },

        // 清除所有檔案
        clearFiles() {
            this.selectedFiles = [];
            this.uploadResults = [];
            this.customFileName = '';
            this.$emit('files-changed', this.selectedFiles);
        },

        // 開始上傳
        async startUpload() {
            if (this.isUploading || !this.hasValidFiles) return;

            this.isUploading = true;
            this.uploadResults = [];

            const validFiles = this.selectedFiles.filter(file => !file.error);

            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                await this.uploadSingleFile(file);
            }

            this.isUploading = false;
            this.$emit('upload-complete', this.uploadResults);
        },

        // 上傳單個檔案
        async uploadSingleFile(file) {
            try {
                file.uploadStatus = 'uploading';
                file.progress = 0;

                // 準備表單數據
                const formData = new FormData();
                formData.append('file', file);

                // 如果是單檔案且有自訂名稱
                if (this.selectedFiles.length === 1 && this.customFileName) {
                    formData.append('customFileName', this.customFileName);
                }

                // 使用 FileAPI 上傳
                const result = await FileAPI.uploadFile(file, this.customFileName);

                if (result.success) {
                    file.uploadStatus = 'success';
                    file.progress = 100;
                    this.uploadResults.push({
                        success: true,
                        fileName: file.name,
                        data: result.data
                    });
                    this.$emit('file-uploaded', result.data);
                } else {
                    throw new Error(result.message);
                }

            } catch (error) {
                file.uploadStatus = 'error';
                file.error = error.message;
                this.uploadResults.push({
                    success: false,
                    fileName: file.name,
                    error: error.message
                });
            }
        },

        // 取得檔案圖示
        getFileIcon(fileName) {
            const extension = this.getFileExtension(fileName);
            const iconMap = {
                'pdf': 'fas fa-file-pdf text-danger',
                'doc': 'fas fa-file-word text-primary',
                'docx': 'fas fa-file-word text-primary',
                'xls': 'fas fa-file-excel text-success',
                'xlsx': 'fas fa-file-excel text-success',
                'ppt': 'fas fa-file-powerpoint text-warning',
                'pptx': 'fas fa-file-powerpoint text-warning',
                'txt': 'fas fa-file-text text-secondary',
                'csv': 'fas fa-file-csv text-success',
                'jpg': 'fas fa-file-image text-info',
                'jpeg': 'fas fa-file-image text-info',
                'png': 'fas fa-file-image text-info',
                'gif': 'fas fa-file-image text-info',
                'bmp': 'fas fa-file-image text-info',
                'svg': 'fas fa-file-image text-info',
                'mp4': 'fas fa-file-video text-primary',
                'avi': 'fas fa-file-video text-primary',
                'mov': 'fas fa-file-video text-primary',
                'wmv': 'fas fa-file-video text-primary',
                'mp3': 'fas fa-file-audio text-warning',
                'wav': 'fas fa-file-audio text-warning',
                'flac': 'fas fa-file-audio text-warning',
                'aac': 'fas fa-file-audio text-warning',
                'zip': 'fas fa-file-archive text-secondary',
                'rar': 'fas fa-file-archive text-secondary',
                '7z': 'fas fa-file-archive text-secondary'
            };
            return iconMap[extension.toLowerCase()] || 'fas fa-file text-muted';
        },

        // 取得檔案副檔名
        getFileExtension(fileName) {
            return fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2);
        },

        // 格式化檔案大小
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        // 產生唯一ID
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
    }
}
</script>

<style scoped>
    .file-upload-container {
        width: 100%;
    }

    .upload-dropzone {
        border: 2px dashed #dee2e6;
        border-radius: 0.5rem;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background-color: #f8f9fa;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

        .upload-dropzone:hover {
            border-color: #0d6efd;
            background-color: #f0f8ff;
        }

        .upload-dropzone.dragover {
            border-color: #0d6efd;
            background-color: #e7f3ff;
            transform: scale(1.02);
        }

        .upload-dropzone.has-files {
            text-align: left;
            align-items: flex-start;
            min-height: auto;
        }

        .upload-dropzone.uploading {
            border-color: #ffc107;
            background-color: #fff8e1;
        }

    .upload-prompt {
        width: 100%;
    }

    .upload-icon {
        font-size: 3rem;
        color: #6c757d;
        margin-bottom: 1rem;
    }

    .upload-title {
        color: #495057;
        margin-bottom: 0.5rem;
    }

    .upload-subtitle {
        margin-bottom: 1rem;
    }

    .upload-info {
        margin-top: 1rem;
    }

    .selected-files {
        width: 100%;
    }

    .file-list {
        max-height: 300px;
        overflow-y: auto;
    }

    .file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background-color: white;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        transition: all 0.2s ease;
    }

        .file-item:hover {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .file-item.upload-success {
            border-color: #198754;
            background-color: #f8fff9;
        }

        .file-item.upload-error {
            border-color: #dc3545;
            background-color: #fff8f8;
        }

        .file-item.uploading {
            border-color: #ffc107;
            background-color: #fffbf0;
        }

    .file-info {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
    }

    .file-icon {
        font-size: 1.5rem;
        margin-right: 0.75rem;
        flex-shrink: 0;
    }

    .file-details {
        min-width: 0;
        flex: 1;
    }

    .file-name {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 0.25rem;
    }

    .file-size {
        font-size: 0.875rem;
        color: #6c757d;
    }

    .file-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .upload-progress {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 120px;
    }

    .progress {
        width: 80px;
        height: 6px;
    }

    .status-icon {
        font-size: 1.25rem;
    }

    .upload-controls {
        border-top: 1px solid #dee2e6;
        padding-top: 1rem;
    }

    .upload-summary {
        flex: 1;
    }

    .upload-results {
        border-top: 1px solid #dee2e6;
        padding-top: 1rem;
    }

    .custom-filename {
        border-top: 1px solid #dee2e6;
        padding-top: 1rem;
    }

    /* 響應式設計 */
    @media (max-width: 768px) {
        .upload-dropzone {
            padding: 1.5rem 1rem;
            min-height: 150px;
        }

        .upload-icon {
            font-size: 2rem;
        }

        .file-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }

        .file-info {
            width: 100%;
        }

        .file-actions {
            width: 100%;
            justify-content: space-between;
        }

        .upload-controls .d-flex {
            flex-direction: column;
            gap: 1rem;
        }

        .upload-summary {
            text-align: center;
        }
    }

    @media (max-width: 576px) {
        .upload-dropzone {
            padding: 1rem;
            min-height: 120px;
        }

        .upload-title {
            font-size: 1.1rem;
        }

        .upload-subtitle {
            font-size: 0.9rem;
        }

        .file-name {
            font-size: 0.9rem;
        }

        .file-size {
            font-size: 0.8rem;
        }
    }

    /* 動畫效果 */
    @keyframes uploadSuccess {
        0% {
            transform: scale(1);
        }

        50% {
            transform: scale(1.05);
        }

        100% {
            transform: scale(1);
        }
    }

    .file-item.upload-success {
        animation: uploadSuccess 0.5s ease-in-out;
    }

    @keyframes shake {
        0%, 100% {
            transform: translateX(0);
        }

        25% {
            transform: translateX(-5px);
        }

        75% {
            transform: translateX(5px);
        }
    }

    .file-item.upload-error {
        animation: shake 0.5s ease-in-out;
    }
</style>