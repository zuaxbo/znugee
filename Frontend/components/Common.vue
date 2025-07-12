<template>
    <div class="common-components">
        <!-- 載入動畫組件 -->
        <div v-if="loading" class="loading-overlay" :class="{ 'full-screen': fullScreen }">
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">載入中...</span>
                </div>
                <div class="loading-text mt-2" v-if="loadingText">{{ loadingText }}</div>
            </div>
        </div>

        <!-- 成功訊息提示 -->
        <div v-if="successMessage" class="toast-container position-fixed top-0 end-0 p-3">
            <div class="toast show" role="alert">
                <div class="toast-header bg-success text-white">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong class="me-auto">成功</strong>
                    <button type="button" class="btn-close btn-close-white" @click="clearSuccess"></button>
                </div>
                <div class="toast-body">
                    {{ successMessage }}
                </div>
            </div>
        </div>

        <!-- 錯誤訊息提示 -->
        <div v-if="errorMessage" class="toast-container position-fixed top-0 end-0 p-3">
            <div class="toast show" role="alert">
                <div class="toast-header bg-danger text-white">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    <strong class="me-auto">錯誤</strong>
                    <button type="button" class="btn-close btn-close-white" @click="clearError"></button>
                </div>
                <div class="toast-body">
                    {{ errorMessage }}
                </div>
            </div>
        </div>

        <!-- 警告訊息提示 -->
        <div v-if="warningMessage" class="toast-container position-fixed top-0 end-0 p-3">
            <div class="toast show" role="alert">
                <div class="toast-header bg-warning text-dark">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong class="me-auto">警告</strong>
                    <button type="button" class="btn-close" @click="clearWarning"></button>
                </div>
                <div class="toast-body">
                    {{ warningMessage }}
                </div>
            </div>
        </div>

        <!-- 資訊訊息提示 -->
        <div v-if="infoMessage" class="toast-container position-fixed top-0 end-0 p-3">
            <div class="toast show" role="alert">
                <div class="toast-header bg-info text-white">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong class="me-auto">資訊</strong>
                    <button type="button" class="btn-close btn-close-white" @click="clearInfo"></button>
                </div>
                <div class="toast-body">
                    {{ infoMessage }}
                </div>
            </div>
        </div>

        <!-- 進度條組件 -->
        <div v-if="showProgress" class="progress-container">
            <div class="progress-header mb-2">
                <span class="progress-title">{{ progressTitle }}</span>
                <span class="progress-percentage">{{ progressPercentage }}%</span>
            </div>
            <div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated"
                     :class="progressClass"
                     role="progressbar"
                     :style="{ width: progressPercentage + '%' }"
                     :aria-valuenow="progressPercentage"
                     aria-valuemin="0"
                     aria-valuemax="100">
                </div>
            </div>
        </div>

        <!-- 空狀態組件 -->
        <div v-if="showEmpty" class="empty-state text-center py-5">
            <div class="empty-icon mb-3">
                <i :class="emptyIcon" class="text-muted"></i>
            </div>
            <h5 class="empty-title text-muted">{{ emptyTitle }}</h5>
            <p class="empty-description text-muted">{{ emptyDescription }}</p>
            <button v-if="emptyAction" class="btn btn-primary" @click="handleEmptyAction">
                {{ emptyActionText }}
            </button>
        </div>

        <!-- 確認對話框 -->
        <div v-if="showConfirm" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ confirmTitle }}</h5>
                        <button type="button" class="btn-close" @click="cancelConfirm"></button>
                    </div>
                    <div class="modal-body">
                        <p>{{ confirmMessage }}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="cancelConfirm">
                            {{ confirmCancelText }}
                        </button>
                        <button type="button" class="btn" :class="confirmButtonClass" @click="handleConfirm">
                            {{ confirmOkText }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
module.exports = {
  name: 'Common',
  data() {
    return {
      // 載入狀態
      loading: false,
      loadingText: '',
      fullScreen: false,

      // 訊息提示
      successMessage: '',
      errorMessage: '',
      warningMessage: '',
      infoMessage: '',

      // 進度條
      showProgress: false,
      progressTitle: '',
      progressPercentage: 0,
      progressClass: 'bg-primary',

      // 空狀態
      showEmpty: false,
      emptyIcon: 'fas fa-folder-open fa-4x',
      emptyTitle: '沒有檔案',
      emptyDescription: '此資料夾是空的',
      emptyAction: null,
      emptyActionText: '上傳檔案',

      // 確認對話框
      showConfirm: false,
      confirmTitle: '確認',
      confirmMessage: '您確定要執行此操作嗎？',
      confirmOkText: '確認',
      confirmCancelText: '取消',
      confirmButtonClass: 'btn-primary',
      confirmCallback: null,

      // 自動隱藏計時器
      messageTimers: {}
    }
  },
  methods: {
    // 載入控制
    showLoading(text = '載入中...', isFullScreen = false) {
      this.loading = true;
      this.loadingText = text;
      this.fullScreen = isFullScreen;
    },
    hideLoading() {
      this.loading = false;
      this.loadingText = '';
      this.fullScreen = false;
    },

    // 訊息提示
    showSuccess(message, autoHide = true) {
      this.successMessage = message;
      if (autoHide) {
        this.setAutoHide('success', 3000);
      }
    },
    showError(message, autoHide = true) {
      this.errorMessage = message;
      if (autoHide) {
        this.setAutoHide('error', 5000);
      }
    },
    showWarning(message, autoHide = true) {
      this.warningMessage = message;
      if (autoHide) {
        this.setAutoHide('warning', 4000);
      }
    },
    showInfo(message, autoHide = true) {
      this.infoMessage = message;
      if (autoHide) {
        this.setAutoHide('info', 3000);
      }
    },

    // 清除訊息
    clearSuccess() {
      this.successMessage = '';
      this.clearTimer('success');
    },
    clearError() {
      this.errorMessage = '';
      this.clearTimer('error');
    },
    clearWarning() {
      this.warningMessage = '';
      this.clearTimer('warning');
    },
    clearInfo() {
      this.infoMessage = '';
      this.clearTimer('info');
    },
    clearAllMessages() {
      this.clearSuccess();
      this.clearError();
      this.clearWarning();
      this.clearInfo();
    },

    // 進度條控制
    showProgressBar(title = '處理中...', percentage = 0, className = 'bg-primary') {
      this.showProgress = true;
      this.progressTitle = title;
      this.progressPercentage = percentage;
      this.progressClass = className;
    },
    updateProgress(percentage, title = null) {
      this.progressPercentage = Math.min(100, Math.max(0, percentage));
      if (title) {
        this.progressTitle = title;
      }
    },
    hideProgress() {
      this.showProgress = false;
      this.progressTitle = '';
      this.progressPercentage = 0;
    },

    // 空狀態控制
    showEmptyState(options = {}) {
      this.showEmpty = true;
      this.emptyIcon = options.icon || 'fas fa-folder-open fa-4x';
      this.emptyTitle = options.title || '沒有檔案';
      this.emptyDescription = options.description || '此資料夾是空的';
      this.emptyAction = options.action || null;
      this.emptyActionText = options.actionText || '上傳檔案';
    },
    hideEmptyState() {
      this.showEmpty = false;
    },
    handleEmptyAction() {
      if (this.emptyAction) {
        this.emptyAction();
      }
    },

    // 確認對話框
    showConfirmDialog(options = {}) {
      return new Promise((resolve) => {
        this.showConfirm = true;
        this.confirmTitle = options.title || '確認';
        this.confirmMessage = options.message || '您確定要執行此操作嗎？';
        this.confirmOkText = options.okText || '確認';
        this.confirmCancelText = options.cancelText || '取消';
        this.confirmButtonClass = options.buttonClass || 'btn-primary';
        this.confirmCallback = resolve;
      });
    },
    handleConfirm() {
      this.showConfirm = false;
      if (this.confirmCallback) {
        this.confirmCallback(true);
      }
    },
    cancelConfirm() {
      this.showConfirm = false;
      if (this.confirmCallback) {
        this.confirmCallback(false);
      }
    },

    // 工具方法
    setAutoHide(type, delay) {
      this.clearTimer(type);
      this.messageTimers[type] = setTimeout(() => {
        switch(type) {
          case 'success':
            this.clearSuccess();
            break;
          case 'error':
            this.clearError();
            break;
          case 'warning':
            this.clearWarning();
            break;
          case 'info':
            this.clearInfo();
            break;
        }
      }, delay);
    },
    clearTimer(type) {
      if (this.messageTimers[type]) {
        clearTimeout(this.messageTimers[type]);
        delete this.messageTimers[type];
      }
    },

    // 格式化檔案大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('zh-TW') + ' ' + d.toLocaleTimeString('zh-TW');
    },

    // 防抖函數
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  },
  beforeDestroy() {
    // 清除所有計時器
    Object.values(this.messageTimers).forEach(timer => {
      clearTimeout(timer);
    });
  }
}
</script>

