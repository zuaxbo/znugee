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

