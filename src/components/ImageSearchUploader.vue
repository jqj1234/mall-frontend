<template>
  <div class="image-search-uploader">
    <aside class="intro-card">
      <p class="intro-kicker">Visual Finder</p>
      <h3>图像搜索</h3>
      <p class="intro-desc">
        上传商品图片后，系统会自动检索相似商品。适合不知道关键词或想找同款时使用。
      </p>

      <div class="intro-status" :class="{ ready: hasImage }">
        <i :class="hasImage ? 'el-icon-success' : 'el-icon-picture-outline'"></i>
        <div>
          <p>{{ hasImage ? '图片已就绪' : '等待上传图片' }}</p>
          <span>{{
            hasImage
              ? '可直接点击“图像搜索”开始检索'
              : '支持 JPG/PNG，图片大小不超过 5MB'
          }}</span>
        </div>
      </div>

      <div class="intro-actions">
        <el-button type="text" :disabled="!hasImage" @click="$emit('clear')"
          >清空图片</el-button
        >
        <el-button
          type="primary"
          size="small"
          :disabled="!hasImage"
          :loading="imageSearchLoading"
          @click="$emit('search')"
          >图像搜索</el-button
        >
      </div>
    </aside>

    <div class="upload-card" :class="{ uploading: imageUploadLoading }">
      <el-upload
        ref="imageUploader"
        class="upload-box"
        drag
        :show-file-list="false"
        :http-request="onUpload"
        :before-upload="onBeforeUpload"
        :action="uploadAction"
      >
        <template v-if="imagePreview">
          <img class="upload-preview" :src="imagePreview" alt="预览" />
          <div class="upload-overlay">点击此处更换图片</div>
        </template>
        <template v-else>
          <div class="upload-placeholder">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">
              将图片拖到此处，或<em>点击上传</em>
            </div>
            <div class="el-upload__tip">推荐上传白底商品图，识别效果更好</div>
          </div>
        </template>
      </el-upload>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageSearchUploader',
  props: {
    imagePreview: {
      type: String,
      default: ''
    },
    imageSearchUrl: {
      type: String,
      default: ''
    },
    imageUploadLoading: {
      type: Boolean,
      default: false
    },
    imageSearchLoading: {
      type: Boolean,
      default: false
    },
    uploadAction: {
      type: String,
      required: true
    },
    onUpload: {
      type: Function,
      required: true
    },
    onBeforeUpload: {
      type: Function,
      required: true
    }
  },
  computed: {
    hasImage () {
      return Boolean(this.imageSearchUrl)
    }
  },
  methods: {
    clearFiles () {
      if (this.$refs.imageUploader) {
        this.$refs.imageUploader.clearFiles()
      }
    }
  }
}
</script>

<style scoped>
.image-search-uploader {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.intro-card {
  border: 1px solid #e7ecf3;
  border-radius: 14px;
  background: linear-gradient(145deg, #ffffff 0%, #fff8f4 100%);
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
}

.intro-kicker {
  margin: 0;
  color: #ef6f6f;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

.intro-card h3 {
  margin: 8px 0 10px;
  font-size: 22px;
  line-height: 1.25;
  color: #0f172a;
}

.intro-desc {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
  font-size: 13px;
}

.intro-status {
  margin-top: 16px;
  border-radius: 12px;
  border: 1px solid #dbe3ef;
  background: #f8fbff;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.intro-status.ready {
  border-color: #b9ebc5;
  background: #f2fff6;
}

.intro-status i {
  font-size: 18px;
  color: #7389a5;
  margin-top: 1px;
}

.intro-status.ready i {
  color: #24a148;
}

.intro-status p {
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
}

.intro-status span {
  display: block;
  margin-top: 3px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.5;
}

.intro-actions {
  margin-top: auto;
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.upload-card {
  border: 1px solid #e7ecf3;
  border-radius: 14px;
  background: #f8fbff;
  overflow: hidden;
  transition: opacity 0.2s ease;
}

.upload-card.uploading {
  opacity: 0.72;
}

.upload-box,
.upload-box ::v-deep .el-upload {
  width: 100%;
}

.upload-box ::v-deep .el-upload-dragger {
  width: 100%;
  height: 310px;
  border: none;
  border-radius: 0;
  background: transparent;
  overflow: hidden;
  position: relative;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.upload-placeholder .el-icon-upload {
  margin: 0;
}

.upload-placeholder ::v-deep .el-upload__text {
  margin: 0;
  color: #5a6b82;
}

.upload-placeholder ::v-deep .el-upload__tip {
  margin: 0;
  color: #7e8ea5;
  line-height: 1.5;
}

.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #f5f8fd;
}

.upload-overlay {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  height: 30px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.48);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1024px) {
  .image-search-uploader {
    grid-template-columns: 1fr;
  }

  .intro-actions {
    margin-top: 14px;
  }

  .upload-box ::v-deep .el-upload-dragger {
    height: 270px;
  }
}
</style>
