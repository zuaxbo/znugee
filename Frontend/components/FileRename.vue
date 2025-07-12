<template>
    <div class="rename-modal">
        <!-- 模態框背景 -->
        <div class="modal-backdrop" @click="closeModal"></div>

        <!-- 模態框內容 -->
        <div class="modal-content">
            <!-- 模態框頭部 -->
            <div class="modal-header">
                <h5 class="modal-title">
                    <i class="bi bi-pencil-square me-2"></i>
                    重命名檔案
                </h5>
                <button type="button" class="btn-close" @click="closeModal" title="關閉">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <!-- 模態框主體 -->
            <div class="modal-body">
                <!-- 檔案資訊 -->
                <div class="file-info-section">
                    <div class="current-file-info">
                        <div class="file-icon-wrapper">
                            <!-- 圖片檔案縮圖 -->
                            <img v-if="isImage(file.originalName || file.fileName)"
                                 :src="getThumbnailUrl()"
                                 :alt="file.originalName || file.fileName"
                                 class="file-thumbnail"
                                 @error="handleImageError">

                            <!-- 檔案類型圖標 -->
                            <img v-else
                                 :src="getFileIcon()"
                                 :alt="getFileTypeName()"
                                 class="file-type-icon">
                        </div>
                        <div class="file-details">
                            <div class="current-name">
                                <label class="form-label">目前檔案名稱：</label>
                                <span class="file-name-display">{{ file.originalName || file.fileName }}</span>
                            </div>
                            <div class="file-meta">
                                <small class="text-muted">
                                    {{ formatFileSize(file.fileSize) }} ·
                                    {{ formatDate(file.uploadedAt, 'short') }}
                                    <span v-if="file.uploadedBy"> · 由 {{ file.uploadedBy }} 上傳</span>
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 重命名表單 -->
                <form @submit.prevent="handleSubmit" class="rename-form">
                    <div class="form-group">
                        <label for="newFileName" class="form-label">
                            <i class="bi bi-pencil me-1"></i>
                            新檔案名稱：
                        </label>
                        <div class="input-group">
                            <input type="text"
                                   id="newFileName"
                                   ref="fileNameInput"
                                   v-model="newFileName"
                                   class="form-control"
                                   :class="{ 'is-invalid': hasError }"
                                   placeholder="請輸入新的檔案名稱"
                                   maxlength="255"
                                   @input="handleInput"
                                   @blur="validateFileName"
                                   @keyup.enter="handleSubmit"
                                   @keyup.escape="closeModal">
                            <span class="input-group-text file-extension">
                                {{ fileExtension }}
                            </span>
                        </div>

                        <!-- 驗證錯誤訊息 -->
                        <div v-if="hasError" class="invalid-feedback">
                            <i class="bi bi-exclamation-triangle me-1"></i>
                            {{ errorMessage }}
                        </div>

                        <!-- 幫助文字 -->
                        <div class="form-text">
                            <i class="bi bi-info-circle me-1"></i>
                            檔案名稱不能包含以下字元：&lt; &gt; : " / \ | ? *
                        </div>
                    </div>

                    <!-- 名稱建議 -->
                    <div v-if="nameSuggestions.length > 0" class="suggestions-section">
                        <label class="form-label">建議的檔案名稱：</label>
                        <div class="suggestions-list">
                            <button v-for="suggestion in nameSuggestions"
                                    :key="suggestion"
                                    type="button"
                                    class="btn btn-outline-secondary btn-sm suggestion-btn"
                                    @click="selectSuggestion(suggestion)">
                                {{ suggestion }}
                            </button>
                        </div>
                    </div>

                    <!-- 預覽區域 -->
                    <div class="preview-section">
                        <label class="form-label">預覽：</label>
                        <div class="name-preview">
                            <span class="preview-name" :class="{ 'text-success': isValid && newFileName.trim() }">
                                {{ previewFileName }}
                            </span>
                            <span class="preview-extension">{{ fileExtension }}</span>
                        </div>
                        <div v-if="isValid && newFileName.trim()" class="preview-success">
                            <i class="bi bi-check-circle text-success me-1"></i>
                            <small class="text-success">檔案名稱有效</small>
                        </div>
                    </div>

                    <!-- 選項設定 -->
                    <div class="options-section">
                        <div class="form-check">
                            <input class="form-check-input"
                                   type="checkbox"
                                   id="keepOriginalExtension"
                                   v-model="keepOriginalExtension">
                            <label class="form-check-label" for="keepOriginalExtension">
                                保持原始副檔名
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input"
                                   type="checkbox"
                                   id="createCopy"
                                   v-model="createCopy">
                            <label class="form-check-label" for="createCopy">
                                建立副本而非重命名原檔案
                            </label>
                        </div>
                    </div>
                </form>

                <!-- 載入狀態 -->
                <div v-if="isLoading" class="loading-overlay">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">處理中...</span>
                    </div>
                    <p class="loading-text">正在{{ createCopy ? '建立副本' : '重命名檔案' }}...</p>
                </div>
            </div>

            <!-- 模態框底部 -->
            <div class="modal-footer">
                <div class="footer-info">
                    <small class="text-muted">
                        <i class="bi bi-lightbulb me-1"></i>
                        提示：按 Enter 確認，按 ESC 取消
                    </small>
                </div>
                <div class="footer-actions">
                    <button type="button"
                            class="btn btn-secondary"
                            @click="closeModal"
                            :disabled="isLoading">
                        取消
                    </button>
                    <button type="button"
                            class="btn btn-primary"
                            @click="handleSubmit"
                            :disabled="!canSubmit"
                            :class="{ 'btn-success': createCopy }">
                        <i class="bi" :class="createCopy ? 'bi-files' : 'bi-check-lg'"></i>
                        {{ createCopy ? '建立副本' : '確認重命名' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
module.exports = {
  props: {
    file: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      // 表單數據
      newFileName: '',
      originalFileName: '',
      fileExtension: '',

      // 表單選項
      keepOriginalExtension: true,
      createCopy: false,

      // 驗證狀態
      hasError: false,
      errorMessage: '',
      isValid: false,

      // UI 狀態
      isLoading: false,
      nameSuggestions: [],

      // 驗證規則
      invalidChars: /[<>:"/\\|?*\x00-\x1f]/,
      reservedNames: /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
    }
  },

  computed: {
    previewFileName() {
      return this.newFileName.trim() || '(空白名稱)';
    },

    canSubmit() {
      return this.isValid &&
             this.newFileName.trim().length > 0 &&
             !this.isLoading &&
             this.newFileName.trim() !== this.originalFileName;
    },

    finalFileName() {
      const trimmedName = this.newFileName.trim();
      if (!trimmedName) return '';

      if (this.keepOriginalExtension) {
        return trimmedName + this.fileExtension;
      } else {
        // 如果用戶輸入了新的副檔名，使用用戶輸入的
        return trimmedName.includes('.') ? trimmedName : trimmedName + this.fileExtension;
      }
    }
  },

  mounted() {
    this.initializeForm();

    // 自動聚焦到輸入框
    this.$nextTick(() => {
      if (this.$refs.fileNameInput) {
        this.$refs.fileNameInput.focus();
        this.$refs.fileNameInput.select(); // 選中所有文字
      }
    });

    // 監聽鍵盤事件
    document.addEventListener('keydown', this.handleKeydown);

    console.log('✏️ 檔案重命名組件已掛載:', this.file);
  },

  beforeDestroy() {
    // 清理事件監聽器
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    // ==========================================
    // 初始化
    // ==========================================

    initializeForm() {
      const fileName = this.file.originalName || this.file.fileName || '';

      // 分離檔案名稱和副檔名
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        this.originalFileName = fileName.substring(0, lastDotIndex);
        this.fileExtension = fileName.substring(lastDotIndex); // 包含點
      } else {
        this.originalFileName = fileName;
        this.fileExtension = '';
      }

      // 設定初始值
      this.newFileName = this.originalFileName;

      // 生成名稱建議
      this.generateNameSuggestions();

      // 初始驗證
      this.validateFileName();
    },

    generateNameSuggestions() {
      const baseName = this.originalFileName;
      const suggestions = [];

      // 添加副本建議
      suggestions.push(`${baseName} - 副本`);
      suggestions.push(`${baseName} - 複製`);

      // 添加日期建議
      const today = new Date();
      const dateStr = today.toLocaleDateString('zh-TW').replace(/\//g, '-');
      suggestions.push(`${baseName} - ${dateStr}`);

      // 添加時間戳建議
      const timestamp = today.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/:/g, '');
      suggestions.push(`${baseName} - ${timestamp}`);

      this.nameSuggestions = suggestions;
    },

    // ==========================================
    // 表單處理
    // ==========================================

    handleInput() {
      // 實時驗證
      this.validateFileName();
    },

    validateFileName() {
      const trimmedName = this.newFileName.trim();

      // 重置錯誤狀態
      this.hasError = false;
      this.errorMessage = '';
      this.isValid = false;

      // 檢查是否為空
      if (!trimmedName) {
        this.hasError = true;
        this.errorMessage = '檔案名稱不能為空';
        return;
      }

      // 檢查長度
      if (trimmedName.length > 200) {
        this.hasError = true;
        this.errorMessage = '檔案名稱過長，最多200個字元';
        return;
      }

      // 檢查非法字元
      if (this.invalidChars.test(trimmedName)) {
        this.hasError = true;
        this.errorMessage = '檔案名稱包含非法字元';
        return;
      }

      // 檢查保留名稱
      if (this.reservedNames.test(trimmedName)) {
        this.hasError = true;
        this.errorMessage = '檔案名稱不能使用系統保留名稱';
        return;
      }

      // 檢查是否以點或空格結尾
      if (trimmedName.endsWith('.') || trimmedName.endsWith(' ')) {
        this.hasError = true;
        this.errorMessage = '檔案名稱不能以點號或空格結尾';
        return;
      }

      // 檢查是否與原名稱相同
      if (trimmedName === this.originalFileName && !this.createCopy) {
        this.hasError = true;
        this.errorMessage = '新檔案名稱與原名稱相同';
        return;
      }

      // 驗證通過
      this.isValid = true;
    },

    selectSuggestion(suggestion) {
      this.newFileName = suggestion;
      this.validateFileName();

      // 聚焦到輸入框
      this.$nextTick(() => {
        if (this.$refs.fileNameInput) {
          this.$refs.fileNameInput.focus();
        }
      });
    },

    // ==========================================
    // 提交處理
    // ==========================================

    async handleSubmit() {
      if (!this.canSubmit) return;

      // 最終驗證
      this.validateFileName();
      if (!this.isValid) return;

      this.isLoading = true;

      try {
        console.log('✏️ 提交重命名:', {
          originalName: this.file.originalName,
          newName: this.finalFileName,
          createCopy: this.createCopy
        });

        let result;

        if (this.createCopy) {
          // 建立副本
          result = await this.createFileCopy();
        } else {
          // 重命名檔案
          result = await FileService.renameFile(this.file.id, this.finalFileName);
        }

        if (result.success) {
          console.log('✅ 重命名成功:', result);

          this.$emit('rename-success', {
            ...result,
            originalFile: this.file,
            newName: this.finalFileName,
            isCreatedCopy: this.createCopy
          });

          this.closeModal();
        } else {
          this.showError(result.message || '操作失敗');
        }

      } catch (error) {
        console.error('❌ 重命名失敗:', error);
        this.showError('操作失敗，請稍後再試');
      } finally {
        this.isLoading = false;
      }
    },

    async createFileCopy() {
      // 這裡應該調用複製檔案的 API
      // 目前先模擬實現
      console.log('📄 建立檔案副本');

      // 模擬 API 調用
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: '檔案副本建立成功',
            file: {
              ...this.file,
              id: 'copy_' + this.file.id,
              originalName: this.finalFileName
            }
          });
        }, 1000);
      });
    },

    // ==========================================
    // 事件處理
    // ==========================================

    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.closeModal();
      } else if (event.key === 'Enter' && event.ctrlKey) {
        this.handleSubmit();
      }
    },

    handleImageError() {
      console.warn('⚠️ 縮圖載入失敗');
    },

    // ==========================================
    // UI 控制
    // ==========================================

    closeModal() {
      if (this.isLoading) {
        const confirmed = confirm('正在處理中，確定要關閉嗎？');
        if (!confirmed) return;
      }

      console.log('✏️ 關閉重命名對話框');
      this.$emit('close');
    },

    showError(message) {
      this.hasError = true;
      this.errorMessage = message;
      this.isValid = false;
    },

    // ==========================================
    // 工具方法
    // ==========================================

    isImage(filename) {
      return FileUtils.isImage(filename);
    },

    getThumbnailUrl() {
      if (this.file.thumbnailUrl) {
        return this.file.thumbnailUrl;
      }
      return FileUtils.buildThumbnailUrl(this.file.id) + '?size=48';
    },

    getFileIcon() {
      const iconName = FileUtils.getFileIcon(this.file.originalName || this.file.fileName);
      return FileUtils.buildIconPath(iconName);
    },

    getFileTypeName() {
      const typeInfo = FileUtils.getFileTypeInfo(this.file.originalName || this.file.fileName);
      return typeInfo.category || 'file';
    },

    formatFileSize(bytes) {
      return FileUtils.formatFileSize(bytes);
    },

    formatDate(dateString, format) {
      return FormatUtils.formatDate(dateString, format);
    }
  }
}
</script>

