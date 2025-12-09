<template>
  <div
    class="product-detail"
    v-loading="creating"
    element-loading-text="正在创建订单，请稍等"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(0, 0, 0, 0.4)"
  >
    <h2>秒杀商品详情</h2>

    <div class="detail-container">
      <div class="image-section">
        <img :src="item.image" :alt="item.name" class="product-img" />
      </div>

      <div class="info-section">
        <h3>{{ item.name }}</h3>
        <p><strong>品牌：</strong>{{ item.brand }}</p>
        <p class="price">
          <strong>秒杀价：</strong>￥{{ formatPrice(item.price) }}
        </p>
        <p><strong>库存：</strong>{{ item.stock }}</p>
        <p><strong>开始时间：</strong>{{ formatTime(item.beginTime) }}</p>
        <p><strong>结束时间：</strong>{{ formatTime(item.endTime) }}</p>

        <div class="payment-type">
          <el-radio-group v-model="paymentType">
            <el-radio :label="5">余额支付</el-radio>
            <el-radio :label="1" disabled>微信</el-radio>
            <el-radio :label="2" disabled>支付宝</el-radio>
          </el-radio-group>
        </div>

        <div class="address-section">
          <el-select
            v-model="selectedAddressId"
            placeholder="请选择收货地址"
            style="width: 95%"
          >
            <el-option
              v-for="addr in addressList"
              :key="addr.id"
              :label="addr.fullAddress"
              :value="addr.id"
            />
          </el-select>
        </div>

        <div class="actions">
          <el-button
            type="primary"
            :loading="creating"
            :disabled="!canOrder || creating"
            @click="placeOrder"
          >
            立即下单
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getSeckillItemById, createSeckillOrder } from '@/api/seckill'
import { getAddress } from '@/api/address'
import { applyPayOrder } from '@/api/pay'
import { getOrderById } from '@/api/order'

export default {
  name: 'SeckillDetail',
  data () {
    return {
      item: {},
      addressList: [],
      selectedAddressId: '',
      paymentType: 5,
      loading: false,
      creating: false
    }
  },
  computed: {
    canOrder () {
      return !!this.selectedAddressId && !!this.item && !!this.item.itemId
    }
  },
  created () {
    const id = this.$route.params.id
    this.fetchItem(id)
    this.fetchAddresses()
  },
  methods: {
    async fetchItem (id) {
      try {
        this.loading = true
        const res = await getSeckillItemById(id)
        this.item = res || {}
      } catch (e) {
        this.$message.error('加载秒杀商品失败')
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
    formatPrice (cents) {
      return (Number(cents) / 100).toFixed(2)
    },
    formatTime (tsOrStr) {
      try {
        if (!tsOrStr) return ''
        const v = Number(tsOrStr)
        const d = !Number.isNaN(v)
          ? new Date(v)
          : new Date(String(tsOrStr).replace('T', ' '))
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        const hh = String(d.getHours()).padStart(2, '0')
        const mi = String(d.getMinutes()).padStart(2, '0')
        const ss = String(d.getSeconds()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
      } catch (e) {
        return tsOrStr
      }
    },
    async placeOrder () {
      if (!this.canOrder) {
        this.$message.warning('请选择收货地址')
        return
      }
      try {
        this.creating = true
        const orderId = await createSeckillOrder({
          addressId: this.selectedAddressId,
          paymentType: this.paymentType,
          itemId: this.item.itemId,
          seckillItemId: this.item.seckillItemId
        })

        await this.waitOrderReady(orderId)
        const amount = Number(this.item.price || 0)
        const payOrderNo = await applyPayOrder({
          bizOrderNo: orderId,
          amount,
          payChannelCode: 'BALANCE',
          payType: 5
        })

        this.$router.push({
          path: '/pay',
          query: {
            orderId: orderId,
            payOrderNo: payOrderNo || '',
            amount
          }
        })
      } catch (e) {
        this.$message.error('下单失败')
      } finally {
        this.creating = false
      }
    },
    async waitOrderReady (orderId) {
      const maxAttempts = 20
      const intervalMs = 1000
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const order = await getOrderById(orderId)
          if (order && (order.id || order.orderId)) return
        } catch (e) {
          void e
        }
        await new Promise(r => setTimeout(r, intervalMs))
      }
      throw new Error('订单未完成落库')
    }
  }
}
</script>

<style scoped>
.address-section {
  margin-top: 15px;
}

.product-detail {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.detail-container {
  display: flex;
  gap: 40px;
  max-width: 1000px;
  margin: 0 auto;
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.image-section img {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.info-section h3 {
  margin-top: 0;
}

.price {
  color: #ff4d4f;
}

.actions {
  margin-top: 20px;
}
</style>
