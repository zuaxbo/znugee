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

