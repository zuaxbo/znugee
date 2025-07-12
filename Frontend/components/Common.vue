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


