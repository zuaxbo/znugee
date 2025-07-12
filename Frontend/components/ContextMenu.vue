<template>
    <div class="context-menu"
         :style="menuStyle"
         v-if="visible"
         @click.stop
         @contextmenu.prevent>

        <!-- 檔案資訊顯示 -->
        <div v-if="file" class="menu-header">
            <div class="file-info">
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
                    <div class="file-name" :title="file.originalName || file.fileName">
                        {{ formatFileName(file.originalName || file.fileName, 20) }}
                    </div>
                    <small class="file-meta text-muted">
                        {{ formatFileSize(file.fileSize) }}
                    </small>
                </div>
            </div>
        </div>

        <!-- 分隔線 -->
        <div v-if="file" class="menu-divider"></div>

        <!-- 選單項目 -->
        <div class="menu-items">
            <!-- 預覽 -->
            <button v-if="canPreview"
                    class="menu-item"
                    @click="handleAction('preview')"
                    :disabled="isDisabled('preview')">
                <i class="bi bi-eye menu-icon"></i>
                <span class="menu-text">預覽</span>
                <span v-if="!isRecycleBin" class="menu-shortcut">Space</span>
            </button>

            <!-- 下載 -->
            <button class="menu-item"
                    @click="handleAction('download')"
                    :disabled="isDisabled('download')">
                <i class="bi bi-download menu-icon"></i>
                <span class="menu-text">下載</span>
                <span v-if="!isRecycleBin" class="menu-shortcut">Ctrl+D</span>
            </button>

            <!-- 複製熱連結 -->
            <button v-if="!isRecycleBin"
                    class="menu-item"
                    @click="handleAction('copy-link')"
                    :disabled="isDisabled('copy-link')">
                <i class="bi bi-link-45deg menu-icon"></i>
                <span class="menu-text">複製熱連結</span>
                <span class="menu-shortcut">Ctrl+L</span>
            </button>

            <!-- 分隔線 -->
            <div v-if="!isRecycleBin" class="menu-divider"></div>

            <!-- 重新命名 -->
            <button v-if="!isRecycleBin"
                    class="menu-item"
                    @click="handleAction('rename')"
                    :disabled="isDisabled('rename')">
                <i class="bi bi-pencil menu-icon"></i>
                <span class="menu-text">重新命名</span>
                <span class="menu-shortcut">F2</span>
            </button>

            <!-- 複製檔案 -->
            <button v-if="!isRecycleBin"
                    class="menu-item"
                    @click="handleAction('copy')"
                    :disabled="isDisabled('copy')">
                <i class="bi bi-files menu-icon"></i>
                <span class="menu-text">建立副本</span>
                <span class="menu-shortcut">Ctrl+C</span>
            </button>

            <!-- 移動檔案 -->
            <button v-if="!isRecycleBin && enableAdvancedFeatures"
                    class="menu-item"
                    @click="handleAction('move')"
                    :disabled="isDisabled('move')">
                <i class="bi bi-folder-symlink menu-icon"></i>
                <span class="menu-text">移動到資料夾</span>
            </button>

            <!-- 分隔線 -->
            <div class="menu-divider"></div>

            <!-- 檔案資訊 -->
            <button v-if="!isRecycleBin"
                    class="menu-item"
                    @click="handleAction('info')"
                    :disabled="isDisabled('info')">
                <i class="bi bi-info-circle menu-icon"></i>
                <span class="menu-text">檔案資訊</span>
                <span class="menu-shortcut">Ctrl+I</span>
            </button>

            <!-- 回收筒相關操作 -->
            <template v-if="isRecycleBin">
                <!-- 還原檔案 -->
                <button class="menu-item restore-item"
                        @click="handleAction('restore')"
                        :disabled="isDisabled('restore')">
                    <i class="bi bi-arrow-clockwise menu-icon"></i>
                    <span class="menu-text">還原檔案</span>
                    <span class="menu-shortcut">Ctrl+R</span>
                </button>

                <!-- 還原到指定位置 -->
                <button v-if="enableAdvancedFeatures"
                        class="menu-item"
                        @click="handleAction('restore-to')"
                        :disabled="isDisabled('restore-to')">
                    <i class="bi bi-arrow-up-right menu-icon"></i>
                    <span class="menu-text">還原到...</span>
                </button>

                <!-- 分隔線 -->
                <div class="menu-divider"></div>

                <!-- 永久刪除 -->
                <button class="menu-item danger-item"
                        @click="handleAction('permanent-delete')"
                        :disabled="isDisabled('permanent-delete')">
                    <i class="bi bi-trash-fill menu-icon"></i>
                    <span class="menu-text">永久刪除</span>
                    <span class="menu-shortcut">Shift+Del</span>
                </button>
            </template>

            <!-- 一般刪除 (移至回收筒) -->
            <template v-else>
                <button class="menu-item danger-item"
                        @click="handleAction('delete')"
                        :disabled="isDisabled('delete')">
                    <i class="bi bi-trash menu-icon"></i>
                    <span class="menu-text">刪除</span>
                    <span class="menu-shortcut">Del</span>
                </button>
            </template>
        </div>

        <!-- 多選操作提示 -->
        <div v-if="selectedCount > 1" class="menu-footer">
            <small class="text-muted">
                <i class="bi bi-check-square me-1"></i>
                已選中 {{ selectedCount }} 個檔案
            </small>
        </div>
    </div>
