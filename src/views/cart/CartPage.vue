<template>
  <div class="cart-page">
    <div class="container">
      <section class="hero-card">
        <div class="hero-text">
          <p class="hero-kicker">Sun Mall</p>
          <h1>我的购物车</h1>
          <p class="hero-desc">核对商品数量和收货地址后，可直接完成结算。</p>
        </div>
        <div class="hero-actions">
          <el-button plain icon="el-icon-arrow-left" @click="$router.push('/')">
            继续购物
          </el-button>
        </div>
      </section>

      <section v-if="loading" class="panel-card loading-wrap">
        <i class="el-icon-loading"></i>
        <span>正在加载购物车...</span>
      </section>

      <template v-else-if="availableCarts.length">
        <section class="panel-card address-panel">
          <div class="address-left">
            <p class="label">收货地址</p>
            <el-select
              v-model="selectedAddressId"
              placeholder="请选择收货地址"
              class="address-select"
            >
              <el-option
                v-for="addr in addressList"
                :key="addr.id"
                :label="addr.fullAddress"
                :value="addr.id"
              />
            </el-select>
          </div>
          <div class="address-right">
            <div class="stat-chip">
              <span>商品件数</span>
              <strong>{{ totalCount }}</strong>
            </div>
            <div class="stat-chip">
              <span>可结算商品</span>
              <strong>{{ availableCarts.length }}</strong>
            </div>
          </div>
        </section>

        <section class="panel-card table-panel">
          <div class="panel-head">
            <div>
              <h2>待结算商品</h2>
              <p>支持直接调整数量并实时计算小计</p>
            </div>
          </div>
          <el-table :data="availableCarts" border class="cart-table">
            <el-table-column label="商品" min-width="360">
              <template slot-scope="{ row }">
                <div class="item-cell">
                  <img :src="row.image" alt="" class="item-thumb" />
                  <div class="item-info">
                    <div class="item-title">{{ row.name }}</div>
                    <div class="item-spec" v-if="row.spec">{{ row.spec }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="价格" width="160" align="center">
              <template slot-scope="{ row }">
                <div class="price-wrap">
                  <span class="price">￥{{ formatPrice(priceOf(row)) }}</span>
                  <span
                    v-if="row.newPrice && row.newPrice !== row.price"
                    class="old-price"
                    >￥{{ formatPrice(row.price) }}</span
                  >
                </div>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="160" align="center">
              <template slot-scope="{ row }">
                <div class="qty-control">
                  <el-button
                    size="mini"
                    icon="el-icon-minus"
                    :disabled="row.num <= 1 || updatingId === row.id"
                    @click="decrease(row)"
                  ></el-button>
                  <span class="qty">{{ row.num }}</span>
                  <el-button
                    size="mini"
                    icon="el-icon-plus"
                    :disabled="updatingId === row.id"
                    @click="increase(row)"
                  ></el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              prop="stock"
              label="库存"
              width="120"
              align="center"
            />
            <el-table-column label="小计" width="160" align="center">
              <template slot-scope="{ row }">
                <span class="subtotal">￥{{ formatPrice(subtotalOf(row)) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template slot-scope="{ row }">
                <el-popconfirm title="确认删除该商品？" @confirm="remove(row)">
                  <el-button
                    slot="reference"
                    type="text"
                    :disabled="deletingId === row.id"
                    >删除</el-button
                  >
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </template>

      <section v-else class="panel-card empty-panel">
        <el-empty description="购物车为空"></el-empty>
      </section>

      <section v-if="downCarts.length" class="panel-card down-section">
        <div class="panel-head">
          <div>
            <h2>已下架商品</h2>
            <p>建议移除后重新选择替代商品</p>
          </div>
        </div>
        <el-table :data="downCarts" border class="down-table">
          <el-table-column label="商品" min-width="360">
            <template slot-scope="{ row }">
              <div class="item-cell">
                <img :src="row.image" alt="" class="item-thumb" />
                <div class="item-info">
                  <div class="item-title">{{ row.name }}</div>
                  <div class="item-spec" v-if="row.spec">{{ row.spec }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="价格" width="160" align="center">
            <template slot-scope="{ row }">
              <span class="down-price">￥{{ formatPrice(priceOf(row)) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="120" align="center" />
          <el-table-column label="操作" width="120" align="center">
            <template slot-scope="{ row }">
              <el-popconfirm title="确认删除该商品？" @confirm="remove(row)">
                <el-button
                  slot="reference"
                  type="text"
                  :disabled="deletingId === row.id"
                  >删除</el-button
                >
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section v-if="availableCarts.length" class="checkout-bar">
        <div class="checkout-info">
          <span class="checkout-label">合计金额</span>
          <span class="sum">￥{{ formatPrice(totalAmount) }}</span>
          <span class="checkout-count">共 {{ totalCount }} 件商品</span>
        </div>
        <el-button
          type="primary"
          size="medium"
          class="checkout-btn"
          :disabled="!availableCarts.length"
          @click="checkout"
          >去结算</el-button
        >
      </section>
    </div>
  </div>
</template>

<script>
import { getMyCarts, updateCart, deleteCartItem } from '@/api/cart'
import { createOrderForm } from '@/api/order'
import { applyPayOrder } from '@/api/pay'
import { getAddress } from '@/api/address'
export default {
  name: 'CartPage',
  data () {
    return {
      carts: [],
      loading: false,
      updatingId: null,
      deletingId: null,
      addressList: [],
      selectedAddressId: ''
    }
  },
  computed: {
    availableCarts () {
      return this.carts.filter(i => i.status === 1)
    },
    downCarts () {
      return this.carts.filter(i => i.status === 2)
    },
    totalCount () {
      return this.availableCarts.reduce((sum, i) => sum + (i.num || 0), 0)
    },
    totalAmount () {
      return this.availableCarts.reduce(
        (sum, i) => sum + this.priceOf(i) * (i.num || 0),
        0
      )
    }
  },
  mounted () {
    this.fetchCarts()
    this.fetchAddresses()
  },
  methods: {
    async fetchCarts () {
      try {
        this.loading = true
        const res = await getMyCarts()
        this.carts = Array.isArray(res) ? res : []
      } catch (e) {
        this.$message.error('加载购物车失败')
      } finally {
        this.loading = false
      }
    },
    async fetchAddresses () {
      try {
        const list = await getAddress()
        this.addressList = Array.isArray(list)
          ? list.map(item => ({
              id: item.id,
              fullAddress: `${item.contact} ${item.mobile} ${item.province}${item.city}${item.town}${item.street}`
            }))
          : []
        if (this.addressList.length) {
          const defaultAddr = list.find(a => a.isDefault === 1) || list[0]
          this.selectedAddressId = defaultAddr && defaultAddr.id
        }
      } catch (e) {
        this.$message.error('加载地址失败')
      }
    },
    async decrease (row) {
      if (row.num <= 1 || this.updatingId) return
      await this.updateQty(row, row.num - 1)
    },
    async increase (row) {
      if (this.updatingId) return
      await this.updateQty(row, (row.num || 0) + 1)
    },
    async updateQty (row, num) {
      try {
        this.updatingId = row.id
        await updateCart({ id: row.id, num })
        row.num = num
        this.$message.success('数量已更新')
      } catch (e) {
        this.$message.error('更新数量失败')
      } finally {
        this.updatingId = null
      }
    },
    async remove (row) {
      try {
        this.deletingId = row.id
        await deleteCartItem(row.id)
        this.carts = this.carts.filter(i => i.id !== row.id)
        this.$message.success('已删除')
      } catch (e) {
        this.$message.error('删除失败')
      } finally {
        this.deletingId = null
      }
    },
    async checkout () {
      if (!this.availableCarts.length) return
      try {
        this.loading = true
        if (!this.selectedAddressId) {
          this.$message.warning('请先添加收货地址')
          return
        }
        const details = this.availableCarts
          .filter(i => i.num > 0)
          .map(i => ({ itemId: i.itemId || i.id, num: i.num }))
        if (!details.length) {
          this.$message.warning('购物车为空或数量为0')
          return
        }
        const orderId = await createOrderForm({
          addressId: this.selectedAddressId,
          paymentType: 5,
          details
        })
        const payOrderNo = await applyPayOrder({
          bizOrderNo: orderId,
          amount: this.totalAmount,
          payChannelCode: 'BALANCE',
          payType: 5
        })
        this.$router.push({
          path: '/pay',
          query: {
            orderId: orderId,
            payOrderNo: payOrderNo || '',
            amount: this.totalAmount
          }
        })
      } catch (e) {
        this.$message.error('结算失败')
      } finally {
        this.loading = false
      }
    },
    priceOf (row) {
      return row && row.newPrice != null ? row.newPrice : row.price || 0
    },
    subtotalOf (row) {
      return this.priceOf(row) * (row.num || 0)
    },
    formatPrice (cents) {
      return (cents / 100).toFixed(2)
    },
    statusText (status) {
      const map = { 1: '在售', 2: '下架' }
      return map[status] || '未知'
    },
    statusTagType (status) {
      const map = { 1: 'success', 2: 'info' }
      return map[status] || 'warning'
    }
  }
}
</script>

<style scoped>
.cart-page {
  --primary: #eb5757;
  --primary-deep: #cc4242;
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

.panel-card {
  margin-top: 16px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.loading-wrap {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: #64748b;
}

.loading-wrap i {
  font-size: 28px;
  color: #f27a61;
}

.address-panel {
  padding: 16px 18px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.address-left {
  min-width: 0;
  flex: 1;
}

.label {
  margin: 0 0 10px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
}

.address-select {
  width: min(560px, 100%);
}

.address-select ::v-deep .el-input__inner {
  border-radius: 12px;
  border: 1px solid #dde5f0;
  height: 42px;
}

.address-right {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.stat-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  min-height: 38px;
  border-radius: 12px;
  border: 1px solid #e8edf6;
  background: #f8fafc;
  padding: 0 12px;
  color: #64748b;
  font-size: 13px;
}

.stat-chip strong {
  color: #0f172a;
  font-size: 20px;
}

.table-panel {
  padding: 18px 18px 16px;
}

.panel-head {
  margin-bottom: 12px;
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

.cart-table ::v-deep .el-table__header-wrapper th,
.down-table ::v-deep .el-table__header-wrapper th {
  background: #f8fafd;
  color: #475569;
  font-weight: 600;
}

.cart-table ::v-deep .el-table td,
.cart-table ::v-deep .el-table th.is-leaf,
.down-table ::v-deep .el-table td,
.down-table ::v-deep .el-table th.is-leaf {
  border-bottom: 1px solid #edf1f7;
}

.cart-table ::v-deep .el-table__body tr:hover > td,
.down-table ::v-deep .el-table__body tr:hover > td {
  background: #fffaf8;
}

.item-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.item-thumb {
  width: 72px;
  height: 72px;
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

.price-wrap {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: baseline;
}

.price {
  color: var(--primary);
  font-weight: 700;
}

.old-price {
  color: #94a3b8;
  text-decoration: line-through;
}

.subtotal {
  color: var(--primary);
  font-weight: 700;
}

.qty-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.qty-control ::v-deep .el-button {
  border-radius: 8px;
  border-color: #dce4ef;
}

.qty {
  min-width: 24px;
  display: inline-block;
  text-align: center;
  font-weight: 600;
}

.empty-panel {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.down-section {
  padding: 18px;
}

.down-price {
  color: #334155;
  font-weight: 600;
}

.sum {
  color: var(--primary);
  font-weight: 700;
  font-size: 30px;
  line-height: 1;
}

.checkout-bar {
  position: sticky;
  bottom: 16px;
  z-index: 10;
  margin-top: 16px;
  border: 1px solid #ffe0d9;
  background: linear-gradient(135deg, #ffffff 0%, #fff4f1 100%);
  box-shadow: 0 10px 20px rgba(224, 106, 94, 0.12);
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
}

.checkout-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.checkout-label {
  color: #64748b;
  font-size: 14px;
}

.checkout-count {
  color: #64748b;
  font-size: 13px;
}

.checkout-btn {
  min-width: 132px;
}

.checkout-btn ::v-deep span {
  font-weight: 600;
}

@media (max-width: 860px) {
  .container {
    width: calc(100% - 24px);
  }

  .cart-page {
    padding: 16px 0 26px;
  }

  .hero-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 22px 20px;
  }

  .hero-text h1 {
    font-size: 30px;
  }

  .address-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .address-right {
    justify-content: flex-start;
  }

  .table-panel,
  .down-section {
    padding: 14px;
  }

  .checkout-bar {
    bottom: 10px;
    flex-direction: column;
    align-items: stretch;
  }

  .checkout-btn {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .hero-text h1 {
    font-size: 28px;
  }

  .hero-desc {
    display: none;
  }

  .panel-head h2 {
    font-size: 22px;
  }

  .sum {
    font-size: 26px;
  }

  .stat-chip {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 420px) {
  .qty-control {
    gap: 6px;
  }

  .qty-control ::v-deep .el-button {
    padding-left: 8px;
    padding-right: 8px;
  }

  .checkout-info {
    justify-content: space-between;
  }

  .sum {
    width: 100%;
  }
}
</style>
