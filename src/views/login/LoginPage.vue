<template>
  <div class="auth-page">
    <div class="bg-glow glow-left"></div>
    <div class="bg-glow glow-right"></div>

    <div class="auth-container">
      <section class="brand-panel">
        <p class="brand-kicker">Sun Mall</p>
        <h1>阳光商城</h1>
        <p class="brand-desc">
          精选好物，轻松购物。登录后可使用购物车、历史订单与智能搜索等完整功能。
        </p>

        <div class="feature-list">
          <div class="feature-item">
            <i class="el-icon-search"></i>
            <span>关键字与图像双搜索</span>
          </div>
          <div class="feature-item">
            <i class="el-icon-goods"></i>
            <span>实时库存与价格同步</span>
          </div>
          <div class="feature-item">
            <i class="el-icon-shopping-cart-full"></i>
            <span>购物车与订单全流程体验</span>
          </div>
        </div>

        <el-button type="text" class="home-link" @click="$router.push('/')">
          返回首页
        </el-button>
      </section>

      <section class="form-panel">
        <div class="form-shell">
          <div class="form-header">
            <h2>{{ isRegister ? '创建账号' : '欢迎登录' }}</h2>
            <p>{{ isRegister ? '注册后即可开始购物体验' : '登录后可查看订单与购物车' }}</p>
          </div>

          <el-form
            ref="form"
            :model="formModel"
            :rules="rules"
            size="large"
            autocomplete="off"
            class="form"
            label-position="top"
            @keyup.enter.native="handleSubmit"
          >
            <el-form-item prop="username" label="用户名">
              <el-input
                v-model="formModel.username"
                prefix-icon="el-icon-user"
                placeholder="请输入用户名（3-16位字母或数字）"
                clearable
              ></el-input>
              <div class="hint">用户名仅支持字母与数字，长度 3-16 位</div>
            </el-form-item>

            <el-form-item prop="password" label="密码">
              <el-input
                v-model="formModel.password"
                prefix-icon="el-icon-lock"
                type="password"
                placeholder="请输入密码（3-16位字母或数字）"
                show-password
              ></el-input>
              <div class="hint">密码仅支持字母与数字，长度 3-16 位</div>
            </el-form-item>

            <el-form-item prop="code" label="验证码">
              <div class="code-container">
                <el-input
                  v-model="formModel.code"
                  prefix-icon="el-icon-key"
                  placeholder="请输入4位验证码"
                  maxlength="4"
                  clearable
                ></el-input>
                <img
                  class="captcha-image"
                  @click="getCode"
                  :src="imageData"
                  alt="验证码"
                  title="点击刷新验证码"
                />
              </div>
            </el-form-item>

            <el-form-item class="submit-wrap">
              <el-button
                class="submit-btn"
                type="primary"
                :disabled="submitting"
                :loading="submitting"
                @click="handleSubmit"
              >
                {{ isRegister ? '立即注册' : '立即登录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="switch-row">
            <span>{{ isRegister ? '已有账号？' : '还没有账号？' }}</span>
            <el-link type="primary" :underline="false" @click="toggleMode">
              {{ isRegister ? '去登录' : '去注册' }}
            </el-link>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { getCode, register, login } from '@/api/user'
import { mapActions } from 'vuex'

export default {
  name: 'LoginPage',
  data () {
    return {
      formModel: {
        username: '',
        password: '',
        code: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 16, message: '用户名长度为 3-16 位', trigger: 'blur' },
          {
            validator: (rule, value, cb) => {
              const ok = /^[a-zA-Z0-9]+$/.test(value || '')
              cb(ok ? undefined : new Error('用户名只能是字母和数字'))
            },
            trigger: 'blur'
          }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 3, max: 16, message: '密码长度为 3-16 位', trigger: 'blur' },
          {
            validator: (rule, value, cb) => {
              const ok = /^[a-zA-Z0-9]+$/.test(value || '')
              cb(ok ? undefined : new Error('密码只能是字母和数字'))
            },
            trigger: 'blur'
          }
        ],
        code: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
          {
            validator: (rule, value, cb) => {
              const ok = /^[a-zA-Z0-9]{4}$/.test(value || '')
              cb(ok ? undefined : new Error('验证码为 4 位字母或数字'))
            },
            trigger: 'blur'
          }
        ]
      },
      isRegister: false,
      imageData: '',
      sessionId: '',
      submitting: false
    }
  },
  methods: {
    ...mapActions('user', ['setSessionId', 'setUser']),

    resetForm () {
      this.formModel = {
        username: '',
        password: '',
        code: ''
      }
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    },

    async getCode () {
      try {
        const res = await getCode()
        this.imageData = `data:image/png;base64,${res.imageData}`
        this.sessionId = res.sessionId
        this.setSessionId(this.sessionId)
      } catch (err) {
        this.$message.error('获取验证码失败，请稍后重试')
      }
    },

    async handleSubmit () {
      if (!this.$refs.form) return

      try {
        const valid = await this.$refs.form.validate().catch(() => false)
        if (!valid) return

        this.submitting = true

        const payload = {
          ...this.formModel,
          sessionId: this.sessionId
        }

        if (this.isRegister) {
          await register(payload)
          this.$message.success('注册成功，请登录')
          this.isRegister = false
          this.resetForm()
          await this.getCode()
          return
        }

        const res = await login(payload)
        this.setUser(res)
        this.$message.success('登录成功')
        this.$router.push('/')
      } catch (err) {
        const fallbackMessage = this.isRegister
          ? '注册失败，请稍后重试'
          : '登录失败，请检查用户名、密码和验证码'
        this.$message.error(err && err.message ? err.message : fallbackMessage)
      } finally {
        this.submitting = false
      }
    },

    toggleMode () {
      this.isRegister = !this.isRegister
      this.resetForm()
      this.getCode()
    }
  },
  mounted () {
    this.getCode()
  }
}
</script>

