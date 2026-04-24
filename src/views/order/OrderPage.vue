<template>
  <div class="order-page">
    <div class="container">
      <section class="hero-card">
        <div class="hero-text">
          <p class="hero-kicker">Sun Mall</p>
          <h1>历史订单</h1>
          <p class="hero-desc">查看订单状态、剩余支付时间和商品明细</p>
        </div>
        <div class="hero-actions">
          <el-button plain icon="el-icon-house" @click="$router.push('/')">
            返回首页
          </el-button>
        </div>
      </section>

      <section class="stats-grid">
        <article class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-document"></i>
          </div>
          <div class="stat-text">
            <p class="stat-label">当前页订单</p>
            <p class="stat-value">{{ orders.length }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon pending">
            <i class="el-icon-time"></i>
          </div>
          <div class="stat-text">
            <p class="stat-label">待支付</p>
            <p class="stat-value">{{ pendingCount }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon success">
            <i class="el-icon-circle-check"></i>
          </div>
          <div class="stat-text">
            <p class="stat-label">已完成</p>
            <p class="stat-value">{{ completedCount }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon amount">
            <i class="el-icon-money"></i>
          </div>
          <div class="stat-text">
            <p class="stat-label">当前页金额</p>
            <p class="stat-value">￥{{ formatPrice(currentPageAmount) }}</p>
          </div>
        </article>
      </section>

      <section class="table-panel">
        <div class="panel-head">
          <div>
            <h2>订单列表</h2>
            <p>共 {{ total }} 条历史订单记录</p>
          </div>
        </div>

        <el-table
          :data="orders"
          border
          style="width: 100%"
          class="order-table"
          v-loading="loading"
          empty-text="暂无订单记录"
        >
          <el-table-column
            prop="id"
            label="订单号"
            min-width="220"
            show-overflow-tooltip
          ></el-table-column>

          <el-table-column label="总金额" width="120">
            <template slot-scope="{ row }">
              <span class="amount-text">￥{{ formatPrice(row.totalFee) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="剩余支付时间" width="170">
            <template slot-scope="{ row }">
              <span v-if="showCountdown(row)" class="countdown">
                {{ countdownText(row) }}
              </span>
              <span v-else class="countdown-empty">-</span>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" min-width="180">
            <template slot-scope="{ row }">
              {{ formatDate(row.createTime) }}
            </template>
          </el-table-column>

          <el-table-column label="付款方式" width="120">
            <template slot-scope="{ row }">
              {{ paymentTypeText(row.paymentType) }}
            </template>
          </el-table-column>

          <el-table-column label="状态" width="190">
            <template slot-scope="{ row }">
              <span class="status-wrap" :class="`status-${row.status}`">
                <span class="status-dot"></span>
                <el-tag :type="statusTagType(row.status)" effect="plain">
                  {{ statusText(row.status) }}
                </el-tag>
              </span>
            </template>
          </el-table-column>

          <el-table-column label="操作" fixed="right" min-width="170">
            <template slot-scope="{ row }">
              <div class="action-group">
                <el-button size="mini" plain @click="viewOrderDetail(row)">
                  查看详情
                </el-button>
                <el-button
                  v-if="showCountdown(row)"
                  size="mini"
                  type="danger"
                  :loading="creatingPayOrderId === row.id"
                  :disabled="
                    creatingPayOrderId && creatingPayOrderId !== row.id
                  "
                  @click="payNow(row)"
                >
                  去支付
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination" v-if="total">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="total"
            :current-page.sync="currentPage"
            :page-size="pageSize"
            @current-change="handlePageChange"
          ></el-pagination>
        </div>
      </section>

    <el-dialog
      title="订单详情"
      :visible.sync="detailVisible"
      width="700px"
      custom-class="order-detail-dialog"
      append-to-body
    >
      <div v-loading="detailLoading">
        <el-table :data="orderDetails" border class="detail-table">
          <el-table-column label="商品" min-width="360">
            <template slot-scope="{ row }">
              <div class="item-cell">
                <img :src="row.image" class="item-thumb" />
                <div class="item-info">
                  <div class="item-title">{{ row.name }}</div>
                  <div class="item-spec" v-if="row.spec">
                    {{ renderSpec(row.spec) }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="num" label="数量" width="100" align="center" />
          <el-table-column label="单价" width="120" align="center">
            <template slot-scope="{ row }"
              >￥{{ formatPrice(row.price) }}</template
            >
          </el-table-column>
          <el-table-column label="小计" width="120" align="center">
            <template slot-scope="{ row }"
              >￥{{ formatPrice(row.price * (row.num || 0)) }}</template
            >
          </el-table-column>
        </el-table>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">关闭</el-button>
      </span>
    </el-dialog>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getOrder, getOrderDetails } from '@/api/order'
import { applyPayOrder } from '@/api/pay'
export default {
  name: 'OrderList',
  data () {
    return {
      orders: [], // 订单列表
      total: 0, // 总条数
      pageSize: 10, // 每页显示条数
      currentPage: 1,
      loading: false,
      nowTs: Date.now(),
      timer: null,
      detailVisible: false,
      detailLoading: false,
      orderDetails: [],
      creatingPayOrderId: null
    }
  },
  computed: {
    ...mapGetters('user', ['getSessionId', 'getToken', 'getUser']),
    pendingCount () {
      return this.orders.filter(item => Number(item.status) === 1).length
    },
    completedCount () {
      return this.orders.filter(item =>
        [4, 6].includes(Number(item.status))
      ).length
    },
    currentPageAmount () {
      return this.orders.reduce(
        (sum, item) => sum + Number(item.totalFee || 0),
        0
      )
    }
  },
  mounted () {
    this.fetchOrders(this.currentPage)
    this.startTimer()
  },
  beforeDestroy () {
    this.destroyTimer()
  },
  methods: {
    fetchOrders (page = this.currentPage) {
      this.loading = true
      this.currentPage = page
      getOrder(this.currentPage, this.pageSize)
        .then(res => {
          this.orders = Array.isArray(res.list) ? res.list : []
          this.total = Number(res.total) || 0
        })
        .catch(() => {
          this.orders = []
          this.total = 0
          this.$message.error('加载订单失败，请稍后重试')
        })
        .finally(() => {
          this.loading = false
        })
    },

    handlePageChange (page) {
      this.currentPage = page
      this.fetchOrders(page)
    },

    formatPrice (price) {
      return (Number(price || 0) / 100).toFixed(2)
    },

    formatDate (timeStr) {
      return String(timeStr).replace('T', ' ')
    },

    statusText (status) {
      const statusMap = {
        1: '未付款',
        2: '已付款,未发货',
        3: '已发货,未确认',
        4: '确认收货，交易成功',
        5: '交易取消，订单关闭',
        6: '交易结束，已评价'
      }
      return statusMap[status] || '未知状态'
    },

    statusTagType (status) {
      const tagMap = {
        1: 'warning',
        2: 'success',
        3: 'primary',
        4: 'info',
        5: 'danger',
        6: 'success'
      }
      return tagMap[status] || 'default'
    },

    paymentTypeText (type) {
      const typeMap = {
        1: '支付宝',
        2: '微信',
        3: '银联支付',
        4: '货到付款',
        5: '余额支付'
      }
      return typeMap[type] || '未知支付方式'
    },

    async viewOrderDetail (order) {
      try {
        this.detailVisible = true
        this.detailLoading = true
        const list = await getOrderDetails(order.id)
        this.orderDetails = Array.isArray(list) ? list : []
      } catch (e) {
        this.$message.error('加载订单详情失败')
      } finally {
        this.detailLoading = false
      }
    },
    renderSpec (spec) {
      try {
        const obj = typeof spec === 'string' ? JSON.parse(spec) : spec || {}
        return Object.keys(obj)
          .map(k => `${k}: ${obj[k]}`)
          .join('，')
      } catch (e) {
        return spec
      }
    },
    startTimer () {
      if (this.timer) return
      this.timer = setInterval(() => {
        this.nowTs = Date.now()
      }, 1000)
    },
    destroyTimer () {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    showCountdown (row) {
      if (!row || row.status !== 1 || !row.autoCloseTime) return false
      const end = new Date(row.autoCloseTime).getTime()
      return end - this.nowTs > 0
    },
    countdownText (row) {
      const end = new Date(row.autoCloseTime).getTime()
      const diff = Math.max(0, end - this.nowTs)
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      const pad = n => String(n).padStart(2, '0')
      return `${pad(h)}:${pad(m)}:${pad(s)}`
    },
    async payNow (row) {
      if (this.creatingPayOrderId) return
      if (!this.showCountdown(row)) {
        this.$message.warning('订单已超时或不可支付')
        return
      }
      try {
        this.creatingPayOrderId = row.id
        const payOrderNo = await applyPayOrder({
          bizOrderNo: row.id,
          amount: row.totalFee,
          payChannelCode: 'BALANCE',
          payType: 5
        })
        this.$router.push({
          path: '/pay',
          query: {
            orderId: row.id,
            payOrderNo: payOrderNo || '',
            amount: row.totalFee
          }
        })
      } catch (e) {
        this.$message.error('创建支付单失败')
      } finally {
        this.creatingPayOrderId = null
      }
    }
  }
}
</script>

<style scoped>
.order-page {
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
  width: min(1400px, calc(100% - 32px));
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

.hero-actions ::v-deep .el-button {
  border-radius: 12px;
  border-color: #d8e1ee;
  color: #334155;
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

.stat-icon.pending {
  background: #fff8e8;
  color: #d88227;
}

.stat-icon.success {
  background: #ecfbf3;
  color: #1fa765;
}

.stat-icon.amount {
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

.order-table ::v-deep .el-table__header-wrapper th {
  background: #f8fafd;
  color: #475569;
  font-weight: 600;
}

.order-table ::v-deep .el-table td,
.order-table ::v-deep .el-table th.is-leaf {
  border-bottom: 1px solid #edf1f7;
}

.order-table ::v-deep .el-table__body tr:hover > td {
  background: #fffaf8;
}

.amount-text {
  color: var(--primary);
  font-weight: 700;
}

.countdown {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  color: #d64545;
  background: #fff1f0;
  border: 1px solid #ffd4d0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.countdown-empty {
  color: #94a3b8;
}

.status-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
}

.status-2 .status-dot,
.status-4 .status-dot,
.status-6 .status-dot {
  background: #22c55e;
}

.status-3 .status-dot {
  background: #409eff;
}

.status-5 .status-dot {
  background: #f56c6c;
}

.action-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.action-group ::v-deep .el-button {
  margin-left: 0;
  border-radius: 10px;
}

.pagination {
  margin-top: 18px;
  text-align: center;
  border-top: 1px solid #eff3f8;
  padding-top: 14px;
}

.pagination ::v-deep .el-pager li {
  border-radius: 8px;
}

.item-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.item-thumb {
  width: 62px;
  height: 62px;
  object-fit: contain;
  border: 1px solid #e6ecf3;
  border-radius: 8px;
  background: #f8fafc;
}

.item-info {
  min-width: 0;
}

.item-title {
  font-size: 14px;
  color: #334155;
  line-height: 1.5;
}

.item-spec {
  font-size: 12px;
  color: #94a3b8;
}

::v-deep .order-detail-dialog {
  border-radius: 14px;
}

::v-deep .order-detail-dialog .el-dialog__header {
  border-bottom: 1px solid #edf2f7;
}

::v-deep .detail-table .el-table__header-wrapper th {
  background: #f8fafd;
  color: #475569;
}

@media (max-width: 1200px) {
  .stats-grid {
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
}

@media (max-width: 640px) {
  .order-page {
    padding: 16px 0 26px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .hero-text h1 {
    font-size: 28px;
  }

  .panel-head h2 {
    font-size: 22px;
  }
}
</style>
