<template>
    <div class="file-list">
        <!-- 表格頭部 -->
        <div class="list-header">
            <div class="header-row">
                <!-- 全選框 -->
                <div class="header-cell select-cell" v-if="enableMultiSelect">
                    <input type="checkbox"
                           class="form-check-input"
                           :checked="isAllSelected"
                           :indeterminate.prop="isPartialSelected"
                           @change="handleSelectAll"
                           title="全選/取消全選">
                </div>

                <!-- 檔案名稱 -->
                <div class="header-cell name-cell sortable" @click="handleSort('name')">
                    <span class="header-label">
                        <i class="bi bi-file-earmark me-2"></i>
                        檔案名稱
                    </span>
                    <i class="sort-icon" :class="getSortIconClass('name')"></i>
                </div>

                <!-- 檔案大小 -->
                <div class="header-cell size-cell sortable" @click="handleSort('size')">
                    <span class="header-label">
                        <i class="bi bi-hdd me-2"></i>
                        大小
                    </span>
                    <i class="sort-icon" :class="getSortIconClass('size')"></i>
                </div>

                <!-- 檔案類型 -->
                <div class="header-cell type-cell sortable" @click="handleSort('type')">
                    <span class="header-label">
                        <i class="bi bi-tags me-2"></i>
                        類型
                    </span>
                    <i class="sort-icon" :class="getSortIconClass('type')"></i>
                </div>

                <!-- 上傳日期 -->
                <div class="header-cell date-cell sortable" @click="handleSort('uploadedAt')">
                    <span class="header-label">
                        <i class="bi bi-calendar me-2"></i>
                        上傳日期
                    </span>
                    <i class="sort-icon" :class="getSortIconClass('uploadedAt')"></i>
                </div>

                <!-- 上傳者 -->
                <div class="header-cell uploader-cell">
                    <span class="header-label">
                        <i class="bi bi-person me-2"></i>
                        上傳者
                    </span>
                </div>

                <!-- 操作 -->
                <div class="header-cell actions-cell" v-if="showActions">
                    <span class="header-label">
                        <i class="bi bi-gear me-2"></i>
                        操作
                    </span>
                </div>
            </div>
        </div>

        <!-- 表格內容 -->
        <div class="list-content" ref="listContent">
            <!-- 檔案行 -->
            <div v-for="file in files"
                 :key="file.id"
                 class="file-row"
                 :class="{
          'selected': isFileSelected(file),
          'loading': file.isLoading,
          'uploading': file.status === 'uploading'
        }"
                 @click="handleFileClick(file, $event)"
                 @dblclick="handleFileDoubleClick(file)"
                 @contextmenu="handleFileContextMenu(file, $event)">
                <!-- 選擇框 -->
                <div class="file-cell select-cell" v-if="enableMultiSelect">
                    <input type="checkbox"
                           class="form-check-input"
                           :checked="isFileSelected(file)"
                           @click.stop="handleFileSelect(file)"
                           @change="handleFileSelect(file)">
                </div>

                <!-- 檔案名稱和圖標 -->
                <div class="file-cell name-cell">
                    <div class="file-name-content">
                        <!-- 檔案圖標 -->
                        <div class="file-icon-wrapper">
                            <!-- 載入狀態 -->
                            <div v-if="file.isLoading" class="file-loading">
                                <div class="spinner-border spinner-border-sm text-primary" role="status">
                                    <span class="visually-hidden">載入中...</span>
                                </div>
                            </div>

                            <!-- 圖片縮圖 -->
                            <img v-else-if="isImage(file.originalName || file.fileName)"
                                 :src="getThumbnailUrl(file)"
                                 :alt="file.originalName || file.fileName"
                                 class="file-thumbnail"
                                 @error="handleImageError"
                                 loading="lazy">

                            <!-- 檔案圖標 -->
                            <img v-else
                                 :src="getFileIcon(file.originalName || file.fileName)"
                                 :alt="getFileTypeName(file.originalName || file.fileName)"
                                 class="file-type-icon">

                            <!-- 檔案狀態指示器 -->
                            <div v-if="file.status" class="file-status-indicator">
                                <i v-if="file.status === 'uploading'" class="bi bi-cloud-upload text-primary"></i>
                                <i v-else-if="file.status === 'error'" class="bi bi-exclamation-triangle text-danger"></i>
                                <i v-else-if="file.status === 'success'" class="bi bi-check-circle text-success"></i>
                            </div>
                        </div>

                        <!-- 檔案名稱和詳細資訊 -->
                        <div class="file-name-info">
                            <div class="file-name" :title="file.originalName || file.fileName">
                                {{ file.originalName || file.fileName }}
                            </div>

                            <!-- 上傳進度 -->
                            <div v-if="file.progress !== undefined && file.progress < 100" class="upload-progress">
                                <div class="progress">
                                    <div class="progress-bar bg-primary"
                                         role="progressbar"
                                         :style="{ width: file.progress + '%' }"
                                         :aria-valuenow="file.progress"
                                         aria-valuemin="0"
                                         aria-valuemax="100">
                                    </div>
                                </div>
                                <small class="progress-text">{{ file.progress }}% 已上傳</small>
                            </div>

                            <!-- 檔案路徑 (如果有) -->
                            <div v-if="file.path" class="file-path">
                                <small class="text-muted">{{ file.path }}</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 檔案大小 -->
                <div class="file-cell size-cell">
                    <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
                    <small v-if="isImage(file.originalName || file.fileName)" class="file-dimensions text-muted">
                        {{ getImageDimensions(file) }}
                    </small>
                </div>

                <!-- 檔案類型 -->
                <div class="file-cell type-cell">
                    <div class="file-type-info">
                        <span class="file-type-badge" :style="{ backgroundColor: getFileColor(file.originalName || file.fileName) }">
                            {{ getFileExtension(file.originalName || file.fileName) }}
                        </span>
                        <small class="file-type-name text-muted">
                            {{ getFileTypeDisplayName(file.originalName || file.fileName) }}
                        </small>
                    </div>
                </div>

                <!-- 上傳日期 -->
                <div class="file-cell date-cell">
                    <div class="date-info">
                        <span class="upload-date">{{ formatDate(file.uploadedAt, 'date') }}</span>
                        <small class="upload-time text-muted">{{ formatDate(file.uploadedAt, 'time') }}</small>
                    </div>
                </div>

                <!-- 上傳者 -->
                <div class="file-cell uploader-cell">
                    <div class="uploader-info">
                        <div class="uploader-avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="uploader-details">
                            <span class="uploader-name">{{ file.uploadedBy || '未知' }}</span>
                            <small class="uploader-role text-muted">{{ getUserRole(file.uploadedBy) }}</small>
                        </div>
                    </div>
                </div>

                <!-- 操作按鈕 -->
                <div class="file-cell actions-cell" v-if="showActions">
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary action-btn"
                                @click.stop="handleFilePreview(file)"
                                title="預覽"
                                :disabled="!canPreview(file)">
                            <i class="bi bi-eye"></i>
                        </button>

                        <button class="btn btn-sm btn-outline-success action-btn"
                                @click.stop="handleFileDownload(file)"
                                title="下載">
                            <i class="bi bi-download"></i>
                        </button>

                        <button class="btn btn-sm btn-outline-secondary action-btn"
                                @click.stop="handleFileMenu(file, $event)"
                                title="更多選項">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空狀態 -->
        <div v-if="files.length === 0" class="empty-list">
            <div class="text-center py-5">
                <i class="bi bi-list-ul empty-icon"></i>
                <h5 class="mt-3 text-muted">沒有檔案可顯示</h5>
                <p class="text-muted">上傳一些檔案來填滿您的列表視圖</p>
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
    sortBy: {
      type: String,
      default: 'uploadedAt'
    },
    sortDirection: {
      type: String,
      default: 'desc'
    },
    thumbnailSize: {
      type: Number,
      default: 40
    }
  },

  data() {
    return {
      imageLoadErrors: new Set(),
      lastClickTime: 0,
      lastClickedFile: null
    }
  },

  computed: {
    isAllSelected() {
      return this.files.length > 0 && this.selectedFiles.length === this.files.length;
    },

    isPartialSelected() {
      return this.selectedFiles.length > 0 && this.selectedFiles.length < this.files.length;
    }
  },

  methods: {
    // ==========================================
    // 排序處理
    // ==========================================

    handleSort(field) {
      let direction = 'asc';

      if (this.sortBy === field) {
        // 如果點擊的是當前排序欄位，切換方向
        direction = this.sortDirection === 'asc' ? 'desc' : 'asc';
      }

      console.log('📊 列表排序:', { field, direction });
      this.$emit('sort-change', { sortBy: field, sortDirection: direction });
    },

    getSortIconClass(field) {
      if (this.sortBy !== field) {
        return 'bi bi-arrow-down-up text-muted';
      }

      return this.sortDirection === 'asc'
        ? 'bi bi-arrow-up text-primary'
        : 'bi bi-arrow-down text-primary';
    },

    // ==========================================
    // 檔案選擇處理
    // ==========================================

    handleSelectAll() {
      const selectAll = !this.isAllSelected;
      console.log('✅ 全選檔案:', selectAll);

      this.files.forEach(file => {
        const isCurrentlySelected = this.isFileSelected(file);
        if (selectAll && !isCurrentlySelected) {
          this.$emit('file-select', file, true);
        } else if (!selectAll && isCurrentlySelected) {
          this.$emit('file-select', file, false);
        }
      });
    },

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

    // ==========================================
    // 檔案操作
    // ==========================================

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
    // 圖片處理
    // ==========================================

    handleImageError(event) {
      const img = event.target;
      const src = img.getAttribute('src');
      this.imageLoadErrors.add(src);

      console.warn('⚠️ 縮圖載入失敗:', src);

      // 隱藏失敗的圖片
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
      if (file.thumbnailUrl) {
        return file.thumbnailUrl;
      }

      if (file.id) {
        return FileUtils.buildThumbnailUrl(file.id) + `?size=${this.thumbnailSize}`;
      }

      return this.getFileIcon(file.originalName || file.fileName);
    },

    getFileIcon(filename) {
      const iconName = FileUtils.getFileIcon(filename);
      return FileUtils.buildIconPath(iconName);
    },

    getFileExtension(filename) {
      const ext = FileUtils.getFileExtension(filename);
      return ext ? ext.toUpperCase() : 'FILE';
    },

    getFileColor(filename) {
      return FileUtils.getFileColor(filename);
    },

    getFileTypeName(filename) {
      const typeInfo = FileUtils.getFileTypeInfo(filename);
      return typeInfo.category || 'file';
    },

    getFileTypeDisplayName(filename) {
      const extension = FileUtils.getFileExtension(filename);
      const typeMap = {
        'jpg': '圖片檔案', 'jpeg': '圖片檔案', 'png': '圖片檔案', 'gif': '圖片檔案',
        'pdf': 'PDF 文檔', 'doc': 'Word 文檔', 'docx': 'Word 文檔',
        'xls': 'Excel 表格', 'xlsx': 'Excel 表格',
        'ppt': 'PowerPoint', 'pptx': 'PowerPoint',
        'mp4': '影片檔案', 'avi': '影片檔案', 'mov': '影片檔案',
        'mp3': '音頻檔案', 'wav': '音頻檔案',
        'zip': '壓縮檔案', 'rar': '壓縮檔案',
        'txt': '文字檔案', 'js': 'JavaScript', 'css': '樣式表'
      };

      return typeMap[extension] || '檔案';
    },

    getImageDimensions(file) {
      if (file.width && file.height) {
        return `${file.width} × ${file.height}`;
      }
      return '';
    },

    getUserRole(username) {
      // 這裡可以根據實際需求返回用戶角色
      return '用戶';
    },

    canPreview(file) {
      return FileUtils.isPreviewSupported(file.originalName || file.fileName);
    },

    formatFileSize(bytes) {
      return FileUtils.formatFileSize(bytes);
    },

    formatDate(dateString, format = 'datetime') {
      return FormatUtils.formatDate(dateString, format);
    }
  }
}
</script>

