<template>
  <div class="product-detail">
    <h2>商品详情</h2>

    <div class="detail-container">
      <!-- 商品图片 -->
      <div class="image-section">
        <img :src="product.image" :alt="product.name" class="product-img" />
      </div>

      <!-- 商品信息 -->
      <div class="info-section">
        <h3>{{ product.name }}</h3>
        <p><strong>品牌：</strong>{{ product.brand }}</p>
        <p><strong>分类：</strong>{{ product.category }}</p>
        <p style="color: red">
          <strong>价格：</strong>￥{{ formatPrice(product.price) }}
        </p>
        <p><strong>库存：</strong>{{ product.stock }}</p>

        <!-- 购买数量 -->
        <div class="quantity-control">
          <label for="quantity">购买数量：</label>
          <button @click="decreaseQuantity" :disabled="quantity <= 1">-</button>
          <input
            type="number"
            id="quantity"
            v-model.number="quantity"
            min="1"
            :max="product.stock"
            readonly
          />
          <button
            @click="increaseQuantity"
            :disabled="quantity >= product.stock"
          >
            +
          </button>
        </div>

        <!-- 总价显示 -->
        <div class="total-price">
          <strong>总价：</strong>
          <span style="color: red">￥{{ totalPrice }}</span>
        </div>

        <!-- 支付方式选择 -->
        <div class="payment-type">
          <el-radio-group v-model="paymentType">
            <el-radio :label="5">余额支付</el-radio>
            <el-radio :label="1" disabled>微信</el-radio>
            <el-radio :label="2" disabled>支付宝</el-radio>
          </el-radio-group>
        </div>

        <!-- 收货地址选择 -->
        <div class="address-section">
          <el-select
            v-model="selectedAddressId"
            placeholder="请选择收货地址"
            @change="handleSelectChange"
            style="width: 95%"
          >
            <el-option
              v-for="addr in addressList"
              :key="addr.id"
              :label="addr.fullAddress"
              :value="addr.id"
            >
            </el-option>
          </el-select>
        </div>

        <!-- 按钮 -->
        <div class="actions">
          <el-button type="primary" @click="buyNow">立即购买</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getItem } from '@/api/item'
import { getAddress } from '@/api/address'
import { createOrderForm } from '@/api/order'
import { applyPayOrder } from '@/api/pay'
export default {
  name: 'ProductDetail',
  data () {
    return {
      // 模拟从接口获取的商品数据（实际中应通过 API 请求）
      product: {},
      addressList: [],
      selectedAddressId: '', // 当前选中的地址
      quantity: 1,
      paymentType: 5
    }
  },
  computed: {
    totalPrice () {
      return ((this.product.price * this.quantity) / 100).toFixed(2)
    }
  },
  mounted () {
    // 获取商品 ID，并使用 API 获取商品详情数据
    const productId = this.$route.params.id
    // 假设 API 获取商品详情数据
    getItem(productId).then(res => {
      this.product = res
    })

    // 获取收货地址
    this.handleAddress()
  },
  methods: {
    handleSelectChange (value) {
      console.log('选择了地址:', value)
      // 这里可以添加逻辑来处理选择地址后的操作，比如更新表单、显示详细信息等
    },
    handleAddress () {
      // let userId = store.state.user.user.id
      // getAddress(userId).then(res => {
      //   this.addressList = res.map(
      //     item =>
      //       `${item.contact} ${item.mobile} ${item.province}${item.city}${item.town}${item.street}`
      //   )
      // })

      getAddress()
        .then(res => {
          // 将原始数据映射成 { id, fullAddress } 结构
          this.addressList = res.map(item => ({
            id: item.id,
            fullAddress: `${item.contact} ${item.mobile} ${item.province}${item.city}${item.town}${item.street}`
          }))
          // 默认选中第一个地址（如果存在）
          if (this.addressList.length > 0) {
            this.selectedAddressId = this.addressList[0].id
          }
        })
        .catch(error => {
          console.error('获取地址失败', error)
        })
    },
    formatPrice (priceInCents) {
      return (priceInCents / 100).toFixed(2)
    },
    decreaseQuantity () {
      if (this.quantity > 1) {
        this.quantity--
      }
    },
    increaseQuantity () {
      if (this.quantity < this.product.stock) {
        this.quantity++
      }
    },
    async buyNow () {
      if (!this.selectedAddressId) {
        this.$message.warning('请选择收货地址')
        return
      }
      try {
        const orderId = await createOrderForm({
          addressId: this.selectedAddressId,
          paymentType: 5,
          details: [{ itemId: this.product.id, num: this.quantity }]
        })
        const amount = (this.product.price || 0) * (this.quantity || 0)
        const payOrderNo = await applyPayOrder({
          bizOrderNo: orderId,
          amount,
          payChannelCode: 'BALANCE',
          payType: 5
        })
        this.$router.push({
          path: '/pay',
          query: {
            orderId,
            payOrderNo: payOrderNo || '',
            amount
          }
        })
      } catch (e) {
        this.$message.error('下单失败')
      }
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

.quantity-control {
  display: flex;
  align-items: center;
  margin: 15px 0;
}

.quantity-control button {
  width: 30px;
  height: 30px;
  font-size: 18px;
  cursor: pointer;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  margin: 0 5px;
}

.quantity-control input {
  width: 60px;
  text-align: center;
  font-size: 16px;
  border: 1px solid #ccc;
  padding: 4px;
  margin: 0 5px;
}

.total-price {
  font-size: 18px;
  margin: 15px 0;
}

.actions {
  margin-top: 20px;
}
</style>
