<template>
  <div>
    <div class="header">
      <div class="brand" @click="$router.push('/')">阳光商城</div>
      <div v-if="user.userId" class="user-info">
        <span>欢迎：{{ user.username }}</span>
        <el-button
          type="text"
          @click="$router.push('/user')"
          style="color: gray"
          >个人中心</el-button
        >
        <el-button
          type="text"
          @click="$router.push('/orderlist')"
          style="color: gray"
          >历史订单</el-button
        >
        <el-button
          type="text"
          @click="$router.push('/cart')"
          style="color: gray"
          >我的购物车</el-button
        >
        <el-button type="text" @click="handleLogout" class="logout-btn"
          >退出登录</el-button
        >
      </div>
      <div v-else class="user-info">
        <el-button
          type="text"
          @click="$router.push('/login')"
          style="color: gray"
          >请登录</el-button
        >
        <el-button
          type="text"
          @click="$router.push('/cart')"
          style="color: gray"
          >我的购物车</el-button
        >
      </div>
    </div>
    <div class="search-bar container">
      <div class="search-input">
        <el-input
          v-model="keyword"
          placeholder="请输入关键字"
          clearable
          size="medium"
          prefix-icon="el-icon-search"
          @keyup.enter.native="handleSearch"
        ></el-input>
        <el-button type="danger" size="medium" @click="handleSearch"
          >搜索</el-button
        >
      </div>
      <div class="search-sections">
        <div class="filter-panel">
          <div class="filter-header">
            <span>全部结果：</span>
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

        <div class="image-search-panel">
          <div class="image-search-header">
            <span>图像搜索</span>
            <div>
              <el-button
                type="text"
                size="mini"
                :disabled="!imageSearchUrl"
                @click="clearImage"
                >清空图片</el-button
              >
              <el-button
                type="primary"
                size="small"
                :disabled="!imageSearchUrl"
                :loading="imageSearchLoading"
                @click="handleImageSearch"
                >图像搜索</el-button
              >
            </div>
          </div>
          <el-upload
            ref="imageUploader"
            class="upload-box"
            drag
            :show-file-list="false"
            :http-request="handleImageUpload"
            :before-upload="beforeImageUpload"
            :action="dummyUploadAction"
          >
            <template v-if="imagePreview">
              <img class="upload-preview" :src="imagePreview" alt="预览" />
              <div class="upload-overlay">点击此处更换图片</div>
            </template>
            <template v-else>
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">
                将图片拖到此处，或<em>点击上传</em>
              </div>
              <div class="el-upload__tip" slot="tip">
                仅支持 jpg/png，大小不超过5MB
              </div>
            </template>
          </el-upload>
        </div>
      </div>
    </div>
    <div class="product-list container">
      <h1>商品列表</h1>
      <div v-if="loading">加载中...</div>
      <div v-else class="products">
        <div v-for="product in products" :key="product.id" class="product-card">
          <img
            :src="product.image"
            :alt="product.name"
            class="product-image"
            loading="lazy"
          />
          <h3 class="product-title" v-html="product.name"></h3>
          <div class="product-details">
            <div class="product-info">
              <span class="price-span" style="color: red"
                >价格：￥{{ (product.price / 100).toFixed(2) }}</span
              >
              <span>品牌：{{ product.brand }}</span>
              <span>分类：{{ product.category }}</span>

              <span>
                <el-button
                  type="warning"
                  size="small"
                  plain
                  :loading="addingCartItemId === product.id"
                  :disabled="addingCartItemId === product.id"
                  @click="addToCart(product)"
                  >加入购物车</el-button
                >
              </span>
              <span>
                <el-button
                  type="danger"
                  @click="goToProductDetail(product.id)"
                  :disabled="product.stock === 0"
                  size="small"
                  plain
                >
                  {{ product.stock === 0 ? '已售罄' : '购买' }}
                </el-button>
              </span>
            </div>
            <!-- <div class="product-action">
              <el-button type="warning" @click="collectItem(product.id)">
                收藏</el-button
              >
              <el-button
                type="danger"
                @click="detail(product.id)"
                :disabled="product.stock === 0"
              >
                {{ product.stock === 0 ? '已售罄' : '购买' }}
              </el-button>
            </div> -->
          </div>
        </div>
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
    </div>

    <!-- Floating Seckill Buttons -->
    <div class="fixed-seckill left" @click="$router.push('/seckill')">
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
    </div>
  </div>
</template>

