// assets/js/pages/register.js
new Vue({
    el: '#app',
    data: {
        form: {
            username: '',
            email: '',
            fullName: '',
            password: '',
            confirmPassword: ''
        },
        errors: {},
        loading: false,
        showPassword: false,
        showConfirmPassword: false
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
        async handleRegister() {
            // 清除之前的錯誤
            this.errors = {};

            // 前端驗證
            if (!this.validateForm()) {
                return;
            }

            this.loading = true;

            try {
                const result = await AuthAPI.register({
                    username: this.form.username.trim(),
                    email: this.form.email.trim().toLowerCase(),
                    fullName: this.form.fullName.trim(),
                    password: this.form.password,
                    confirmPassword: this.form.confirmPassword
                });

                if (result.success) {
                    Utils.showToast(result.message || MESSAGES.SUCCESS.REGISTER, 'success');

                    // 註冊成功後跳轉到登入頁面
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    Utils.showToast(result.message || MESSAGES.ERROR.REGISTER_FAILED, 'danger');

                    // 處理伺服器回傳的錯誤
                    if (result.errors && Array.isArray(result.errors)) {
                        result.errors.forEach(error => {
                            if (error.includes('使用者名稱') || error.includes('Username')) {
                                this.errors.username = error;
                            } else if (error.includes('電子郵件') || error.includes('Email')) {
                                this.errors.email = error;
                            } else if (error.includes('密碼') || error.includes('Password')) {
                                this.errors.password = error;
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Register error:', error);
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

            // 驗證電子郵件
            if (!this.form.email.trim()) {
                errors.email = '請輸入電子郵件';
            } else if (!this.isValidEmail(this.form.email)) {
                errors.email = '請輸入有效的電子郵件格式';
            } else if (this.form.email.length > 100) {
                errors.email = '電子郵件長度不能超過100個字元';
            }

            // 驗證姓名（可選）
            if (this.form.fullName && this.form.fullName.length > 100) {
                errors.fullName = '姓名長度不能超過100個字元';
            }

            // 驗證密碼
            if (!this.form.password) {
                errors.password = '請輸入密碼';
            } else if (this.form.password.length < 6) {
                errors.password = '密碼至少需要6個字元';
            } else if (this.form.password.length > 100) {
                errors.password = '密碼長度不能超過100個字元';
            }

            // 驗證確認密碼
            if (!this.form.confirmPassword) {
                errors.confirmPassword = '請再次輸入密碼';
            } else if (this.form.password !== this.form.confirmPassword) {
                errors.confirmPassword = '密碼與確認密碼不符';
            }

            this.errors = errors;
            return Object.keys(errors).length === 0;
        },

        isValidEmail(email) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        },

        togglePassword() {
            this.showPassword = !this.showPassword;
        },

        toggleConfirmPassword() {
            this.showConfirmPassword = !this.showConfirmPassword;
        },

        // 處理 Enter 鍵提交
        handleKeyPress(event) {
            if (event.key === 'Enter' && !this.loading) {
                this.handleRegister();
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
        'form.email'() {
            if (this.errors.email) {
                this.$delete(this.errors, 'email');
            }
        },
        'form.fullName'() {
            if (this.errors.fullName) {
                this.$delete(this.errors, 'fullName');
            }
        },
        'form.password'() {
            if (this.errors.password) {
                this.$delete(this.errors, 'password');
            }
            // 如果確認密碼已填寫且不匹配，重新驗證
            if (this.form.confirmPassword && this.form.password !== this.form.confirmPassword) {
                this.errors.confirmPassword = '密碼與確認密碼不符';
            } else if (this.errors.confirmPassword && this.form.password === this.form.confirmPassword) {
                this.$delete(this.errors, 'confirmPassword');
            }
        },
        'form.confirmPassword'() {
            if (this.errors.confirmPassword) {
                // 如果密碼匹配，清除錯誤
                if (this.form.password === this.form.confirmPassword) {
                    this.$delete(this.errors, 'confirmPassword');
                }
            }
            // 即時驗證密碼是否匹配
            if (this.form.confirmPassword && this.form.password !== this.form.confirmPassword) {
                this.errors.confirmPassword = '密碼與確認密碼不符';
            }
        }
    }
});