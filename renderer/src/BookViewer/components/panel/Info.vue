<template>
  <!-- info -->
  <el-icon v-if="showTrigger" class="setting-icon" color="#ccc" :title="t('info.title')" @click="showInfo = true">
    <WarningFilled />
  </el-icon>
  <el-drawer v-model="showInfo" resizable :title="t('info.title')" :with-header="false" :size="400">
    <div v-if="info" class="information">
      <el-image class="cover" :src="info.cover" :alt="info.title" :preview-src-list="[info.cover]" fit="cover">
        <template #error>
          <div class="image-slot">
            <el-icon>
              <Picture />
            </el-icon>
          </div>
        </template>
      </el-image>
      <h2 v-if="info.title" class="book-title">{{ info.title }}</h2>
      <dl class="metadata">
        <div v-if="info.author?.name" class="metadata-row">
          <dt>{{ t('info.author') }}</dt>
          <dd>{{ info.author.name }}</dd>
        </div>
        <div v-if="info.published" class="metadata-row">
          <dt>{{ t('info.publisher') }}</dt>
          <dd>{{ format(info.published) }}</dd>
        </div>
        <div v-if="info.language" class="metadata-row">
          <dt>{{ t('info.language') }}</dt>
          <dd>{{ info.language }}</dd>
        </div>
        <div v-if="info.modified" class="metadata-row">
          <dt>{{ t('info.modified') }}</dt>
          <dd>{{ format(info.modified) }}</dd>
        </div>
      </dl>
      <section v-if="info.description" class="description">
        <h3>{{ t('info.description') }}</h3>
        <p>{{ info.description }}</p>
      </section>
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
defineProps({ showTrigger: { type: Boolean, default: true } })
defineExpose({ open: () => (showInfo.value = true) })
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
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--el-text-color-primary);
}

.cover {
  align-self: center;
  width: min(180px, 65%);
  max-height: 260px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

.book-title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  line-height: 1.45;
  text-align: center;
}

.metadata {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}

.metadata-row {
  display: grid;
  grid-template-columns: minmax(72px, auto) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.metadata-row dt {
  color: var(--el-text-color-secondary);
}

.metadata-row dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.description {
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.description h3 {
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
  font-size: 15px;
}

.description p {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.7;
  white-space: pre-wrap;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 180px;
  color: var(--el-text-color-placeholder);
  font-size: 30px;
}
</style>
