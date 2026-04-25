<template>
  <div class="user-page">
    <header class="header">
      <div class="container header-inner">
        <div class="brand-wrap" @click="$router.push('/')">
          <div class="brand">阳光商城</div>
          <p class="brand-subtitle">个人中心 · 资料与地址管理</p>
        </div>
        <div class="header-actions">
          <el-button type="text" @click="$router.push('/')">返回首页</el-button>
          <el-button type="text" @click="$router.push('/orderlist')"
            >历史订单</el-button
          >
        </div>
      </div>
    </header>

    <section class="container main-content">
      <el-card class="panel-card profile-card" v-loading="loading">
        <div class="section-head">
          <div>
            <h3>账户资料</h3>
            <p>更新联系方式和头像，确保系统资料实时可用。</p>
          </div>
        </div>
        <div class="profile-main">
          <div class="avatar-column">
            <div class="avatar-box">
              <el-upload
                ref="avatarUploader"
                class="upload-box"
                drag
                :show-file-list="false"
                :http-request="handleAvatarUpload"
                :before-upload="beforeAvatarUpload"
                :action="dummyAction"
              >
                <template v-if="avatarPreview">
                  <img class="upload-preview" :src="avatarPreview" />
                  <div class="upload-overlay">点击更换头像</div>
                </template>
                <template v-else>
                  <img :src="defaultAvatar" class="upload-preview" />
                  <div class="upload-overlay">点击上传头像</div>
                </template>
              </el-upload>
            </div>
            <el-button
              type="text"
              size="mini"
              class="clear-avatar-btn"
              @click="clearAvatar"
              :disabled="avatarUploading"
              >清空头像</el-button
            >
          </div>

          <div class="info-form">
            <el-form :model="form" label-width="100px">
              <el-form-item label="用户名">
                <span class="readonly-text">{{ form.username || '-' }}</span>
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="form.phone" maxlength="11" />
              </el-form-item>
              <el-form-item label="账户余额">
                <div class="balance-row">
                  <span class="money">￥{{ formatMoney(user.balance) }}</span>
                  <el-button
                    size="mini"
                    type="danger"
                    plain
                    @click="openRecharge"
                    >充值</el-button
                  >
                </div>
              </el-form-item>
              <el-form-item label="注册时间">
                <span class="readonly-text">{{ formatDate(user.createTime) }}</span>
              </el-form-item>
              <el-form-item label="更新时间">
                <span class="readonly-text">{{ formatDate(user.updateTime) }}</span>
              </el-form-item>
              <el-form-item class="form-actions" label=" ">
                <el-button type="primary" :loading="saving" @click="saveUser"
                  >保存修改</el-button
                >
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-card>

      <el-card class="panel-card addresses-card">
        <div class="section-head">
          <div>
            <h3>我的地址</h3>
            <p>维护常用收货地址，结算时可以快速选择。</p>
          </div>
          <el-button type="primary" size="small" @click="openAddAddress"
            >新增地址</el-button
          >
        </div>
        <el-table
          v-if="addresses && addresses.length"
          :data="addresses"
          stripe
          class="addr-table"
        >
          <el-table-column prop="contact" label="联系人" width="120" />
          <el-table-column prop="mobile" label="手机号" width="120" />
          <el-table-column label="地区" min-width="220">
            <template slot-scope="scope">
              {{ scope.row.province }} {{ scope.row.city }} {{ scope.row.town }}
            </template>
          </el-table-column>
          <el-table-column prop="street" label="详细地址" min-width="240" />
          <el-table-column label="默认" width="80">
            <template slot-scope="scope">
              <el-tag
                size="small"
                :type="scope.row.isDefault === 1 ? 'success' : 'info'"
                >{{ scope.row.isDefault === 1 ? '是' : '否' }}</el-tag
              >
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="editAddress(scope.row)"
                >修改</el-button
              >
              <el-button
                type="text"
                size="small"
                class="delete-btn"
                @click="removeAddress(scope.row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="addr-empty">暂无地址，点击右上角新增地址开始使用。</div>
      </el-card>
    </section>

    <el-dialog
      title="新增地址"
      :visible.sync="addrDialogVisible"
      width="520px"
      append-to-body
    >
      <el-form :model="addrForm" label-width="90px">
        <el-form-item label="联系人"
          ><el-input v-model="addrForm.contact" maxlength="20"
        /></el-form-item>
        <el-form-item label="手机号"
          ><el-input v-model="addrForm.mobile" maxlength="11"
        /></el-form-item>
        <el-form-item label="省份"
          ><el-input v-model="addrForm.province" maxlength="20"
        /></el-form-item>
        <el-form-item label="城市"
          ><el-input v-model="addrForm.city" maxlength="20"
        /></el-form-item>
        <el-form-item label="区县"
          ><el-input v-model="addrForm.town" maxlength="20"
        /></el-form-item>
        <el-form-item label="详细地址"
          ><el-input v-model="addrForm.street" maxlength="100"
        /></el-form-item>
        <el-form-item label="备注"
          ><el-input v-model="addrForm.notes" maxlength="100"
        /></el-form-item>
        <el-form-item label="设为默认"
          ><el-switch
            v-model="addrForm.isDefault"
            :active-value="1"
            :inactive-value="0"
        /></el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addrDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addrSaving" @click="saveAddress"
          >保存</el-button
        >
      </span>
    </el-dialog>
    <el-dialog
      title="账户充值"
      :visible.sync="rechargeVisible"
      width="360px"
      append-to-body
    >
      <div class="recharge-tip">请直接给☆阳光☆转账，谢谢！😊</div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="rechargeVisible = false"
          >知道了</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getUserInfo,
  updateUser,
  findMyAddresses,
  addOrUpdateAddress,
  deleteAddress
} from '@/api/user'
import { uploadImage } from '@/api/item'
export default {
  name: 'UserPage',
  data () {
    return {
      user: {},
      loading: false,
      defaultAvatar: 'https://via.placeholder.com/120x120?text=Avatar',
      form: { username: '', phone: '' },
      avatarPreview: '',
      avatarUrl: '',
      avatarUploading: false,
      saving: false,
      dummyAction: '/items/upload',
      rechargeVisible: false,
      addresses: [],
      addrDialogVisible: false,
      addrForm: {
        id: '',
        contact: '',
        mobile: '',
        province: '',
        city: '',
        town: '',
        street: '',
        notes: '',
        isDefault: 0
      },
      addrSaving: false
    }
  },
  mounted () {
    this.fetchUser()
    this.fetchAddresses()
  },
  methods: {
    async fetchUser () {
      try {
        this.loading = true
        const res = await getUserInfo()
        this.user = res || {}
        this.form.username = this.user.username || ''
        this.form.phone = this.user.phone || ''
        this.avatarPreview = this.user.avatar || this.defaultAvatar
      } catch (e) {
        this.$message.error('加载用户信息失败')
      } finally {
        this.loading = false
      }
    },
    async fetchAddresses () {
      try {
        const res = await findMyAddresses()
        const list = Array.isArray(res) ? res : res && res.data ? res.data : []
        this.addresses = Array.isArray(list) ? list : []
      } catch (e) {
        this.addresses = []
      }
    },
    beforeAvatarUpload (file) {
      const isValidType = ['image/jpeg', 'image/png'].includes(file.type)
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isValidType) {
        this.$message.error('仅支持 JPG/PNG 格式')
        return false
      }
      if (!isLt5M) {
        this.$message.error('图片大小不能超过 5MB')
        return false
      }
      return true
    },
    async handleAvatarUpload ({ file }) {
      try {
        this.avatarUploading = true
        const url = await uploadImage(file)
        this.avatarUrl = url
        if (this.avatarPreview && this.avatarPreview !== this.defaultAvatar) {
          URL.revokeObjectURL(this.avatarPreview)
        }
        this.avatarPreview = URL.createObjectURL(file)
        this.$message.success('头像上传成功')
      } catch (e) {
        this.$message.error('头像上传失败')
      } finally {
        this.avatarUploading = false
      }
    },
    clearAvatar () {
      if (this.$refs.avatarUploader) {
        this.$refs.avatarUploader.clearFiles()
      }
      if (this.avatarPreview && this.avatarPreview !== this.defaultAvatar) {
        URL.revokeObjectURL(this.avatarPreview)
      }
      this.avatarPreview = this.defaultAvatar
      this.avatarUrl = ''
    },
    async saveUser () {
      const payload = {
        id: this.user.id,
        username: this.form.username,
        phone: this.form.phone,
        avatar: this.avatarUrl || this.user.avatar
      }
      try {
        this.saving = true
        await updateUser(payload)
        this.$message.success('更新成功')
        const after = await getUserInfo()
        this.user = after || {}
        this.form.username = this.user.username || ''
        this.form.phone = this.user.phone || ''
        this.avatarPreview = this.user.avatar || this.defaultAvatar
      } catch (e) {
        this.$message.error('更新失败')
      } finally {
        this.saving = false
      }
    },
    formatDate (val) {
      if (!val) return '-'
      return String(val).replace('T', ' ')
    },
    formatMoney (cents) {
      if (!cents && cents !== 0) return '0.00'
      return (cents / 100).toFixed(2)
    },
    openRecharge () {
      this.rechargeVisible = true
    },
    openAddAddress () {
      this.addrDialogVisible = true
      this.addrForm = {
        id: '',
        contact: '',
        mobile: '',
        province: '',
        city: '',
        town: '',
        street: '',
        notes: '',
        isDefault: 0
      }
    },
    editAddress (row) {
      this.addrDialogVisible = true
      this.addrForm = {
        id: row.id || '',
        contact: row.contact || '',
        mobile: row.mobile || '',
        province: row.province || '',
        city: row.city || '',
        town: row.town || '',
        street: row.street || '',
        notes: row.notes || '',
        isDefault: row.isDefault || 0
      }
    },
    async saveAddress () {
      const payload = {
        id: this.addrForm.id || undefined,
        contact: this.addrForm.contact,
        mobile: this.addrForm.mobile,
        province: this.addrForm.province,
        city: this.addrForm.city,
        town: this.addrForm.town,
        street: this.addrForm.street,
        notes: this.addrForm.notes,
        isDefault: this.addrForm.isDefault
      }
      try {
        this.addrSaving = true
        await addOrUpdateAddress(payload)
        if (this.addrForm.id) {
          this.$message.success('更新地址成功')
        } else {
          this.$message.success('新增地址成功')
        }
        this.addrDialogVisible = false
        this.fetchAddresses()
      } catch (e) {
        this.$message.error('保存地址失败')
      } finally {
        this.addrSaving = false
      }
    },
    async removeAddress (row) {
      try {
        await deleteAddress(row.id)
        this.$message.success('已删除地址')
        this.fetchAddresses()
      } catch (e) {
        this.$message.error('删除失败')
      }
    }
  }
}
</script>

