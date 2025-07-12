<template>
    <div class="common-components">
        <!-- 全域載入指示器 -->
        <div v-if="showGlobalLoading" class="global-loading-overlay">
            <div class="global-loading-content">
                <div class="loading-spinner">
                    <div class="spinner-ring">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
                <div class="loading-text">{{ globalLoadingMessage }}</div>
                <div v-if="showCancelButton" class="loading-actions">
                    <button class="btn btn-outline-light btn-sm" @click="cancelLoading">
                        取消
                    </button>
                </div>
            </div>
        </div>

        <!-- Toast 通知容器 -->
        <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1100;">
            <!-- 成功通知 -->
            <div v-for="toast in successToasts" 
                 :key="toast.id" 
                 class="toast show success-toast" 
                 role="alert">
                <div class="toast-header bg-success text-white">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <strong class="me-auto">成功</strong>
                    <small>{{ getTimeAgo(toast.timestamp) }}</small>
                    <button type="button" 
                            class="btn-close btn-close-white" 
                            @click="removeToast('success', toast.id)">
                    </button>
                </div>
                <div class="toast-body">
                    {{ toast.message }}
                </div>
            </div>

            <!-- 錯誤通知 -->
            <div v-for="toast in errorToasts" 
                 :key="toast.id" 
                 class="toast show error-toast" 
                 role="alert">
                <div class="toast-header bg-danger text-white">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong class="me-auto">錯誤</strong>
                    <small>{{ getTimeAgo(toast.timestamp) }}</small>
                    <button type="button" 
                            class="btn-close btn-close-white" 
                            @click="removeToast('error', toast.id)">
                    </button>
                </div>
                <div class="toast-body">
                    {{ toast.message }}
                </div>
            </div>

            <!-- 警告通知 -->
            <div v-for="toast in warningToasts" 
                 :key="toast.id" 
                 class="toast show warning-toast" 
                 role="alert">
                <div class="toast-header bg-warning text-dark">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong class="me-auto">警告</strong>
                    <small>{{ getTimeAgo(toast.timestamp) }}</small>
                    <button type="button" 
                            class="btn-close" 
                            @click="removeToast('warning', toast.id)">
                    </button>
                </div>
                <div class="toast-body">
                    {{ toast.message }}
                </div>
            </div>

            <!-- 資訊通知 -->
            <div v-for="toast in infoToasts" 
                 :key="toast.id" 
                 class="toast show info-toast" 
                 role="alert">
                <div class="toast-header bg-info text-white">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <strong class="me-auto">資訊</strong>
                    <small>{{ getTimeAgo(toast.timestamp) }}</small>
                    <button type="button" 
                            class="btn-close btn-close-white" 
                            @click="removeToast('info', toast.id)">
                    </button>
                </div>
                <div class="toast-body">
                    {{ toast.message }}
                </div>
            </div>
        </div>

        <!-- 內嵌載入指示器 -->
        <div v-if="showInlineLoading" class="inline-loading">
            <div class="loading-content">
                <div class="loading-spinner-sm">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">載入中...</span>
                    </div>
                </div>
                <span class="loading-text-sm ms-2">{{ inlineLoadingMessage }}</span>
            </div>
        </div>

        <!-- 空狀態組件 -->
        <div v-if="showEmptyState" class="empty-state">
            <div class="empty-state-content">
                <div class="empty-icon">
                    <i class="bi" :class="emptyStateIcon"></i>
                </div>
                <h4 class="empty-title">{{ emptyStateTitle }}</h4>
                <p class="empty-description">{{ emptyStateDescription }}</p>
                <div v-if="emptyStateActions.length > 0" class="empty-actions">
                    <button v-for="action in emptyStateActions"
                            :key="action.key"
                            :class="action.className || 'btn btn-primary'"
                            @click="handleEmptyStateAction(action)">
                        <i v-if="action.icon" class="bi me-2" :class="action.icon"></i>
                        {{ action.text }}
                    </button>
                </div>
            </div>
        </div>

        <!-- 進度條組件 -->
        <div v-if="showProgressBar" class="progress-container">
            <div class="progress-header">
                <span class="progress-label">{{ progressLabel }}</span>
                <span class="progress-percentage">{{ Math.round(progressValue) }}%</span>
            </div>
            <div class="progress">
                <div class="progress-bar" 
                     :class="progressBarClass"
                     role="progressbar" 
                     :style="{ width: progressValue + '%' }"
                     :aria-valuenow="progressValue" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                </div>
            </div>
            <div v-if="progressSubtext" class="progress-subtext">
                <small class="text-muted">{{ progressSubtext }}</small>
            </div>
        </div>

        <!-- 確認對話框 -->
        <div v-if="showConfirmDialog" class="confirm-dialog-modal">
            <div class="modal-backdrop" @click="handleDialogBackdrop"></div>
            <div class="modal-content confirm-modal">
                <div class="modal-header">
                    <div class="confirm-icon" :class="confirmIconClass">
                        <i class="bi" :class="confirmIconName"></i>
                    </div>
                    <div class="confirm-content">
                        <h5 class="modal-title">{{ confirmTitle }}</h5>
                        <p class="confirm-message">{{ confirmMessage }}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" 
                            class="btn btn-secondary" 
                            @click="handleConfirmCancel">
                        {{ confirmCancelText }}
                    </button>
                    <button type="button" 
                            :class="confirmButtonClass" 
                            @click="handleConfirmOk">
                        {{ confirmOkText }}
                    </button>
                </div>
            </div>
        </div>

        <!-- 工具提示容器 -->
        <div v-if="showTooltip" 
             class="custom-tooltip" 
             :style="tooltipStyles">
            {{ tooltipText }}
        </div>

        <!-- 鍵盤快捷鍵幫助 -->
        <div v-if="showKeyboardHelp" class="keyboard-help-modal">
            <div class="modal-backdrop" @click="hideKeyboardHelp"></div>
            <div class="modal-content keyboard-help">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-keyboard me-2"></i>
                        鍵盤快捷鍵
                    </h5>
                    <button type="button" 
                            class="btn-close" 
                            @click="hideKeyboardHelp">
                    </button>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-grid">
                        <div v-for="shortcut in keyboardShortcuts" 
                             :key="shortcut.key"
                             class="shortcut-item">
                            <div class="shortcut-keys">
                                <kbd v-for="key in shortcut.keys" 
                                     :key="key"
                                     class="key">{{ key }}</kbd>
                            </div>
                            <div class="shortcut-description">
                                {{ shortcut.description }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 網路狀態指示器 -->
        <div v-if="!isOnline" class="network-status offline">
            <div class="network-indicator">
                <i class="bi bi-wifi-off me-2"></i>
                <span>網路連接已中斷</span>
                <button class="btn btn-sm btn-outline-light ms-2" @click="checkNetworkStatus">
                    重試
                </button>
            </div>
        </div>

        <!-- 後端狀態指示器 -->
        <div v-if="showBackendStatus && !isBackendOnline" class="backend-status offline">
            <div class="backend-indicator">
                <i class="bi bi-server me-2"></i>
                <span>後端服務無法連接</span>
                <small class="status-detail">{{ backendStatusMessage }}</small>
            </div>
        </div>
    </div>
</template>

<script>
module.exports = {
  data() {
    return {
      // 載入狀態
      showGlobalLoading: false,
      globalLoadingMessage: '載入中...',
      showCancelButton: false,
      showInlineLoading: false,
      inlineLoadingMessage: '處理中...',

      // Toast 通知
      successToasts: [],
      errorToasts: [],
      warningToasts: [],
      infoToasts: [],
      toastIdCounter: 1,

      // 空狀態
      showEmptyState: false,
      emptyStateIcon: 'bi-folder2-open',
      emptyStateTitle: '沒有資料',
      emptyStateDescription: '目前沒有可顯示的內容',
      emptyStateActions: [],

      // 進度條
      showProgressBar: false,
      progressValue: 0,
      progressLabel: '進度',
      progressSubtext: '',
      progressBarClass: 'bg-primary',

      // 確認對話框
      showConfirmDialog: false,
      confirmTitle: '確認',
      confirmMessage: '',
      confirmOkText: '確定',
      confirmCancelText: '取消',
      confirmType: 'info',
      confirmCallback: null,

      // 工具提示
      showTooltip: false,
      tooltipText: '',
      tooltipX: 0,
      tooltipY: 0,

      // 鍵盤快捷鍵
      showKeyboardHelp: false,
      keyboardShortcuts: [
        { keys: ['Ctrl', 'U'], description: '上傳檔案' },
        { keys: ['Del'], description: '刪除選中檔案' },
        { keys: ['F2'], description: '重命名檔案' },
        { keys: ['Ctrl', 'A'], description: '全選檔案' },
        { keys: ['Ctrl', 'D'], description: '下載檔案' },
        { keys: ['Ctrl', 'L'], description: '複製連結' },
        { keys: ['Space'], description: '預覽檔案' },
        { keys: ['Esc'], description: '取消操作' },
        { keys: ['?'], description: '顯示快捷鍵說明' }
      ],

      // 網路狀態
      isOnline: navigator.onLine,
      isBackendOnline: true,
      showBackendStatus: false,
      backendStatusMessage: '正在檢查連接...',

      // 計時器
      timers: new Map()
    }
  },

  computed: {
    confirmIconClass() {
      const classes = {
        info: 'icon-info',
        success: 'icon-success',
        warning: 'icon-warning',
        error: 'icon-error',
        danger: 'icon-danger'
      };
      return classes[this.confirmType] || 'icon-info';
    },

    confirmIconName() {
      const icons = {
        info: 'bi-info-circle-fill',
        success: 'bi-check-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        error: 'bi-exclamation-octagon-fill',
        danger: 'bi-exclamation-octagon-fill'
      };
      return icons[this.confirmType] || 'bi-info-circle-fill';
    },

    confirmButtonClass() {
      const classes = {
        info: 'btn btn-primary',
        success: 'btn btn-success',
        warning: 'btn btn-warning',
        error: 'btn btn-danger',
        danger: 'btn btn-danger'
      };
      return classes[this.confirmType] || 'btn btn-primary';
    },

    tooltipStyles() {
      return {
        left: this.tooltipX + 'px',
        top: this.tooltipY + 'px'
      };
    }
  },

  mounted() {
    // 監聽全域事件
    this.$eventBus.$on('show-loading', this.handleShowLoading);
    this.$eventBus.$on('hide-loading', this.hideGlobalLoading);
    this.$eventBus.$on('show-toast', this.handleShowToast);
    this.$eventBus.$on('show-confirm', this.handleShowConfirm);
    this.$eventBus.$on('show-empty-state', this.handleShowEmptyState);
    this.$eventBus.$on('hide-empty-state', this.hideEmptyState);
    this.$eventBus.$on('show-progress', this.handleShowProgress);
    this.$eventBus.$on('update-progress', this.handleUpdateProgress);
    this.$eventBus.$on('hide-progress', this.hideProgressBar);
    this.$eventBus.$on('show-tooltip', this.handleShowTooltip);
    this.$eventBus.$on('hide-tooltip', this.hideTooltip);

    // 監聽網路狀態
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // 監聽鍵盤事件
    document.addEventListener('keydown', this.handleGlobalKeydown);

    console.log('🎛️ 通用組件已掛載');
  },

  beforeDestroy() {
    // 清理事件監聽器
    this.$eventBus.$off('show-loading', this.handleShowLoading);
    this.$eventBus.$off('hide-loading', this.hideGlobalLoading);
    this.$eventBus.$off('show-toast', this.handleShowToast);
    this.$eventBus.$off('show-confirm', this.handleShowConfirm);
    this.$eventBus.$off('show-empty-state', this.handleShowEmptyState);
    this.$eventBus.$off('hide-empty-state', this.hideEmptyState);
    this.$eventBus.$off('show-progress', this.handleShowProgress);
    this.$eventBus.$off('update-progress', this.handleUpdateProgress);
    this.$eventBus.$off('hide-progress', this.hideProgressBar);
    this.$eventBus.$off('show-tooltip', this.handleShowTooltip);
    this.$eventBus.$off('hide-tooltip', this.hideTooltip);

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('keydown', this.handleGlobalKeydown);

    // 清理計時器
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  },

  methods: {
    // ==========================================
    // 載入指示器相關
    // ==========================================

    handleShowLoading(data) {
      this.showGlobalLoading = true;
      this.globalLoadingMessage = data.message || '載入中...';
      this.showCancelButton = data.showCancel || false;
    },

    hideGlobalLoading() {
      this.showGlobalLoading = false;
      this.showCancelButton = false;
    },

    cancelLoading() {
      this.$eventBus.$emit('loading-cancelled');
      this.hideGlobalLoading();
    },

    showInlineLoadingState(message = '處理中...') {
      this.showInlineLoading = true;
      this.inlineLoadingMessage = message;
    },

    hideInlineLoadingState() {
      this.showInlineLoading = false;
    },

    // ==========================================
    // Toast 通知相關
    // ==========================================

    handleShowToast(data) {
      const { type = 'info', message, duration = 0 } = data;
      this.showToast(type, message, duration);
    },

    showToast(type, message, duration = 0) {
      const toast = {
        id: this.toastIdCounter++,
        message: message,
        timestamp: new Date(),
        type: type
      };

      // 添加到對應的 toast 陣列
      switch (type) {
        case 'success':
          this.successToasts.push(toast);
          if (!duration) duration = 3000;
          break;
        case 'error':
          this.errorToasts.push(toast);
          if (!duration) duration = 5000;
          break;
        case 'warning':
          this.warningToasts.push(toast);
          if (!duration) duration = 4000;
          break;
        case 'info':
        default:
          this.infoToasts.push(toast);
          if (!duration) duration = 3000;
          break;
      }

      // 自動移除
      if (duration > 0) {
        const timer = setTimeout(() => {
          this.removeToast(type, toast.id);
        }, duration);
        this.timers.set(`toast_${toast.id}`, timer);
      }

      console.log(`📢 顯示 ${type} 通知:`, message);
    },

    removeToast(type, id) {
      let toastArray;
      switch (type) {
        case 'success': toastArray = this.successToasts; break;
        case 'error': toastArray = this.errorToasts; break;
        case 'warning': toastArray = this.warningToasts; break;
        case 'info': toastArray = this.infoToasts; break;
        default: return;
      }

      const index = toastArray.findIndex(toast => toast.id === id);
      if (index !== -1) {
        toastArray.splice(index, 1);
      }

      // 清理計時器
      const timer = this.timers.get(`toast_${id}`);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(`toast_${id}`);
      }
    },

    getTimeAgo(timestamp) {
      const now = new Date();
      const diff = now - timestamp;
      const seconds = Math.floor(diff / 1000);

      if (seconds < 60) return '剛剛';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}分鐘前`;
      return `${Math.floor(seconds / 3600)}小時前`;
    },

    // ==========================================
    // 確認對話框相關
    // ==========================================

    handleShowConfirm(data) {
      const {
        title = '確認',
        message = '',
        type = 'info',
        okText = '確定',
        cancelText = '取消',
        callback = null
      } = data;

      this.confirmTitle = title;
      this.confirmMessage = message;
      this.confirmType = type;
      this.confirmOkText = okText;
      this.confirmCancelText = cancelText;
      this.confirmCallback = callback;
      this.showConfirmDialog = true;
    },

    handleConfirmOk() {
      if (this.confirmCallback) {
        this.confirmCallback(true);
      }
      this.hideConfirmDialog();
    },

    handleConfirmCancel() {
      if (this.confirmCallback) {
        this.confirmCallback(false);
      }
      this.hideConfirmDialog();
    },

    handleDialogBackdrop() {
      this.handleConfirmCancel();
    },

    hideConfirmDialog() {
      this.showConfirmDialog = false;
      this.confirmCallback = null;
    },

    // ==========================================
    // 空狀態相關
    // ==========================================

    handleShowEmptyState(data) {
      const {
        icon = 'bi-folder2-open',
        title = '沒有資料',
        description = '目前沒有可顯示的內容',
        actions = []
      } = data;

      this.emptyStateIcon = icon;
      this.emptyStateTitle = title;
      this.emptyStateDescription = description;
      this.emptyStateActions = actions;
      this.showEmptyState = true;
    },

    hideEmptyState() {
      this.showEmptyState = false;
    },

    handleEmptyStateAction(action) {
      if (action.callback) {
        action.callback();
      }
      this.$eventBus.$emit('empty-state-action', action);
    },

    // ==========================================
    // 進度條相關
    // ==========================================

    handleShowProgress(data) {
      const {
        label = '進度',
        value = 0,
        subtext = '',
        className = 'bg-primary'
      } = data;

      this.progressLabel = label;
      this.progressValue = value;
      this.progressSubtext = subtext;
      this.progressBarClass = className;
      this.showProgressBar = true;
    },

    handleUpdateProgress(data) {
      if (this.showProgressBar) {
        this.progressValue = data.value || 0;
        if (data.label) this.progressLabel = data.label;
        if (data.subtext) this.progressSubtext = data.subtext;
        if (data.className) this.progressBarClass = data.className;
      }
    },

    hideProgressBar() {
      this.showProgressBar = false;
    },

    // ==========================================
    // 工具提示相關
    // ==========================================

    handleShowTooltip(data) {
      const { text, x, y } = data;
      this.tooltipText = text;
      this.tooltipX = x;
      this.tooltipY = y;
      this.showTooltip = true;

      // 自動隱藏
      const timer = setTimeout(() => {
        this.hideTooltip();
      }, 3000);
      this.timers.set('tooltip', timer);
    },

    hideTooltip() {
      this.showTooltip = false;
      const timer = this.timers.get('tooltip');
      if (timer) {
        clearTimeout(timer);
        this.timers.delete('tooltip');
      }
    },

    // ==========================================
    // 鍵盤快捷鍵相關
    // ==========================================

    handleGlobalKeydown(event) {
      // 顯示快捷鍵幫助
      if (event.key === '?' && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        this.showKeyboardHelp = true;
      }

      // ESC 關閉所有 Modal
      if (event.key === 'Escape') {
        if (this.showKeyboardHelp) {
          this.hideKeyboardHelp();
        } else if (this.showConfirmDialog) {
          this.handleConfirmCancel();
        }
      }
    },

    hideKeyboardHelp() {
      this.showKeyboardHelp = false;
    },

    // ==========================================
    // 網路狀態相關
    // ==========================================

    handleOnline() {
      this.isOnline = true;
      this.showToast('success', '網路連接已恢復');
    },

    handleOffline() {
      this.isOnline = false;
      this.showToast('warning', '網路連接已中斷', 0);
    },

    checkNetworkStatus() {
      if (navigator.onLine) {
        this.handleOnline();
      } else {
        this.showToast('error', '網路仍然無法連接');
      }
    },

    // ==========================================
    // 後端狀態相關
    // ==========================================

    updateBackendStatus(isOnline, message = '') {
      this.isBackendOnline = isOnline;
      this.backendStatusMessage = message;
      this.showBackendStatus = !isOnline;
    },

    // ==========================================
    // 公用方法
    // ==========================================

    showSuccess(message, duration = 3000) {
      this.showToast('success', message, duration);
    },

    showError(message, duration = 5000) {
      this.showToast('error', message, duration);
    },

    showWarning(message, duration = 4000) {
      this.showToast('warning', message, duration);
    },

    showInfo(message, duration = 3000) {
      this.showToast('info', message, duration);
    },

    confirm(title, message, type = 'info') {
      return new Promise((resolve) => {
        this.handleShowConfirm({
          title,
          message,
          type,
          callback: resolve
        });
      });
    }
  }
}
</script>