<style scoped>
     /* ==========================================
    主容器
    ========================================== */

     .rename-modal {
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
         border-radius: 12px;
         width: 90%;
         max-width: 500px;
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
         padding: 20px 24px;
         background: linear-gradient(135deg, #f8f9fa, #e9ecef);
         border-bottom: 1px solid #dee2e6;
     }

     .modal-title {
         margin: 0;
         font-size: 1.1rem;
         font-weight: 600;
         color: #495057;
         display: flex;
         align-items: center;
     }

     .btn-close {
         background: none;
         border: none;
         color: #6c757d;
         font-size: 1.1rem;
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
             background: rgba(108, 117, 125, 0.1);
             color: #495057;
             transform: scale(1.1);
         }

     /* ==========================================
    模態框主體
    ========================================== */

     .modal-body {
         padding: 24px;
         flex: 1;
         overflow-y: auto;
         max-height: calc(90vh - 160px);
         position: relative;
     }

     /* ==========================================
    檔案資訊區域
    ========================================== */

     .file-info-section {
         margin-bottom: 24px;
         padding: 16px;
         background: #f8f9fa;
         border-radius: 8px;
         border: 1px solid #e9ecef;
     }

     .current-file-info {
         display: flex;
         align-items: center;
         gap: 12px;
     }

     .file-icon-wrapper {
         width: 48px;
         height: 48px;
         display: flex;
         align-items: center;
         justify-content: center;
         background: white;
         border-radius: 8px;
         box-shadow: 0 2px 4px rgba(0,0,0,0.1);
         flex-shrink: 0;
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

     .file-details {
         flex: 1;
         min-width: 0;
     }

     .current-name {
         margin-bottom: 4px;
     }

         .current-name .form-label {
             font-size: 0.85rem;
             font-weight: 600;
             color: #6c757d;
             margin-bottom: 2px;
         }

     .file-name-display {
         font-weight: 500;
         color: #495057;
         display: block;
         overflow: hidden;
         text-overflow: ellipsis;
         white-space: nowrap;
     }

     .file-meta {
         margin-top: 4px;
     }

     /* ==========================================
    重命名表單
    ========================================== */

     .rename-form {
         display: flex;
         flex-direction: column;
         gap: 20px;
     }

     .form-group {
         margin-bottom: 0;
     }

     .form-label {
         font-weight: 600;
         color: #495057;
         margin-bottom: 8px;
         display: flex;
         align-items: center;
     }

     .input-group {
         position: relative;
     }

     .form-control {
         border-radius: 8px 0 0 8px;
         border-right: none;
         padding: 10px 12px;
         font-weight: 500;
         transition: all 0.3s ease;
     }

         .form-control:focus {
             border-color: #007bff;
             box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.15);
             transform: translateY(-1px);
         }

         .form-control.is-invalid {
             border-color: #dc3545;
             box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.15);
         }

     .file-extension {
         background: #e9ecef;
         border-color: #ced4da;
         color: #6c757d;
         font-weight: 600;
         border-radius: 0 8px 8px 0;
         min-width: 60px;
         justify-content: center;
     }

     .invalid-feedback {
         display: block;
         width: 100%;
         margin-top: 6px;
         font-size: 0.875rem;
         color: #dc3545;
         font-weight: 500;
     }

     .form-text {
         margin-top: 6px;
         font-size: 0.8rem;
         color: #6c757d;
     }

     /* ==========================================
    名稱建議區域
    ========================================== */

     .suggestions-section {
         padding: 16px;
         background: #fff3cd;
         border-radius: 8px;
         border: 1px solid #ffeaa7;
     }

         .suggestions-section .form-label {
             color: #856404;
             font-size: 0.9rem;
             margin-bottom: 10px;
         }

     .suggestions-list {
         display: flex;
         flex-wrap: wrap;
         gap: 6px;
     }

     .suggestion-btn {
         font-size: 0.8rem;
         padding: 4px 8px;
         border-radius: 12px;
         transition: all 0.3s ease;
         border-color: #ffc107;
         color: #856404;
     }

         .suggestion-btn:hover {
             background: #ffc107;
             border-color: #ffb300;
             color: #000;
             transform: translateY(-1px);
         }

     /* ==========================================
    預覽區域
    ========================================== */

     .preview-section {
         padding: 16px;
         background: #e3f2fd;
         border-radius: 8px;
         border: 1px solid #bbdefb;
     }

         .preview-section .form-label {
             color: #1976d2;
             font-size: 0.9rem;
             margin-bottom: 10px;
         }

     .name-preview {
         background: white;
         padding: 10px 12px;
         border-radius: 6px;
         border: 1px solid #90caf9;
         font-family: monospace;
         display: flex;
         align-items: center;
         margin-bottom: 8px;
     }

     .preview-name {
         color: #1976d2;
         font-weight: 600;
         flex: 1;
         overflow: hidden;
         text-overflow: ellipsis;
         white-space: nowrap;
     }

     .preview-extension {
         color: #666;
         font-weight: 500;
         margin-left: 4px;
     }

     .preview-success {
         display: flex;
         align-items: center;
     }

     /* ==========================================
    選項設定區域
    ========================================== */

     .options-section {
         padding: 16px;
         background: #f1f8e9;
         border-radius: 8px;
         border: 1px solid #c8e6c9;
         display: flex;
         flex-direction: column;
         gap: 10px;
     }

     .form-check {
         display: flex;
         align-items: center;
         margin-bottom: 0;
     }

     .form-check-input {
         margin-right: 8px;
         cursor: pointer;
     }

     .form-check-label {
         cursor: pointer;
         font-weight: 500;
         color: #2e7d32;
         margin-bottom: 0;
     }

     /* ==========================================
    載入覆蓋層
    ========================================== */

     .loading-overlay {
         position: absolute;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         background: rgba(255, 255, 255, 0.9);
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: center;
         gap: 16px;
         z-index: 10;
         border-radius: 8px;
     }

     .loading-text {
         font-weight: 500;
         color: #495057;
         margin: 0;
     }

     /* ==========================================
    模態框底部
    ========================================== */

     .modal-footer {
         display: flex;
         justify-content: space-between;
         align-items: center;
         padding: 16px 24px;
         background: #f8f9fa;
         border-top: 1px solid #dee2e6;
     }

     .footer-info {
         flex: 1;
     }

     .footer-actions {
         display: flex;
         gap: 8px;
     }

         .footer-actions .btn {
             padding: 8px 16px;
             font-weight: 500;
             border-radius: 6px;
             transition: all 0.3s ease;
             min-width: 100px;
         }

             .footer-actions .btn:hover {
                 transform: translateY(-1px);
                 box-shadow: 0 2px 4px rgba(0,0,0,0.1);
             }

             .footer-actions .btn:disabled {
                 opacity: 0.6;
                 cursor: not-allowed;
                 transform: none;
             }

         .footer-actions .btn-primary {
             background: linear-gradient(135deg, #007bff, #0056b3);
         }

         .footer-actions .btn-success {
             background: linear-gradient(135deg, #28a745, #1e7e34);
         }

     /* ==========================================
    響應式設計
    ========================================== */

     /* 平板設備 (768px 以下) */
     @media (max-width: 768px) {
         .modal-content {
             width: 95%;
             margin: 20px;
         }

         .modal-header {
             padding: 16px 20px;
         }

         .modal-title {
             font-size: 1rem;
         }

         .modal-body {
             padding: 20px;
         }

         .file-info-section {
             padding: 12px;
             margin-bottom: 20px;
         }

         .current-file-info {
             gap: 10px;
         }

         .file-icon-wrapper {
             width: 40px;
             height: 40px;
         }

         .file-type-icon {
             width: 28px;
             height: 28px;
         }

         .form-control {
             padding: 8px 10px;
             font-size: 0.9rem;
         }

         .file-extension {
             font-size: 0.85rem;
             min-width: 50px;
         }

         .suggestions-list {
             gap: 4px;
         }

         .suggestion-btn {
             font-size: 0.75rem;
             padding: 3px 6px;
         }

         .modal-footer {
             padding: 12px 20px;
             flex-direction: column;
             gap: 12px;
             align-items: stretch;
         }

         .footer-actions {
             width: 100%;
             justify-content: center;
         }

             .footer-actions .btn {
                 flex: 1;
                 max-width: 140px;
                 font-size: 0.9rem;
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
             padding: 12px 16px;
         }

         .modal-title {
             font-size: 0.95rem;
         }

         .btn-close {
             width: 32px;
             height: 32px;
             font-size: 1rem;
         }

         .modal-body {
             padding: 16px;
         }

         .file-info-section {
             padding: 10px;
             margin-bottom: 16px;
         }

         .current-file-info {
             flex-direction: column;
             text-align: center;
             gap: 8px;
         }

         .file-icon-wrapper {
             width: 36px;
             height: 36px;
             align-self: center;
         }

         .file-type-icon {
             width: 24px;
             height: 24px;
         }

         .file-details {
             width: 100%;
         }

         .file-name-display {
             text-align: center;
             white-space: normal;
             word-break: break-word;
         }

         .rename-form {
             gap: 16px;
         }

         .form-label {
             font-size: 0.85rem;
         }

         .form-control {
             font-size: 0.85rem;
             padding: 8px 10px;
         }

         .file-extension {
             font-size: 0.8rem;
             min-width: 45px;
         }

         .suggestions-section,
         .preview-section,
         .options-section {
             padding: 12px;
         }

         .suggestions-list {
             justify-content: center;
         }

         .suggestion-btn {
             font-size: 0.7rem;
             padding: 3px 6px;
         }

         .name-preview {
             padding: 8px 10px;
             font-size: 0.85rem;
         }

         .form-check {
             justify-content: center;
         }

         .form-check-label {
             font-size: 0.85rem;
         }

         .modal-footer {
             padding: 10px 16px;
         }

         .footer-info {
             text-align: center;
         }

             .footer-info small {
                 font-size: 0.75rem;
             }

         .footer-actions .btn {
             font-size: 0.85rem;
             padding: 6px 12px;
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

         .theme-auto .modal-header {
             background: linear-gradient(135deg, #2a2a2a, #333333);
             border-bottom-color: #444444;
         }

         .theme-auto .modal-footer {
             background: #2a2a2a;
             border-top-color: #444444;
         }

         .theme-auto .file-info-section {
             background: #2a2a2a;
             border-color: #444444;
         }

         .theme-auto .file-icon-wrapper {
             background: #333333;
         }

         .theme-auto .form-control {
             background: #2a2a2a;
             border-color: #444444;
             color: #ffffff;
         }

         .theme-auto .file-extension {
             background: #333333;
             border-color: #444444;
             color: #cccccc;
         }

         .theme-auto .suggestions-section {
             background: #2a2520;
             border-color: #4a4520;
         }

         .theme-auto .preview-section {
             background: #1a2332;
             border-color: #344152;
         }

         .theme-auto .options-section {
             background: #1e2a1e;
             border-color: #2e4a2e;
         }

         .theme-auto .name-preview {
             background: #2a2a2a;
             border-color: #444444;
         }
     }

     .theme-dark .modal-content {
         background: #1e1e1e;
         color: #ffffff;
     }

     .theme-dark .modal-header {
         background: linear-gradient(135deg, #2a2a2a, #333333);
         border-bottom-color: #444444;
     }

     .theme-dark .modal-title {
         color: #ffffff;
     }

     .theme-dark .btn-close {
         color: #cccccc;
     }

         .theme-dark .btn-close:hover {
             background: rgba(255, 255, 255, 0.1);
             color: #ffffff;
         }

     .theme-dark .modal-footer {
         background: #2a2a2a;
         border-top-color: #444444;
     }

     .theme-dark .file-info-section {
         background: #2a2a2a;
         border-color: #444444;
     }

     .theme-dark .file-name-display {
         color: #ffffff;
     }

     .theme-dark .file-icon-wrapper {
         background: #333333;
     }

     .theme-dark .form-label {
         color: #ffffff;
     }

     .theme-dark .form-control {
         background: #2a2a2a;
         border-color: #444444;
         color: #ffffff;
     }

         .theme-dark .form-control:focus {
             border-color: #64b5f6;
             box-shadow: 0 0 0 0.2rem rgba(100, 181, 246, 0.15);
         }

     .theme-dark .file-extension {
         background: #333333;
         border-color: #444444;
         color: #cccccc;
     }

     .theme-dark .suggestions-section {
         background: #2a2520;
         border-color: #4a4520;
     }

         .theme-dark .suggestions-section .form-label {
             color: #ffc107;
         }

     .theme-dark .suggestion-btn {
         border-color: #ffc107;
         color: #ffc107;
     }

     .theme-dark .preview-section {
         background: #1a2332;
         border-color: #344152;
     }

         .theme-dark .preview-section .form-label {
             color: #64b5f6;
         }

     .theme-dark .options-section {
         background: #1e2a1e;
         border-color: #2e4a2e;
     }

     .theme-dark .form-check-label {
         color: #4caf50;
     }

     .theme-dark .name-preview {
         background: #2a2a2a;
         border-color: #444444;
     }

     .theme-dark .preview-name {
         color: #64b5f6;
     }

     .theme-dark .loading-overlay {
         background: rgba(30, 30, 30, 0.9);
     }

     .theme-dark .loading-text {
         color: #ffffff;
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
         .rename-modal,
         .modal-content,
         .btn,
         .form-control {
             animation: none;
             transition: none;
         }

             .btn:hover,
             .form-control:focus {
                 transform: none;
             }
     }

     /* 高對比度模式 */
     @media (prefers-contrast: high) {
         .modal-content {
             border: 2px solid currentColor;
         }

         .modal-header,
         .modal-footer {
             border-width: 2px;
         }

         .form-control,
         .file-extension {
             border-width: 2px;
         }

         .btn {
             border-width: 2px;
         }
     }

     /* 焦點可見性 */
     .btn:focus-visible,
     .btn-close:focus-visible,
     .form-control:focus-visible,
     .form-check-input:focus-visible {
         outline: 3px solid #007bff;
         outline-offset: 2px;
     }

     .suggestion-btn:focus-visible {
         outline: 2px solid #ffc107;
         outline-offset: 2px;
     }

     /* ==========================================
    滾動條樣式
    ========================================== */

     .modal-body::-webkit-scrollbar {
         width: 8px;
     }

     .modal-body::-webkit-scrollbar-track {
         background: #f1f1f1;
         border-radius: 4px;
     }

     .modal-body::-webkit-scrollbar-thumb {
         background: #c1c1c1;
         border-radius: 4px;
         transition: background 0.3s ease;
     }

         .modal-body::-webkit-scrollbar-thumb:hover {
             background: #a1a1a1;
         }

     /* Firefox 滾動條樣式 */
     .modal-body {
         scrollbar-width: thin;
         scrollbar-color: #c1c1c1 #f1f1f1;
     }
</style>