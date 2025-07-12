<template>
    <div class="file-grid">
        <div class="grid-container">
            <div v-for="file in files"
                 :key="file.id"
                 class="file-item"
                 :class="{
          'selected': isFileSelected(file),
          'is-image': isImage(file.originalName || file.fileName),
          'loading': file.isLoading
        }"
                 @click="handleFileClick(file, $event)"
                 @dblclick="handleFileDoubleClick(file)"
                 @contextmenu="handleFileContextMenu(file, $event)">
                <!-- 選擇框 -->
                <div class="file-checkbox" v-if="!file.isLoading">
                    <input type="checkbox"
                           :checked="isFileSelected(file)"
                           @click.stop="handleFileSelect(file)"
                           @change="handleFileSelect(file)"
                           class="form-check-input">
                </div>

                <!-- 檔案縮圖/圖標 -->
                <div class="file-thumbnail">
                    <!-- 載入狀態 -->
                    <div v-if="file.isLoading" class="thumbnail-loading">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                            <span class="visually-hidden">載入中...</span>
                        </div>
                    </div>

                    <!-- 圖片檔案縮圖 -->
                    <img v-else-if="isImage(file.originalName || file.fileName)"
                         :src="getThumbnailUrl(file)"
                         :alt="file.originalName || file.fileName"
                         class="thumbnail-image"
                         @load="handleImageLoad"
                         @error="handleImageError"
                         loading="lazy">

                    <!-- 非圖片檔案圖標 -->
                    <div v-else class="file-icon-container">
                        <img :src="getFileIcon(file.originalName || file.fileName)"
                             :alt="getFileTypeName(file.originalName || file.fileName)"
                             class="file-icon">

                        <!-- 檔案大小標籤 -->
                        <div class="file-size-badge">
                            {{ formatFileSize(file.fileSize) }}
                        </div>
                    </div>

                    <!-- 檔案狀態覆蓋層 -->
                    <div v-if="file.status" class="file-status-overlay">
                        <i v-if="file.status === 'uploading'" class="bi bi-cloud-upload text-primary"></i>
                        <i v-else-if="file.status === 'error'" class="bi bi-exclamation-triangle text-danger"></i>
                        <i v-else-if="file.status === 'success'" class="bi bi-check-circle text-success"></i>
                    </div>

                    <!-- 懸停操作按鈕 -->
                    <div class="file-actions" v-if="!file.isLoading">
                        <button class="btn btn-sm btn-light action-btn"
                                @click.stop="handleFilePreview(file)"
                                title="預覽">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-light action-btn"
                                @click.stop="handleFileDownload(file)"
                                title="下載">
                            <i class="bi bi-download"></i>
                        </button>
                        <button class="btn btn-sm btn-light action-btn"
                                @click.stop="handleFileMenu(file, $event)"
                                title="更多選項">
                            <i class="bi bi-three-dots"></i>
                        </button>
                    </div>
                </div>

                <!-- 檔案資訊 -->
                <div class="file-info">
                    <!-- 檔案名稱 -->
                    <div class="file-name" :title="file.originalName || file.fileName">
                        {{ formatFileName(file.originalName || file.fileName) }}
                    </div>

                    <!-- 檔案詳細資訊 -->
                    <div class="file-details">
                        <small class="text-muted">
                            <!-- 檔案大小 -->
                            <span v-if="isImage(file.originalName || file.fileName)">
                                {{ formatFileSize(file.fileSize) }}
                            </span>

                            <!-- 上傳日期 -->
                            <span class="upload-date">
                                {{ formatDate(file.uploadedAt, 'short') }}
                            </span>
                        </small>
                    </div>

                    <!-- 檔案類型標籤 -->
                    <div v-if="showFileTypeBadge(file)" class="file-type-badge">
                        {{ getFileTypeLabel(file.originalName || file.fileName) }}
                    </div>
                </div>

                <!-- 進度條 (上傳中) -->
                <div v-if="file.progress !== undefined && file.progress < 100" class="upload-progress">
                    <div class="progress">
                        <div class="progress-bar bg-primary"
                             role="progressbar"
                             :style="{ width: file.progress + '%' }"
                             :aria-valuenow="file.progress"
                             aria-valuemin="0"
                             aria-valuemax="100">
                            {{ file.progress }}%
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空狀態提示 -->
        <div v-if="files.length === 0" class="empty-grid">
            <div class="text-center py-5">
                <i class="bi bi-grid-3x3-gap empty-icon"></i>
                <h5 class="mt-3 text-muted">沒有檔案可顯示</h5>
                <p class="text-muted">上傳一些檔案來填滿您的網格視圖</p>
            </div>
        </div>
    </div>
