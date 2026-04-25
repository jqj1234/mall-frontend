<template>
  <div class="product-detail-page">
    <div class="container">
      <section class="hero-card">
        <div class="hero-text">
          <p class="hero-kicker">Sun Mall</p>
          <h1>确认订单</h1>
          <p class="hero-desc">核对商品、地址与支付方式后，快速完成下单</p>
        </div>
        <div class="hero-actions">
          <el-button plain icon="el-icon-arrow-left" @click="$router.push('/')">
            返回首页
          </el-button>
        </div>
      </section>

      <section class="detail-panel">
        <div class="product-grid">
          <div class="image-section">
            <img
              :src="product.image"
              :alt="product.name || '商品图片'"
              class="product-img"
            />
            <span v-if="product.id && !hasStock" class="stock-tag">暂时缺货</span>
          </div>

          <div class="info-section">
            <h2 class="product-name">{{ product.name || '商品信息加载中...' }}</h2>

            <div class="meta-list">
              <span class="meta-chip">品牌：{{ product.brand || '--' }}</span>
              <span class="meta-chip">分类：{{ product.category || '--' }}</span>
              <span class="meta-chip">库存：{{ stockCount }}</span>
            </div>

            <div class="price-card">
              <span class="price-label">商品单价</span>
              <span class="price-value">￥{{ formatPrice(unitPrice) }}</span>
            </div>

            <div class="quantity-wrap">
              <p class="block-title">购买数量</p>
              <div class="quantity-control">
                <button
                  class="qty-btn"
                  @click="decreaseQuantity"
                  :disabled="quantity <= 1"
                >
                  -
                </button>
                <input
                  id="quantity"
                  type="number"
                  v-model.number="quantity"
                  min="1"
                  :max="stockCount"
                  readonly
                />
                <button
                  class="qty-btn"
                  @click="increaseQuantity"
                  :disabled="!hasStock || quantity >= stockCount"
                >
                  +
                </button>
              </div>
            </div>

            <div class="total-card">
              <span>当前合计</span>
              <strong>￥{{ totalPrice }}</strong>
            </div>
          </div>
        </div>

        <div class="checkout-grid">
          <article class="panel-card">
            <div class="card-head">
              <h3>支付方式</h3>
              <p>当前支持余额支付</p>
            </div>
            <el-radio-group v-model="paymentType" class="payment-group">
              <el-radio :label="5">余额支付</el-radio>
              <el-radio :label="1" disabled>微信支付</el-radio>
              <el-radio :label="2" disabled>支付宝支付</el-radio>
            </el-radio-group>
          </article>

          <article class="panel-card">
            <div class="card-head">
              <h3>收货地址</h3>
              <p>共 {{ addressList.length }} 个可用地址</p>
            </div>
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
            <p v-if="selectedAddress" class="address-preview">
              已选择：{{ selectedAddress.fullAddress }}
            </p>
          </article>
        </div>

        <div class="action-bar">
          <div class="action-summary">
            <span>共 {{ quantity }} 件商品</span>
            <strong>￥{{ totalPrice }}</strong>
          </div>
          <el-button
            type="primary"
            class="submit-btn"
            :disabled="!canSubmit"
            @click="buyNow"
          >
            立即下单
          </el-button>
        </div>
      </section>
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
      product: {},
      addressList: [],
      selectedAddressId: '',
      quantity: 1,
      paymentType: 5
    }
  },
  computed: {
    unitPrice () {
      return Number(this.product.price || 0)
    },
    stockCount () {
      const stock = Number(this.product.stock || 0)
      return Number.isNaN(stock) ? 0 : stock
    },
    hasStock () {
      return this.stockCount > 0
    },
    totalPrice () {
      const total = this.unitPrice * Number(this.quantity || 0)
      return (total / 100).toFixed(2)
    },
    selectedAddress () {
      return this.addressList.find(item => item.id === this.selectedAddressId)
    },
    canSubmit () {
      return (
        Boolean(this.product.id) &&
        Boolean(this.selectedAddressId) &&
        this.hasStock &&
        this.quantity > 0
      )
    }
  },
  mounted () {
    const productId = this.$route.params.id
    this.fetchProduct(productId)
    this.fetchAddressList()
  },
  methods: {
    async fetchProduct (productId) {
      try {
        const res = await getItem(productId)
        this.product = res || {}
        if (this.hasStock && this.quantity < 1) {
          this.quantity = 1
        }
      } catch (e) {
        this.product = {}
        this.$message.error('加载商品信息失败')
      }
    },
    async fetchAddressList () {
      try {
        const res = await getAddress()
        const list = Array.isArray(res) ? res : []
        this.addressList = list.map(item => ({
          id: item.id,
          fullAddress: `${item.contact} ${item.mobile} ${item.province}${item.city}${item.town}${item.street}`
        }))
        if (this.addressList.length > 0) {
          const defaultAddress = list.find(item => item.isDefault === 1) || list[0]
          this.selectedAddressId = defaultAddress && defaultAddress.id
        }
      } catch (error) {
        this.addressList = []
        this.$message.error('获取收货地址失败')
      }
    },
    formatPrice (priceInCents) {
      return (Number(priceInCents || 0) / 100).toFixed(2)
    },
    decreaseQuantity () {
      if (this.quantity > 1) {
        this.quantity -= 1
      }
    },
    increaseQuantity () {
      if (this.hasStock && this.quantity < this.stockCount) {
        this.quantity += 1
      }
    },
    async buyNow () {
      if (!this.selectedAddressId) {
        this.$message.warning('请选择收货地址')
        return
      }
      if (!this.hasStock) {
        this.$message.warning('当前商品库存不足')
        return
      }
      try {
        const orderId = await createOrderForm({
          addressId: this.selectedAddressId,
          paymentType: this.paymentType,
          details: [{ itemId: this.product.id, num: this.quantity }]
        })
        const amount = this.unitPrice * Number(this.quantity || 0)
        const payOrderNo = await applyPayOrder({
          bizOrderNo: orderId,
          amount,
          payChannelCode: 'BALANCE',
          payType: this.paymentType
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
        this.$message.error('下单失败，请稍后重试')
      }
    }
  }
}
</script>

<style scoped>
.product-detail-page {
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

.detail-panel {
  margin-top: 16px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  padding: 20px;
}

.product-grid {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 20px;
}

.image-section {
  position: relative;
  border-radius: 16px;
  border: 1px solid #e7edf6;
  background: linear-gradient(180deg, #fafcff 0%, #f6f8fb 100%);
  padding: 18px;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-img {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
}

.stock-tag {
  position: absolute;
  top: 14px;
  right: 14px;
  height: 28px;
  border-radius: 999px;
  padding: 0 12px;
  line-height: 28px;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(120deg, #ef6b6b, var(--primary));
  box-shadow: 0 8px 14px rgba(235, 87, 87, 0.28);
}

.info-section {
  min-width: 0;
}

.product-name {
  margin: 2px 0 14px;
  font-size: 28px;
  line-height: 1.35;
  color: #111827;
}

.meta-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  height: 32px;
  border-radius: 16px;
  padding: 0 14px;
  border: 1px solid #dbe3ef;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
}

.price-card {
  margin-top: 18px;
  border-radius: 14px;
  padding: 12px 14px;
  background: #fff5f2;
  border: 1px solid #ffd9ce;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.price-label {
  color: #64748b;
  font-size: 14px;
}

.price-value {
  color: var(--primary);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.quantity-wrap {
  margin-top: 16px;
}

.block-title {
  margin: 0 0 10px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
}

.quantity-control {
  display: inline-flex;
  align-items: center;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.qty-btn {
  width: 42px;
  height: 42px;
  border: none;
  background: #f8fafc;
  color: #334155;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qty-btn:hover:not(:disabled) {
  background: #fff2ef;
  color: var(--primary);
}

.qty-btn:disabled {
  cursor: not-allowed;
  color: #a0aec0;
}

.quantity-control input {
  width: 72px;
  height: 42px;
  border: none;
  outline: none;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.total-card {
  margin-top: 16px;
  border-top: 1px dashed #e5ebf3;
  padding-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.total-card span {
  color: #64748b;
}

.total-card strong {
  color: var(--primary);
  font-size: 24px;
}

.checkout-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.panel-card {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}

.card-head {
  margin-bottom: 12px;
}

.card-head h3 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
}

.card-head p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.payment-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.payment-group ::v-deep .el-radio {
  margin-right: 0;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #dbe3ef;
  background: #f8fafc;
}

.payment-group ::v-deep .el-radio__input.is-checked + .el-radio__label {
  color: var(--primary);
  font-weight: 600;
}

.address-select {
  width: 100%;
}

.address-select ::v-deep .el-input__inner {
  border-radius: 12px;
  border: 1px solid #dbe3ef;
  height: 42px;
}

.address-preview {
  margin: 10px 0 0;
  color: #475569;
  line-height: 1.55;
  font-size: 13px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e8eef6;
  padding: 8px 10px;
}

.action-bar {
  margin-top: 16px;
  border-top: 1px solid #eff3f8;
  padding-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.action-summary {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: #64748b;
}

.action-summary strong {
  color: var(--primary);
  font-size: 30px;
  line-height: 1;
}

.submit-btn {
  min-width: 148px;
}

.submit-btn ::v-deep span {
  font-weight: 600;
}

@media (max-width: 1024px) {
  .product-grid {
    grid-template-columns: 1fr;
  }

  .image-section {
    min-height: 280px;
  }

  .checkout-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .container {
    width: calc(100% - 24px);
  }

  .product-detail-page {
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

  .detail-panel {
    padding: 14px;
  }

  .product-name {
    font-size: 22px;
  }

  .price-value {
    font-size: 24px;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .submit-btn {
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

  .meta-list {
    gap: 8px;
  }

  .meta-chip {
    width: 100%;
    justify-content: center;
  }

  .action-summary {
    justify-content: space-between;
  }

  .action-summary strong {
    font-size: 26px;
  }
}
</style>