<style scoped lang="scss">
.auth-page {
  --primary: #eb5757;
  --primary-deep: #cc4242;
  --text-main: #1f2937;
  --text-sub: #6b7280;
  --border-color: #e7ecf3;
  --card-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  color: var(--text-main);
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
  background: radial-gradient(circle at 10% 10%, rgba(255, 215, 188, 0.32), transparent 34%),
    radial-gradient(circle at 92% 0, rgba(255, 246, 216, 0.45), transparent 38%),
    #f6f8fb;
}

.bg-glow {
  position: absolute;
  width: 380px;
  height: 380px;
  border-radius: 999px;
  filter: blur(14px);
  opacity: 0.5;
  pointer-events: none;
}

.glow-left {
  left: -140px;
  bottom: -110px;
  background: rgba(246, 127, 103, 0.26);
}

.glow-right {
  right: -120px;
  top: -140px;
  background: rgba(253, 214, 150, 0.32);
}

.auth-container {
  position: relative;
  z-index: 1;
  width: min(1060px, calc(100% - 32px));
  display: grid;
  grid-template-columns: 1.05fr minmax(360px, 420px);
  gap: 22px;
  align-items: stretch;
}

.brand-panel {
  border-radius: 22px;
  padding: 36px;
  border: 1px solid var(--border-color);
  background: linear-gradient(140deg, #ffffff 0%, #fff9f4 100%);
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
}

.brand-kicker {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #ef6f6f;
}

.brand-panel h1 {
  margin: 10px 0 14px;
  font-size: 38px;
  line-height: 1.2;
  color: #111827;
}

.brand-desc {
  margin: 0;
  max-width: 540px;
  font-size: 15px;
  line-height: 1.8;
  color: #475569;
}

.feature-list {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #334155;
  font-size: 15px;
}

.feature-item i {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #d64e4e;
  background: #fff1ec;
}

.home-link {
  margin-top: auto;
  padding: 0;
  align-self: flex-start;
}

.home-link ::v-deep .el-button--text {
  color: #4b5563;
}

.home-link ::v-deep .el-button--text:hover {
  color: var(--primary);
}

.form-panel {
  display: flex;
  align-items: stretch;
}

.form-shell {
  width: 100%;
  border-radius: 22px;
  padding: 30px 28px 22px;
  background: #ffffff;
  border: 1px solid var(--border-color);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.1);
}

.form-header h2 {
  margin: 0;
  font-size: 30px;
  color: #111827;
}

.form-header p {
  margin: 8px 0 0;
  color: var(--text-sub);
  font-size: 14px;
}

.form {
  margin-top: 20px;
}

.form ::v-deep .el-form-item {
  margin-bottom: 16px;
}

.form ::v-deep .el-form-item__label {
  padding-bottom: 8px;
  color: #334155;
  font-size: 14px;
  line-height: 1.3;
}

.form ::v-deep .el-input__inner {
  height: 44px;
  border-radius: 12px;
  border: 1px solid #dbe3ef;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form ::v-deep .el-input__inner:focus {
  border-color: #ff9f8a;
  box-shadow: 0 0 0 4px rgba(245, 120, 90, 0.15);
}

.form ::v-deep .el-input__prefix {
  color: #94a3b8;
}

.hint {
  margin-top: 7px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

.code-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.code-container .el-input {
  flex: 1;
  min-width: 0;
}

.captcha-image {
  width: 114px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid #e4e9f2;
  object-fit: fill;
  cursor: pointer;
  background: #fff;
  display: block;
}

.submit-wrap {
  margin-top: 6px;
}

.submit-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(120deg, #ef6b6b, var(--primary));
  box-shadow: 0 10px 18px rgba(235, 87, 87, 0.28);
}

.submit-btn:hover,
.submit-btn:focus {
  background: linear-gradient(120deg, #e55e5e, var(--primary-deep));
}

.submit-btn.is-disabled,
.submit-btn.is-loading {
  opacity: 0.92;
}

.switch-row {
  margin-top: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-sub);
}

@media (max-width: 980px) {
  .auth-container {
    width: min(720px, calc(100% - 24px));
    grid-template-columns: 1fr;
  }

  .brand-panel {
    padding: 28px;
  }

  .brand-panel h1 {
    font-size: 32px;
  }
}

@media (max-width: 640px) {
  .auth-page {
    padding: 16px 0;
  }

  .auth-container {
    width: calc(100% - 20px);
    gap: 12px;
  }

  .brand-panel {
    padding: 22px 18px;
  }

  .feature-list {
    margin-top: 20px;
  }

  .form-shell {
    border-radius: 18px;
    padding: 22px 16px 16px;
  }

  .form-header h2 {
    font-size: 26px;
  }

  .code-container {
    flex-direction: column;
    align-items: stretch;
  }

  .captcha-image {
    width: 100%;
    height: 42px;
  }
}
</style>
