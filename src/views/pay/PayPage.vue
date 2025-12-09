<template>
  <div class="pay-page container">
    <div class="header-bar">
      <h2>支付中心</h2>
      <el-button type="text" @click="$router.push('/')">返回首页</el-button>
    </div>
    <div class="center-wrap">
      <el-card class="pay-card">
        <div class="row">
          <span>订单号</span>
          <span>{{ orderId }}</span>
        </div>
        <div class="row">
          <span>支付金额</span>
          <span class="amount">￥{{ formatPrice(amount) }}</span>
        </div>
        <div class="row">
          <span>支付方式</span>
          <el-radio-group v-model="payType">
            <el-radio :label="1">余额支付</el-radio>
            <el-radio :label="2" disabled>微信支付</el-radio>
            <el-radio :label="3" disabled>支付宝支付</el-radio>
          </el-radio-group>
        </div>
        <div class="row">
          <span>支付密码</span>
          <el-input
            v-model="password"
            type="password"
            placeholder="请输入支付密码"
            show-password
            style="max-width: 300px"
          />
        </div>
        <div class="actions">
          <el-button
            type="primary"
            :loading="paying"
            :disabled="!canPay"
            @click="payByBalance"
            >支付</el-button
          >
          <el-button @click="$router.push('/orderlist')">查看订单</el-button>
        </div>
      </el-card>
    </div>
    <div class="tip">目前仅支持余额支付，其它方式暂不可用</div>
  </div>
</template>

<script>
import { tryPayOrderByBalance } from '@/api/pay'
export default {
  name: 'PayPage',
  data () {
    return {
      orderId: this.$route.query.orderId || '',
      payOrderNo: this.$route.query.payOrderNo || '',
      amount: Number(this.$route.query.amount || 0),
      payType: 1,
      password: '',
      paying: false
    }
  },
  computed: {
    canPay () {
      return this.payType === 1 && this.password && this.password.length >= 3
    }
  },
  methods: {
    formatPrice (cents) {
      return (Number(cents) / 100).toFixed(2)
    },
    async payByBalance () {
      if (!this.canPay) return
      if (!this.payOrderNo) {
        this.$message.error('支付单不存在')
        return
      }
      try {
        this.paying = true
        await tryPayOrderByBalance(this.payOrderNo, { pw: this.password })
        this.$message.success('支付成功')
        this.$router.push('/orderlist')
      } catch (e) {
        // this.$message.error('支付失败')
      } finally {
        this.paying = false
      }
    }
  }
}
</script>

<style scoped>
.pay-page {
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.center-wrap {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.pay-card {
  max-width: 640px;
  width: 640px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.amount {
  color: #ff4d4f;
  font-weight: 600;
}
.actions {
  display: flex;
  gap: 12px;
}
.tip {
  margin-top: 10px;
  color: #999;
}
</style>
