<template>
  <div class="ai-chat-container" :class="{ 'is-open': isOpen }">
    <button
      v-if="!isOpen"
      type="button"
      class="ai-chat-btn"
      @click="toggleChat"
    >
      <i class="el-icon-chat-dot-round"></i>
      <span class="btn-text">AI导购</span>
    </button>

    <transition name="fade-slide">
      <section
        v-show="isOpen"
        class="ai-chat-window"
        role="dialog"
        aria-label="AI导购助手"
      >
        <header class="chat-header">
          <div class="header-main">
            <i class="el-icon-service"></i>
            <div class="header-text">
              <p class="header-title">AI 智能导购助手</p>
              <p class="header-subtitle">支持文字与图片识别推荐</p>
            </div>
          </div>
          <button type="button" class="close-btn" @click="toggleChat">
            <i class="el-icon-close"></i>
          </button>
        </header>

        <div class="chat-messages" ref="messagesContainer">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message-wrapper', msg.role]"
          >
            <div class="message-avatar">
              <i
                :class="
                  msg.role === 'user' ? 'el-icon-user-solid' : 'el-icon-service'
                "
              ></i>
            </div>
            <div class="message-content">
              <div
                v-if="msg.content || msg.imageUrl"
                class="text-content"
                :class="{ 'markdown-body': msg.role === 'assistant' && !msg.streaming }"
              >
                <div v-if="msg.imageUrl" class="image-content">
                  <img :src="msg.imageUrl" alt="上传的图片" />
                </div>
                <template v-if="msg.role === 'assistant' && msg.content">
                  <div v-if="msg.streaming" class="stream-content">{{ msg.content }}</div>
                  <div v-else v-html="renderMarkdown(msg.content)"></div>
                </template>
                <template v-else-if="msg.content">{{ msg.content }}</template>
              </div>

              <div
                v-else-if="
                  msg.role === 'assistant' &&
                  isLoading &&
                  index === messages.length - 1 &&
                  (!msg.products || msg.products.length === 0)
                "
                class="text-content typing-indicator"
              >
                <span>.</span><span>.</span><span>.</span>
              </div>

              <div
                v-if="msg.products && msg.products.length > 0"
                class="products-container"
              >
                <div
                  v-for="(product, productIndex) in getVisibleProducts(msg)"
                  :key="resolveProductId(product) || `${index}-${productIndex}`"
                  class="product-card"
                  @click="goToProduct(resolveProductId(product))"
                >
                  <img
                    :src="product.image || product.pic || product.imageUrl || product.img"
                    alt="商品图片"
                    class="product-img"
                  />
                  <div class="product-info">
                    <div
                      class="product-name"
                      v-html="product.name || product.title || product.productName || product.itemName || '商品'"
                    ></div>
                    <div class="product-price">
                      ¥{{ formatProductPrice(product) }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="shouldShowProductsToggle(msg)"
                  class="products-toggle"
                  @click.stop="toggleProductsExpand(msg)"
                >
                  {{ msg.productsExpanded ? '收起商品列表' : '点击查看全部' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="chat-input">
          <div class="input-actions">
            <el-upload
              class="chat-uploader"
              action=""
              :http-request="handleImageUpload"
              :show-file-list="false"
              :before-upload="beforeImageUpload"
              :disabled="isLoading"
            >
              <el-button
                type="text"
                icon="el-icon-picture-outline"
                :disabled="isLoading"
                title="上传图片"
              ></el-button>
            </el-upload>

            <div v-if="pendingImage" class="pending-image-preview">
              <img :src="pendingImage" alt="待发送图片" />
              <i
                class="el-icon-error remove-pending-image"
                @click.stop="removePendingImage"
              ></i>
            </div>
          </div>

          <el-input
            v-model="inputText"
            class="chat-textarea"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="告诉我你想买什么，或先上传一张图片让AI帮你找同款"
            @keyup.enter.native="sendMessage"
          ></el-input>

          <div class="action-bar">
            <el-button
              type="primary"
              size="small"
              :loading="isLoading"
              @click="sendMessage"
            >发送</el-button>
          </div>
        </footer>
      </section>
    </transition>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it'
import { uploadImage } from '@/api/item'
import { streamChat } from '@/api/ai-chat'

const md = new MarkdownIt({
  breaks: true,
  linkify: true
})

export default {
  name: 'AiChat',
  data () {
    return {
      isOpen: false,
      inputText: '',
      isLoading: false,
      pendingImage: null,
      streamRenderTimer: null,
      messages: [
        {
          role: 'assistant',
          content:
            '你好！我是你的专属 AI 导购助手，可以根据文字或图片帮你快速找商品。你想先看什么？'
        }
      ]
    }
  },
  beforeDestroy () {
    if (this.streamRenderTimer) {
      clearInterval(this.streamRenderTimer)
      this.streamRenderTimer = null
    }
  },
  methods: {
    renderMarkdown (text) {
      if (!text) return ''
      return md.render(text)
    },
    toggleChat () {
      this.isOpen = !this.isOpen
      if (this.isOpen) {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },
    scrollToBottom () {
      const container = this.$refs.messagesContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },
    goToProduct (id) {
      if (id) {
        this.$router.push(`/product/${id}`)
      }
    },
    resolveProductId (product) {
      if (!product || typeof product !== 'object') return ''
      return (
        product.id ||
        product.itemId ||
        product.productId ||
        product.goodsId ||
        product.spuId ||
        ''
      )
    },
    extractProductsPayload (eventData) {
      if (!eventData || typeof eventData !== 'object') return []

      const normalizeToArray = payload => {
        if (!payload) return []
        if (Array.isArray(payload)) return payload

        if (typeof payload === 'string') {
          try {
            return normalizeToArray(JSON.parse(payload))
          } catch (error) {
            return []
          }
        }

        if (typeof payload === 'object') {
          if (Array.isArray(payload.list)) return payload.list
          if (Array.isArray(payload.items)) return payload.items
          if (Array.isArray(payload.products)) return payload.products
          if (Array.isArray(payload.data)) return payload.data
        }
        return []
      }

      const candidates = [
        eventData.data,
        eventData.products,
        eventData.list,
        eventData.items
      ]

      for (const candidate of candidates) {
        const list = normalizeToArray(candidate)
        if (list.length > 0) {
          return list
        }
      }

      return []
    },
    normalizeProducts (rawList) {
      if (!Array.isArray(rawList)) return []

      return rawList
        .filter(item => item && typeof item === 'object')
        .map((item, idx) => ({
          ...item,
          id:
            item.id ||
            item.itemId ||
            item.productId ||
            item.goodsId ||
            item.spuId ||
            `chat-product-${Date.now()}-${idx}`,
          name:
            item.name ||
            item.title ||
            item.productName ||
            item.itemName ||
            '商品',
          image: item.image || item.pic || item.imageUrl || item.img || '',
          price:
            item.price != null
              ? item.price
              : item.newPrice != null
              ? item.newPrice
              : item.amount != null
              ? item.amount
              : 0
        }))
    },
    formatProductPrice (product) {
      if (!product || typeof product !== 'object') return '0.00'

      const rawPrice =
        product.price != null
          ? product.price
          : product.newPrice != null
          ? product.newPrice
          : product.amount != null
          ? product.amount
          : 0
      const num = Number(rawPrice)
      if (!Number.isFinite(num) || num < 0) return '0.00'

      // 项目内商品价格默认是分；当后端返回小数时按元兜底处理
      if (!Number.isInteger(num)) {
        return num.toFixed(2)
      }

      return (num / 100).toFixed(2)
    },
    getVisibleProducts (msg) {
      const products = (msg && Array.isArray(msg.products)) ? msg.products : []
      if (products.length <= 2 || msg.productsExpanded) {
        return products
      }
      return products.slice(0, 2)
    },
    shouldShowProductsToggle (msg) {
      const products = (msg && Array.isArray(msg.products)) ? msg.products : []
      return products.length > 2
    },
    toggleProductsExpand (msg) {
      if (!msg || !Array.isArray(msg.products) || msg.products.length <= 2) {
        return
      }

      const nextExpanded = !msg.productsExpanded
      this.$set(msg, 'productsExpanded', nextExpanded)
      this.$nextTick(() => {
        this.scrollToBottom()
      })
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
    formatMessageContent (msg) {
      if (msg.imageUrl) {
        const content = []
        if (msg.content) {
          content.push({
            type: 'text',
            text: `${msg.content}。图片的URL地址为：${msg.imageUrl}`
          })
        } else {
          content.push({
            type: 'text',
            text: '帮我找一下这张图片里的相似商品。'
          })
        }
        content.push({ type: 'image', url: msg.imageUrl })
        return content
      }

      return msg.content || ''
    },
    removePendingImage () {
      this.pendingImage = null
    },
    async handleImageUpload ({ file }) {
      try {
        this.isLoading = true
        const url = await uploadImage(file)
        this.pendingImage = url
      } catch (error) {
        console.error('图片上传失败:', error)
        this.$message.error('图片上传失败')
      } finally {
        this.isLoading = false
      }
    },
    async sendMessage () {
      if ((!this.inputText.trim() && !this.pendingImage) || this.isLoading) {
        return
      }

      const imageUrl = this.pendingImage
      const userMessage = this.inputText.trim()
      this.inputText = ''
      this.pendingImage = null

      this.messages.push({
        role: 'user',
        content: userMessage,
        imageUrl
      })

      this.scrollToBottom()
      this.isLoading = true

      const history = this.messages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: this.formatMessageContent(msg)
      }))

      const aiMessageIndex = this.messages.length
      this.messages.push({
        role: 'assistant',
        content: '',
        products: [],
        streaming: true
      })

      const aiMessage = this.messages[aiMessageIndex]
      let renderQueue = ''
      let streamDone = false

      const stopRender = () => {
        if (this.streamRenderTimer) {
          clearInterval(this.streamRenderTimer)
          this.streamRenderTimer = null
        }
      }

      const finalizeRender = () => {
        if (aiMessage) {
          aiMessage.streaming = false
        }
        this.isLoading = false
        stopRender()
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }

      const renderStep = () => {
        if (!aiMessage) {
          finalizeRender()
          return
        }

        if (renderQueue.length > 0) {
          const stepSize =
            renderQueue.length > 180
              ? 14
              : renderQueue.length > 80
              ? 8
              : renderQueue.length > 30
              ? 4
              : 2
          aiMessage.content += renderQueue.slice(0, stepSize)
          renderQueue = renderQueue.slice(stepSize)
          this.$nextTick(() => {
            this.scrollToBottom()
          })
        }

        if (streamDone && renderQueue.length === 0) {
          finalizeRender()
        }
      }

      stopRender()
      this.streamRenderTimer = setInterval(renderStep, 16)

      try {
        await streamChat(
          {
            message: this.formatMessageContent(
              this.messages[this.messages.length - 2]
            ),
            history
          },
          data => {
            if (!aiMessage) {
              return
            }

            if (data.type === 'message') {
              renderQueue += data.chunk || ''
            } else if (data.type === 'products') {
              const rawProducts = this.extractProductsPayload(data)
              const normalizedProducts = this.normalizeProducts(rawProducts)
              if (!aiMessage.products) {
                this.$set(aiMessage, 'products', [])
              }
              aiMessage.products = normalizedProducts
              this.$set(aiMessage, 'productsExpanded', false)
            } else if (data.type === 'error') {
              renderQueue += `\n[发生错误: ${data.message}]`
            } else if (data.type === 'end') {
              streamDone = true
            }

            this.$nextTick(() => {
              this.scrollToBottom()
            })
          }
        )
      } catch (error) {
        console.error('发送消息失败:', error)
        if (aiMessage) {
          renderQueue += '\n抱歉，服务出现异常，请稍后再试。'
        }
        streamDone = true
      } finally {
        streamDone = true
        renderStep()
      }
    }
  }
}
</script>

<style scoped>
.ai-chat-container {
  --chat-primary: var(--primary, #eb5757);
  --chat-primary-deep: var(--primary-deep, #cc4242);
  --chat-text-main: #1f2937;
  --chat-text-sub: #64748b;
  --chat-border: #e7ecf3;
  --chat-shadow: 0 18px 36px rgba(15, 23, 42, 0.18);

  position: fixed;
  right: clamp(12px, 2.2vw, 32px);
  bottom: clamp(16px, 3.6vh, 38px);
  z-index: 60;
}

.ai-chat-btn {
  width: 64px;
  height: 64px;
  border: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--chat-primary), var(--chat-primary-deep));
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(207, 72, 72, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ai-chat-btn:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 14px 28px rgba(207, 72, 72, 0.42);
}

.ai-chat-btn i {
  font-size: 22px;
}

.btn-text {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 600;
}

.ai-chat-window {
  position: absolute;
  right: 0;
  bottom: 0;
  width: clamp(380px, 36vw, 580px);
  height: clamp(560px, 80vh, 820px);
  max-height: calc(100vh - 24px);
  background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
  border: 1px solid var(--chat-border);
  border-radius: 18px;
  box-shadow: var(--chat-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
}

.chat-header {
  min-height: 64px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #fff;
  background: linear-gradient(
    138deg,
    rgba(235, 87, 87, 0.98) 0%,
    rgba(207, 72, 72, 0.97) 100%
  );
}

.header-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.header-main > i {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.header-text {
  min-width: 0;
}

.header-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.88;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-btn {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px 10px;
  display: flex;
  flex-direction: column;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: #d5dce7;
}

.message-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 14px;
}

.message-wrapper.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}

.message-wrapper.user .message-avatar {
  color: #fff;
  background: linear-gradient(130deg, var(--chat-primary), var(--chat-primary-deep));
}

.message-wrapper.assistant .message-avatar {
  color: var(--chat-primary);
  background: #fff;
  border: 1px solid #e6ecf5;
}

.message-content {
  max-width: min(82%, 430px);
}

.text-content {
  padding: 11px 13px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-wrapper.user .text-content {
  color: #fff;
  background: linear-gradient(130deg, var(--chat-primary), var(--chat-primary-deep));
  border-top-right-radius: 4px;
}

.message-wrapper.assistant .text-content {
  color: var(--chat-text-main);
  background: #fff;
  border: 1px solid #ebeff6;
  border-top-left-radius: 4px;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
}

.image-content {
  margin-bottom: 8px;
}

.image-content img {
  max-width: 100%;
  max-height: 220px;
  border-radius: 8px;
  border: 1px solid #e4e9f2;
  object-fit: contain;
  background: #f7f9fc;
}

.text-content.markdown-body {
  white-space: normal;
}

.stream-content {
  white-space: pre-wrap;
}

.markdown-body ::v-deep p {
  margin: 0 0 8px;
}

.markdown-body ::v-deep p:last-child {
  margin-bottom: 0;
}

.markdown-body ::v-deep ul,
.markdown-body ::v-deep ol {
  margin: 0 0 8px;
  padding-left: 20px;
}

.markdown-body ::v-deep a {
  color: #d74d4d;
  text-decoration: none;
}

.markdown-body ::v-deep a:hover {
  text-decoration: underline;
}

.markdown-body ::v-deep pre {
  margin: 8px 0;
  padding: 10px;
  border-radius: 8px;
  overflow-x: auto;
  background: #242a33;
  color: #e2e8f0;
}

.markdown-body ::v-deep code {
  border-radius: 4px;
  padding: 2px 4px;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  color: #d74d4d;
  background: #f5f7fb;
}

.markdown-body ::v-deep pre code {
  padding: 0;
  color: inherit;
  background: transparent;
}

.products-container {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-card {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid #e8edf5;
  background: #fff;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.product-card:hover {
  transform: translateY(-1px);
  border-color: #ffc5b9;
  box-shadow: 0 8px 14px rgba(15, 23, 42, 0.08);
}

.product-img {
  width: 62px;
  height: 62px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #edf2f8;
}

.product-info {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 12px;
  line-height: 1.45;
  color: #243041;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.product-price {
  margin-top: 5px;
  font-size: 14px;
  color: var(--chat-primary);
  font-weight: 700;
}

.products-toggle {
  align-self: center;
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.4;
  color: #94a3b8;
  cursor: pointer;
  user-select: none;
}

.products-toggle:hover {
  color: #6b7280;
}

.chat-input {
  padding: 10px 12px 12px;
  border-top: 1px solid #e8edf5;
  background: rgba(255, 255, 255, 0.96);
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  margin-bottom: 8px;
}

.chat-uploader ::v-deep .el-button {
  padding: 0;
  color: #6b7280;
  font-size: 20px;
}

.chat-uploader ::v-deep .el-button:hover,
.chat-uploader ::v-deep .el-button:focus {
  color: var(--chat-primary);
}

.pending-image-preview {
  position: relative;
  width: 52px;
  height: 52px;
  padding: 2px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #dce4ef;
}

.pending-image-preview img {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
}

.remove-pending-image {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #f27a61;
  font-size: 16px;
  cursor: pointer;
}

.chat-textarea ::v-deep .el-textarea__inner {
  border-radius: 12px;
  border-color: #dce4ef;
  min-height: 62px !important;
  color: #1f2937;
  line-height: 1.5;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.chat-textarea ::v-deep .el-textarea__inner:focus {
  border-color: #ff9f8a;
  box-shadow: 0 0 0 3px rgba(245, 120, 90, 0.14);
}

.action-bar {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.action-bar ::v-deep .el-button--primary {
  border: none;
  border-radius: 10px;
  padding: 9px 18px;
  font-weight: 600;
  background: linear-gradient(120deg, #ef6b6b, var(--chat-primary));
}

.typing-indicator span {
  display: inline-block;
  margin: 0 2px;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.fade-slide-enter,
.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(12px);
}

@media (max-width: 1280px) {
  .ai-chat-window {
    width: clamp(360px, 42vw, 520px);
    height: clamp(540px, 80vh, 760px);
  }
}

@media (max-width: 860px) {
  .ai-chat-container {
    right: 12px;
    bottom: 12px;
  }

  .ai-chat-window {
    width: min(calc(100vw - 24px), 520px);
    height: min(82vh, 720px);
    max-height: calc(100vh - 16px);
  }
}

@media (max-width: 560px) {
  .ai-chat-container.is-open .ai-chat-window {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: min(84vh, 720px);
    max-height: calc(100vh - 8px);
    border-radius: 16px 16px 0 0;
  }

  .ai-chat-btn {
    width: 58px;
    height: 58px;
  }

  .btn-text {
    font-size: 11px;
  }

  .chat-header {
    min-height: 58px;
    padding: 10px 12px;
  }

  .header-subtitle {
    display: none;
  }

  .message-content {
    max-width: 86%;
  }
}
</style>
