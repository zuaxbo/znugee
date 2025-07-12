<template>
    <div class="upload-modal">
        <!-- 模態框背景 -->
        <div class="modal-backdrop" @click="closeModal"></div>

        <!-- 模態框內容 -->
        <div class="modal-content">
            <!-- 模態框頭部 -->
            <div class="modal-header">
                <h5 class="modal-title">
                    <i class="bi bi-cloud-upload-fill me-2"></i>
                    上傳檔案
                </h5>
                <button type="button" class="btn-close" @click="closeModal" title="關閉">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <!-- 模態框主體 -->
            <div class="modal-body">
                <!-- 拖拽上傳區域 -->
                <div class="upload-area"
                     :class="{
                     'drag-over' : isDragOver,
                     'has-files' : uploadFiles.length>
                    0,
                    'uploading': isUploading
                    }"
                    @drop.prevent="handleDrop"
                    @dragover.prevent="handleDragOver"
                    @dragleave.prevent="handleDragLeave"
                    @dragenter.prevent
                    >
                    <!-- 上傳圖標和提示 -->
                    <div v-if="uploadFiles.length === 0" class="upload-prompt">
                        <div class="upload-icon">
                            <i class="bi bi-cloud-upload" :class="{ 'animate-bounce': isDragOver }"></i>
                        </div>
                        <h4 class="upload-title">
                            {{ isDragOver ? '放開以上傳檔案' : '拖拽檔案到此處' }}
                        </h4>
                        <p class="upload-description">
                            或點擊下方按鈕選擇檔案
                        </p>
                        <div class="upload-info">
                            <small class="text-muted">
                                支援的檔案類型：圖片、文檔、影片、音頻等<br>
                                單個檔案最大 {{ formatFileSize(maxFileSize) }}，最多同時上傳 {{ maxConcurrentFiles }} 個檔案
                            </small>
                        </div>
                    </div>

                    <!-- 檔案選擇按鈕 -->
                    <div v-if="uploadFiles.length === 0" class="upload-actions">
                        <button class="btn btn-primary btn-lg select-files-btn" @click="selectFiles">
                            <i class="bi bi-folder2-open me-2"></i>
                            選擇檔案
                        </button>
                        <input ref="fileInput"
                               type="file"
                               multiple
                               @change="handleFileSelect"
                               :accept="acceptedFileTypes"
                               style="display: none">
                    </div>
                </div>

                <!-- 已選擇的檔案列表 -->
                <div v-if="uploadFiles.length > 0" class="file-list">
                    <div class="file-list-header">
                        <h6 class="mb-0">
                            <i class="bi bi-files me-2"></i>
                            已選擇 {{ uploadFiles.length }} 個檔案
                            <span class="total-size text-muted">
                                (總大小: {{ formatFileSize(totalSize) }})
                            </span>
                        </h6>
                        <button v-if="!isUploading"
                                class="btn btn-sm btn-outline-secondary clear-btn"
                                @click="clearFiles"
                                title="清除所有檔案">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>

                    <!-- 檔案項目 -->
                    <div class="file-items">
                        <div v-for="(file, index) in uploadFiles"
                             :key="file.id"
                             class="file-item"
                             :class="{
                'upload-success': file.status === 'success',
                'upload-error': file.status === 'error',
                'upload-uploading': file.status === 'uploading'
              }">
                            <!-- 檔案圖標和縮圖 -->
                            <div class="file-icon">
                                <!-- 圖片縮圖 -->
                                <img v-if="isImage(file.file.name) && file.preview"
                                     :src="file.preview"
                                     :alt="file.file.name"
                                     class="file-thumbnail">
                                <!-- 檔案類型圖標 -->
                                <img v-else
                                     :src="getFileIcon(file.file.name)"
                                     :alt="getFileTypeName(file.file.name)"
                                     class="file-type-icon">

                                <!-- 狀態覆蓋層 -->
                                <div v-if="file.status" class="file-status-overlay">
                                    <i v-if="file.status === 'uploading'" class="bi bi-arrow-clockwise spin text-primary"></i>
                                    <i v-else-if="file.status === 'success'" class="bi bi-check-circle-fill text-success"></i>
                                    <i v-else-if="file.status === 'error'" class="bi bi-exclamation-triangle-fill text-danger"></i>
                                </div>
                            </div>

                            <!-- 檔案資訊 -->
                            <div class="file-info">
                                <div class="file-name" :title="file.file.name">
                                    {{ file.file.name }}
                                </div>
                                <div class="file-details">
                                    <span class="file-size">{{ formatFileSize(file.file.size) }}</span>
                                    <span v-if="file.file.type" class="file-type">{{ file.file.type }}</span>
                                </div>

                                <!-- 上傳進度 -->
                                <div v-if="file.status === 'uploading'" class="upload-progress">
                                    <div class="progress">
                                        <div class="progress-bar bg-primary"
                                             role="progressbar"
                                             :style="{ width: file.progress + '%' }"
                                             :aria-valuenow="file.progress"
                                             aria-valuemin="0"
                                             aria-valuemax="100">
                                        </div>
                                    </div>
                                    <div class="progress-info">
                                        <span class="progress-text">{{ file.progress }}%</span>
                                        <span v-if="file.speed" class="upload-speed">{{ formatFileSize(file.speed) }}/s</span>
                                    </div>
                                </div>

                                <!-- 錯誤訊息 -->
                                <div v-if="file.status === 'error'" class="error-message">
                                    <small class="text-danger">
                                        <i class="bi bi-exclamation-triangle me-1"></i>
                                        {{ file.error || '上傳失敗' }}
                                    </small>
                                </div>

                                <!-- 成功訊息 -->
                                <div v-if="file.status === 'success'" class="success-message">
                                    <small class="text-success">
                                        <i class="bi bi-check-circle me-1"></i>
                                        上傳成功
                                    </small>
                                </div>
                            </div>

                            <!-- 檔案操作 -->
                            <div class="file-actions">
                                <!-- 移除按鈕 -->
                                <button v-if="!isUploading || file.status === 'error'"
                                        class="btn btn-sm btn-outline-danger remove-btn"
                                        @click="removeFile(index)"
                                        title="移除檔案">
                                    <i class="bi bi-x"></i>
                                </button>

                                <!-- 重試按鈕 -->
                                <button v-if="file.status === 'error'"
                                        class="btn btn-sm btn-outline-primary retry-btn"
                                        @click="retryFile(index)"
                                        title="重新上傳">
                                    <i class="bi bi-arrow-clockwise"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 新增更多檔案 -->
                    <div v-if="!isUploading && canAddMoreFiles" class="add-more-files">
                        <button class="btn btn-outline-primary btn-sm" @click="selectFiles">
                            <i class="bi bi-plus-circle me-1"></i>
                            新增更多檔案
                        </button>
                    </div>
                </div>

                <!-- 上傳設定 -->
                <div v-if="uploadFiles.length > 0 && !isUploading" class="upload-settings">
                    <div class="settings-row">
                        <div class="setting-item">
                            <label class="form-check-label">
                                <input type="checkbox"
                                       class="form-check-input me-2"
                                       v-model="generateThumbnails">
                                自動生成縮圖
                            </label>
                        </div>
                        <div class="setting-item">
                            <label class="form-check-label">
                                <input type="checkbox"
                                       class="form-check-input me-2"
                                       v-model="overwriteExisting">
                                覆蓋同名檔案
                            </label>
                        </div>
                    </div>
                </div>

                <!-- 整體上傳進度 -->
                <div v-if="isUploading" class="overall-progress">
                    <div class="progress-header">
                        <span class="progress-label">
                            正在上傳... {{ completedFiles }}/{{ uploadFiles.length }} 個檔案已完成
                        </span>
                        <span class="progress-percentage">{{ overallProgress }}%</span>
                    </div>
                    <div class="progress overall-progress-bar">
                        <div class="progress-bar bg-primary"
                             role="progressbar"
                             :style="{ width: overallProgress + '%' }"
                             :aria-valuenow="overallProgress"
                             aria-valuemin="0"
                             aria-valuemax="100">
                        </div>
                    </div>
                    <div class="upload-stats">
                        <small class="text-muted">
                            <span v-if="estimatedTimeRemaining">預計剩餘時間: {{ estimatedTimeRemaining }}</span>
                            <span v-if="overallSpeed" class="ms-3">平均速度: {{ formatFileSize(overallSpeed) }}/s</span>
                        </small>
                    </div>
                </div>
            </div>

            <!-- 模態框底部 -->
            <div class="modal-footer">
                <button type="button"
                        class="btn btn-secondary"
                        @click="closeModal"
                        :disabled="isUploading">
                    {{ isUploading ? '上傳中...' : '取消' }}
                </button>

                <button v-if="uploadFiles.length > 0 && !isUploading"
                        type="button"
                        class="btn btn-primary upload-btn"
                        @click="startUpload"
                        :disabled="!canStartUpload">
                    <i class="bi bi-cloud-upload-fill me-2"></i>
                    開始上傳 ({{ uploadFiles.length }} 個檔案)
                </button>

                <button v-if="isUploading"
                        type="button"
                        class="btn btn-danger cancel-upload-btn"
                        @click="cancelUpload">
                    <i class="bi bi-x-circle me-2"></i>
                    取消上傳
                </button>

                <button v-if="allFilesProcessed"
                        type="button"
                        class="btn btn-success close-btn"
                        @click="closeModal">
                    <i class="bi bi-check-circle me-2"></i>
                    完成
                </button>
            </div>
        </div>
    </div>
