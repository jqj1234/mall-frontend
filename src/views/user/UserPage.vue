<template>
  <div class="user-page container">
    <div class="header-bar">
      <h2>个人中心</h2>
      <el-button type="text" @click="$router.push('/')">返回首页</el-button>
    </div>
    <el-card v-loading="loading">
      <div class="profile">
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
              <div class="upload-overlay">点击此处更换头像</div>
            </template>
            <template v-else>
              <img :src="defaultAvatar" class="upload-preview" />
              <div class="upload-overlay">点击上传头像</div>
            </template>
          </el-upload>
          <div class="avatar-actions">
            <el-button
              type="text"
              size="mini"
              @click="clearAvatar"
              :disabled="avatarUploading"
              >清空</el-button
            >
          </div>
        </div>
        <div class="info-form">
          <el-form :model="form" label-width="100px">
            <el-form-item label="用户名">
              <!-- <el-input v-model="form.username" maxlength="20"/> -->
              <span>{{ formatDate(user.username) }}</span>
            </el-form-item>
            <el-form-item label="手机号"
              ><el-input v-model="form.phone" maxlength="11"
            /></el-form-item>
            <el-form-item label="账户余额">
              <div class="balance-row">
                <span class="money">￥{{ formatMoney(user.balance) }}</span>
                <el-button size="mini" type="danger" plain @click="openRecharge"
                  >充值</el-button
                >
              </div>
            </el-form-item>

            <el-form-item label="注册时间"
              ><span>{{ formatDate(user.createTime) }}</span></el-form-item
            >
            <el-form-item label="更新时间"
              ><span>{{ formatDate(user.updateTime) }}</span></el-form-item
            >
            <el-form-item style="text-align: center">
              <el-button type="primary" :loading="saving" @click="saveUser"
                >保存修改</el-button
              >
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>
    <el-card class="addresses-card">
      <div class="addr-header">
        <h3>我的地址</h3>
        <el-button type="primary" size="small" @click="openAddAddress"
          >新增地址</el-button
        >
      </div>
      <el-table
        v-if="addresses && addresses.length"
        :data="addresses"
        stripe
        style="width: 100%"
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
              style="color: #ff4d4f"
              @click="removeAddress(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="addr-empty">暂无地址</div>
    </el-card>
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
    statusText (s) {
      const map = { 1: '正常', 2: '冻结' }
      return map[s] || '-'
    },
    statusTagType (s) {
      const map = { 1: 'success', 2: 'warning' }
      return map[s] || 'info'
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
  padding: 20px;
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.profile {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 28px;
  align-items: start;
}
.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #eee;
  background: #fafafa;
}
.info {
  display: grid;
  grid-template-columns: 120px 1fr;
  row-gap: 10px;
  column-gap: 8px;
  align-items: center;
}
.label {
  color: #666;
}
.money {
  color: #ff4d4f;
  font-weight: 600;
}
.user-page {
  max-width: 1000px;
  margin: 0 auto;
}
.avatar-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  width: 200px;
  overflow: hidden;
}
.avatar-actions {
  width: 160px;
  text-align: center;
  display: none;
}
.upload-box {
  width: 160px !important;
  display: inline-block;
}
.upload-box ::v-deep .el-upload-dragger {
  width: 160px !important;
  height: 160px !important;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
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
  height: 28px;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  width: 160px;
}
.info-form {
  flex: 1;
  width: 100%;
}
.info-form .el-form-item {
  margin-bottom: 18px;
}
.money {
  color: #ff4d4f;
  font-weight: 600;
}
.balance-row {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.user-page :deep(.el-card__body) {
  padding: 22px 26px;
}
.info-form {
  padding-top: 4px;
  max-width: 520px;
}
.recharge-tip {
  text-align: center;
  padding: 12px 0;
}
.addresses-card {
  margin-top: 16px;
}
.addr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.addr-empty {
  color: #999;
  text-align: center;
  padding: 24px 0;
}
</style>