<script>
import { getList, getFilters, uploadImage, imageSearch } from '@/api/item'
import { addItemToCart } from '@/api/cart'
import { mapGetters } from 'vuex'
import { getUserInfo } from '@/api/user'
import store from '@/store'
export default {
  name: 'IndexPage',
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
      imagePreview: '',
      imageSearchUrl: '',
      imageUploadLoading: false,
      imageSearchLoading: false,
      addingCartItemId: null,
      dummyUploadAction: '/items/upload'
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
      this.pageNum = 1
      this.getProducts(this.pageNum)
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
      if (this.$refs.imageUploader) {
        this.$refs.imageUploader.clearFiles()
      }
      if (this.imagePreview) {
        URL.revokeObjectURL(this.imagePreview)
      }
      this.imagePreview = ''
      this.imageSearchUrl = ''
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
.header {
  padding: 12px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.brand {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
}

.search-bar {
  padding: 20px;
}
.search-input {
  display: flex;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto 18px auto;
}
.search-input .el-input {
  flex: 1;
}
.filter-panel {
  border: 1px solid #eaeaea;
  border-radius: 6px;
  padding: 12px 16px;
  background: #fff;
  margin: 0 0 12px 0;
}
.search-sections {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.search-sections .filter-panel {
  flex: 1;
}
.image-search-panel {
  width: 360px;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  padding: 12px;
  background: #fff;
}
.image-search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.upload-box {
  width: 100%;
}
.upload-box .el-upload-dragger {
  width: 100%;
  height: 240px;
  position: relative;
}
.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.upload-overlay {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  height: 28px;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.filter-header {
  color: #888;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.selected-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-row {
  display: flex;
  align-items: flex-start;
  border-bottom: 1px solid #f3f3f3;
  padding: 10px 0;
}
.filter-row:last-child {
  border-bottom: none;
}
.filter-title {
  width: 80px;
  color: #666;
}
.filter-options {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.filter-option {
  cursor: pointer;
  color: #333;
  display: inline-block;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  background: #fafafa;
  transition: all 0.2s ease;
}
.filter-option.active {
  background: #ff4d4f;
  color: #fff;
  border-color: #ff4d4f;
}
.filter-option:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.user-actions {
  display: flex;
  justify-content: flex-end; /* 右对齐 */
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.user-info {
  font-size: larger;
  display: flex;
  align-items: center;
  gap: 16px;
}
.user-info > span {
  line-height: 1.2;
}
.logout-btn {
  color: #ff4d4f;
}
.logout-btn:hover {
  color: #d9363e;
}
.product-list {
  padding: 20px;
  font-family: Arial, sans-serif;
}
.product-list h1 {
  font-size: 22px;
  margin: 8px 0 16px 0;
}

.products {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 28px;
  justify-items: stretch;
  padding: 8px 4px;
}

.product-card {
  border: 1px solid #ddd;
  padding: 8px;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background: #fff;
}
.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: contain;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid #eee;
  padding: 6px;
  box-sizing: border-box;
}

.product-details {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.product-info {
  display: flex;
  flex-wrap: wrap; /* 当内容超出容器宽度时换行 */
  gap: 8px; /* 子元素之间的间距 */
  margin-top: 10px;
  justify-content: center;
}
.product-info .el-button {
  width: 100%;
}

.product-info span {
  background-color: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  flex: 0 0 calc(50% - 8px); /* 每个 span 占据 50% 宽度减去间距 */
  box-sizing: border-box; /* 确保内边距和边框包含在元素的宽度和高度内 */
}
.product-info .price-span {
  flex: 0 0 calc(100% - 8px);
  font-size: 16px;
}

.product-action {
  justify-content: center;
}

.product-card h3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4em;
  max-height: calc(1.4em * 2);
  margin-top: 10px;
}
.product-title ::v-deep em {
  color: #ff4d4f;
  font-style: normal;
}
.pagination-center {
  text-align: center;
  margin-top: 16px;
}

.fixed-seckill {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 80px;
  height: 100px;
  background-color: #d9363e;
  color: #fff;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition: transform 0.2s;
}
.fixed-seckill:hover {
  transform: translateY(-50%) scale(1.05);
}
.fixed-seckill.left {
  left: 20px;
}
.fixed-seckill.right {
  right: 20px;
}
.seckill-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 10px;
  font-size: 14px;
  font-weight: bold;
}
.seckill-content i {
  font-size: 24px;
}
</style>
