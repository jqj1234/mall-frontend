<template>
  <div class="cart-page container">
    <div class="header-bar">
      <h2>我的购物车</h2>
      <el-button type="text" @click="$router.push('/')">继续购物</el-button>
    </div>
    <div v-if="loading" class="loading-wrap">
      <i class="el-icon-loading"></i>
    </div>
    <div v-else-if="availableCarts.length" class="cart-content">
      <div class="address-bar">
        <div class="address-left">
          <span class="label">收货地址</span>
          <el-select
            v-model="selectedAddressId"
            placeholder="请选择收货地址"
            style="width: 400px"
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
          <span>商品件数：{{ totalCount }}</span>
        </div>
      </div>

      <div class="cart-table">
        <el-table :data="availableCarts" border>
          <el-table-column label="商品" min-width="380">
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
      </div>
    </div>
    <div v-else>
      <el-empty description="购物车为空"></el-empty>
    </div>

    <div v-if="downCarts.length" class="down-section">
      <h3>已下架商品</h3>
      <el-table :data="downCarts" border>
        <el-table-column label="商品" min-width="380">
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
            <span>￥{{ formatPrice(priceOf(row)) }}</span>
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
    </div>

    <div v-if="availableCarts.length" class="checkout-bar">
      <div class="checkout-info">
        <span>合计金额：</span>
        <span class="sum">￥{{ formatPrice(totalAmount) }}</span>
      </div>
      <el-button
        type="primary"
        size="medium"
        :disabled="!availableCarts.length"
        @click="checkout"
        >去结算</el-button
      >
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
  padding: 20px;
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.cart-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.address-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background: #fff;
}
.address-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.label {
  color: #666;
}
.item-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}
.item-thumb {
  width: 80px;
  height: 80px;
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
.price-wrap {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: baseline;
}
.price {
  color: #ff4d4f;
  font-weight: 600;
}
.old-price {
  color: #999;
  text-decoration: line-through;
}
.subtotal {
  color: #ff4d4f;
}
.summary {
  display: none;
}
.qty-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.qty {
  min-width: 24px;
  display: inline-block;
  text-align: center;
}
.down-section {
  margin-top: 16px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.sum {
  color: #ff4d4f;
  font-weight: 600;
}
.checkout-bar {
  position: sticky;
  bottom: 0;
  background: #fff;
  border-top: 1px solid #eee;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-top: 12px;
}
.checkout-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.loading-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}
</style>