<style scoped>
.user-page {
  --primary: #eb5757;
  --primary-deep: #cc4242;
  --text-main: #1f2937;
  --text-sub: #6b7280;
  --border-color: #e7ecf3;
  --card-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  min-height: 100vh;
  color: var(--text-main);
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
  background: radial-gradient(
      circle at 10% 10%,
      rgba(255, 215, 188, 0.32),
      transparent 34%
    ),
    radial-gradient(circle at 92% 0, rgba(255, 246, 216, 0.45), transparent 38%),
    #f6f8fb;
}

.container {
  width: min(1400px, calc(100% - 32px));
  margin: 0 auto;
}

.header {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.84);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.header-inner {
  min-height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.brand-wrap {
  cursor: pointer;
  user-select: none;
}

.brand {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 1px;
}

.brand-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-sub);
  letter-spacing: 1.5px;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px 12px;
}

.header-actions ::v-deep .el-button--text {
  color: #4b5563;
  padding: 0;
}

.header-actions ::v-deep .el-button--text:hover {
  color: var(--primary);
}

.money {
  color: var(--primary);
  font-weight: 700;
  font-size: 30px;
  line-height: 1;
}

.main-content {
  padding: 24px 0 42px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.panel-card ::v-deep .el-card__body {
  padding: 22px 24px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px 16px;
  margin-bottom: 16px;
}

.section-head h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.section-head p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-sub);
}