</template>

<script>
module.exports = {
  props: {
    file: {
      type: Object,
      default: null
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    visible: {
      type: Boolean,
      default: false
    },
    isRecycleBin: {
      type: Boolean,
      default: false
    },
    selectedCount: {
      type: Number,
      default: 0
    },
    enableAdvancedFeatures: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      // 選單尺寸
      menuWidth: 220,
      menuHeight: 0,

      // 視窗尺寸
      windowWidth: 0,
      windowHeight: 0,

      // 操作權限
      permissions: {
        preview: true,
        download: true,
        'copy-link': true,
        rename: true,
        copy: true,
        move: true,
        info: true,
        restore: true,
        'restore-to': true,
        delete: true,
        'permanent-delete': true
      }
    }
  },

  computed: {
    menuStyle() {
      return {
        left: this.adjustedX + 'px',
        top: this.adjustedY + 'px',
        width: this.menuWidth + 'px'
      };
    },

    adjustedX() {
      const margin = 10;
      let x = this.position.x;

      // 防止選單超出右邊界
      if (x + this.menuWidth + margin > this.windowWidth) {
        x = this.windowWidth - this.menuWidth - margin;
      }

      // 防止選單超出左邊界
      if (x < margin) {
        x = margin;
      }

      return Math.max(0, x);
    },

    adjustedY() {
      const margin = 10;
      let y = this.position.y;

      // 估算選單高度（如果還沒有實際高度）
      const estimatedHeight = this.menuHeight || 300;

      // 防止選單超出下邊界
      if (y + estimatedHeight + margin > this.windowHeight) {
        y = this.windowHeight - estimatedHeight - margin;
      }

      // 防止選單超出上邊界
      if (y < margin) {
        y = margin;
      }

      return Math.max(0, y);
    },

    canPreview() {
      if (!this.file) return false;
      return FileUtils.isPreviewSupported(this.file.originalName || this.file.fileName);
    }
  },

  mounted() {
    // 更新視窗尺寸
    this.updateWindowSize();
    window.addEventListener('resize', this.updateWindowSize);

    // 監聽點擊事件來關閉選單
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('contextmenu', this.handleDocumentClick);

    // 監聽鍵盤事件
    document.addEventListener('keydown', this.handleKeydown);

    // 計算選單實際高度
    this.$nextTick(() => {
      this.updateMenuHeight();
    });

    console.log('📋 右鍵選單已掛載:', {
      file: this.file?.originalName,
      position: this.position,
      isRecycleBin: this.isRecycleBin
    });
  },

  beforeDestroy() {
    // 清理事件監聽器
    window.removeEventListener('resize', this.updateWindowSize);
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('contextmenu', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    // ==========================================
    // 操作處理
    // ==========================================

    handleAction(action) {
      console.log('📋 執行選單操作:', action, this.file?.originalName);

      // 發送對應的事件
      switch (action) {
        case 'preview':
          this.$emit('preview', this.file);
          break;
        case 'download':
          this.$emit('download', this.file);
          break;
        case 'copy-link':
          this.$emit('copy-link', this.file);
          break;
        case 'rename':
          this.$emit('rename', this.file);
          break;
        case 'copy':
          this.$emit('copy', this.file);
          break;
        case 'move':
          this.$emit('move', this.file);
          break;
        case 'info':
          this.$emit('info', this.file);
          break;
        case 'restore':
          this.$emit('restore', this.file);
          break;
        case 'restore-to':
          this.$emit('restore-to', this.file);
          break;
        case 'delete':
          this.$emit('delete', this.file);
          break;
        case 'permanent-delete':
          this.$emit('permanent-delete', this.file);
          break;
        default:
          console.warn('未知的操作:', action);
      }

      // 關閉選單
      this.closeMenu();
    },

    isDisabled(action) {
      // 檢查權限
      if (!this.permissions[action]) {
        return true;
      }

      // 檢查檔案狀態
      if (!this.file) {
        return true;
      }

      // 特殊邏輯檢查
      switch (action) {
        case 'preview':
          return !this.canPreview;
        case 'copy-link':
          return this.file.status === 'uploading';
        case 'rename':
        case 'copy':
        case 'move':
        case 'delete':
          return this.file.status === 'uploading' || this.file.isLoading;
        case 'restore':
        case 'restore-to':
        case 'permanent-delete':
          return this.file.isLoading;
        default:
          return false;
      }
    },

    // ==========================================
    // 事件處理
    // ==========================================

    handleDocumentClick(event) {
      // 如果點擊的是選單內部，不關閉
      if (this.$el && this.$el.contains(event.target)) {
        return;
      }

      // 關閉選單
      this.closeMenu();
    },

    handleKeydown(event) {
      if (!this.visible) return;

      switch (event.key) {
        case 'Escape':
          this.closeMenu();
          break;
        case 'Enter':
          // 預設執行預覽操作
          if (this.canPreview && !this.isDisabled('preview')) {
            this.handleAction('preview');
          }
          break;
        case 'Delete':
          if (event.shiftKey && this.isRecycleBin) {
            // Shift+Delete = 永久刪除
            this.handleAction('permanent-delete');
          } else if (!this.isRecycleBin) {
            // Delete = 刪除到回收筒
            this.handleAction('delete');
          }
          break;
        case 'F2':
          if (!this.isRecycleBin) {
            this.handleAction('rename');
          }
          break;
        case 'd':
        case 'D':
          if (event.ctrlKey) {
            event.preventDefault();
            this.handleAction('download');
          }
          break;
        case 'l':
        case 'L':
          if (event.ctrlKey && !this.isRecycleBin) {
            event.preventDefault();
            this.handleAction('copy-link');
          }
          break;
        case 'r':
        case 'R':
          if (event.ctrlKey && this.isRecycleBin) {
            event.preventDefault();
            this.handleAction('restore');
          }
          break;
        case 'i':
        case 'I':
          if (event.ctrlKey && !this.isRecycleBin) {
            event.preventDefault();
            this.handleAction('info');
          }
          break;
        case 'c':
        case 'C':
          if (event.ctrlKey && !this.isRecycleBin) {
            event.preventDefault();
            this.handleAction('copy');
          }
          break;
        case ' ':
          if (!this.isRecycleBin && this.canPreview) {
            event.preventDefault();
            this.handleAction('preview');
          }
          break;
      }
    },

    handleImageError() {
      console.warn('⚠️ 選單中的縮圖載入失敗');
    },

    // ==========================================
    // UI 控制
    // ==========================================

    closeMenu() {
      console.log('📋 關閉右鍵選單');
      this.$emit('close');
    },

    updateWindowSize() {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
    },

    updateMenuHeight() {
      if (this.$el) {
        this.menuHeight = this.$el.offsetHeight;
      }
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
      return FileUtils.buildThumbnailUrl(this.file.id) + '?size=32';
    },

    getFileIcon() {
      const iconName = FileUtils.getFileIcon(this.file.originalName || this.file.fileName);
      return FileUtils.buildIconPath(iconName);
    },

    getFileTypeName() {
      const typeInfo = FileUtils.getFileTypeInfo(this.file.originalName || this.file.fileName);
      return typeInfo.category || 'file';
    },

    formatFileName(filename, maxLength) {
      return FormatUtils.formatFileName(filename, maxLength);
    },

    formatFileSize(bytes) {
      return FileUtils.formatFileSize(bytes);
    }
  }
}
</script>

<style scoped>
     /* ==========================================
    主容器
    ========================================== */

     .context-menu {
         position: fixed;
         background: white;
         border-radius: 8px;
         box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
         border: 1px solid rgba(0, 0, 0, 0.1);
         z-index: 2000;
         min-width: 200px;
         max-width: 280px;
         overflow: hidden;
         backdrop-filter: blur(20px);
         animation: contextMenuFadeIn 0.15s ease-out;
         user-select: none;
     }

     @keyframes contextMenuFadeIn {
         from {
             opacity: 0;
             transform: scale(0.95) translateY(-5px);
         }

         to {
             opacity: 1;
             transform: scale(1) translateY(0);
         }
     }

     /* ==========================================
    選單頭部 - 檔案資訊
    ========================================== */

     .menu-header {
         padding: 12px 16px;
         background: linear-gradient(135deg, #f8f9fa, #e9ecef);
         border-bottom: 1px solid #e9ecef;
     }

     .file-info {
         display: flex;
         align-items: center;
         gap: 10px;
     }

     .file-icon-wrapper {
         width: 32px;
         height: 32px;
         display: flex;
         align-items: center;
         justify-content: center;
         background: white;
         border-radius: 6px;
         box-shadow: 0 2px 4px rgba(0,0,0,0.1);
         flex-shrink: 0;
     }

     .file-thumbnail {
         width: 100%;
         height: 100%;
         object-fit: cover;
         border-radius: 4px;
     }

     .file-type-icon {
         width: 20px;
         height: 20px;
         object-fit: contain;
     }

     .file-details {
         flex: 1;
         min-width: 0;
     }

     .file-name {
         font-weight: 600;
         color: #212529;
         font-size: 0.875rem;
         line-height: 1.3;
         margin-bottom: 2px;
         overflow: hidden;
         text-overflow: ellipsis;
         white-space: nowrap;
     }

     .file-meta {
         font-size: 0.75rem;
         color: #6c757d;
     }

     /* ==========================================
    分隔線
    ========================================== */

     .menu-divider {
         height: 1px;
         background: linear-gradient(to right, transparent, #e9ecef, transparent);
         margin: 4px 0;
     }

     /* ==========================================
    選單項目
    ========================================== */

     .menu-items {
         padding: 4px 0;
     }

     .menu-item {
         width: 100%;
         display: flex;
         align-items: center;
         padding: 10px 16px;
         border: none;
         background: none;
         text-align: left;
         font-size: 0.875rem;
         color: #495057;
         cursor: pointer;
         transition: all 0.15s ease;
         position: relative;
         gap: 10px;
     }

         .menu-item:hover:not(:disabled) {
             background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
             color: #1976d2;
             padding-left: 20px;
         }

         .menu-item:active:not(:disabled) {
             background: linear-gradient(135deg, #bbdefb, #e1bee7);
             transform: scale(0.98);
         }

         .menu-item:disabled {
             color: #adb5bd;
             cursor: not-allowed;
             opacity: 0.6;
         }

             .menu-item:disabled .menu-icon {
                 opacity: 0.5;
             }

         /* 危險操作項目 */
         .menu-item.danger-item {
             color: #dc3545;
         }

             .menu-item.danger-item:hover:not(:disabled) {
                 background: linear-gradient(135deg, #f8d7da, #f5c6cb);
                 color: #721c24;
             }

             .menu-item.danger-item .menu-icon {
                 color: #dc3545;
             }

         /* 還原操作項目 */
         .menu-item.restore-item {
             color: #28a745;
         }

             .menu-item.restore-item:hover:not(:disabled) {
                 background: linear-gradient(135deg, #d4edda, #c3e6cb);
                 color: #155724;
             }

             .menu-item.restore-item .menu-icon {
                 color: #28a745;
             }

     /* ==========================================
    選單項目元素
    ========================================== */

     .menu-icon {
         width: 16px;
         height: 16px;
         flex-shrink: 0;
         color: inherit;
         transition: all 0.15s ease;
     }

     .menu-text {
         flex: 1;
         font-weight: 500;
         white-space: nowrap;
         overflow: hidden;
         text-overflow: ellipsis;
     }

     .menu-shortcut {
         font-size: 0.75rem;
         color: #6c757d;
         background: rgba(108, 117, 125, 0.1);
         padding: 2px 6px;
         border-radius: 4px;
         font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
         white-space: nowrap;
         flex-shrink: 0;
         margin-left: 8px;
     }

     .menu-item:hover:not(:disabled) .menu-shortcut {
         background: rgba(25, 118, 210, 0.1);
         color: #1976d2;
     }

     .menu-item.danger-item:hover:not(:disabled) .menu-shortcut {
         background: rgba(220, 53, 69, 0.1);
         color: #721c24;
     }

     .menu-item.restore-item:hover:not(:disabled) .menu-shortcut {
         background: rgba(40, 167, 69, 0.1);
         color: #155724;
     }

     /* ==========================================
    選單底部
    ========================================== */

     .menu-footer {
         padding: 8px 16px;
         background: #f8f9fa;
         border-top: 1px solid #e9ecef;
         text-align: center;
     }

         .menu-footer small {
             font-weight: 500;
         }

     /* ==========================================
    響應式設計
    ========================================== */

     /* 小螢幕設備 */
     @media (max-width: 768px) {
         .context-menu {
             min-width: 180px;
             max-width: 250px;
         }

         .menu-header {
             padding: 10px 14px;
         }

         .file-icon-wrapper {
             width: 28px;
             height: 28px;
         }

         .file-type-icon {
             width: 18px;
             height: 18px;
         }

         .file-name {
             font-size: 0.8rem;
         }

         .file-meta {
             font-size: 0.7rem;
         }

         .menu-item {
             padding: 9px 14px;
             font-size: 0.8rem;
             gap: 8px;
         }

             .menu-item:hover:not(:disabled) {
                 padding-left: 18px;
             }

         .menu-icon {
             width: 14px;
             height: 14px;
         }

         .menu-shortcut {
             font-size: 0.7rem;
             padding: 1px 4px;
             margin-left: 6px;
         }

         .menu-footer {
             padding: 6px 14px;
         }
     }

     /* 超小螢幕設備 */
     @media (max-width: 480px) {
         .context-menu {
             min-width: 160px;
             max-width: 220px;
         }

         .menu-header {
             padding: 8px 12px;
         }

         .file-info {
             gap: 8px;
         }

         .file-icon-wrapper {
             width: 24px;
             height: 24px;
         }

         .file-type-icon {
             width: 16px;
             height: 16px;
         }

         .file-name {
             font-size: 0.75rem;
         }

         .file-meta {
             font-size: 0.65rem;
         }

         .menu-item {
             padding: 8px 12px;
             font-size: 0.75rem;
             gap: 6px;
         }

             .menu-item:hover:not(:disabled) {
                 padding-left: 16px;
             }

         .menu-icon {
             width: 12px;
             height: 12px;
         }

         .menu-text {
             font-weight: 600;
         }

         .menu-shortcut {
             display: none; /* 在小螢幕上隱藏快捷鍵提示 */
         }

         .menu-footer {
             padding: 4px 12px;
         }

             .menu-footer small {
                 font-size: 0.65rem;
             }
     }

     /* ==========================================
    深色主題支持
    ========================================== */

     @media (prefers-color-scheme: dark) {
         .theme-auto .context-menu {
             background: #2a2a2a;
             border-color: #444444;
             box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
         }

         .theme-auto .menu-header {
             background: linear-gradient(135deg, #333333, #2a2a2a);
             border-bottom-color: #444444;
         }

         .theme-auto .file-name {
             color: #ffffff;
         }

         .theme-auto .file-icon-wrapper {
             background: #333333;
         }

         .theme-auto .menu-divider {
             background: linear-gradient(to right, transparent, #444444, transparent);
         }

         .theme-auto .menu-item {
             color: #e9ecef;
         }

             .theme-auto .menu-item:hover:not(:disabled) {
                 background: linear-gradient(135deg, #1a2332, #2a1a32);
                 color: #64b5f6;
             }

             .theme-auto .menu-item:active:not(:disabled) {
                 background: linear-gradient(135deg, #0d1a2a, #1a0d2a);
             }

         .theme-auto .menu-shortcut {
             background: rgba(233, 236, 239, 0.1);
             color: #adb5bd;
         }

         .theme-auto .menu-item:hover:not(:disabled) .menu-shortcut {
             background: rgba(100, 181, 246, 0.1);
             color: #64b5f6;
         }

         .theme-auto .menu-footer {
             background: #333333;
             border-top-color: #444444;
         }
     }

     .theme-dark .context-menu {
         background: #2a2a2a;
         border-color: #444444;
         box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
     }

     .theme-dark .menu-header {
         background: linear-gradient(135deg, #333333, #2a2a2a);
         border-bottom-color: #444444;
     }

     .theme-dark .file-name {
         color: #ffffff;
     }

     .theme-dark .file-icon-wrapper {
         background: #333333;
     }

     .theme-dark .menu-divider {
         background: linear-gradient(to right, transparent, #444444, transparent);
     }

     .theme-dark .menu-item {
         color: #e9ecef;
     }

         .theme-dark .menu-item:hover:not(:disabled) {
             background: linear-gradient(135deg, #1a2332, #2a1a32);
             color: #64b5f6;
         }

         .theme-dark .menu-item:active:not(:disabled) {
             background: linear-gradient(135deg, #0d1a2a, #1a0d2a);
         }

         .theme-dark .menu-item:disabled {
             color: #6c757d;
         }

     .theme-dark .menu-shortcut {
         background: rgba(233, 236, 239, 0.1);
         color: #adb5bd;
     }

     .theme-dark .menu-item:hover:not(:disabled) .menu-shortcut {
         background: rgba(100, 181, 246, 0.1);
         color: #64b5f6;
     }

     .theme-dark .menu-item.danger-item:hover:not(:disabled) .menu-shortcut {
         background: rgba(220, 53, 69, 0.1);
         color: #f8d7da;
     }

     .theme-dark .menu-item.restore-item:hover:not(:disabled) .menu-shortcut {
         background: rgba(40, 167, 69, 0.1);
         color: #d4edda;
     }

     .theme-dark .menu-footer {
         background: #333333;
         border-top-color: #444444;
     }

     /* ==========================================
    特殊狀態和動畫
    ========================================== */

     /* 懸停動畫增強 */
     .menu-item {
         position: relative;
         overflow: hidden;
     }

         .menu-item::before {
             content: '';
             position: absolute;
             left: -100%;
             top: 0;
             width: 100%;
             height: 100%;
             background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
             transition: left 0.5s ease;
         }

         .menu-item:hover:not(:disabled)::before {
             left: 100%;
         }

         /* 載入狀態 */
         .menu-item.loading {
             pointer-events: none;
             opacity: 0.7;
         }

             .menu-item.loading .menu-icon {
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

     /* 脈衝效果（用於高亮某個操作） */
     .menu-item.highlight {
         animation: pulse 1.5s ease-in-out infinite;
     }

     @keyframes pulse {
         0%, 100% {
             background: rgba(0, 123, 255, 0.1);
         }

         50% {
             background: rgba(0, 123, 255, 0.3);
         }
     }

     /* ==========================================
    可訪問性增強
    ========================================== */

     /* 減少動畫模式 */
     @media (prefers-reduced-motion: reduce) {
         .context-menu {
             animation: none;
         }

         .menu-item,
         .menu-item::before,
         .menu-icon {
             animation: none;
             transition: none;
         }

             .menu-item:hover:not(:disabled) {
                 transform: none;
             }

             .menu-item:active:not(:disabled) {
                 transform: none;
             }
     }

     /* 高對比度模式 */
     @media (prefers-contrast: high) {
         .context-menu {
             border: 2px solid currentColor;
             box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
         }

         .menu-header {
             border-bottom-width: 2px;
         }

         .menu-divider {
             height: 2px;
             background: currentColor;
         }

         .menu-item {
             border: 1px solid transparent;
         }

             .menu-item:hover:not(:disabled) {
                 border-color: currentColor;
             }

         .menu-footer {
             border-top-width: 2px;
         }
     }

     /* 焦點可見性 */
     .menu-item:focus-visible {
         outline: 2px solid #007bff;
         outline-offset: -2px;
         background: rgba(0, 123, 255, 0.1);
     }

     /* ==========================================
    防止文字選取
    ========================================== */

     .context-menu * {
         user-select: none;
         -webkit-user-select: none;
         -moz-user-select: none;
         -ms-user-select: none;
     }

     /* ==========================================
    滾動條樣式（如果內容過多）
    ========================================== */

     .menu-items {
         max-height: 60vh;
         overflow-y: auto;
     }

         .menu-items::-webkit-scrollbar {
             width: 6px;
         }

         .menu-items::-webkit-scrollbar-track {
             background: transparent;
         }

         .menu-items::-webkit-scrollbar-thumb {
             background: rgba(0, 0, 0, 0.2);
             border-radius: 3px;
         }

             .menu-items::-webkit-scrollbar-thumb:hover {
                 background: rgba(0, 0, 0, 0.3);
             }

     /* Firefox 滾動條樣式 */
     .menu-items {
         scrollbar-width: thin;
         scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
     }

     /* ==========================================
    特殊效果
    ========================================== */

     /* 毛玻璃效果增強 */
     .context-menu {
         background: rgba(255, 255, 255, 0.9);
         backdrop-filter: blur(20px) saturate(180%);
     }

     @supports not (backdrop-filter: blur(20px)) {
         .context-menu {
             background: rgba(255, 255, 255, 0.95);
         }
     }

     /* 深色主題毛玻璃效果 */
     .theme-dark .context-menu {
         background: rgba(42, 42, 42, 0.9);
         backdrop-filter: blur(20px) saturate(180%);
     }

     @supports not (backdrop-filter: blur(20px)) {
         .theme-dark .context-menu {
             background: rgba(42, 42, 42, 0.95);
         }
     }

     /* ==========================================
    打印樣式
    ========================================== */

     @media print {
         .context-menu {
             display: none !important;
         }
     }
</style>