</template>

<script>
module.exports = {
  data() {
    return {
      // 拖拽狀態
      isDragOver: false,
      dragCounter: 0,

      // 檔案列表
      uploadFiles: [],
      nextFileId: 1,

      // 上傳狀態
      isUploading: false,
      uploadStartTime: null,
      completedFiles: 0,

      // 上傳設定
      generateThumbnails: true,
      overwriteExisting: false,

      // 檔案限制
      maxFileSize: API_CONFIG.upload.maxFileSize,
      maxConcurrentFiles: API_CONFIG.upload.maxConcurrentUploads,

      // 支援的檔案類型
      acceptedFileTypes: API_CONFIG.upload.allowedTypes.join(','),

      // 上傳任務
      activeUploads: new Map(),
      uploadQueue: []
    }
  },

  computed: {
    // 總檔案大小
    totalSize() {
      return this.uploadFiles.reduce((sum, file) => sum + file.file.size, 0);
    },

    // 是否可以新增更多檔案
    canAddMoreFiles() {
      return this.uploadFiles.length < this.maxConcurrentFiles;
    },

    // 是否可以開始上傳
    canStartUpload() {
      return this.uploadFiles.length > 0 &&
             this.uploadFiles.every(file => file.status !== 'uploading');
    },

    // 所有檔案是否已處理完成
    allFilesProcessed() {
      if (this.uploadFiles.length === 0) return false;
      return this.uploadFiles.every(file =>
        file.status === 'success' || file.status === 'error'
      );
    },

    // 整體上傳進度
    overallProgress() {
      if (this.uploadFiles.length === 0) return 0;

      const totalProgress = this.uploadFiles.reduce((sum, file) => {
        return sum + (file.progress || 0);
      }, 0);

      return Math.round(totalProgress / this.uploadFiles.length);
    },

    // 整體上傳速度
    overallSpeed() {
      if (!this.uploadStartTime || this.uploadFiles.length === 0) return 0;

      const elapsedTime = (Date.now() - this.uploadStartTime) / 1000; // 秒
      const uploadedBytes = this.uploadFiles.reduce((sum, file) => {
        return sum + ((file.progress || 0) / 100 * file.file.size);
      }, 0);

      return elapsedTime > 0 ? uploadedBytes / elapsedTime : 0;
    },

    // 預計剩餘時間
    estimatedTimeRemaining() {
      if (!this.overallSpeed || this.overallProgress >= 100) return null;

      const remainingBytes = this.uploadFiles.reduce((sum, file) => {
        return sum + ((100 - (file.progress || 0)) / 100 * file.file.size);
      }, 0);

      const remainingSeconds = remainingBytes / this.overallSpeed;

      if (remainingSeconds < 60) {
        return `${Math.ceil(remainingSeconds)} 秒`;
      } else if (remainingSeconds < 3600) {
        return `${Math.ceil(remainingSeconds / 60)} 分鐘`;
      } else {
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.ceil((remainingSeconds % 3600) / 60);
        return `${hours} 小時 ${minutes} 分鐘`;
      }
    }
  },

  mounted() {
    // 監聽全域拖拽事件，防止檔案被瀏覽器直接開啟
    document.addEventListener('dragover', this.preventDefaultDrag);
    document.addEventListener('drop', this.preventDefaultDrag);

    console.log('📤 檔案上傳組件已掛載');
  },

  beforeDestroy() {
    // 清理事件監聽器
    document.removeEventListener('dragover', this.preventDefaultDrag);
    document.removeEventListener('drop', this.preventDefaultDrag);

    // 取消所有進行中的上傳
    this.cancelAllUploads();
  },

  methods: {
    // ==========================================
    // 模態框控制
    // ==========================================

    closeModal() {
      if (this.isUploading) {
        const confirmed = confirm('上傳正在進行中，確定要關閉嗎？這將取消所有未完成的上傳。');
        if (!confirmed) return;

        this.cancelAllUploads();
      }

      console.log('📤 關閉上傳對話框');
      this.$emit('close');
    },

    // ==========================================
    // 拖拽處理
    // ==========================================

    handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';

      if (!this.isDragOver) {
        this.isDragOver = true;
        this.dragCounter++;
      }
    },

    handleDragLeave(event) {
      event.preventDefault();
      this.dragCounter--;

      if (this.dragCounter <= 0) {
        this.isDragOver = false;
        this.dragCounter = 0;
      }
    },

    handleDrop(event) {
      event.preventDefault();
      this.isDragOver = false;
      this.dragCounter = 0;

      const files = Array.from(event.dataTransfer.files);
      console.log('📁 拖拽檔案:', files.length);

      this.addFiles(files);
    },

    preventDefaultDrag(event) {
      event.preventDefault();
      event.dataTransfer.effectAllowed = 'none';
      event.dataTransfer.dropEffect = 'none';
    },

    // ==========================================
    // 檔案選擇處理
    // ==========================================

    selectFiles() {
      this.$refs.fileInput.click();
    },

    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      console.log('📁 選擇檔案:', files.length);

      this.addFiles(files);

      // 清空 input 值，允許重複選擇相同檔案
      event.target.value = '';
    },

    async addFiles(files) {
      if (files.length === 0) return;

      // 檢查檔案數量限制
      const remainingSlots = this.maxConcurrentFiles - this.uploadFiles.length;
      if (files.length > remainingSlots) {
        this.showError(`最多只能同時上傳 ${this.maxConcurrentFiles} 個檔案，已選擇 ${this.uploadFiles.length} 個`);
        files = files.slice(0, remainingSlots);
      }

      const validFiles = [];
      const errors = [];

      for (const file of files) {
        // 驗證檔案
        const validation = this.validateFile(file);
        if (validation.isValid) {
          const uploadFile = await this.createUploadFile(file);
          validFiles.push(uploadFile);
        } else {
          errors.push(`${file.name}: ${validation.message}`);
        }
      }

      // 新增有效檔案
      this.uploadFiles.push(...validFiles);

      // 顯示錯誤訊息
      if (errors.length > 0) {
        this.showError(`以下檔案無法上傳：\n${errors.join('\n')}`);
      }

      console.log('✅ 新增檔案:', validFiles.length, '個，錯誤:', errors.length, '個');
    },

    async createUploadFile(file) {
      const uploadFile = {
        id: this.nextFileId++,
        file: file,
        status: 'pending',
        progress: 0,
        speed: 0,
        error: null,
        preview: null
      };

      // 為圖片檔案生成預覽
      if (this.isImage(file.name)) {
        try {
          uploadFile.preview = await this.generateFilePreview(file);
        } catch (error) {
          console.warn('⚠️ 生成預覽失敗:', error);
        }
      }

      return uploadFile;
    },

    generateFilePreview(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('讀取檔案失敗'));

        reader.readAsDataURL(file);
      });
    },

    // ==========================================
    // 檔案驗證
    // ==========================================

    validateFile(file) {
      // 檢查檔案大小
      if (file.size > this.maxFileSize) {
        return {
          isValid: false,
          message: `檔案大小超過限制 (${this.formatFileSize(this.maxFileSize)})`
        };
      }

      // 檢查檔案類型
      if (!this.isFileTypeAllowed(file)) {
        return {
          isValid: false,
          message: '不支援的檔案類型'
        };
      }

      // 檢查檔案名稱
      const nameValidation = ValidationUtils.validateFileName(file.name);
      if (!nameValidation.isValid) {
        return {
          isValid: false,
          message: nameValidation.message
        };
      }

      // 檢查重複檔案
      const isDuplicate = this.uploadFiles.some(uploadFile =>
        uploadFile.file.name === file.name && uploadFile.file.size === file.size
      );

      if (isDuplicate) {
        return {
          isValid: false,
          message: '檔案已存在於上傳列表中'
        };
      }

      return { isValid: true, message: '' };
    },

    isFileTypeAllowed(file) {
      // 檢查 MIME 類型
      if (file.type && API_CONFIG.upload.allowedTypes.includes(file.type)) {
        return true;
      }

      // 檢查副檔名
      const extension = FileUtils.getFileExtension(file.name);
      return Object.values(CONSTANTS.FILE_TYPES).some(typeInfo =>
        typeInfo.extensions && typeInfo.extensions.includes(extension)
      );
    },

    // ==========================================
    // 檔案操作
    // ==========================================

    removeFile(index) {
      const file = this.uploadFiles[index];
      console.log('🗑️ 移除檔案:', file.file.name);

      // 如果檔案正在上傳，先取消上傳
      if (file.status === 'uploading') {
        this.cancelFileUpload(file.id);
      }

      this.uploadFiles.splice(index, 1);
    },

    clearFiles() {
      console.log('🧹 清除所有檔案');

      // 取消所有進行中的上傳
      this.cancelAllUploads();

      this.uploadFiles = [];
    },

    async retryFile(index) {
      const file = this.uploadFiles[index];
      console.log('🔄 重試上傳:', file.file.name);

      file.status = 'pending';
      file.progress = 0;
      file.error = null;

      await this.uploadSingleFile(file);
    },

    // ==========================================
    // 上傳處理
    // ==========================================

    async startUpload() {
      if (this.uploadFiles.length === 0) return;

      console.log('📤 開始上傳:', this.uploadFiles.length, '個檔案');

      this.isUploading = true;
      this.uploadStartTime = Date.now();
      this.completedFiles = 0;

      // 並發上傳檔案
      const uploadPromises = this.uploadFiles.map(file => this.uploadSingleFile(file));

      try {
        await Promise.all(uploadPromises);
        console.log('✅ 所有檔案上傳完成');

        // 發送上傳完成事件
        const successFiles = this.uploadFiles.filter(f => f.status === 'success');
        if (successFiles.length > 0) {
          this.$emit('upload-success', {
            files: successFiles,
            totalCount: this.uploadFiles.length,
            successCount: successFiles.length
          });
        }

      } catch (error) {
        console.error('❌ 上傳過程中發生錯誤:', error);
        this.$emit('upload-error', error);
      } finally {
        this.isUploading = false;
      }
    },

    async uploadSingleFile(uploadFile) {
      try {
        uploadFile.status = 'uploading';
        uploadFile.progress = 0;
        uploadFile.error = null;

        console.log('📤 上傳檔案:', uploadFile.file.name);

        const result = await UploadService.uploadFile(uploadFile.file, {
          onProgress: (progress) => {
            uploadFile.progress = progress.percentage;
            uploadFile.speed = progress.speed || 0;
          },
          generateThumbnail: this.generateThumbnails,
          overwrite: this.overwriteExisting
        });

        if (result.success) {
          uploadFile.status = 'success';
          uploadFile.progress = 100;
          uploadFile.result = result.data;
          this.completedFiles++;

          console.log('✅ 檔案上傳成功:', uploadFile.file.name);
        } else {
          throw new Error(result.message || '上傳失敗');
        }

      } catch (error) {
        uploadFile.status = 'error';
        uploadFile.error = error.message || '上傳失敗';
        this.completedFiles++;

        console.error('❌ 檔案上傳失敗:', uploadFile.file.name, error);
      }
    },

    cancelUpload() {
      console.log('⏹️ 取消上傳');

      const confirmed = confirm('確定要取消上傳嗎？已上傳的檔案將會保留。');
      if (!confirmed) return;

      this.cancelAllUploads();
      this.isUploading = false;
    },

    cancelAllUploads() {
      // 取消所有進行中的上傳
      this.uploadFiles.forEach(file => {
        if (file.status === 'uploading') {
          this.cancelFileUpload(file.id);
        }
      });

      this.activeUploads.clear();
    },

    cancelFileUpload(fileId) {
      const uploadTask = this.activeUploads.get(fileId);
      if (uploadTask && uploadTask.cancel) {
        uploadTask.cancel();
        this.activeUploads.delete(fileId);
      }
    },

    // ==========================================
    // 工具方法
    // ==========================================

    isImage(filename) {
      return FileUtils.isImage(filename);
    },

    getFileIcon(filename) {
      const iconName = FileUtils.getFileIcon(filename);
      return FileUtils.buildIconPath(iconName);
    },

    getFileTypeName(filename) {
      const typeInfo = FileUtils.getFileTypeInfo(filename);
      return typeInfo.category || 'file';
    },

    formatFileSize(bytes) {
      return FileUtils.formatFileSize(bytes);
    },

    showError(message) {
      this.$emit('upload-error', { message });
    },

    showSuccess(message) {
      this.$emit('upload-success', { message });
    }
  }
}
</script>