.section-head ::v-deep .el-button {
  border-radius: 10px;
  font-weight: 600;
}

.profile-main {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  align-items: start;
}

.avatar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-box {
  width: 168px;
}

.balance-row {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.balance-row .money {
  font-size: 26px;
}

.balance-row ::v-deep .el-button {
  border-radius: 10px;
  padding: 8px 14px;
  font-weight: 600;
}

.upload-box {
  width: 168px !important;
  display: block;
}

.upload-box ::v-deep .el-upload {
  width: 168px;
  display: block;
}

.upload-box ::v-deep .el-upload-dragger {
  width: 168px !important;
  height: 168px !important;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  border: 1px dashed #d7deea;
  background: #f8fafc;
}

.upload-box ::v-deep .el-upload-dragger:hover {
  border-color: #ffb7aa;
}

.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.upload-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.46));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.clear-avatar-btn {
  color: #64748b;
}

.clear-avatar-btn:hover {
  color: var(--primary);
}

.info-form {
  max-width: 620px;
}

.info-form ::v-deep .el-form-item {
  margin-bottom: 18px;
}

.info-form ::v-deep .el-form-item__label {
  color: #64748b;
  font-weight: 500;
}

.info-form ::v-deep .el-input__inner {
  height: 40px;
  border-radius: 10px;
  border: 1px solid #dde5f0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.info-form ::v-deep .el-input__inner:focus {
  border-color: #ff9f8a;
  box-shadow: 0 0 0 4px rgba(245, 120, 90, 0.15);
}

