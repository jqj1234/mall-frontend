<template>
  <div class="index-page">
    <header class="header">
      <div class="container header-inner">
        <div class="brand-wrap" @click="$router.push('/')">
          <div class="brand">阳光商城</div>
          <p class="brand-subtitle">精选好物 · 轻松购物</p>
        </div>
        <div v-if="user.userId" class="user-info">
          <span class="welcome-text">欢迎：{{ user.username }}</span>
          <el-button type="text" @click="$router.push('/user')"
            >个人中心</el-button
          >
          <el-button type="text" @click="$router.push('/orderlist')"
            >历史订单</el-button
          >
          <el-button type="text" @click="$router.push('/cart')"
            >我的购物车</el-button
          >
          <el-button type="text" @click="handleLogout" class="logout-btn"
            >退出登录</el-button
          >
        </div>
        <div v-else class="user-info">
          <el-button type="text" @click="$router.push('/login')"
            >请登录</el-button
          >
          <el-button type="text" @click="$router.push('/cart')"
            >我的购物车</el-button
          >
        </div>
      </div>
    </header>

    <section class="hero container">
      <div class="hero-card">
        <div class="hero-text">
          <p class="hero-kicker">Sun Mall</p>
          <h1>简约选品，值得入手</h1>
          <p class="hero-desc">
            支持关键词和图像搜索，帮你更快找到想买的商品。
          </p>
        </div>
        <div class="search-input">
          <el-input
            v-model="keyword"
            placeholder="请输入关键字"
            clearable
            size="medium"
            prefix-icon="el-icon-search"
            @keyup.enter.native="handleSearch"
          ></el-input>
          <el-button type="primary" size="medium" @click="handleSearch"
            >搜索</el-button
          >
        </div>
      </div>
    </section>

    <section class="search-bar container">
      <div class="search-mode-tabs panel-card">
        <button
          type="button"
          class="mode-tab"
          :class="{ active: searchMode === 'filter' }"
          @click="switchSearchMode('filter')"
        >
          快捷筛选
        </button>
        <button
          type="button"
          class="mode-tab"
          :class="{ active: searchMode === 'image' }"
          @click="switchSearchMode('image')"
        >
          图像搜索
        </button>
      </div>
      <div class="search-sections">
        <div v-if="searchMode === 'filter'" class="filter-panel panel-card">
          <div class="filter-header">
            <span>快捷筛选：</span>
            <div class="selected-chips">
              <el-tag
                v-if="selectedCategory"
                size="small"
                closable
                @close="clearCategory"
                >分类：{{ selectedCategory }}</el-tag
              >
              <el-tag
                v-if="selectedBrand"
                size="small"
                closable
                @close="clearBrand"
                >品牌：{{ selectedBrand }}</el-tag
              >
              <el-tag
                v-if="selectedPriceRange"
                size="small"
                closable
                @close="clearPriceRange"
                >价格：{{ selectedPriceRange.label }}</el-tag
              >
            </div>
          </div>
          <div class="filter-row" v-if="!selectedCategory">
            <span class="filter-title">分类</span>
            <div class="filter-options">
              <span
                v-for="c in categories"
                :key="c"
                class="filter-option"
                :class="{ active: selectedCategory === c }"
                @click="selectCategory(c)"
                >{{ c }}</span
              >
            </div>
          </div>
          <div class="filter-row" v-if="!selectedBrand">
            <span class="filter-title">品牌</span>
            <div class="filter-options">
              <span
                v-for="b in brands"
                :key="b"
                class="filter-option"
                :class="{ active: selectedBrand === b }"
                @click="selectBrand(b)"
                >{{ b }}</span
              >
            </div>
          </div>
          <div class="filter-row">
            <span class="filter-title">价格</span>
            <div class="filter-options">
              <span
                v-for="r in priceRanges"
                :key="r.label"
                class="filter-option"
                :class="{
                  active:
                    selectedPriceRange && selectedPriceRange.label === r.label
                }"
                @click="selectPriceRange(r)"
                >{{ r.label }}</span
              >
            </div>
          </div>
        </div>

        <div v-else class="image-search-panel panel-card">
          <ImageSearchUploader
            ref="imageSearchUploader"
            :image-preview="imagePreview"
            :image-search-url="imageSearchUrl"
            :image-upload-loading="imageUploadLoading"
            :image-search-loading="imageSearchLoading"
            :upload-action="dummyUploadAction"
            :on-upload="handleImageUpload"
            :on-before-upload="beforeImageUpload"
            @clear="clearImage"
            @search="handleImageSearch"
          />
        </div>
      </div>
    </section>

    <section class="product-list container">
      <div class="list-header">
        <h2>商品列表</h2>
        <span class="result-count">共 {{ total }} 件商品</span>
      </div>
      <div v-if="loading" class="loading-state">
        <i class="el-icon-loading"></i>
        <span>正在加载商品...</span>
      </div>
      <div v-else-if="products.length" class="products">
        <div v-for="product in products" :key="product.id" class="product-card">
          <div class="product-image-wrap">
            <img
              :src="product.image"
              :alt="product.name"
              class="product-image"
              loading="lazy"
            />
          </div>
          <div class="product-content">
            <h3 class="product-title" v-html="product.name"></h3>
            <div class="product-meta">
              <span class="price-span"
                >价格：￥{{ (product.price / 100).toFixed(2) }}</span
              >
              <span>品牌：{{ product.brand }}</span>
              <span>分类：{{ product.category }}</span>
            </div>
            <div class="product-actions">
              <el-button
                type="warning"
                size="small"
                plain
                :loading="addingCartItemId === product.id"
                :disabled="addingCartItemId === product.id"
                @click="addToCart(product)"
                >加入购物车</el-button
              >
              <el-button
                type="danger"
                size="small"
                plain
                :disabled="product.stock === 0"
                @click="goToProductDetail(product.id)"
              >
                {{ product.stock === 0 ? '已售罄' : '购买' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <i class="el-icon-goods"></i>
        <p>没有找到匹配的商品，试试更换筛选条件</p>
      </div>
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="pageNum"
        :page-size="pageSize"
        @current-change="handlePageChange"
        class="pagination-center"
      >
      </el-pagination>
    </section>

    <el-dialog
      title="服务时间提示"
      :visible.sync="showNotice"
      width="520px"
      append-to-body
    >
      <div class="notice-body">
        <p>
          本网站为个人开发测试，因深度学习模型采用本地部署，服务器成本较高。
        </p>
        <p>网站正常访问时间：</p>
        <div class="notice-time">周一到周五 09:30 ~ 17:30</div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="showNotice = false"
          >我知道了</el-button
        >
      </span>
    </el-dialog>

    <!-- Floating Seckill Buttons -->
    <!-- <div class="fixed-seckill left" @click="$router.push('/seckill')">
      <div class="seckill-content">
        <i class="el-icon-timer"></i>
        <span>抢购秒杀</span>
      </div>
    </div>
    <div class="fixed-seckill right" @click="$router.push('/seckill')">
      <div class="seckill-content">
        <i class="el-icon-timer"></i>
        <span>抢购秒杀</span>
      </div>
    </div> -->

    <!-- AI Chat Assistant -->
    <AiChat />
  </div>
</template>

<script>
import AiChat from '@/components/AiChat.vue'
import ImageSearchUploader from '@/components/ImageSearchUploader.vue'
import { getList, getFilters, uploadImage, imageSearch } from '@/api/item'
import { addItemToCart } from '@/api/cart'
import { mapGetters } from 'vuex'
import { getUserInfo } from '@/api/user'
import store from '@/store'
export default {
  name: 'IndexPage',
  components: {
    AiChat,
    ImageSearchUploader
  },
  data () {
    return {
      products: [],
      total: 0,
      loading: true,
      pageNum: 1,
      pageSize: 20,
      keyword: '',
      user: {},
      categories: [],
      brands: [],
      priceRanges: [
        { label: '100以下', min: 0, max: 100 * 100 },
        { label: '100~299元', min: 100 * 100, max: 299 * 100 },
        { label: '300~599元', min: 300 * 100, max: 599 * 100 },
        { label: '600~899元', min: 600 * 100, max: 899 * 100 },
        { label: '900~1599元', min: 900 * 100, max: 1599 * 100 },
        { label: '1600以上元', min: 1600 * 100, max: null }
      ],
      selectedCategory: '',
      selectedBrand: '',
      selectedPriceRange: null,
      searchMode: 'filter',
      imagePreview: '',
      imageSearchUrl: '',
      imageUploadLoading: false,
      imageSearchLoading: false,
      addingCartItemId: null,
      dummyUploadAction: '/items/upload',
      showNotice: true
    }
  },
  computed: {
    ...mapGetters('user', ['getSessionId', 'getToken', 'getUser'])
  },
  created () {
    this.user = this.getUser
    // user为空时，则不进行token验证
    if (this.user.token !== undefined) {
      this.validateUserToken().then(() => {
        this.getProducts(this.pageNum)
      })
    } else {
      this.getProducts(this.pageNum)
    }
  },
  methods: {
    async validateUserToken () {
      // const userId = this.user && this.user.userId
      // if (!userId) return
      try {
        await getUserInfo()
      } catch (err) {
        await store.dispatch('user/clearUser')
        this.user = {}
      }
    },
    async handleLogout () {
      await store.dispatch('user/clearUser')
      this.user = {}
      this.$message.success('已退出登录')
      this.$router.push('/login')
    },
    handleSearch () {
      if (this.searchMode !== 'filter') {
        this.switchSearchMode('filter')
        return
      }
      this.pageNum = 1
      this.getProducts(this.pageNum)
    },
    switchSearchMode (mode) {
      if (mode === this.searchMode) return

      if (mode === 'image') {
        this.resetFilterSelections()
      } else {
        this.clearImage()
        this.pageNum = 1
        this.getProducts(this.pageNum)
      }
      this.searchMode = mode
    },
    resetFilterSelections () {
      const hasFilter = Boolean(
        this.selectedCategory || this.selectedBrand || this.selectedPriceRange
      )
      this.selectedCategory = ''
      this.selectedBrand = ''
      this.selectedPriceRange = null
      if (hasFilter) {
        this.pageNum = 1
        this.getProducts(this.pageNum)
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
        this.imageUploadLoading = true
        const url = await uploadImage(file)
        this.imageSearchUrl = url
        if (this.imagePreview) {
          URL.revokeObjectURL(this.imagePreview)
        }
        this.imagePreview = URL.createObjectURL(file)
        this.$message.success('图片上传成功')
      } catch (e) {
        this.$message.error('图片上传失败')
      } finally {
        this.imageUploadLoading = false
      }
    },
    clearImage () {
      if (this.$refs.imageSearchUploader) {
        this.$refs.imageSearchUploader.clearFiles()
      }
      if (this.imagePreview) {
        URL.revokeObjectURL(this.imagePreview)
      }
      this.imagePreview = ''
      this.imageSearchUrl = ''
      this.imageUploadLoading = false
      this.imageSearchLoading = false
    },
    async handleImageSearch () {
      if (!this.imageSearchUrl) {
        this.$message.warning('请先上传图片')
        return
      }
      try {
        this.imageSearchLoading = true
        const response = await imageSearch(this.imageSearchUrl)
        this.products = response.list || []
        this.total = Number(response.total || 0)
        this.pageNum = 1
        this.$message.success('图像搜索完成')
      } catch (e) {
        this.$message.error('图像搜索失败')
      } finally {
        this.imageSearchLoading = false
      }
    },
    handlePageChange (pageNum) {
      this.pageNum = pageNum
      this.getProducts(pageNum)
    },
    selectCategory (c) {
      this.selectedCategory = this.selectedCategory === c ? '' : c
      this.pageNum = 1
      this.getProducts(this.pageNum)
    },
    selectBrand (b) {
      this.selectedBrand = this.selectedBrand === b ? '' : b
      this.pageNum = 1
      this.getProducts(this.pageNum)
    },
    selectPriceRange (r) {
      this.selectedPriceRange =
        this.selectedPriceRange && this.selectedPriceRange.label === r.label
          ? null
          : r
      this.pageNum = 1
      this.getProducts(this.pageNum)
    },
    clearCategory () {
      this.selectedCategory = ''
      this.pageNum = 1
      this.getProducts(this.pageNum)
    },
    clearBrand () {
      this.selectedBrand = ''
      this.pageNum = 1
      this.getProducts(this.pageNum)
    },
    clearPriceRange () {
      this.selectedPriceRange = null
      this.pageNum = 1
      this.getProducts(this.pageNum)
    },
    async getProducts (pageNum) {
      this.loading = true
      try {
        const minPrice = this.selectedPriceRange
          ? this.selectedPriceRange.min
          : undefined
        const maxPrice = this.selectedPriceRange
          ? this.selectedPriceRange.max
          : undefined
        const query = {
          pageNum,
          pageSize: this.pageSize,
          key: this.keyword || undefined,
          category: this.selectedCategory || undefined,
          brand: this.selectedBrand || undefined,
          minPrice,
          maxPrice
        }
        const [response, filters] = await Promise.all([
          getList(query),
          getFilters(query)
        ])
        // console.log(response)
        this.products = response.list
        this.total = Number(response.total)
        this.categories = Array.isArray(filters.category)
          ? filters.category
          : []
        this.brands = Array.isArray(filters.brand) ? filters.brand : []
        // console.log(this.products)
      } catch (error) {
        console.error('获取商品数据失败:', error)
        alert('无法加载商品数据，请检查网络或API地址')
      } finally {
        this.loading = false
      }
      // console.log(this.getUser.token)
    },
    async addToCart (product) {
      if (this.addingCartItemId) return
      try {
        this.addingCartItemId = product.id
        await addItemToCart({
          itemId: product.id,
          name: product.name,
          spec: null,
          price: product.price,
          image: product.image
        })
        this.$message.success('已加入购物车')
      } catch (err) {
        this.$message.error('加入购物车失败')
      } finally {
        this.addingCartItemId = null
      }
    },
    async goToProductDetail (productId) {
      let userId = store.state.user.user.userId
      if (userId == null) {
        this.$router.push({
          path: '/login'
        })
        return
      }
      await getUserInfo()

      this.$router.push({
        path: `/product/${productId}`
      })
    }
  }
}
</script>

<style scoped>
.index-page {
  --primary: #eb5757;
  --primary-deep: #cc4242;
  --text-main: #1f2937;
  --text-sub: #6b7280;
  --border-color: #e7ecf3;
  --card-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  min-height: 100vh;
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

.header {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.84);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.header-inner {
  min-height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.brand-wrap {
  cursor: pointer;
  user-select: none;
}

.brand {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 1px;
}

.brand-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-sub);
  letter-spacing: 1.5px;
}

.user-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px 12px;
}

.welcome-text {
  font-size: 14px;
  color: #475569;
  padding-right: 4px;
}

.user-info ::v-deep .el-button--text {
  color: #4b5563;
  padding: 0;
}

.user-info ::v-deep .el-button--text:hover {
  color: var(--primary);
}

.logout-btn {
  color: var(--primary) !important;
}

.hero {
  padding-top: 24px;
}

.hero-card {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  border-radius: 20px;
  padding: 28px 30px;
  background: linear-gradient(135deg, #ffffff 0%, #fff9f4 100%);
  border: 1px solid var(--border-color);
  box-shadow: var(--card-shadow);
}

.hero-text h1 {
  margin: 4px 0 10px;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
}

.hero-kicker {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #ef6f6f;
}

.hero-desc {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
}

.search-input {
  width: min(640px, 100%);
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input .el-input {
  flex: 1;
}

.search-input ::v-deep .el-input__inner {
  height: 46px;
  border-radius: 12px;
  border: 1px solid #dde5f0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input ::v-deep .el-input__inner:focus {
  border-color: #ff9f8a;
  box-shadow: 0 0 0 4px rgba(245, 120, 90, 0.15);
}

.search-input ::v-deep .el-button {
  height: 46px;
  border-radius: 12px;
  padding: 0 26px;
  font-weight: 600;
}

.search-bar {
  padding-top: 16px;
}

.search-mode-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  margin-bottom: 14px;
}

.mode-tab {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-tab:hover {
  color: #334155;
  background: #f8fafc;
}

.mode-tab.active {
  color: #fff;
  background: linear-gradient(120deg, #ef6b6b, var(--primary));
  box-shadow: 0 8px 14px rgba(235, 87, 87, 0.28);
}

.search-sections {
  display: block;
}

.panel-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.filter-panel {
  padding: 16px 20px;
}

.filter-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  color: #64748b;
  margin-bottom: 6px;
}

.selected-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.selected-chips ::v-deep .el-tag {
  border-radius: 16px;
  border-color: #ffd6cf;
  background: #fff4f2;
  color: #d04d4d;
}

.filter-row {
  display: flex;
  align-items: flex-start;
  border-top: 1px solid #eff3f8;
  padding-top: 12px;
  margin-top: 12px;
}

.filter-title {
  width: 56px;
  margin-top: 6px;
  color: #667085;
  font-size: 14px;
  flex-shrink: 0;
}

.filter-options {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-option {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 16px;
  border: 1px solid #dbe3ef;
  color: #334155;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-option:hover {
  color: var(--primary);
  border-color: #ffb7aa;
  background: #fff2ef;
}

.filter-option.active {
  color: #fff;
  border-color: var(--primary);
  background: linear-gradient(120deg, #ef6b6b, var(--primary));
}

.image-search-panel {
  width: 100%;
  padding: 16px;
}

.product-list {
  padding: 24px 0 42px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}

.list-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.result-count {
  font-size: 13px;
  color: var(--text-sub);
}

.loading-state,
.empty-state {
  min-height: 220px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  gap: 8px;
}

.loading-state i,
.empty-state i {
  font-size: 28px;
  color: #f27a61;
}

.products {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.product-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  transition: transform 0.22s ease, box-shadow 0.22s ease,
    border-color 0.22s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: #f6b8aa;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
}

.product-image-wrap {
  height: 214px;
  padding: 14px;
  background: linear-gradient(180deg, #fafcff 0%, #f6f8fb 100%);
  border-bottom: 1px solid #eef2f7;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.03);
}

.product-content {
  padding: 14px 14px 16px;
}

.product-title {
  margin: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  min-height: 42px;
  color: #1f2937;
}

.product-title ::v-deep em {
  color: var(--primary);
  font-style: normal;
}

.product-meta {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.product-meta span {
  border-radius: 8px;
  background: #f6f8fb;
  color: #4b5563;
  font-size: 13px;
  padding: 7px 9px;
}

.product-meta .price-span {
  grid-column: 1 / -1;
  color: var(--primary);
  font-size: 16px;
  font-weight: 700;
  background: #fff3ef;
}

.product-actions {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.product-actions ::v-deep .el-button {
  width: 100%;
  margin-left: 0;
  border-radius: 10px;
  font-weight: 600;
}

.pagination-center {
  margin-top: 22px;
  text-align: center;
}

.pagination-center ::v-deep .el-pager li {
  border-radius: 8px;
}

.notice-body {
  color: #334155;
  line-height: 1.8;
}

.notice-time {
  margin-top: 8px;
  padding: 10px 14px;
  background: #fff5f2;
  border: 1px solid #ffd9ce;
  border-radius: 8px;
  color: #cf4747;
  font-weight: 700;
  font-size: 18px;
  text-align: center;
}

.fixed-seckill {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 74px;
  height: 92px;
  border-radius: 16px;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(165deg, #ef6d6d, #cf4848);
  box-shadow: 0 12px 20px rgba(207, 72, 72, 0.35);
  z-index: 30;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.fixed-seckill:hover {
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 16px 26px rgba(207, 72, 72, 0.4);
}

.fixed-seckill.left {
  left: 16px;
}

.fixed-seckill.right {
  right: 16px;
}

.seckill-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.seckill-content i {
  font-size: 22px;
}

@media (max-width: 1360px) {
  .products {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .header {
    position: static;
  }

  .hero-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-input {
    width: 100%;
  }

  .products {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fixed-seckill {
    width: 68px;
    height: 82px;
  }
}

@media (max-width: 768px) {
  .container {
    width: calc(100% - 24px);
  }

  .header-inner {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px 0;
  }

  .brand {
    font-size: 22px;
  }

  .hero-card {
    padding: 20px;
  }

  .hero-text h1 {
    font-size: 28px;
  }

  .search-input {
    flex-direction: column;
  }

  .search-input ::v-deep .el-button {
    width: 100%;
  }

  .filter-row {
    flex-direction: column;
    gap: 8px;
  }

  .filter-title {
    width: auto;
    margin-top: 0;
  }

  .product-image-wrap {
    height: 200px;
  }
}

@media (max-width: 560px) {
  .brand-subtitle,
  .hero-desc,
  .welcome-text {
    display: none;
  }

  .products {
    grid-template-columns: 1fr;
  }

  .fixed-seckill {
    top: auto;
    bottom: 110px;
    transform: none;
  }

  .fixed-seckill:hover {
    transform: scale(1.05);
  }

  .fixed-seckill.left {
    left: 12px;
  }

  .fixed-seckill.right {
    display: none;
  }
}
</style>