<style scoped>
     /* ==========================================
    模態框主體
    ========================================== */

     .upload-modal {
         position: fixed;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         display: flex;
         align-items: center;
         justify-content: center;
         z-index: 1050;
         animation: fadeIn 0.3s ease-out;
     }

     .modal-backdrop {
         position: absolute;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         background: rgba(0, 0, 0, 0.6);
         backdrop-filter: blur(4px);
     }

     .modal-content {
         background: white;
         border-radius: 16px;
         width: 90%;
         max-width: 700px;
         max-height: 90vh;
         position: relative;
         box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
         overflow: hidden;
         display: flex;
         flex-direction: column;
         animation: slideUp 0.4s ease-out;
     }

     /* ==========================================
    模態框頭部
    ========================================== */

     .modal-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         padding: 24px 28px;
         background: linear-gradient(135deg, #007bff, #0056b3);
         color: white;
         border-radius: 16px 16px 0 0;
     }

     .modal-title {
         margin: 0;
         font-size: 1.25rem;
         font-weight: 600;
         display: flex;
         align-items: center;
     }

     .btn-close {
         background: none;
         border: none;
         color: white;
         font-size: 1.2rem;
         cursor: pointer;
         padding: 8px;
         border-radius: 50%;
         width: 36px;
         height: 36px;
         display: flex;
         align-items: center;
         justify-content: center;
         transition: all 0.3s ease;
     }

         .btn-close:hover {
             background: rgba(255, 255, 255, 0.2);
             transform: scale(1.1);
         }

     /* ==========================================
    模態框主體
    ========================================== */

     .modal-body {
         padding: 28px;
         flex: 1;
         overflow-y: auto;
         max-height: calc(90vh - 160px);
     }

     /* ==========================================
    上傳區域
    ========================================== */

     .upload-area {
         border: 3px dashed #dee2e6;
         border-radius: 12px;
         padding: 40px 20px;
         text-align: center;
         transition: all 0.3s ease;
         background: #f8f9fa;
         position: relative;
         overflow: hidden;
     }

         .upload-area.drag-over {
             border-color: #007bff;
             background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
             transform: scale(1.02);
             box-shadow: 0 8px 25px rgba(0, 123, 255, 0.2);
         }

         .upload-area.has-files {
             padding: 20px;
             border-style: solid;
             border-color: #28a745;
             background: linear-gradient(135deg, #d4edda, #d1ecf1);
         }

         .upload-area.uploading {
             border-color: #ffc107;
             background: linear-gradient(135deg, #fff3cd, #fdeaa7);
         }

     .upload-prompt {
         max-width: 400px;
         margin: 0 auto;
     }

     .upload-icon {
         margin-bottom: 20px;
     }

         .upload-icon i {
             font-size: 4rem;
             color: #6c757d;
             transition: all 0.3s ease;
         }

     .upload-area.drag-over .upload-icon i {
         color: #007bff;
         transform: scale(1.2);
     }

     .animate-bounce {
         animation: bounce 0.6s infinite alternate;
     }

     @keyframes bounce {
         from {
             transform: translateY(0);
         }

         to {
             transform: translateY(-10px);
         }
     }

     .upload-title {
         font-size: 1.5rem;
         font-weight: 600;
         color: #495057;
         margin-bottom: 12px;
     }

     .upload-area.drag-over .upload-title {
         color: #007bff;
     }

     .upload-description {
         color: #6c757d;
         margin-bottom: 20px;
         font-size: 1rem;
     }

     .upload-info {
         margin-bottom: 24px;
     }

     .upload-actions {
         margin-top: 20px;
     }

     .select-files-btn {
         padding: 12px 32px;
         font-size: 1.1rem;
         font-weight: 600;
         border-radius: 8px;
         box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
         transition: all 0.3s ease;
     }

         .select-files-btn:hover {
             transform: translateY(-2px);
             box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
         }

     /* ==========================================
    檔案列表
    ========================================== */

     .file-list {
         margin-top: 24px;
     }

     .file-list-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         margin-bottom: 16px;
         padding-bottom: 12px;
         border-bottom: 2px solid #e9ecef;
     }

         .file-list-header h6 {
             color: #495057;
             font-weight: 600;
         }

     .total-size {
         font-weight: normal;
         font-size: 0.9rem;
     }

     .clear-btn {
         padding: 6px 12px;
         border-radius: 6px;
         transition: all 0.3s ease;
     }

         .clear-btn:hover {
             transform: scale(1.05);
         }

     .file-items {
         max-height: 300px;
         overflow-y: auto;
         border: 1px solid #e9ecef;
         border-radius: 8px;
         background: white;
     }

     /* ==========================================
    檔案項目
    ========================================== */

     .file-item {
         display: flex;
         align-items: center;
         padding: 16px;
         border-bottom: 1px solid #f1f3f5;
         transition: all 0.3s ease;
         position: relative;
     }

         .file-item:last-child {
             border-bottom: none;
         }

         .file-item:hover {
             background: #f8f9fa;
         }

         .file-item.upload-success {
             background: linear-gradient(135deg, #d4edda, #c3e6cb);
             border-left: 4px solid #28a745;
         }

         .file-item.upload-error {
             background: linear-gradient(135deg, #f8d7da, #f1b6bb);
             border-left: 4px solid #dc3545;
         }

         .file-item.upload-uploading {
             background: linear-gradient(135deg, #fff3cd, #fdeaa7);
             border-left: 4px solid #ffc107;
         }

     /* 檔案圖標 */
     .file-icon {
         position: relative;
         width: 48px;
         height: 48px;
         margin-right: 16px;
         flex-shrink: 0;
         border-radius: 8px;
         overflow: hidden;
         background: #f8f9fa;
         display: flex;
         align-items: center;
         justify-content: center;
     }

     .file-thumbnail {
         width: 100%;
         height: 100%;
         object-fit: cover;
         border-radius: 6px;
     }

     .file-type-icon {
         width: 32px;
         height: 32px;
         object-fit: contain;
     }

     .file-status-overlay {
         position: absolute;
         top: -4px;
         right: -4px;
         background: white;
         border-radius: 50%;
         width: 20px;
         height: 20px;
         display: flex;
         align-items: center;
         justify-content: center;
         font-size: 0.8rem;
         box-shadow: 0 2px 4px rgba(0,0,0,0.2);
     }

     .spin {
         animation: spin 1s linear infinite;
     }

     @keyframes spin {
         from {
             transform: rotate(0deg);
         }

         to {
             transform: rotate(360deg);
         }
     }

     /* 檔案資訊 */
     .file-info {
         flex: 1;
         min-width: 0;
         margin-right: 12px;
     }

     .file-name {
         font-weight: 600;
         color: #212529;
         margin-bottom: 4px;
         overflow: hidden;
         text-overflow: ellipsis;
         white-space: nowrap;
     }

     .file-details {
         display: flex;
         gap: 12px;
         margin-bottom: 8px;
     }

     .file-size {
         color: #6c757d;
         font-size: 0.875rem;
     }

     .file-type {
         color: #6c757d;
         font-size: 0.875rem;
         font-style: italic;
     }

     /* 上傳進度 */
     .upload-progress {
         margin-top: 8px;
     }

         .upload-progress .progress {
             height: 6px;
             background-color: #e9ecef;
             border-radius: 3px;
             margin-bottom: 4px;
             overflow: hidden;
         }

         .upload-progress .progress-bar {
             transition: width 0.3s ease;
             border-radius: 3px;
         }

     .progress-info {
         display: flex;
         justify-content: space-between;
         align-items: center;
     }

     .progress-text {
         font-size: 0.75rem;
         font-weight: 600;
         color: #495057;
     }

     .upload-speed {
         font-size: 0.75rem;
         color: #6c757d;
     }

     /* 狀態訊息 */
     .error-message,
     .success-message {
         margin-top: 4px;
     }

     /* 檔案操作 */
     .file-actions {
         display: flex;
         gap: 6px;
         flex-shrink: 0;
     }

     .remove-btn,
     .retry-btn {
         width: 32px;
         height: 32px;
         padding: 0;
         border-radius: 50%;
         display: flex;
         align-items: center;
         justify-content: center;
         transition: all 0.3s ease;
     }

         .remove-btn:hover,
         .retry-btn:hover {
             transform: scale(1.1);
         }

     /* ==========================================
    新增更多檔案
    ========================================== */

     .add-more-files {
         text-align: center;
         padding: 16px;
         border-top: 1px dashed #dee2e6;
         margin-top: 8px;
     }

     /* ==========================================
    上傳設定
    ========================================== */

     .upload-settings {
         margin-top: 20px;
         padding: 16px;
         background: #f8f9fa;
         border-radius: 8px;
         border: 1px solid #e9ecef;
     }

     .settings-row {
         display: flex;
         gap: 24px;
     }

     .setting-item {
         display: flex;
         align-items: center;
     }

     .form-check-label {
         margin: 0;
         cursor: pointer;
         font-weight: 500;
         color: #495057;
         display: flex;
         align-items: center;
     }

     /* ==========================================
    整體進度
    ========================================== */

     .overall-progress {
         margin-top: 24px;
         padding: 20px;
         background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
         border-radius: 12px;
         border: 1px solid #bbdefb;
     }

     .progress-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         margin-bottom: 12px;
     }

     .progress-label {
         font-weight: 600;
         color: #1976d2;
     }

     .progress-percentage {
         font-size: 1.25rem;
         font-weight: 700;
         color: #1976d2;
     }

     .overall-progress-bar {
         height: 12px;
         background-color: rgba(255, 255, 255, 0.5);
         border-radius: 6px;
         margin-bottom: 8px;
         overflow: hidden;
     }

         .overall-progress-bar .progress-bar {
             height: 100%;
             border-radius: 6px;
             transition: width 0.5s ease;
         }

     .upload-stats {
         text-align: center;
     }

     /* ==========================================
    模態框底部
    ========================================== */

     .modal-footer {
         display: flex;
         justify-content: flex-end;
         gap: 12px;
         padding: 20px 28px;
         background: #f8f9fa;
         border-top: 1px solid #dee2e6;
     }

         .modal-footer .btn {
             padding: 10px 20px;
             font-weight: 600;
             border-radius: 8px;
             transition: all 0.3s ease;
             border: none;
         }

     .upload-btn {
         background: linear-gradient(135deg, #28a745, #20c997);
         color: white;
         box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
     }

         .upload-btn:hover:not(:disabled) {
             transform: translateY(-2px);
             box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
         }

     .cancel-upload-btn {
         background: linear-gradient(135deg, #dc3545, #c82333);
         color: white;
     }

     .close-btn {
         background: linear-gradient(135deg, #28a745, #20c997);
         color: white;
     }

     .btn:disabled {
         opacity: 0.6;
         cursor: not-allowed;
         transform: none !important;
     }

     /* ==========================================
    響應式設計
    ========================================== */

     /* 平板設備 (768px 以下) */
     @media (max-width: 768px) {
         .modal-content {
             width: 95%;
             max-height: 95vh;
             margin: 20px;
         }

         .modal-header {
             padding: 20px 24px;
         }

         .modal-title {
             font-size: 1.1rem;
         }

         .modal-body {
             padding: 24px 20px;
         }

         .upload-area {
             padding: 30px 16px;
         }

         .upload-icon i {
             font-size: 3rem;
         }

         .upload-title {
             font-size: 1.25rem;
         }

         .select-files-btn {
             padding: 10px 24px;
             font-size: 1rem;
         }

         .file-item {
             padding: 12px;
         }

         .file-icon {
             width: 40px;
             height: 40px;
             margin-right: 12px;
         }

         .file-type-icon {
             width: 28px;
             height: 28px;
         }

         .settings-row {
             flex-direction: column;
             gap: 12px;
         }

         .modal-footer {
             padding: 16px 20px;
             flex-wrap: wrap;
         }

             .modal-footer .btn {
                 flex: 1;
                 min-width: 120px;
             }
     }

     /* 手機設備 (576px 以下) */
     @media (max-width: 576px) {
         .modal-content {
             width: 100%;
             height: 100%;
             max-height: 100vh;
             border-radius: 0;
             margin: 0;
         }

         .modal-header {
             padding: 16px 20px;
         }

         .modal-title {
             font-size: 1rem;
         }

         .modal-body {
             padding: 20px 16px;
         }

         .upload-area {
             padding: 24px 12px;
         }

         .upload-icon i {
             font-size: 2.5rem;
         }

         .upload-title {
             font-size: 1.1rem;
         }

         .upload-description {
             font-size: 0.9rem;
         }

         .select-files-btn {
             width: 100%;
             padding: 12px;
         }

         .file-items {
             max-height: 250px;
         }

         .file-item {
             padding: 10px;
             flex-direction: column;
             align-items: flex-start;
             gap: 8px;
         }

         .file-icon {
             width: 36px;
             height: 36px;
             margin-right: 0;
             align-self: flex-start;
         }

         .file-info {
             width: 100%;
             margin-right: 0;
         }

         .file-actions {
             align-self: flex-end;
         }

         .file-details {
             flex-direction: column;
             gap: 4px;
         }

         .overall-progress {
             padding: 16px;
         }

         .progress-header {
             flex-direction: column;
             gap: 8px;
             text-align: center;
         }

         .modal-footer {
             padding: 12px 16px;
         }

             .modal-footer .btn {
                 font-size: 0.9rem;
                 padding: 8px 16px;
             }
     }

     /* ==========================================
    深色主題支持
    ========================================== */

     @media (prefers-color-scheme: dark) {
         .theme-auto .modal-content {
             background: #1e1e1e;
             color: #ffffff;
         }

         .theme-auto .modal-footer {
             background: #2a2a2a;
             border-top-color: #444444;
         }

         .theme-auto .upload-area {
             background: #2a2a2a;
             border-color: #555555;
         }

             .theme-auto .upload-area.drag-over {
                 background: linear-gradient(135deg, #1a1a2e, #16213e);
                 border-color: #64b5f6;
             }

         .theme-auto .file-items {
             background: #2a2a2a;
             border-color: #444444;
         }

         .theme-auto .file-item {
             border-bottom-color: #333333;
         }

             .theme-auto .file-item:hover {
                 background: #333333;
             }

         .theme-auto .file-icon {
             background: #333333;
         }

         .theme-auto .upload-settings {
             background: #2a2a2a;
             border-color: #444444;
         }
     }

     .theme-dark .modal-content {
         background: #1e1e1e;
         color: #ffffff;
     }

     .theme-dark .modal-footer {
         background: #2a2a2a;
         border-top-color: #444444;
     }

     .theme-dark .upload-area {
         background: #2a2a2a;
         border-color: #555555;
     }

         .theme-dark .upload-area.drag-over {
             background: linear-gradient(135deg, #1a1a2e, #16213e);
             border-color: #64b5f6;
         }

         .theme-dark .upload-area.has-files {
             background: linear-gradient(135deg, #1a2e1a, #1e3a1e);
             border-color: #4caf50;
         }

     .theme-dark .upload-title {
         color: #ffffff;
     }

     .theme-dark .upload-description {
         color: #cccccc;
     }

     .theme-dark .file-items {
         background: #2a2a2a;
         border-color: #444444;
     }

     .theme-dark .file-item {
         border-bottom-color: #333333;
     }

         .theme-dark .file-item:hover {
             background: #333333;
         }

     .theme-dark .file-name {
         color: #ffffff;
     }

     .theme-dark .file-icon {
         background: #333333;
     }

     .theme-dark .upload-settings {
         background: #2a2a2a;
         border-color: #444444;
     }

     .theme-dark .form-check-label {
         color: #cccccc;
     }

     .theme-dark .overall-progress {
         background: linear-gradient(135deg, #1a1a2e, #16213e);
         border-color: #444444;
     }

     /* ==========================================
    動畫效果
    ========================================== */

     @keyframes fadeIn {
         from {
             opacity: 0;
         }

         to {
             opacity: 1;
         }
     }

     @keyframes slideUp {
         from {
             opacity: 0;
             transform: translateY(30px) scale(0.95);
         }

         to {
             opacity: 1;
             transform: translateY(0) scale(1);
         }
     }

     /* ==========================================
    可訪問性增強
    ========================================== */

     @media (prefers-reduced-motion: reduce) {
         .upload-modal,
         .modal-content,
         .upload-area,
         .file-item,
         .btn {
             animation: none;
             transition: none;
         }

             .upload-area.drag-over,
             .select-files-btn:hover,
             .btn:hover {
                 transform: none;
             }

         .animate-bounce {
             animation: none;
         }

         .spin {
             animation: none;
         }
     }

     /* 高對比度模式 */
     @media (prefers-contrast: high) {
         .upload-area {
             border-width: 4px;
         }

         .file-item {
             border-left-width: 6px;
         }

         .btn {
             border: 2px solid currentColor;
         }
     }

     /* 焦點可見性 */
     .btn:focus-visible,
     .form-check-input:focus-visible {
         outline: 3px solid #007bff;
         outline-offset: 2px;
     }

     .upload-area:focus-within {
         outline: 2px solid #007bff;
         outline-offset: 4px;
     }

     /* ==========================================
    滾動條樣式
    ========================================== */

     .modal-body::-webkit-scrollbar,
     .file-items::-webkit-scrollbar {
         width: 8px;
     }

     .modal-body::-webkit-scrollbar-track,
     .file-items::-webkit-scrollbar-track {
         background: #f1f1f1;
         border-radius: 4px;
     }

     .modal-body::-webkit-scrollbar-thumb,
     .file-items::-webkit-scrollbar-thumb {
         background: #c1c1c1;
         border-radius: 4px;
         transition: background 0.3s ease;
     }

         .modal-body::-webkit-scrollbar-thumb:hover,
         .file-items::-webkit-scrollbar-thumb:hover {
             background: #a1a1a1;
         }
</style>