.readonly-text {
  color: #1f2937;
}

.form-actions {
  margin-top: 2px;
}

.form-actions ::v-deep .el-button {
  min-width: 120px;
  height: 40px;
  border-radius: 10px;
  font-weight: 600;
}

.addr-table {
  width: 100%;
}

.addr-table ::v-deep .el-table__header th.el-table__cell {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
}

.addr-table ::v-deep td.el-table__cell {
  border-bottom: 1px solid #edf2f8;
}

.addr-table ::v-deep .el-button--text {
  padding: 0;
}

.addr-table ::v-deep .el-tag {
  border-radius: 12px;
}

.delete-btn {
  color: #ff4d4f !important;
}

.addr-empty {
  border-radius: 12px;
  border: 1px dashed #dbe3ef;
  background: #f8fafc;
  color: #64748b;
  text-align: center;
  padding: 32px 12px;
}

.recharge-tip {
  text-align: center;
  padding: 12px 0;
  color: #334155;
  line-height: 1.8;
}

::v-deep .el-dialog {
  border-radius: 14px;
}

::v-deep .el-dialog__header {
  border-bottom: 1px solid #eef2f7;
}

@media (max-width: 1024px) {
  .header {
    position: static;
  }
}

@media (max-width: 768px) {
  .container {
    width: calc(100% - 24px);
  }

  .header-inner {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px 0;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-main {
    grid-template-columns: 1fr;
  }

  .avatar-column {
    align-items: flex-start;
  }

  .money {
    font-size: 26px;
  }
}

@media (max-width: 560px) {
  .brand-subtitle {
    display: none;
  }

  .panel-card ::v-deep .el-card__body {
    padding: 18px 16px;
  }

  .balance-row .money {
    font-size: 22px;
  }
}
</style>
