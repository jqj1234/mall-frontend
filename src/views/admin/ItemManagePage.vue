<template>
  <div class="item-manage-page">
    <div class="container">
      <section class="hero-card">
        <div class="hero-text">
          <p class="hero-kicker">Sun Mall Admin</p>
          <h1>商品管理</h1>
          <p class="hero-desc">管理商品信息、库存、状态和图片，支持分页、新增、编辑、删除。</p>
        </div>
        <div class="hero-actions">
          <el-button plain icon="el-icon-house" @click="$router.push('/')">
            返回首页
          </el-button>
          <el-button type="primary" icon="el-icon-plus" @click="openCreateDialog">
            新增商品
          </el-button>
        </div>
      </section>

      <section class="stats-grid">
        <article class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-goods"></i>
          </div>
          <div class="stat-text">
            <p class="stat-label">总商品数</p>
            <p class="stat-value">{{ total }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon success">
            <i class="el-icon-circle-check"></i>
          </div>
          <div class="stat-text">
            <p class="stat-label">当前页在售</p>
            <p class="stat-value">{{ onSaleCount }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon warning">
            <i class="el-icon-remove-outline"></i>
          </div>
          <div class="stat-text">
            <p class="stat-label">当前页下架</p>
            <p class="stat-value">{{ offSaleCount }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon primary">
            <i class="el-icon-time"></i>
          </div>
          <div class="stat-text">
            <p class="stat-label">当前页记录</p>
            <p class="stat-value">{{ items.length }}</p>
          </div>
        </article>
      </section>

      <section class="table-panel">
        <div class="panel-head">
          <div>
            <h2>商品列表</h2>
            <p>按更新时间倒序显示，支持编辑、上下架和删除。</p>
          </div>
          <el-button
            icon="el-icon-refresh"
            :loading="loading"
            @click="fetchItems"
          >
            刷新
          </el-button>
        </div>

        <el-table
          :data="items"
          border
          class="item-table"
          v-loading="loading"
          empty-text="暂无商品数据"
        >
          <el-table-column prop="id" label="ID" width="90" />

          <el-table-column label="商品信息" min-width="280">
            <template slot-scope="{ row }">
              <div class="item-cell">
                <img :src="row.image || fallbackImage" class="item-thumb" />
                <div class="item-info">
                  <p class="item-name">{{ row.name || '-' }}</p>
                  <p class="item-spec">{{ row.spec || '暂无规格信息' }}</p>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="分类 / 品牌" min-width="170">
            <template slot-scope="{ row }">
              <div class="meta-column">
                <span>{{ row.category || '-' }}</span>
                <span>{{ row.brand || '-' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="价格" width="120" align="center">
            <template slot-scope="{ row }">
              <span class="price">￥{{ formatPrice(row.price) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="stock" label="库存" width="90" align="center" />
          <el-table-column prop="sold" label="销量" width="90" align="center" />
          <el-table-column
            prop="commentCount"
            label="评论数"
            width="90"
            align="center"
          />

          <el-table-column label="广告" width="90" align="center">
            <template slot-scope="{ row }">
              <el-tag size="small" :type="row.isAD ? 'danger' : 'info'">
                {{ row.isAD ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100" align="center">
            <template slot-scope="{ row }">
              <el-tag size="small" :type="statusTagType(row.status)">
                {{ statusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="更新时间" width="172">
            <template slot-scope="{ row }">
              {{ formatDate(row.updateTime) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" fixed="right" width="250">
            <template slot-scope="{ row }">
              <div class="action-group">
                <el-button size="mini" plain @click="openEditDialog(row)">
                  编辑
                </el-button>
                <el-button
                  size="mini"
                  :type="Number(row.status) === 1 ? 'warning' : 'success'"
                  :loading="statusUpdatingId === row.id"
                  :disabled="statusUpdatingId && statusUpdatingId !== row.id"
                  @click="toggleStatus(row)"
                >
                  {{ Number(row.status) === 1 ? '下架' : '上架' }}
                </el-button>
                <el-popconfirm
                  title="确认删除该商品吗？"
                  @confirm="removeItem(row)"
                >
                  <el-button
                    slot="reference"
                    size="mini"
                    type="danger"
                    plain
                    :loading="deletingId === row.id"
                    :disabled="deletingId && deletingId !== row.id"
                  >
                    删除
                  </el-button>
                </el-popconfirm>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :total="total"
            :current-page="pageNo"
            :page-size="pageSize"
            @current-change="handlePageChange"
          />
        </div>
      </section>
    </div>

    <el-dialog
      :title="isEdit ? '编辑商品' : '新增商品'"
      :visible.sync="dialogVisible"
      width="760px"
      append-to-body
    >
      <el-form
        ref="itemForm"
        :model="form"
        :rules="formRules"
        label-width="96px"
        class="item-form"
      >
        <div class="form-grid">
          <el-form-item label="商品名称" prop="name">
            <el-input v-model.trim="form.name" maxlength="100" />
          </el-form-item>

          <el-form-item label="分类" prop="category">
            <el-input v-model.trim="form.category" maxlength="32" />
          </el-form-item>

          <el-form-item label="品牌" prop="brand">
            <el-input v-model.trim="form.brand" maxlength="32" />
          </el-form-item>

          <el-form-item label="价格(元)" prop="priceYuan">
            <el-input-number
              v-model="form.priceYuan"
              :min="0"
              :max="999999"
              :step="0.01"
              :precision="2"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item label="库存" prop="stock">
            <el-input-number
              v-model="form.stock"
              :min="0"
              :max="999999"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item label="销量" prop="sold">
            <el-input-number
              v-model="form.sold"
              :min="0"
              :max="999999"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item label="评论数" prop="commentCount">
            <el-input-number
              v-model="form.commentCount"
              :min="0"
              :max="999999"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item label="广告位" prop="isAD">
            <el-switch v-model="form.isAD" />
          </el-form-item>

          <el-form-item v-if="!isEdit" label="初始状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio :label="1">上架</el-radio>
              <el-radio :label="2">下架</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>

        <el-form-item label="商品图片" prop="image">
          <div class="image-row">
            <el-input
              v-model.trim="form.image"
              placeholder="请输入图片 URL，或使用右侧上传"
            />
            <el-upload
              :show-file-list="false"
              :http-request="handleImageUpload"
              :before-upload="beforeImageUpload"
              :action="dummyUploadAction"
              class="upload-btn-wrap"
            >
              <el-button
                type="primary"
                plain
                icon="el-icon-upload"
                :loading="uploadingImage"
              >
                上传图片
              </el-button>
            </el-upload>
          </div>
          <div v-if="form.image" class="preview-wrap">
            <img :src="form.image" class="preview-image" />
          </div>
        </el-form-item>

        <el-form-item label="规格" prop="spec">
          <el-input
            v-model.trim="form.spec"
            type="textarea"
            :rows="4"
            maxlength="255"
            show-word-limit
            placeholder="例如：颜色:黑色; 内存:256G"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">
          {{ isEdit ? '保存修改' : '创建商品' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getItemPage,
  getItemById,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem
} from '@/api/item-admin'
import { uploadImage } from '@/api/item'

export default {
  name: 'ItemManagePage',
  data () {
    return {
      fallbackImage: 'https://via.placeholder.com/80x80?text=Image',
      loading: false,
      saving: false,
      uploadingImage: false,
      statusUpdatingId: null,
      deletingId: null,
      pageNo: 1,
      pageSize: 10,
      total: 0,
      items: [],
      dialogVisible: false,
      isEdit: false,
      dummyUploadAction: '/items/upload',
      form: this.getEmptyForm(),
      formRules: {
        name: [
          { required: true, message: '请输入商品名称', trigger: 'blur' },
          { min: 2, max: 100, message: '长度应为 2-100 个字符', trigger: 'blur' }
        ],
        priceYuan: [
          { required: true, message: '请输入价格', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value === '' || value === null || value === undefined) {
                callback(new Error('请输入价格'))
                return
              }
              if (Number(value) < 0) {
                callback(new Error('价格不能小于 0'))
                return
              }
              callback()
            },
            trigger: 'blur'
          }
        ],
        stock: [{ required: true, message: '请输入库存', trigger: 'change' }],
        image: [{ required: true, message: '请上传或填写商品图片', trigger: 'blur' }]
      }
    }
  },
  computed: {
    onSaleCount () {
      return this.items.filter(item => Number(item.status) === 1).length
    },
    offSaleCount () {
      return this.items.filter(item => Number(item.status) === 2).length
    }
  },
  created () {
    this.fetchItems()
  },
  methods: {
    getEmptyForm () {
      return {
        id: undefined,
        name: '',
        priceYuan: 0,
        stock: 0,
        image: '',
        category: '',
        brand: '',
        spec: '',
        sold: 0,
        commentCount: 0,
        isAD: false,
        status: 1
      }
    },
    async fetchItems () {
      try {
        this.loading = true
        const res = await getItemPage({
          pageNo: this.pageNo,
          pageSize: this.pageSize,
          sortBy: 'update_time',
          isAsc: false
        })
        this.items = Array.isArray(res.list) ? res.list : []
        this.total = Number(res.total) || 0
      } catch (e) {
        this.items = []
        this.total = 0
        this.$message.error('加载商品列表失败')
      } finally {
        this.loading = false
      }
    },
    handlePageChange (page) {
      this.pageNo = page
      this.fetchItems()
    },
    openCreateDialog () {
      this.isEdit = false
      this.form = this.getEmptyForm()
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.itemForm) {
          this.$refs.itemForm.clearValidate()
        }
      })
    },
    async openEditDialog (row) {
      try {
        this.isEdit = true
        const detail = await getItemById(row.id)
        this.form = {
          id: detail.id,
          name: detail.name || '',
          priceYuan: this.centToYuan(detail.price),
          stock: Number(detail.stock || 0),
          image: detail.image || '',
          category: detail.category || '',
          brand: detail.brand || '',
          spec: detail.spec || '',
          sold: Number(detail.sold || 0),
          commentCount: Number(detail.commentCount || 0),
          isAD: Boolean(detail.isAD),
          status: Number(detail.status || 1)
        }
        this.dialogVisible = true
        this.$nextTick(() => {
          if (this.$refs.itemForm) {
            this.$refs.itemForm.clearValidate()
          }
        })
      } catch (e) {
        this.$message.error('获取商品详情失败')
      }
    },
    centToYuan (cents) {
      return Number((Number(cents || 0) / 100).toFixed(2))
    },
    yuanToCent (yuan) {
      return Math.round(Number(yuan || 0) * 100)
    },
    formatPrice (cents) {
      return (Number(cents || 0) / 100).toFixed(2)
    },
    formatDate (val) {
      if (!val) return '-'
      return String(val).replace('T', ' ')
    },
    buildPayload () {
      const payload = {
        id: this.form.id,
        name: this.form.name,
        price: this.yuanToCent(this.form.priceYuan),
        stock: Number(this.form.stock || 0),
        image: this.form.image,
        category: this.form.category,
        brand: this.form.brand,
        spec: this.form.spec,
        sold: Number(this.form.sold || 0),
        commentCount: Number(this.form.commentCount || 0),
        isAD: Boolean(this.form.isAD)
      }
      if (!this.isEdit) {
        payload.status = Number(this.form.status || 1)
      }
      return payload
    },
    async submitForm () {
      if (!this.$refs.itemForm || this.saving) return
      const valid = await this.$refs.itemForm.validate().catch(() => false)
      if (!valid) return

      try {
        this.saving = true
        const payload = this.buildPayload()
        if (this.isEdit) {
          await updateItem(payload)
          this.$message.success('商品更新成功')
        } else {
          await createItem(payload)
          this.$message.success('商品创建成功')
        }
        this.dialogVisible = false
        if (!this.isEdit) {
          this.pageNo = 1
        }
        await this.fetchItems()
      } catch (e) {
        this.$message.error(this.isEdit ? '更新失败' : '创建失败')
      } finally {
        this.saving = false
      }
    },
    statusText (status) {
      const map = {
        1: '上架',
        2: '下架',
        3: '删除'
      }
      return map[status] || '未知'
    },
    statusTagType (status) {
      const map = {
        1: 'success',
        2: 'info',
        3: 'danger'
      }
      return map[status] || 'warning'
    },
    async toggleStatus (row) {
      if (this.statusUpdatingId) return
      try {
        this.statusUpdatingId = row.id
        const target = Number(row.status) === 1 ? 2 : 1
        await updateItemStatus(row.id, target)
        row.status = target
        this.$message.success(target === 1 ? '商品已上架' : '商品已下架')
      } catch (e) {
        this.$message.error('更新商品状态失败')
      } finally {
        this.statusUpdatingId = null
      }
    },
    async removeItem (row) {
      if (this.deletingId) return
      try {
        this.deletingId = row.id
        await deleteItem(row.id)
        this.$message.success('删除成功')
        if (this.items.length === 1 && this.pageNo > 1) {
          this.pageNo -= 1
        }
        await this.fetchItems()
      } catch (e) {
        this.$message.error('删除失败')
      } finally {
        this.deletingId = null
      }
    },
    beforeImageUpload (file) {
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
    async handleImageUpload ({ file }) {
      try {
        this.uploadingImage = true
        const url = await uploadImage(file)
        this.form.image = url
        this.$message.success('图片上传成功')
      } catch (e) {
        this.$message.error('图片上传失败')
      } finally {
        this.uploadingImage = false
      }
    }
  }
}
</script>

<style scoped>
.item-manage-page {
  --primary: #eb5757;
  --text-main: #1f2937;
  --text-sub: #6b7280;
  --border-color: #e7ecf3;
  --card-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  min-height: 100vh;
  padding: 24px 0 40px;
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
  width: min(1440px, calc(100% - 32px));
  margin: 0 auto;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
  border-radius: 20px;
  padding: 28px 30px;
  background: linear-gradient(135deg, #ffffff 0%, #fff9f4 100%);
  border: 1px solid var(--border-color);
  box-shadow: var(--card-shadow);
}

.hero-kicker {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #ef6f6f;
}

.hero-text h1 {
  margin: 6px 0 8px;
  font-size: 34px;
  line-height: 1.2;
  color: #111827;
}

.hero-desc {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero-actions ::v-deep .el-button {
  border-radius: 12px;
  font-weight: 600;
}

.stats-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: #fff3ef;
  color: #e25656;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.stat-icon.success {
  background: #ecfbf3;
  color: #1fa765;
}

.stat-icon.warning {
  background: #fff8e8;
  color: #d88227;
}

.stat-icon.primary {
  background: #eef6ff;
  color: #3b82f6;
}

.stat-text {
  min-width: 0;
}

.stat-label {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.stat-value {
  margin: 5px 0 0;
  font-size: 24px;
  line-height: 1.1;
  font-weight: 700;
  color: #0f172a;
}

.table-panel {
  margin-top: 16px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  padding: 18px 18px 16px;
}

.panel-head {
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.panel-head h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #111827;
}

.panel-head p {
  margin: 6px 0 0;
  color: var(--text-sub);
  font-size: 13px;
}

.item-table ::v-deep .el-table__header-wrapper th {
  background: #f8fafd;
  color: #475569;
  font-weight: 600;
}

.item-table ::v-deep .el-table td,
.item-table ::v-deep .el-table th.is-leaf {
  border-bottom: 1px solid #edf1f7;
}

.item-table ::v-deep .el-table__body tr:hover > td {
  background: #fffaf8;
}

.item-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.item-thumb {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border: 1px solid #e6ecf3;
  border-radius: 8px;
  background: #f8fafc;
}

.item-info {
  min-width: 0;
}

.item-name {
  margin: 0;
  color: #334155;
  font-size: 14px;
  line-height: 1.5;
}

.item-spec {
  margin: 3px 0 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.meta-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #475569;
}

.price {
  color: var(--primary);
  font-weight: 700;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-group ::v-deep .el-button {
  margin-left: 0;
  border-radius: 9px;
}

.pagination {
  margin-top: 18px;
  text-align: right;
  border-top: 1px solid #eff3f8;
  padding-top: 14px;
}

.item-form ::v-deep .el-input__inner,
.item-form ::v-deep .el-textarea__inner {
  border-radius: 10px;
}

.item-form ::v-deep .el-input-number {
  width: 100%;
}

.item-form ::v-deep .el-input-number .el-input__inner {
  text-align: left;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 12px;
}

.image-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.upload-btn-wrap {
  line-height: 1;
}

.preview-wrap {
  margin-top: 10px;
}

.preview-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid #e4eaf4;
  background: #f8fafc;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .container {
    width: calc(100% - 24px);
  }

  .hero-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 22px 20px;
  }

  .hero-text h1 {
    font-size: 30px;
  }

  .table-panel {
    padding: 14px;
  }

  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination {
    text-align: center;
  }
}

@media (max-width: 640px) {
  .item-manage-page {
    padding: 16px 0 26px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .hero-text h1 {
    font-size: 28px;
  }

  .hero-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .hero-actions ::v-deep .el-button {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .image-row {
    grid-template-columns: 1fr;
  }
}
</style>