<style scoped>
     /* ==========================================
    主容器
    ========================================== */

     .file-list {
         width: 100%;
         background: white;
         border-radius: 8px;
         overflow: hidden;
         box-shadow: 0 2px 8px rgba(0,0,0,0.08);
     }

     /* ==========================================
    表格頭部
    ========================================== */

     .list-header {
         background: linear-gradient(135deg, #f8f9fa, #e9ecef);
         border-bottom: 2px solid #dee2e6;
         position: sticky;
         top: 0;
         z-index: 10;
     }

     .header-row {
         display: grid;
         grid-template-columns: auto 1fr auto auto auto auto auto;
         align-items: center;
         padding: 0;
         min-height: 50px;
     }

     .header-cell {
         padding: 12px 16px;
         font-weight: 600;
         font-size: 0.875rem;
         color: #495057;
         border-right: 1px solid #dee2e6;
         display: flex;
         align-items: center;
         justify-content: space-between;
     }

         .header-cell:last-child {
             border-right: none;
         }

         .header-cell.sortable {
             cursor: pointer;
             transition: background-color 0.3s ease;
             user-select: none;
         }

             .header-cell.sortable:hover {
                 background-color: rgba(0,123,255,0.1);
             }

     .header-label {
         display: flex;
         align-items: center;
         gap: 4px;
     }

     .sort-icon {
         font-size: 0.8rem;
         transition: all 0.3s ease;
     }

     /* 列寬度設置 */
     .select-cell {
         width: 50px;
         justify-content: center;
     }

     .name-cell {
         min-width: 250px;
     }

     .size-cell {
         width: 120px;
     }

     .type-cell {
         width: 130px;
     }

     .date-cell {
         width: 150px;
     }

     .uploader-cell {
         width: 140px;
     }

     .actions-cell {
         width: 120px;
         justify-content: center;
     }

     /* ==========================================
    表格內容
    ========================================== */

     .list-content {
         max-height: calc(100vh - 300px);
         overflow-y: auto;
     }

     .file-row {
         display: grid;
         grid-template-columns: auto 1fr auto auto auto auto auto;
         align-items: center;
         border-bottom: 1px solid #f1f3f5;
         transition: all 0.3s ease;
         cursor: pointer;
         position: relative;
         min-height: 60px;
     }

         .file-row:hover {
             background-color: #f8f9ff;
             border-color: #e3f2fd;
         }

         .file-row.selected {
             background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
             border-color: #2196f3;
             box-shadow: inset 3px 0 0 #2196f3;
         }

         .file-row.loading {
             opacity: 0.6;
             pointer-events: none;
         }

         .file-row.uploading {
             background: linear-gradient(135deg, #fff3e0, #f3e5f5);
         }

     .file-cell {
         padding: 12px 16px;
         border-right: 1px solid #f1f3f5;
         overflow: hidden;
     }

         .file-cell:last-child {
             border-right: none;
         }

     /* ==========================================
    檔案名稱區域
    ========================================== */

     .file-name-content {
         display: flex;
         align-items: center;
         gap: 12px;
     }

     .file-icon-wrapper {
         position: relative;
         width: 40px;
         height: 40px;
         flex-shrink: 0;
         display: flex;
         align-items: center;
         justify-content: center;
         border-radius: 6px;
         background: #f8f9fa;
     }

     .file-loading {
         display: flex;
         align-items: center;
         justify-content: center;
         width: 100%;
         height: 100%;
     }

     .file-thumbnail {
         width: 100%;
         height: 100%;
         object-fit: cover;
         border-radius: 4px;
     }

     .file-type-icon {
         width: 24px;
         height: 24px;
         object-fit: contain;
     }

     .file-status-indicator {
         position: absolute;
         top: -2px;
         right: -2px;
         background: white;
         border-radius: 50%;
         width: 16px;
         height: 16px;
         display: flex;
         align-items: center;
         justify-content: center;
         font-size: 0.7rem;
         box-shadow: 0 1px 3px rgba(0,0,0,0.2);
     }

     .file-name-info {
         flex: 1;
         min-width: 0;
     }

     .file-name {
         font-weight: 500;
         color: #212529;
         margin-bottom: 2px;
         overflow: hidden;
         text-overflow: ellipsis;
         white-space: nowrap;
         max-width: 100%;
     }

     .upload-progress {
         margin-top: 4px;
     }

         .upload-progress .progress {
             height: 3px;
             background-color: #e9ecef;
             border-radius: 1.5px;
             margin-bottom: 2px;
         }

     .progress-text {
         font-size: 0.7rem;
         color: #6c757d;
     }

     .file-path {
         margin-top: 2px;
     }

     /* ==========================================
    檔案大小區域
    ========================================== */

     .file-size {
         font-weight: 500;
         color: #495057;
         display: block;
     }

     .file-dimensions {
         font-size: 0.75rem;
         margin-top: 2px;
         display: block;
     }

     /* ==========================================
    檔案類型區域
    ========================================== */

     .file-type-info {
         display: flex;
         flex-direction: column;
         gap: 4px;
     }

     .file-type-badge {
         display: inline-block;
         padding: 3px 8px;
         border-radius: 12px;
         font-size: 0.7rem;
         font-weight: 600;
         color: white;
         text-transform: uppercase;
         letter-spacing: 0.5px;
         align-self: flex-start;
     }

     .file-type-name {
         font-size: 0.75rem;
     }

     /* ==========================================
    日期區域
    ========================================== */

     .date-info {
         display: flex;
         flex-direction: column;
         gap: 2px;
     }

     .upload-date {
         font-weight: 500;
         color: #495057;
         font-size: 0.875rem;
     }

     .upload-time {
         font-size: 0.75rem;
     }

     /* ==========================================
    上傳者區域
    ========================================== */

     .uploader-info {
         display: flex;
         align-items: center;
         gap: 8px;
     }

     .uploader-avatar {
         width: 28px;
         height: 28px;
         display: flex;
         align-items: center;
         justify-content: center;
         background: linear-gradient(135deg, #6c757d, #495057);
         border-radius: 50%;
         color: white;
         font-size: 1rem;
     }

     .uploader-details {
         display: flex;
         flex-direction: column;
         min-width: 0;
     }

     .uploader-name {
         font-weight: 500;
         font-size: 0.875rem;
         color: #495057;
         overflow: hidden;
         text-overflow: ellipsis;
         white-space: nowrap;
     }

     .uploader-role {
         font-size: 0.75rem;
     }

     /* ==========================================
    操作按鈕區域
    ========================================== */

     .action-buttons {
         display: flex;
         gap: 6px;
         justify-content: center;
     }

     .action-btn {
         width: 28px;
         height: 28px;
         padding: 0;
         display: flex;
         align-items: center;
         justify-content: center;
         border-radius: 4px;
         transition: all 0.3s ease;
     }

         .action-btn:hover {
             transform: translateY(-1px);
             box-shadow: 0 2px 4px rgba(0,0,0,0.1);
         }

         .action-btn i {
             font-size: 0.8rem;
         }

         .action-btn:disabled {
             opacity: 0.5;
             cursor: not-allowed;
             transform: none;
         }

     /* ==========================================
    空狀態
    ========================================== */

     .empty-list {
         padding: 40px 20px;
         text-align: center;
     }

     .empty-icon {
         font-size: 3rem;
         color: #dee2e6;
         margin-bottom: 1rem;
     }

     /* ==========================================
    響應式設計
    ========================================== */

     /* 平板設備 (1024px 以下) */
     @media (max-width: 1024px) {
         .header-row,
         .file-row {
             grid-template-columns: auto 1fr auto auto auto auto;
         }

         .uploader-cell {
             display: none;
         }

         .type-cell {
             width: 110px;
         }

         .date-cell {
             width: 130px;
         }
     }

     /* 平板設備 (768px 以下) */
     @media (max-width: 768px) {
         .header-row,
         .file-row {
             grid-template-columns: auto 1fr auto auto auto;
         }

         .type-cell {
             display: none;
         }

         .size-cell {
             width: 100px;
         }

         .date-cell {
             width: 120px;
         }

         .actions-cell {
             width: 100px;
         }

         .header-cell {
             padding: 10px 12px;
             font-size: 0.8rem;
         }

         .file-cell {
             padding: 10px 12px;
         }

         .file-name {
             font-size: 0.875rem;
         }
     }

     /* 手機設備 (576px 以下) */
     @media (max-width: 576px) {
         .header-row,
         .file-row {
             grid-template-columns: auto 1fr auto auto;
         }

         .date-cell {
             display: none;
         }

         .size-cell {
             width: 80px;
         }

         .actions-cell {
             width: 80px;
         }

         .header-cell {
             padding: 8px 10px;
             font-size: 0.75rem;
         }

         .file-cell {
             padding: 8px 10px;
         }

         .file-icon-wrapper {
             width: 32px;
             height: 32px;
         }

         .file-type-icon {
             width: 20px;
             height: 20px;
         }

         .file-name {
             font-size: 0.8rem;
         }

         .file-size {
             font-size: 0.8rem;
         }

         .action-btn {
             width: 24px;
             height: 24px;
         }

             .action-btn i {
                 font-size: 0.7rem;
             }

         .file-type-badge {
             font-size: 0.6rem;
             padding: 2px 6px;
         }
     }

     /* 超小螢幕 (480px 以下) */
     @media (max-width: 480px) {
         .header-row,
         .file-row {
             grid-template-columns: 1fr auto auto;
         }

         .select-cell {
             display: none;
         }

         .size-cell {
             width: 70px;
         }

         .actions-cell {
             width: 60px;
         }

         .action-buttons {
             flex-direction: column;
             gap: 4px;
         }

         .action-btn {
             width: 20px;
             height: 20px;
         }

             .action-btn i {
                 font-size: 0.6rem;
             }

         .file-name-content {
             gap: 8px;
         }

         .file-icon-wrapper {
             width: 28px;
             height: 28px;
         }

         .file-type-icon {
             width: 16px;
             height: 16px;
         }
     }

     /* ==========================================
    深色主題支持
    ========================================== */

     @media (prefers-color-scheme: dark) {
         .theme-auto .file-list {
             background: #1e1e1e;
             color: #ffffff;
         }

         .theme-auto .list-header {
             background: linear-gradient(135deg, #2a2a2a, #333333);
             border-bottom-color: #444444;
         }

         .theme-auto .header-cell {
             color: #ffffff;
             border-right-color: #444444;
         }

             .theme-auto .header-cell.sortable:hover {
                 background-color: rgba(100, 181, 246, 0.1);
             }

         .theme-auto .file-row {
             border-bottom-color: #333333;
         }

             .theme-auto .file-row:hover {
                 background-color: #2a2a2a;
                 border-color: #444444;
             }

             .theme-auto .file-row.selected {
                 background: linear-gradient(135deg, #1a1a2e, #16213e);
                 border-color: #64b5f6;
             }

         .theme-auto .file-cell {
             border-right-color: #333333;
         }

         .theme-auto .file-name {
             color: #ffffff;
         }

         .theme-auto .file-icon-wrapper {
             background: #333333;
         }

         .theme-auto .uploader-avatar {
             background: linear-gradient(135deg, #555555, #444444);
         }
     }

     .theme-dark .file-list {
         background: #1e1e1e;
         color: #ffffff;
     }

     .theme-dark .list-header {
         background: linear-gradient(135deg, #2a2a2a, #333333);
         border-bottom-color: #444444;
     }

     .theme-dark .header-cell {
         color: #ffffff;
         border-right-color: #444444;
     }

         .theme-dark .header-cell.sortable:hover {
             background-color: rgba(100, 181, 246, 0.1);
         }

     .theme-dark .file-row {
         border-bottom-color: #333333;
     }

         .theme-dark .file-row:hover {
             background-color: #2a2a2a;
             border-color: #444444;
         }

         .theme-dark .file-row.selected {
             background: linear-gradient(135deg, #1a1a2e, #16213e);
             border-color: #64b5f6;
             box-shadow: inset 3px 0 0 #64b5f6;
         }

         .theme-dark .file-row.uploading {
             background: linear-gradient(135deg, #2a2a2a, #333333);
         }

     .theme-dark .file-cell {
         border-right-color: #333333;
     }

     .theme-dark .file-name {
         color: #ffffff;
     }

     .theme-dark .file-size {
         color: #cccccc;
     }

     .theme-dark .upload-date {
         color: #cccccc;
     }

     .theme-dark .uploader-name {
         color: #cccccc;
     }

     .theme-dark .file-icon-wrapper {
         background: #333333;
     }

     .theme-dark .uploader-avatar {
         background: linear-gradient(135deg, #555555, #444444);
     }

     .theme-dark .upload-progress .progress {
         background-color: #333333;
     }

     /* ==========================================
    可訪問性增強
    ========================================== */

     @media (prefers-reduced-motion: reduce) {
         .file-row,
         .header-cell.sortable,
         .action-btn,
         .sort-icon {
             transition: none;
         }

             .file-row:hover,
             .action-btn:hover {
                 transform: none;
             }
     }

     /* 高對比度模式 */
     @media (prefers-contrast: high) {
         .file-row {
             border-bottom-width: 2px;
         }

         .header-cell {
             border-right-width: 2px;
         }

         .file-cell {
             border-right-width: 2px;
         }

         .action-btn {
             border-width: 2px;
         }
     }

     /* 焦點可見性 */
     .file-row:focus-visible {
         outline: 3px solid #007bff;
         outline-offset: -3px;
     }

     .header-cell.sortable:focus-visible {
         outline: 2px solid #007bff;
         outline-offset: -2px;
     }

     .action-btn:focus-visible {
         outline: 2px solid #007bff;
         outline-offset: 2px;
     }

     /* ==========================================
    打印樣式
    ========================================== */

     @media print {
         .file-list {
             box-shadow: none;
             border: 1px solid #000;
         }

         .list-header {
             background: #f5f5f5 !important;
         }

         .actions-cell {
             display: none;
         }

         .file-row:hover {
             background: transparent;
         }

         .action-btn {
             display: none;
         }
     }

     /* ==========================================
    滾動條樣式
    ========================================== */

     .list-content::-webkit-scrollbar {
         width: 8px;
     }

     .list-content::-webkit-scrollbar-track {
         background: #f1f1f1;
         border-radius: 4px;
     }

     .list-content::-webkit-scrollbar-thumb {
         background: #c1c1c1;
         border-radius: 4px;
         transition: background 0.3s ease;
     }

         .list-content::-webkit-scrollbar-thumb:hover {
             background: #a1a1a1;
         }

     /* Firefox 滾動條樣式 */
     .list-content {
         scrollbar-width: thin;
         scrollbar-color: #c1c1c1 #f1f1f1;
     }
