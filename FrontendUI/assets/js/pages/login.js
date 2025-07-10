// assets/js/pages/login.js
new Vue({
    el: '#app',
    data: {
        form: {
            username: '',
            password: ''
        },
        errors: {},
        loading: false,
        showPassword: false
    },
    mounted() {
        // 如果已經登入，跳轉到檔案管理頁面
        if (Auth.isLoggedIn()) {
            window.location.href = 'files.html';
            return;
        }

        // 焦點設定到使用者名稱欄位
        this.$nextTick(() => {
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.focus();
            }
        });
    },
    methods: {
        async handleLogin() {
            // 清除之前的錯誤
            this.errors = {};

            // 前端驗證
            if (!this.validateForm()) {
                return;
            }

            this.loading = true;

            try {
                const result = await AuthAPI.login(this.form.username, this.form.password);

                if (result.success) {
                    Utils.showToast(result.message || MESSAGES.SUCCESS.LOGIN, 'success');

                    // 短暫延遲後跳轉，讓使用者看到成功訊息
                    setTimeout(() => {
                        window.location.href = 'files.html';
                    }, 1000);
                } else {
                    Utils.showToast(result.message || MESSAGES.ERROR.LOGIN_FAILED, 'danger');

                    // 如果是驗證錯誤，顯示在對應欄位
                    if (result.message.includes('使用者名稱') || result.message.includes('帳號')) {
                        this.errors.username = result.message;
                    } else if (result.message.includes('密碼')) {
                        this.errors.password = result.message;
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                Utils.showToast(MESSAGES.ERROR.NETWORK_ERROR, 'danger');
            } finally {
                this.loading = false;
            }
        },

        validateForm() {
            const errors = {};

            // 驗證使用者名稱
            if (!this.form.username.trim()) {
                errors.username = '請輸入使用者名稱';
            } else if (this.form.username.length < 3) {
                errors.username = '使用者名稱至少需要3個字元';
            } else if (this.form.username.length > 50) {
                errors.username = '使用者名稱不能超過50個字元';
            } else if (!/^[a-zA-Z0-9_]+$/.test(this.form.username)) {
                errors.username = '使用者名稱只能包含字母、數字和底線';
            }

            // 驗證密碼
            if (!this.form.password) {
                errors.password = '請輸入密碼';
            } else if (this.form.password.length < 6) {
                errors.password = '密碼至少需要6個字元';
            }

            this.errors = errors;
            return Object.keys(errors).length === 0;
        },

        togglePassword() {
            this.showPassword = !this.showPassword;
        },

        // 處理 Enter 鍵提交
        handleKeyPress(event) {
            if (event.key === 'Enter' && !this.loading) {
                this.handleLogin();
            }
        }
    },
    watch: {
        // 清除對應欄位的錯誤訊息
        'form.username'() {
            if (this.errors.username) {
                this.$delete(this.errors, 'username');
            }
        },
        'form.password'() {
            if (this.errors.password) {
                this.$delete(this.errors, 'password');
            }
        }
    }
});