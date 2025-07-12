<template>
    <div class="confirm-dialog-modal">
        <!-- 模態框背景 -->
        <div class="modal-backdrop" @click="handleBackdropClick"></div>

        <!-- 模態框內容 -->
        <div class="modal-content" :class="typeClass">
            <!-- 模態框頭部 -->
            <div class="modal-header">
                <div class="header-icon" :class="iconClass">
                    <i class="bi" :class="iconName"></i>
                </div>
                <div class="header-content">
                    <h5 class="modal-title">{{ title }}</h5>
                    <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
                </div>
                <button v-if="showCloseButton"
                        type="button"
                        class="btn-close"
                        @click="handleCancel"
                        title="關閉">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <!-- 模態框主體 -->
            <div class="modal-body">
                <!-- 主要訊息 -->
                <div class="message-content">
                    <p class="message-text">{{ message }}</p>
                </div>

                <!-- 詳細資訊 -->
                <div v-if="details" class="details-section">
                    <div class="details-toggle" @click="toggleDetails">
                        <i class="bi" :class="showDetails ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
                        <span>詳細資訊</span>
                    </div>
                    <div v-show="showDetails" class="details-content">
                        <div v-if="typeof details === 'string'" class="details-text">
                            {{ details }}
                        </div>
                        <div v-else class="details-list">
                            <div v-for="(item, index) in details" :key="index" class="detail-item">
                                <span v-if="typeof item === 'string'">{{ item }}</span>
                                <div v-else>
                                    <strong v-if="item.title">{{ item.title }}:</strong>
                                    <span>{{ item.content }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 輸入欄位（如果需要）-->
                <div v-if="requireInput" class="input-section">
                    <label :for="inputId" class="form-label">{{ inputLabel }}</label>
                    <input :id="inputId"
                           ref="inputField"
                           v-model="inputValue"
                           :type="inputType"
                           class="form-control"
                           :class="{ 'is-invalid': inputError }"
                           :placeholder="inputPlaceholder"
                           @keyup.enter="handleConfirm"
                           @keyup.escape="handleCancel">
                    <div v-if="inputError" class="invalid-feedback">
                        {{ inputError }}
                    </div>
                    <div v-if="inputHelp" class="form-text">
                        {{ inputHelp }}
                    </div>
                </div>

                <!-- 選項清單（如果需要）-->
                <div v-if="options && options.length > 0" class="options-section">
                    <div class="form-check" v-for="option in options" :key="option.value">
                        <input class="form-check-input"
                               type="radio"
                               :id="`option_${option.value}`"
                               :value="option.value"
                               v-model="selectedOption">
                        <label class="form-check-label" :for="`option_${option.value}`">
                            {{ option.label }}
                        </label>
                        <small v-if="option.description" class="text-muted d-block">
                            {{ option.description }}
                        </small>
                    </div>
                </div>

                <!-- 警告訊息 -->
                <div v-if="warning" class="warning-section">
                    <div class="alert alert-warning d-flex align-items-center">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        <div>{{ warning }}</div>
                    </div>
                </div>
            </div>

            <!-- 模態框底部 -->
            <div class="modal-footer">
                <!-- 左側額外資訊 -->
                <div class="footer-info">
                    <small v-if="footerInfo" class="text-muted">
                        {{ footerInfo }}
                    </small>
                </div>

                <!-- 右側按鈕組 -->
                <div class="footer-actions">
                    <!-- 取消按鈕 -->
                    <button type="button"
                            class="btn btn-secondary"
                            @click="handleCancel"
                            :disabled="isProcessing">
                        {{ cancelText }}
                    </button>

                    <!-- 確認按鈕 -->
                    <button type="button"
                            class="btn"
                            :class="confirmButtonClass"
                            @click="handleConfirm"
                            :disabled="!canConfirm">
                        <span v-if="isProcessing" class="spinner-border spinner-border-sm me-2" role="status">
                            <span class="visually-hidden">處理中...</span>
                        </span>
                        <i v-if="!isProcessing && confirmIcon" class="bi me-1" :class="confirmIcon"></i>
                        {{ isProcessing ? processingText : confirmText }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
module.exports = {
  props: {
    // 基本屬性
    title: {
      type: String,
      default: '確認操作'
    },
    subtitle: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'confirm',
      validator: value => ['confirm', 'warning', 'danger', 'info', 'success'].includes(value)
    },

    // 按鈕文字
    confirmText: {
      type: String,
      default: '確定'
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    processingText: {
      type: String,
      default: '處理中...'
    },

    // 詳細資訊
    details: {
      type: [String, Array],
      default: null
    },

    // 警告訊息
    warning: {
      type: String,
      default: ''
    },

    // 底部資訊
    footerInfo: {
      type: String,
      default: ''
    },

    // 輸入相關
    requireInput: {
      type: Boolean,
      default: false
    },
    inputLabel: {
      type: String,
      default: '請輸入'
    },
    inputType: {
      type: String,
      default: 'text'
    },
    inputPlaceholder: {
      type: String,
      default: ''
    },
    inputHelp: {
      type: String,
      default: ''
    },
    inputRequired: {
      type: Boolean,
      default: true
    },

    // 選項相關
    options: {
      type: Array,
      default: () => []
    },

    // UI 設定
    showCloseButton: {
      type: Boolean,
      default: true
    },
    closeOnBackdrop: {
      type: Boolean,
      default: false
    },
    autoFocus: {
      type: Boolean,
      default: true
    },

    // 處理狀態
    isProcessing: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      // 輸入值
      inputValue: '',
      inputError: '',

      // 選擇的選項
      selectedOption: null,

      // UI 狀態
      showDetails: false,

      // 元素 ID
      inputId: `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  },

  computed: {
    // 對話框類型樣式類
    typeClass() {
      return `dialog-${this.type}`;
    },

    // 圖標樣式類
    iconClass() {
      const classes = {
        confirm: 'icon-primary',
        warning: 'icon-warning',
        danger: 'icon-danger',
        info: 'icon-info',
        success: 'icon-success'
      };
      return classes[this.type] || 'icon-primary';
    },

    // 圖標名稱
    iconName() {
      const icons = {
        confirm: 'bi-question-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        danger: 'bi-exclamation-octagon-fill',
        info: 'bi-info-circle-fill',
        success: 'bi-check-circle-fill'
      };
      return icons[this.type] || 'bi-question-circle-fill';
    },

    // 確認按鈕樣式類
    confirmButtonClass() {
      const classes = {
        confirm: 'btn-primary',
        warning: 'btn-warning',
        danger: 'btn-danger',
        info: 'btn-info',
        success: 'btn-success'
      };
      return classes[this.type] || 'btn-primary';
    },

    // 確認按鈕圖標
    confirmIcon() {
      const icons = {
        confirm: 'bi-check-lg',
        warning: 'bi-exclamation-triangle',
        danger: 'bi-trash',
        info: 'bi-info-lg',
        success: 'bi-check-lg'
      };
      return icons[this.type] || null;
    },

    // 是否可以確認
    canConfirm() {
      if (this.isProcessing) return false;

      // 如果需要輸入
      if (this.requireInput) {
        if (this.inputRequired && !this.inputValue.trim()) return false;
        if (this.inputError) return false;
      }

      // 如果有選項但未選擇
      if (this.options.length > 0 && !this.selectedOption) return false;

      return true;
    }
  },

  mounted() {
    // 自動聚焦
    if (this.autoFocus) {
      this.$nextTick(() => {
        if (this.requireInput && this.$refs.inputField) {
          this.$refs.inputField.focus();
        }
      });
    }

    // 監聽鍵盤事件
    document.addEventListener('keydown', this.handleKeydown);

    // 設置初始選項
    if (this.options.length > 0 && !this.selectedOption) {
      const defaultOption = this.options.find(opt => opt.default);
      if (defaultOption) {
        this.selectedOption = defaultOption.value;
      }
    }

    console.log('🔔 確認對話框已掛載:', {
      title: this.title,
      type: this.type,
      requireInput: this.requireInput,
      hasOptions: this.options.length > 0
    });
  },

  beforeDestroy() {
    // 清理事件監聽器
    document.removeEventListener('keydown', this.handleKeydown);
  },

  watch: {
    inputValue(newValue) {
      this.validateInput(newValue);
    }
  },

  methods: {
    // ==========================================
    // 事件處理
    // ==========================================

    handleConfirm() {
      if (!this.canConfirm) return;

      // 最終驗證
      if (this.requireInput && !this.validateInput(this.inputValue)) {
        return;
      }

      const result = {
        confirmed: true,
        inputValue: this.requireInput ? this.inputValue.trim() : null,
        selectedOption: this.selectedOption
      };

      console.log('✅ 確認對話框：確認', result);
      this.$emit('confirm', result);
    },

    handleCancel() {
      if (this.isProcessing) {
        const confirmCancel = confirm('操作正在處理中，確定要取消嗎？');
        if (!confirmCancel) return;
      }

      console.log('❌ 確認對話框：取消');
      this.$emit('cancel', { confirmed: false });
    },

    handleBackdropClick() {
      if (this.closeOnBackdrop) {
        this.handleCancel();
      }
    },

    handleKeydown(event) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          this.handleCancel();
          break;
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.handleConfirm();
          }
          break;
      }
    },

    // ==========================================
    // UI 控制
    // ==========================================

    toggleDetails() {
      this.showDetails = !this.showDetails;
    },

    // ==========================================
    // 輸入驗證
    // ==========================================

    validateInput(value) {
      this.inputError = '';

      if (!value || typeof value !== 'string') {
        if (this.inputRequired) {
          this.inputError = '此欄位為必填';
          return false;
        }
        return true;
      }

      const trimmedValue = value.trim();

      // 基本長度檢查
      if (this.inputRequired && trimmedValue.length === 0) {
        this.inputError = '此欄位不能為空';
        return false;
      }

      // 根據輸入類型進行特定驗證
      switch (this.inputType) {
        case 'email':
          if (trimmedValue && !this.isValidEmail(trimmedValue)) {
            this.inputError = '請輸入有效的電子郵件地址';
            return false;
          }
          break;
        case 'url':
          if (trimmedValue && !this.isValidUrl(trimmedValue)) {
            this.inputError = '請輸入有效的網址';
            return false;
          }
          break;
        case 'number':
          if (trimmedValue && isNaN(Number(trimmedValue))) {
            this.inputError = '請輸入有效的數字';
            return false;
          }
          break;
      }

      return true;
    },

    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    isValidUrl(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }
  }
}
</script>


