<!-- FrontendUI/assets/js/components/Modal.vue -->
<template>
    <div class="modal fade" :id="modalId" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog" :class="modalClass">
            <div class="modal-content">
                <!-- Modal Header -->
                <div class="modal-header" v-if="showHeader">
                    <h5 class="modal-title">
                        <i v-if="icon" :class="icon" class="me-2"></i>
                        {{ title }}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" @click="closeModal"></button>
                </div>

                <!-- Modal Body -->
                <div class="modal-body" :class="bodyClass">
                    <slot></slot>
                </div>

                <!-- Modal Footer -->
                <div class="modal-footer" v-if="showFooter">
                    <slot name="footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closeModal">
                            {{ cancelText }}
                        </button>
                        <button v-if="showConfirmButton"
                                type="button"
                                class="btn"
                                :class="confirmButtonClass"
                                @click="confirmAction"
                                :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            {{ loading ? loadingText : confirmText }}
                        </button>
                    </slot>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Modal',
    props: {
        // Modal 設定
        modalId: {
            type: String,
            default: () => 'modal_' + Date.now()
        },
        title: {
            type: String,
            default: ''
        },
        icon: {
            type: String,
            default: ''
        },
        size: {
            type: String,
            default: '', // '', 'sm', 'lg', 'xl'
            validator: value => ['', 'sm', 'lg', 'xl'].includes(value)
        },
        centered: {
            type: Boolean,
            default: false
        },
        scrollable: {
            type: Boolean,
            default: false
        },

        // 顯示控制
        showHeader: {
            type: Boolean,
            default: true
        },
        showFooter: {
            type: Boolean,
            default: true
        },
        showConfirmButton: {
            type: Boolean,
            default: true
        },

        // 按鈕文字
        cancelText: {
            type: String,
            default: '取消'
        },
        confirmText: {
            type: String,
            default: '確認'
        },
        loadingText: {
            type: String,
            default: '處理中...'
        },

        // 按鈕樣式
        confirmButtonClass: {
            type: String,
            default: 'btn-primary'
        },

        // 狀態
        loading: {
            type: Boolean,
            default: false
        },

        // 樣式類別
        bodyClass: {
            type: String,
            default: ''
        }
    },

    computed: {
        modalClass() {
            const classes = [];

            if (this.size) {
                classes.push(`modal-${this.size}`);
            }

            if (this.centered) {
                classes.push('modal-dialog-centered');
            }

            if (this.scrollable) {
                classes.push('modal-dialog-scrollable');
            }

            return classes.join(' ');
        }
    },

    mounted() {
        // 監聽 Bootstrap Modal 事件
        const modalElement = document.getElementById(this.modalId);
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', this.onModalHidden);
            modalElement.addEventListener('shown.bs.modal', this.onModalShown);
        }
    },

    beforeDestroy() {
        // 清理事件監聽器
        const modalElement = document.getElementById(this.modalId);
        if (modalElement) {
            modalElement.removeEventListener('hidden.bs.modal', this.onModalHidden);
            modalElement.removeEventListener('shown.bs.modal', this.onModalShown);
        }
    },

    methods: {
        // 顯示 Modal
        show() {
            const modal = new bootstrap.Modal(document.getElementById(this.modalId));
            modal.show();
        },

        // 隱藏 Modal
        hide() {
            const modal = bootstrap.Modal.getInstance(document.getElementById(this.modalId));
            if (modal) {
                modal.hide();
            }
        },

        // 關閉 Modal
        closeModal() {
            this.$emit('close');
            this.hide();
        },

        // 確認操作
        confirmAction() {
            this.$emit('confirm');
        },

        // Modal 隱藏後事件
        onModalHidden() {
            this.$emit('hidden');
        },

        // Modal 顯示後事件
        onModalShown() {
            this.$emit('shown');
        }
    }
}
</script>

<style scoped>
    .modal-content {
        border: none;
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }

    .modal-header {
        border-bottom: 1px solid #dee2e6;
        padding: 1rem 1.5rem;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .modal-footer {
        border-top: 1px solid #dee2e6;
        padding: 1rem 1.5rem;
    }

    .modal-title {
        font-weight: 600;
        margin: 0;
    }

    .btn-close {
        opacity: 0.5;
    }

        .btn-close:hover {
            opacity: 0.75;
        }
</style>