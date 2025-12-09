<template>
  <div class="container">
    <!-- 背景装饰 -->
    <div class="bg-deco"></div>

    <!-- 登录/注册表单 -->
    <div class="login-page">
      <el-form
        :model="formModel"
        :rules="rules"
        ref="form"
        size="large"
        autocomplete="off"
        class="form"
        label-position="top"
      >
        <el-form-item>
          <h1 class="title">{{ isRegister ? '注册' : '登录' }}</h1>
          <div class="subtitle">
            阳光商城账户{{ isRegister ? '注册' : '登录' }}
          </div>
        </el-form-item>

        <el-form-item prop="username">
          <el-input
            prefix-icon="el-icon-user"
            placeholder="请输入用户名（仅数字与字母，3-16位）"
            v-model="formModel.username"
            clearable
          ></el-input>
          <div class="hint">用户名仅允许数字与字母，长度3-16</div>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="formModel.password"
            prefix-icon="el-icon-lock"
            type="password"
            placeholder="请输入密码（仅数字与字母，3-16位）"
            show-password
          ></el-input>
          <div class="hint">密码仅允许数字与字母，长度3-16</div>
        </el-form-item>

        <el-form-item class="code" prop="code">
          <div class="code-container">
            <el-input
              v-model="formModel.code"
              prefix-icon="el-icon-key"
              placeholder="请输入验证码（4位字母或数字）"
              clearable
            ></el-input>
            <img @click="getCode" :src="imageData" alt="验证码" />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            class="button"
            type="primary"
            auto-insert-space
            @click="handleSubmit"
            :disabled="submitting"
          >
            {{ isRegister ? '注册' : '登录' }}
          </el-button>
        </el-form-item>

        <el-form-item class="flex">
          <el-link type="info" :underline="false" @click="toggleMode">
            {{ isRegister ? '← 返回' : '注册 →' }}
          </el-link>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { getCode, register, login } from '@/api/user'
import { mapActions, mapGetters } from 'vuex'

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
          { min: 3, max: 16, message: '用户名长度3-16', trigger: 'blur' },
          {
            validator: (rule, value, cb) => {
              const ok = /^[a-zA-Z0-9]+$/.test(value || '')
              cb(ok ? undefined : new Error('用户名只能是数字、字母'))
            },
            trigger: 'blur'
          }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 3, max: 16, message: '密码长度3-16', trigger: 'blur' },
          {
            validator: (rule, value, cb) => {
              const ok = /^[a-zA-Z0-9]+$/.test(value || '')
              cb(ok ? undefined : new Error('密码只能是数字、字母'))
            },
            trigger: 'blur'
          }
        ],
        code: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
          {
            validator: (rule, value, cb) => {
              const ok = /^[a-zA-Z0-9]{4}$/.test(value || '')
              cb(ok ? undefined : new Error('验证码为4位字母或数字'))
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
  computed: {
    ...mapGetters('user', ['getSessionId', 'getToken', 'getUser'])
  },
  methods: {
    ...mapActions('user', ['setSessionId', 'setUser', 'setToken']),

    async getCode () {
      try {
        const res = await getCode()
        this.imageData = `data:image/png;base64,${res.imageData}`
        this.sessionId = res.sessionId
        console.log(this.sessionId)
        this.setSessionId(this.sessionId)
        console.log(this.getSessionId)
      } catch (err) {
        this.$message.error('获取验证码失败')
      }
    },

    async handleSubmit () {
      try {
        this.submitting = true
        const { validate } = this.$refs.form
        const valid = await validate()

        if (!valid) return

        const payload = {
          ...this.formModel,
          sessionId: this.sessionId
        }

        let res
        if (this.isRegister) {
          res = await register(payload)
          // ElMessage.success('注册成功')
          this.$message.success('注册成功')
          this.isRegister = false
        } else {
          res = await login(payload)
          this.setUser(res)
          this.$message.success('登录成功')
          this.$router.push('/')
        }
      } catch (err) {
        // this.$message.error('请求失败')
      } finally {
        this.submitting = false
      }
    },

    toggleMode () {
      this.formModel = {
        username: '',
        password: '',
        code: ''
      }
      this.isRegister = !this.isRegister
      this.getCode()
    }
  },
  mounted () {
    this.getCode()
  }
}
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0eff2;
  position: relative;

  .bg-deco {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('../../assets/bg5.jpg'); // 替换为实际背景图片路径
    background-size: cover;
    background-position: center;
    opacity: 0.3; // 设置透明度，模拟淘宝登录页的背景效果
    z-index: 0;
  }

  .login-page {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 400px;
    padding: 40px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    text-align: center;

    .form {
      .title {
        margin-bottom: 6px;
      }
      .subtitle {
        color: #888;
        margin-bottom: 16px;
        font-size: 14px;
      }

      .code-container {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .el-input {
          flex: 1;
        }

        img {
          cursor: pointer;
          margin-left: 10px;
          width: 100px;
          height: 38px;
          border: 1px solid #eee;
          border-radius: 6px;
        }
      }

      .button {
        width: 100%;
        margin-top: 20px;
      }

      .flex {
        justify-content: center;
      }

      .hint {
        margin-top: 6px;
        font-size: 12px;
        color: #999;
        text-align: left;
      }
    }
  }
}
</style>
