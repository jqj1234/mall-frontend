<template>
  <div class="seckill-page">
    <div class="header">
      <div class="brand" @click="$router.push('/')">商城 - 秒杀专区</div>
      <div class="user-info">
        <el-button type="text" @click="$router.push('/')">返回首页</el-button>
      </div>
    </div>

    <div class="container">
      <div class="seckill-list">
        <div
          v-for="item in seckillItems"
          :key="item.itemId"
          class="seckill-item"
        >
          <div class="item-img">
            <img :src="item.image || defaultImage" :alt="item.name" />
          </div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-brand">品牌: {{ item.brand }}</div>
            <div class="item-price">
              <span class="price"
                >秒杀价: ￥{{ (item.seckillPrice / 100).toFixed(2) }}</span
              >
              <!-- <span class="original-price" v-if="item.price">原价: ￥{{ item.price }}</span> -->
            </div>
            <div class="item-time">
              <span>开始: {{ formatTime(item.beginTime) }}</span>
              <span>结束: {{ formatTime(item.endTime) }}</span>
            </div>
            <div class="item-action">
              <el-button
                type="danger"
                :disabled="item.stock <= 0"
                @click="goToDetail(item.itemId)"
              >
                {{ item.stock > 0 ? '立即抢购' : '已抢光' }}
              </el-button>
              <div class="stock">剩余: {{ item.stock }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="load-more" v-if="!finished">
        <el-button :loading="loading" @click="loadData">加载更多</el-button>
      </div>
      <div class="no-more" v-else>没有更多商品了</div>
    </div>
  </div>
</template>

<script>
import { getSeckillList } from '@/api/item'

export default {
  name: 'SeckillPage',
  data () {
    return {
      seckillItems: [],
      loading: false,
      finished: false,
      lastBeginTime: null,
      lastItemId: null,
      limit: 4,
      defaultImage: 'https://via.placeholder.com/150?text=No+Image'
    }
  },
  created () {
    this.loadData()
  },
  methods: {
    async loadData () {
      if (this.loading || this.finished) return
      this.loading = true
      try {
        const res = await getSeckillList({
          lastBeginTime: this.lastBeginTime,
          lastItemId: this.lastItemId,
          limit: this.limit
        })
        if (res && res.data && res.data.length > 0) {
          this.seckillItems.push(...res.data)
          this.lastBeginTime = res.nextLastBeginTime
          this.lastItemId = res.nextLastItemId
        } else {
          this.finished = true
        }
        if (!res || !res.nextLastItemId) {
          this.finished = true
        }
      } catch (e) {
        this.$message.error('加载秒杀商品失败')
        this.loading = false
      } finally {
        this.loading = false
      }
    },
    formatTime (timeStr) {
      return timeStr ? timeStr.replace('T', ' ') : ''
    },
    goToDetail (itemId) {
      this.$router.push(`/seckill/${itemId}`)
    }
  }
}
</script>

<style scoped>
.seckill-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 40px;
}
.header {
  padding: 15px 20px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}
.brand {
  font-size: 20px;
  font-weight: bold;
  color: #d9363e;
  cursor: pointer;
}
.container {
  width: 1200px;
  margin: 20px auto;
}
.seckill-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.seckill-item {
  display: flex;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  gap: 24px;
  align-items: flex-start;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: all 0.3s;
}
.seckill-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.item-img img {
  width: 160px;
  height: 160px;
  object-fit: contain;
  border: 1px solid #eee;
  border-radius: 4px;
}
.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 5px;
}
.item-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.item-brand {
  color: #666;
  font-size: 14px;
}
.item-price {
  margin-top: 5px;
}
.item-price .price {
  color: #d9363e;
  font-size: 24px;
  font-weight: bold;
  margin-right: 10px;
}
.item-time {
  font-size: 13px;
  color: #888;
  line-height: 1.5;
}
.item-time span {
  margin-right: 20px;
  display: inline-block;
}
.item-action {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 10px;
}
.stock {
  color: #666;
  font-size: 14px;
}
.load-more,
.no-more {
  text-align: center;
  padding: 30px;
  color: #999;
}
</style>
