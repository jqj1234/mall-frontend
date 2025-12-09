<template>
  <div class="order-list-container">
    <div class="header-actions">
      <h2>我的订单</h2>
      <el-button type="primary" size="small" @click="$router.push('/')"
        >返回首页</el-button
      >
    </div>

    <el-table :data="orders" border style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="订单号" width="200"></el-table-column>

      <el-table-column label="总金额" width="100">
        <template slot-scope="{ row }">
          ￥{{ formatPrice(row.totalFee) }}
        </template>
      </el-table-column>

      <el-table-column label="剩余支付时间" width="160">
        <template slot-scope="{ row }">
          <span v-if="showCountdown(row)" class="countdown">{{
            countdownText(row)
          }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" width="160">
        <template slot-scope="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>

      <el-table-column label="付款方式" width="120">
        <template slot-scope="{ row }">
          {{ paymentTypeText(row.paymentType) }}
        </template>
      </el-table-column>

      <el-table-column label="状态" width="160">
        <template slot-scope="{ row }">
          <el-tag :type="statusTagType(row.status)">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right">
        <template slot-scope="{ row }">
          <el-button size="small" @click="viewOrderDetail(row)"
            >查看详情</el-button
          >
          <el-button
            v-if="showCountdown(row)"
            size="small"
            type="danger"
            @click="payNow(row)"
            >去支付</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="currentPage"
        :page-size="pageSize"
        @current-change="handlePageChange"
      ></el-pagination>
    </div>
    <el-dialog
      title="订单详情"
      :visible.sync="detailVisible"
      width="700px"
      append-to-body
    >
      <div v-loading="detailLoading">
        <el-table :data="orderDetails" border>
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
      creatingPayOrderId: null,
      mockData: {
        code: 1,
        msg: null,
        data: {
          total: 4,
          list: [
            {
              id: '1916329860519956480',
              totalFee: 13400,
              paymentType: 1,
              userId: '1916329766085201920',
              status: 1,
              itemId: '33167574964',
              addressId: '1',
              count: 1,
              createTime: '2025-04-27 11:13:37',
              payTime: null,
              endTime: null,
              closeTime: null,
              updateTime: '2025-04-27 11:13:37'
            },
            {
              id: '1919721764024487936',
              totalFee: 28900,
              paymentType: 1,
              userId: '1916329766085201920',
              status: 1,
              itemId: '317578',
              addressId: '1',
              count: 1,
              createTime: '2025-05-06 19:51:50',
              payTime: null,
              endTime: null,
              closeTime: null,
              updateTime: '2025-05-06 19:51:50'
            },
            {
              id: '1919746454126333952',
              totalFee: 27500,
              paymentType: 1,
              userId: '1916329766085201920',
              status: 1,
              itemId: '546872',
              addressId: '1',
              count: 1,
              createTime: '2025-05-06 21:29:56',
              payTime: null,
              endTime: null,
              closeTime: null,
              updateTime: '2025-05-06 21:29:57'
            },
            {
              id: '1919749019735953408',
              totalFee: 71300,
              paymentType: 2,
              userId: '1916329766085201920',
              status: 1,
              itemId: '577967',
              addressId: '1',
              count: 1,
              createTime: '2025-05-06 21:40:08',
              payTime: null,
              endTime: null,
              closeTime: null,
              updateTime: '2025-05-06 21:40:08'
            }
          ]
        }
      }
    }
  },
  computed: {
    ...mapGetters('user', ['getSessionId', 'getToken', 'getUser'])
  },
  mounted () {
    this.fetchOrders(this.currentPage)
    this.startTimer()
  },
  beforeDestroy () {
    this.destroyTimer()
  },
  methods: {
    fetchOrders () {
      this.loading = true
      let userId = this.getUser.id
      console.log(userId)
      getOrder(this.currentPage, this.pageSize).then(res => {
        this.orders = res.list
        this.total = Number(res.total) || 0
        this.loading = false
      })
      // setTimeout(() => {
      //   this.orders = this.mockData.data.list
      //   this.total = this.mockData.data.total
      //   this.loading = false
      // }, 500)
    },

    handlePageChange (page) {
      this.currentPage = page
      this.fetchOrders(page)
    },

    formatPrice (price) {
      return (price / 100).toFixed(2)
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
.order-list-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}
.countdown {
  color: #ff4d4f;
  font-weight: 600;
}
.item-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}
.item-thumb {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fafafa;
}
.item-title {
  font-size: 14px;
  color: #333;
}
.item-spec {
  font-size: 12px;
  color: #888;
}
</style>