</template>

<script>
module.exports = {
  props: {
    files: {
      type: Array,
      default: () => []
    },
    selectedFiles: {
      type: Array,
      default: () => []
    },
    showActions: {
      type: Boolean,
      default: true
    },
    enableMultiSelect: {
      type: Boolean,
      default: true
    },
    thumbnailSize: {
      type: Number,
      default: 150
    }
  },

  data() {
    return {
      imageLoadErrors: new Set(), // 記錄載入失敗的圖片
      lastClickTime: 0,
      lastClickedFile: null
    }
  },

  methods: {
    // ==========================================
    // 檔案操作事件
    // ==========================================

    handleFileClick(file, event) {
      // 防止過快的連續點擊
      const now = Date.now();
      if (now - this.lastClickTime < 200 && this.lastClickedFile === file) {
        return;
      }
      this.lastClickTime = now;
      this.lastClickedFile = file;

      // 如果按住 Ctrl/Cmd 鍵，進行多選
      if (this.enableMultiSelect && (event.ctrlKey || event.metaKey)) {
        this.handleFileSelect(file);
      }
      // 如果按住 Shift 鍵，進行範圍選擇
      else if (this.enableMultiSelect && event.shiftKey) {
        this.handleRangeSelect(file);
      }
      // 普通點擊
      else {
        this.handleSingleSelect(file);
      }
    },

    handleFileDoubleClick(file) {
      console.log('📂 雙擊檔案:', file.originalName);
      this.$emit('file-preview', file);
    },

    handleFileContextMenu(file, event) {
      event.preventDefault();
      console.log('📝 右鍵檔案:', file.originalName);
      this.$emit('file-context-menu', event, file);
    },

    handleFileSelect(file) {
      const isSelected = this.isFileSelected(file);
      console.log('✅ 選擇檔案:', file.originalName, '→', !isSelected);
      this.$emit('file-select', file, !isSelected);
    },

    handleSingleSelect(file) {
      // 如果檔案未選中，清除其他選擇並選中此檔案
      if (!this.isFileSelected(file)) {
        // 先清除所有選擇
        this.selectedFiles.forEach(selectedFile => {
          this.$emit('file-select', selectedFile, false);
        });
        // 再選中當前檔案
        this.$emit('file-select', file, true);
      }
    },

    handleRangeSelect(file) {
      if (this.selectedFiles.length === 0) {
        this.handleFileSelect(file);
        return;
      }

      // 找到最後一個選中檔案的索引
      const lastSelectedFile = this.selectedFiles[this.selectedFiles.length - 1];
      const lastIndex = this.files.findIndex(f => f.id === lastSelectedFile.id);
      const currentIndex = this.files.findIndex(f => f.id === file.id);

      if (lastIndex === -1 || currentIndex === -1) {
        this.handleFileSelect(file);
        return;
      }

      // 計算選擇範圍
      const startIndex = Math.min(lastIndex, currentIndex);
      const endIndex = Math.max(lastIndex, currentIndex);

      // 選中範圍內的所有檔案
      for (let i = startIndex; i <= endIndex; i++) {
        const fileToSelect = this.files[i];
        if (!this.isFileSelected(fileToSelect)) {
          this.$emit('file-select', fileToSelect, true);
        }
      }
    },

    handleFilePreview(file) {
      console.log('👁️ 預覽檔案:', file.originalName);
      this.$emit('file-preview', file);
    },

    handleFileDownload(file) {
      console.log('💾 下載檔案:', file.originalName);
      this.$emit('file-download', file);
    },

    handleFileMenu(file, event) {
      console.log('📋 檔案選單:', file.originalName);
      this.$emit('file-context-menu', event, file);
    },

    // ==========================================
    // 圖片載入處理
    // ==========================================

    handleImageLoad(event) {
      // 圖片載入成功
      const img = event.target;
      img.classList.add('loaded');
    },

    handleImageError(event) {
      // 圖片載入失敗，記錄並使用備用圖標
      const img = event.target;
      const src = img.getAttribute('src');
      this.imageLoadErrors.add(src);

      console.warn('⚠️ 圖片載入失敗:', src);

      // 隱藏失敗的圖片，顯示檔案圖標
      img.style.display = 'none';
    },

    // ==========================================
    // 工具方法
    // ==========================================

    isFileSelected(file) {
      return this.selectedFiles.some(f => f.id === file.id);
    },

    isImage(filename) {
      return FileUtils.isImage(filename);
    },

    getThumbnailUrl(file) {
      // 如果有縮圖 URL，使用縮圖
      if (file.thumbnailUrl) {
        return file.thumbnailUrl;
      }

      // 如果是圖片且有檔案 URL，使用檔案 URL
      if (this.isImage(file.originalName || file.fileName) && file.fileUrl) {
        return file.fileUrl;
      }

      // 使用預覽服務生成縮圖 URL
      if (file.id) {
        return FileUtils.buildThumbnailUrl(file.id) + `?size=${this.thumbnailSize}`;
      }

      // 返回預設圖標
      return this.getFileIcon(file.originalName || file.fileName);
    },

    getFileIcon(filename) {
      const iconName = FileUtils.getFileIcon(filename);
      return FileUtils.buildIconPath(iconName);
    },

    getFileTypeName(filename) {
      const typeInfo = FileUtils.getFileTypeInfo(filename);
      return typeInfo.category || 'file';
    },

    getFileTypeLabel(filename) {
      const extension = FileUtils.getFileExtension(filename);
      return extension.toUpperCase();
    },

    formatFileName(filename, maxLength = 25) {
      return FormatUtils.formatFileName(filename, maxLength);
    },

    formatFileSize(bytes) {
      return FileUtils.formatFileSize(bytes);
    },

    formatDate(dateString, format = 'short') {
      return FormatUtils.formatDate(dateString, format);
    },

    showFileTypeBadge(file) {
      // 對於非圖片檔案顯示類型標籤
      return !this.isImage(file.originalName || file.fileName);
    }
  }
}
</script>

