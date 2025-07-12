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

<style scoped>
     /* ==========================================
    主容器
    ========================================== */

     .confirm-dialog-modal {
         position: fixed;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         display: flex;
         align-items: center;
         justify-content: center;
         z-index: 1055;
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
         border-radius: 16px;
         width: 90%;
         max-width: 500px;
         max-height: 90vh;
         position: relative;
         box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
         overflow: hidden;
         display: flex;
         flex-direction: column;
         animation: slideUp 0.4s ease-out;
     }

     /* ==========================================
    對話框類型樣式
    ========================================== */

     .dialog-confirm {
         border-top: 4px solid #007bff;
     }

     .dialog-warning {
         border-top: 4px solid #ffc107;
     }

     .dialog-danger {
         border-top: 4px solid #dc3545;
     }

     .dialog-info {
         border-top: 4px solid #17a2b8;
     }

     .dialog-success {
         border-top: 4px solid #28a745;
     }

     /* ==========================================
    模態框頭部
    ========================================== */

     .modal-header {
         display: flex;
         align-items: flex-start;
         padding: 24px 28px 16px;
         background: linear-gradient(135deg, #f8f9fa, #e9ecef);
         border-bottom: 1px solid #dee2e6;
         gap: 16px;
     }

     .header-icon {
         width: 48px;
         height: 48px;
         border-radius: 50%;
         display: flex;
         align-items: center;
         justify-content: center;
         flex-shrink: 0;
         box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
     }

         .header-icon i {
             font-size: 1.5rem;
             color: white;
         }

     .icon-primary {
         background: linear-gradient(135deg, #007bff, #0056b3);
     }

     .icon-warning {
         background: linear-gradient(135deg, #ffc107, #e0a800);
     }

     .icon-danger {
         background: linear-gradient(135deg, #dc3545, #bd2130);
     }

     .icon-info {
         background: linear-gradient(135deg, #17a2b8, #138496);
     }

     .icon-success {
         background: linear-gradient(135deg, #28a745, #1e7e34);
     }

     .header-content {
         flex: 1;
         min-width: 0;
     }

     .modal-title {
         margin: 0;
         font-size: 1.25rem;
         font-weight: 700;
         color: #212529;
         line-height: 1.3;
         margin-bottom: 4px;
     }

     .modal-subtitle {
         margin: 0;
         font-size: 0.9rem;
         color: #6c757d;
         font-weight: 500;
         line-height: 1.4;
     }

     .btn-close {
         background: none;
         border: none;
         color: #6c757d;
         font-size: 1rem;
         cursor: pointer;
         padding: 8px;
         border-radius: 50%;
         width: 36px;
         height: 36px;
         display: flex;
         align-items: center;
         justify-content: center;
         transition: all 0.3s ease;
         flex-shrink: 0;
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
         padding: 24px 28px;
         flex: 1;
         overflow-y: auto;
         max-height: calc(90vh - 200px);
     }

     .message-content {
         margin-bottom: 20px;
     }

     .message-text {
         font-size: 1rem;
         line-height: 1.6;
         color: #495057;
         margin: 0;
         word-wrap: break-word;
     }

     /* ==========================================
    詳細資訊區域
    ========================================== */

     .details-section {
         margin: 20px 0;
         border: 1px solid #e9ecef;
         border-radius: 8px;
         overflow: hidden;
     }

     .details-toggle {
         padding: 12px 16px;
         background: #f8f9fa;
         cursor: pointer;
         display: flex;
         align-items: center;
         gap: 8px;
         font-weight: 500;
         color: #495057;
         transition: all 0.3s ease;
         user-select: none;
     }

         .details-toggle:hover {
             background: #e9ecef;
             color: #212529;
         }

         .details-toggle i {
             font-size: 0.875rem;
             transition: transform 0.3s ease;
         }

     .details-content {
         padding: 16px;
         background: white;
         border-top: 1px solid #e9ecef;
         animation: slideDown 0.3s ease-out;
     }

     .details-text {
         font-size: 0.9rem;
         color: #6c757d;
         line-height: 1.5;
         white-space: pre-wrap;
     }

     .details-list {
         display: flex;
         flex-direction: column;
         gap: 8px;
     }

     .detail-item {
         font-size: 0.9rem;
         color: #6c757d;
         line-height: 1.5;
     }

         .detail-item strong {
             color: #495057;
             margin-right: 4px;
         }

     /* ==========================================
    輸入區域
    ========================================== */

     .input-section {
         margin: 20px 0;
     }

     .form-label {
         font-weight: 600;
         color: #495057;
         margin-bottom: 8px;
         display: block;
     }

     .form-control {
         border-radius: 8px;
         border: 2px solid #e9ecef;
         padding: 10px 12px;
         font-size: 0.95rem;
         transition: all 0.3s ease;
         width: 100%;
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
         line-height: 1.4;
     }

     /* ==========================================
    選項區域
    ========================================== */

     .options-section {
         margin: 20px 0;
         padding: 16px;
         background: #f8f9fa;
         border-radius: 8px;
         border: 1px solid #e9ecef;
     }

     .form-check {
         margin-bottom: 12px;
         display: flex;
         align-items: flex-start;
         gap: 8px;
     }

         .form-check:last-child {
             margin-bottom: 0;
         }

     .form-check-input {
         margin-top: 2px;
         cursor: pointer;
     }

     .form-check-label {
         cursor: pointer;
         font-weight: 500;
         color: #495057;
         margin-bottom: 0;
         line-height: 1.4;
     }

     .form-check small {
         margin-top: 4px;
         font-size: 0.8rem;
         line-height: 1.3;
     }

     /* ==========================================
    警告區域
    ========================================== */

     .warning-section {
         margin: 20px 0;
     }

     .alert {
         border-radius: 8px;
         border: none;
         padding: 12px 16px;
         font-weight: 500;
     }

     .alert-warning {
         background: linear-gradient(135deg, #fff3cd, #fdeaa7);
         color: #856404;
         border-left: 4px solid #ffc107;
     }

     .alert i {
         font-size: 1.1rem;
     }

     /* ==========================================
    模態框底部
    ========================================== */

     .modal-footer {
         display: flex;
         justify-content: space-between;
         align-items: center;
         padding: 16px 28px 24px;
         background: #f8f9fa;
         border-top: 1px solid #dee2e6;
     }

     .footer-info {
         flex: 1;
     }

         .footer-info small {
             color: #6c757d;
             font-weight: 500;
             font-size: 0.8rem;
         }

     .footer-actions {
         display: flex;
         gap: 12px;
         flex-shrink: 0;
     }

         .footer-actions .btn {
             padding: 8px 20px;
             font-weight: 600;
             border-radius: 8px;
             transition: all 0.3s ease;
             border: none;
             min-width: 80px;
             position: relative;
             overflow: hidden;
         }

             .footer-actions .btn:hover:not(:disabled) {
                 transform: translateY(-1px);
                 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
             }

             .footer-actions .btn:active:not(:disabled) {
                 transform: translateY(0);
             }

             .footer-actions .btn:disabled {
                 opacity: 0.6;
                 cursor: not-allowed;
                 transform: none;
             }

     .btn-secondary {
         background: linear-gradient(135deg, #6c757d, #545b62);
         color: white;
     }

     .btn-primary {
         background: linear-gradient(135deg, #007bff, #0056b3);
         color: white;
     }

     .btn-warning {
         background: linear-gradient(135deg, #ffc107, #e0a800);
         color: #212529;
     }

     .btn-danger {
         background: linear-gradient(135deg, #dc3545, #bd2130);
         color: white;
     }

     .btn-info {
         background: linear-gradient(135deg, #17a2b8, #138496);
         color: white;
     }

     .btn-success {
         background: linear-gradient(135deg, #28a745, #1e7e34);
         color: white;
     }

     /* 按鈕載入狀態 */
     .spinner-border-sm {
         width: 1rem;
         height: 1rem;
         border-width: 0.15em;
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

     @keyframes slideDown {
         from {
             opacity: 0;
             max-height: 0;
             padding-top: 0;
             padding-bottom: 0;
         }

         to {
             opacity: 1;
             max-height: 200px;
             padding-top: 16px;
             padding-bottom: 16px;
         }
     }

     /* ==========================================
    響應式設計
    ========================================== */

     /* 平板設備 (768px 以下) */
     @media (max-width: 768px) {
         .modal-content {
             width: 95%;
             margin: 20px;
             max-height: 95vh;
         }

         .modal-header {
             padding: 20px 24px 14px;
             gap: 12px;
         }

         .header-icon {
             width: 40px;
             height: 40px;
         }

             .header-icon i {
                 font-size: 1.25rem;
             }

         .modal-title {
             font-size: 1.1rem;
         }

         .modal-subtitle {
             font-size: 0.85rem;
         }

         .btn-close {
             width: 32px;
             height: 32px;
             font-size: 0.9rem;
         }

         .modal-body {
             padding: 20px 24px;
         }

         .message-text {
             font-size: 0.95rem;
         }

         .modal-footer {
             padding: 14px 24px 20px;
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
         .confirm-dialog-modal {
             padding: 10px;
         }

         .modal-content {
             width: 100%;
             margin: 0;
             border-radius: 12px;
             max-height: calc(100vh - 20px);
         }

         .modal-header {
             padding: 16px 20px 12px;
             gap: 10px;
         }

         .header-icon {
             width: 36px;
             height: 36px;
         }

             .header-icon i {
                 font-size: 1.1rem;
             }

         .modal-title {
             font-size: 1rem;
         }

         .modal-subtitle {
             font-size: 0.8rem;
         }

         .btn-close {
             width: 28px;
             height: 28px;
             font-size: 0.8rem;
         }

         .modal-body {
             padding: 16px 20px;
         }

         .message-text {
             font-size: 0.9rem;
         }

         .details-toggle {
             padding: 10px 12px;
             font-size: 0.9rem;
         }

         .details-content {
             padding: 12px;
         }

         .form-control {
             padding: 8px 10px;
             font-size: 0.9rem;
         }

         .modal-footer {
             padding: 12px 20px 16px;
         }

         .footer-actions .btn {
             font-size: 0.85rem;
             padding: 6px 16px;
         }

         .footer-info small {
             font-size: 0.75rem;
             text-align: center;
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

         .theme-auto .modal-title {
             color: #ffffff;
         }

         .theme-auto .modal-subtitle {
             color: #cccccc;
         }

         .theme-auto .btn-close {
             color: #cccccc;
         }

             .theme-auto .btn-close:hover {
                 background: rgba(255, 255, 255, 0.1);
                 color: #ffffff;
             }

         .theme-auto .modal-footer {
             background: #2a2a2a;
             border-top-color: #444444;
         }

         .theme-auto .message-text {
             color: #cccccc;
         }

         .theme-auto .details-toggle {
             background: #333333;
             color: #ffffff;
         }

             .theme-auto .details-toggle:hover {
                 background: #404040;
             }

         .theme-auto .details-content {
             background: #2a2a2a;
             border-top-color: #444444;
         }

         .theme-auto .details-text,
         .theme-auto .detail-item {
             color: #cccccc;
         }

         .theme-auto .form-control {
             background: #2a2a2a;
             border-color: #444444;
             color: #ffffff;
         }

             .theme-auto .form-control:focus {
                 border-color: #64b5f6;
             }

         .theme-auto .options-section {
             background: #2a2a2a;
             border-color: #444444;
         }

         .theme-auto .form-check-label {
             color: #ffffff;
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

     .theme-dark .modal-subtitle {
         color: #cccccc;
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

     .theme-dark .message-text {
         color: #cccccc;
     }

     .theme-dark .details-toggle {
         background: #333333;
         color: #ffffff;
     }

         .theme-dark .details-toggle:hover {
             background: #404040;
         }

     .theme-dark .details-content {
         background: #2a2a2a;
         border-top-color: #444444;
     }

     .theme-dark .details-text,
     .theme-dark .detail-item {
         color: #cccccc;
     }

         .theme-dark .detail-item strong {
             color: #ffffff;
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

     .theme-dark .form-text {
         color: #cccccc;
     }

     .theme-dark .options-section {
         background: #2a2a2a;
         border-color: #444444;
     }

     .theme-dark .form-check-label {
         color: #ffffff;
     }

     .theme-dark .footer-info small {
         color: #cccccc;
     }

     /* ==========================================
    可訪問性增強
    ========================================== */

     /* 減少動畫模式 */
     @media (prefers-reduced-motion: reduce) {
         .confirm-dialog-modal,
         .modal-content,
         .details-content,
         .btn,
         .form-control,
         .details-toggle i {
             animation: none;
             transition: none;
         }

             .btn:hover:not(:disabled),
             .form-control:focus {
                 transform: none;
             }
     }

     /* 高對比度模式 */
     @media (prefers-contrast: high) {
         .modal-content {
             border: 2px solid currentColor;
             box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
         }

         .modal-header,
         .modal-footer {
             border-width: 2px;
         }

         .form-control,
         .btn {
             border-width: 2px;
         }

         .details-section {
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

     .details-toggle:focus-visible {
         outline: 2px solid #007bff;
         outline-offset: 2px;
     }

     /* ==========================================
    打印樣式
    ========================================== */

     @media print {
         .confirm-dialog-modal {
             position: static;
             background: white;
             color: black;
         }

         .modal-backdrop {
             display: none;
         }

         .modal-content {
             box-shadow: none;
             border: 1px solid #000;
             max-width: 100%;
             max-height: none;
         }

         .modal-header,
         .modal-footer {
             background: #f5f5f5 !important;
         }

         .btn {
             display: none;
         }

         .footer-actions {
             display: none;
         }
     }
</style>