<style scoped>
    /* 載入動畫樣式 */
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(2px);
    }

        .loading-overlay.full-screen {
            position: fixed;
            background-color: rgba(255, 255, 255, 0.9);
        }

    .loading-spinner {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .loading-text {
        font-size: 14px;
        color: #6c757d;
        margin-top: 10px;
    }

    /* Toast 訊息樣式 */
    .toast-container {
        z-index: 10000;
    }

    .toast {
        min-width: 300px;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }

        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .toast-header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .toast-body {
        padding: 12px 16px;
        word-wrap: break-word;
    }

    /* 進度條樣式 */
    .progress-container {
        margin: 20px 0;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #dee2e6;
    }

    .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .progress-title {
        font-weight: 500;
        color: #495057;
        font-size: 14px;
    }

    .progress-percentage {
        font-weight: 600;
        color: #007bff;
        font-size: 14px;
    }

    .progress {
        height: 8px;
        background-color: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-bar {
        transition: width 0.3s ease;
    }

    /* 空狀態樣式 */
    .empty-state {
        padding: 60px 20px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px dashed #dee2e6;
        margin: 20px 0;
    }

    .empty-icon {
        margin-bottom: 20px;
    }

        .empty-icon i {
            font-size: 4rem;
            color: #adb5bd;
        }

    .empty-title {
        font-size: 1.25rem;
        font-weight: 500;
        color: #6c757d;
        margin-bottom: 10px;
    }

    .empty-description {
        font-size: 0.95rem;
        color: #868e96;
        margin-bottom: 20px;
        line-height: 1.5;
    }

    .empty-state .btn {
        padding: 8px 24px;
        font-size: 14px;
        border-radius: 6px;
        transition: all 0.2s ease;
    }

        .empty-state .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

    /* 確認對話框樣式 */
    .modal {
        backdrop-filter: blur(3px);
        animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }

    .modal-dialog {
        animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
        from {
            transform: translateY(-50px);
            opacity: 0;
        }

        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-content {
        border: none;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        overflow: hidden;
    }

    .modal-header {
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        padding: 16px 20px;
    }

    .modal-title {
        font-weight: 600;
        color: #495057;
        font-size: 1.1rem;
    }

    .modal-body {
        padding: 20px;
        color: #6c757d;
        line-height: 1.6;
    }

    .modal-footer {
        background: #f8f9fa;
        border-top: 1px solid #dee2e6;
        padding: 12px 20px;
        gap: 10px;
    }

        .modal-footer .btn {
            padding: 8px 20px;
            font-size: 14px;
            border-radius: 6px;
            font-weight: 500;
            transition: all 0.2s ease;
        }

            .modal-footer .btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

    /* 響應式設計 */
    @media (max-width: 768px) {
        .toast {
            min-width: 280px;
            margin: 0 10px;
        }

        .progress-container {
            margin: 15px 0;
            padding: 12px;
        }

        .empty-state {
            padding: 40px 15px;
            margin: 15px 0;
        }

        .empty-icon i {
            font-size: 3rem;
        }

        .empty-title {
            font-size: 1.1rem;
        }

        .empty-description {
            font-size: 0.9rem;
        }

        .modal-dialog {
            margin: 10px;
        }

        .modal-body {
            padding: 15px;
        }

        .modal-header,
        .modal-footer {
            padding: 12px 15px;
        }
    }

    /* 深色主題支援 */
    @media (prefers-color-scheme: dark) {
        .loading-overlay {
            background-color: rgba(33, 37, 41, 0.8);
        }

            .loading-overlay.full-screen {
                background-color: rgba(33, 37, 41, 0.9);
            }

        .loading-spinner {
            background: #495057;
            color: white;
        }

        .progress-container {
            background: #495057;
            border-color: #6c757d;
        }

        .progress-title {
            color: #f8f9fa;
        }

        .progress {
            background-color: #6c757d;
        }

        .empty-state {
            background: #495057;
            border-color: #6c757d;
            color: #f8f9fa;
        }

        .modal-content {
            background: #495057;
            color: #f8f9fa;
        }

        .modal-header,
        .modal-footer {
            background: #343a40;
            border-color: #6c757d;
        }
    }

    /* 動畫效果 */
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.3s ease;
    }

    .fade-enter,
    .fade-leave-to {
        opacity: 0;
    }

    /* 工具類別 */
    .text-ellipsis {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .cursor-pointer {
        cursor: pointer;
    }

    .user-select-none {
        user-select: none;
    }

    /* 滾動條樣式 */
    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }

        ::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }
</style>