<style scoped>
     /* ==========================================
    網格容器
    ========================================== */

     .file-grid {
         width: 100%;
         height: 100%;
     }

     .grid-container {
         display: grid;
         grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
         gap: 20px;
         padding: 10px;
         min-height: 200px;
     }

     /* ==========================================
    檔案項目
    ========================================== */

     .file-item {
         position: relative;
         display: flex;
         flex-direction: column;
         background: white;
         border-radius: 12px;
         padding: 15px;
         cursor: pointer;
         transition: all 0.3s ease;
         border: 2px solid transparent;
         box-shadow: 0 2px 8px rgba(0,0,0,0.08);
         user-select: none;
     }

         .file-item:hover {
             transform: translateY(-3px);
             box-shadow: 0 8px 25px rgba(0,0,0,0.15);
             border-color: #007bff;
         }

         .file-item.selected {
             border-color: #007bff;
             background: linear-gradient(135deg, #f8f9ff, #e3f2fd);
             box-shadow: 0 4px 20px rgba(0, 123, 255, 0.2);
         }

         .file-item.loading {
             opacity: 0.7;
             pointer-events: none;
         }

     /* ==========================================
    選擇框
    ========================================== */

     .file-checkbox {
         position: absolute;
         top: 10px;
         left: 10px;
         z-index: 10;
         opacity: 0;
         transition: opacity 0.3s ease;
     }

     .file-item:hover .file-checkbox,
     .file-item.selected .file-checkbox {
         opacity: 1;
     }

     .file-checkbox .form-check-input {
         width: 18px;
         height: 18px;
         border-radius: 4px;
         border: 2px solid #dee2e6;
         background-color: white;
         box-shadow: 0 2px 4px rgba(0,0,0,0.1);
     }

         .file-checkbox .form-check-input:checked {
             background-color: #007bff;
             border-color: #007bff;
         }

     /* ==========================================
    檔案縮圖/圖標
    ========================================== */

     .file-thumbnail {
         position: relative;
         width: 100%;
         height: 120px;
         display: flex;
         align-items: center;
         justify-content: center;
         margin-bottom: 12px;
         border-radius: 8px;
         overflow: hidden;
         background: #f8f9fa;
     }

     .thumbnail-loading {
         display: flex;
         align-items: center;
         justify-content: center;
         width: 100%;
         height: 100%;
         background: #f8f9fa;
     }

     .thumbnail-image {
         width: 100%;
         height: 100%;
         object-fit: cover;
         border-radius: 6px;
         transition: opacity 0.3s ease;
         opacity: 0;
     }

         .thumbnail-image.loaded {
             opacity: 1;
         }

     .file-icon-container {
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: center;
         width: 100%;
         height: 100%;
         position: relative;
     }

     .file-icon {
         width: 48px;
         height: 48px;
         object-fit: contain;
         opacity: 0.8;
     }

     .file-size-badge {
         position: absolute;
         bottom: 8px;
         right: 8px;
         background: rgba(0,0,0,0.7);
         color: white;
         padding: 2px 6px;
         border-radius: 10px;
         font-size: 0.7rem;
         font-weight: 500;
     }

     /* ==========================================
    檔案狀態覆蓋層
    ========================================== */

     .file-status-overlay {
         position: absolute;
         top: 8px;
         right: 8px;
         background: rgba(255,255,255,0.9);
         border-radius: 50%;
         width: 24px;
         height: 24px;
         display: flex;
         align-items: center;
         justify-content: center;
         font-size: 0.8rem;
     }

     /* ==========================================
    懸停操作按鈕
    ========================================== */

     .file-actions {
         position: absolute;
         top: 50%;
         left: 50%;
         transform: translate(-50%, -50%);
         display: flex;
         gap: 6px;
         opacity: 0;
         transition: opacity 0.3s ease;
         z-index: 5;
     }

     .file-item:hover .file-actions {
         opacity: 1;
     }

     .action-btn {
         width: 32px;
         height: 32px;
         padding: 0;
         border-radius: 50%;
         display: flex;
         align-items: center;
         justify-content: center;
         box-shadow: 0 2px 8px rgba(0,0,0,0.15);
         border: none;
         background: rgba(255,255,255,0.95);
         backdrop-filter: blur(4px);
         transition: all 0.3s ease;
     }

         .action-btn:hover {
             background: white;
             transform: scale(1.1);
             box-shadow: 0 4px 12px rgba(0,0,0,0.2);
         }

         .action-btn i {
             font-size: 0.9rem;
             color: #495057;
         }

     /* ==========================================
    檔案資訊
    ========================================== */

     .file-info {
         flex: 1;
         display: flex;
         flex-direction: column;
         gap: 4px;
         min-height: 0;
     }

     .file-name {
         font-weight: 600;
         font-size: 0.875rem;
         color: #212529;
         line-height: 1.3;
         overflow: hidden;
         display: -webkit-box;
         -webkit-line-clamp: 2;
         -webkit-box-orient: vertical;
         word-break: break-word;
     }

     .file-details {
         display: flex;
         flex-direction: column;
         gap: 2px;
     }

         .file-details small {
             font-size: 0.75rem;
             line-height: 1.2;
         }

     .upload-date {
         display: block;
         margin-top: 2px;
     }

     .file-type-badge {
         align-self: flex-start;
         background: linear-gradient(135deg, #6c757d, #495057);
         color: white;
         padding: 2px 6px;
         border-radius: 8px;
         font-size: 0.65rem;
         font-weight: 600;
         text-transform: uppercase;
         letter-spacing: 0.5px;
         margin-top: 4px;
     }

     /* ==========================================
    上傳進度
    ========================================== */

     .upload-progress {
         margin-top: 8px;
     }

         .upload-progress .progress {
             height: 4px;
             background-color: #e9ecef;
             border-radius: 2px;
             overflow: hidden;
         }

         .upload-progress .progress-bar {
             transition: width 0.3s ease;
             border-radius: 2px;
         }

     /* ==========================================
    空狀態
    ========================================== */

     .empty-grid {
         display: flex;
         align-items: center;
         justify-content: center;
         min-height: 300px;
         width: 100%;
         grid-column: 1 / -1;
     }

     .empty-icon {
         font-size: 3rem;
         color: #dee2e6;
         margin-bottom: 1rem;
     }

     /* ==========================================
    響應式設計
    ========================================== */

     /* 大螢幕 (1400px 以上) */
     @media (min-width: 1400px) {
         .grid-container {
             grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
             gap: 25px;
         }

         .file-thumbnail {
             height: 140px;
         }
     }

     /* 中等螢幕 (992px - 1399px) */
     @media (max-width: 1399px) and (min-width: 992px) {
         .grid-container {
             grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
             gap: 20px;
         }
     }

     /* 平板 (768px - 991px) */
     @media (max-width: 991px) and (min-width: 768px) {
         .grid-container {
             grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
             gap: 16px;
         }

         .file-thumbnail {
             height: 100px;
         }

         .file-item {
             padding: 12px;
         }
     }

     /* 手機橫屏 (576px - 767px) */
     @media (max-width: 767px) and (min-width: 576px) {
         .grid-container {
             grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
             gap: 12px;
             padding: 8px;
         }

         .file-thumbnail {
             height: 90px;
         }

         .file-item {
             padding: 10px;
         }

         .file-name {
             font-size: 0.8rem;
         }

         .action-btn {
             width: 28px;
             height: 28px;
         }
     }

     /* 手機直立 (575px 以下) */
     @media (max-width: 575px) {
         .grid-container {
             grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
             gap: 10px;
             padding: 6px;
         }

         .file-thumbnail {
             height: 80px;
         }

         .file-item {
             padding: 8px;
         }

         .file-name {
             font-size: 0.75rem;
         }

         .file-details small {
             font-size: 0.7rem;
         }

         .file-actions {
             gap: 4px;
         }

         .action-btn {
             width: 26px;
             height: 26px;
         }

             .action-btn i {
                 font-size: 0.8rem;
             }
     }

     /* ==========================================
    深色主題支持
    ========================================== */

     @media (prefers-color-scheme: dark) {
         .theme-auto .file-item {
             background: #1e1e1e;
             color: #ffffff;
         }

             .theme-auto .file-item.selected {
                 background: linear-gradient(135deg, #1a1a2e, #16213e);
             }

         .theme-auto .file-thumbnail {
             background: #2a2a2a;
         }

         .theme-auto .file-name {
             color: #ffffff;
         }

         .theme-auto .action-btn {
             background: rgba(30,30,30,0.95);
             color: #ffffff;
         }

             .theme-auto .action-btn i {
                 color: #ffffff;
             }
     }

     .theme-dark .file-item {
         background: #1e1e1e;
         color: #ffffff;
         border-color: #333;
     }

         .theme-dark .file-item.selected {
             background: linear-gradient(135deg, #1a1a2e, #16213e);
             border-color: #64b5f6;
         }

         .theme-dark .file-item:hover {
             border-color: #64b5f6;
         }

     .theme-dark .file-thumbnail {
         background: #2a2a2a;
     }

     .theme-dark .file-name {
         color: #ffffff;
     }

     .theme-dark .action-btn {
         background: rgba(30,30,30,0.95);
     }

         .theme-dark .action-btn i {
             color: #ffffff;
         }

     .theme-dark .upload-progress .progress {
         background-color: #333;
     }

     /* ==========================================
    可訪問性增強
    ========================================== */

     @media (prefers-reduced-motion: reduce) {
         .file-item {
             transition: none;
         }

             .file-item:hover {
                 transform: none;
             }

         .action-btn:hover {
             transform: none;
         }

         .thumbnail-image {
             transition: none;
         }
     }

     /* 高對比度模式 */
     @media (prefers-contrast: high) {
         .file-item {
             border-width: 3px;
         }

         .file-checkbox .form-check-input {
             border-width: 3px;
         }

         .action-btn {
             border: 2px solid currentColor;
         }
     }

     /* 焦點可見性 */
     .file-item:focus-visible {
         outline: 3px solid #007bff;
         outline-offset: 2px;
     }

     .action-btn:focus-visible {
         outline: 2px solid #007bff;
         outline-offset: 2px;
     }
</style>