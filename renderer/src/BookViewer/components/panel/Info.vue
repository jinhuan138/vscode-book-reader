<template>
  <!-- info -->
  <el-icon class="setting-icon" color="#ccc" :title="t('info.title')" @click="showInfo = true">
    <WarningFilled />
  </el-icon>
  <el-drawer v-model="showInfo" resizable :title="t('info.title')" :with-header="false" :size="400">
    <div v-if="info" class="information">
      <el-image class="el-image" :src="info.cover" :alt="info.title" :preview-src-list="[info.cover]">
        <template #error>
          <div class="image-slot">
            <el-icon>
              <Picture />
            </el-icon>
          </div>
        </template></el-image>
      <p v-if="info.title">{{ t('info.bookTitle') }}: {{ info.title }}</p>
      <p v-if="info.author?.name">{{ t('info.author') }}: {{ info.author.name }}</p>
      <p v-if="info.published">{{ t('info.publisher') }}: {{ format(info.published) }}</p>
      <p v-if="info.language">{{ t('info.language') }}: {{ info.language }}</p>
      <p v-if="info.modified">{{ t('info.modified') }}: {{ info.modified }}</p>
      <p v-if="info.description">{{ t('info.description') }}: {{ info.description }}</p>
    </div>
  </el-drawer>
</template>
<script setup>
import { ref } from 'vue'
import { WarningFilled, Picture } from '@element-plus/icons-vue'
import { dayjs } from 'element-plus'
import useInfo from '@/hooks/useInfo'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const showInfo = ref(false)
const info = useInfo()
const format = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD')
}
</script>
<style scoped lang="scss">
.setting-icon {
  cursor: pointer;
  z-index: 5;
}

.setting-icon:hover {
  color: #409efc;
}

.information {
  color: #000;
}

.el-image {
  width: 100%;

  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 400px;
    font-size: 30px;
  }
}
</style>
