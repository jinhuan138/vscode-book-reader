<template>
  <!-- setting -->
  <el-icon v-if="showTrigger" class="setting-icon" color="#ccc" :title="t('settings.title')" @click="setting = true">
    <Setting />
  </el-icon>
  <el-drawer v-model="setting" resizable :title="t('settings.title')" :with-header="false" :size="isVscode ? 460 : 420">
    <el-tabs v-model="activeTab" class="setting-tabs">
      <el-tab-pane :label="t('settings.reading')" name="reading">
        <section class="setting-section">
          <el-divider content-position="left">{{ t('settings.textStyle') }}</el-divider>
          <TextStyle />
        </section>
        <section class="setting-section">
          <el-divider content-position="left">{{ t('settings.layout') }}</el-divider>
          <Layout />
        </section>
        <section class="setting-section">
          <el-divider content-position="left">{{ t('settings.illustration') }}</el-divider>
          <Image />
        </section>
      </el-tab-pane>
      <el-tab-pane :label="t('settings.preferences')" name="preferences">
        <EnhancedFunctionality />
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import useVscode from '@/hooks/useVscode'
import TextStyle from './TextStyle.vue'
import EnhancedFunctionality from './EnhancedFunctionality.vue'
import Layout from './Layout.vue'
import Image from './Image.vue'
import { useI18n } from 'vue-i18n'
const vscode = useVscode()
const { t } = useI18n()
const isVscode = ref(vscode ? true : false)
const setting = ref(false)
const activeTab = ref('reading')
defineProps({ showTrigger: { type: Boolean, default: true } })
defineExpose({ open: () => (setting.value = true) })
</script>
<style scoped>
.setting-icon {
  cursor: pointer;
  z-index: 5;
}

.setting-icon:hover {
  color: #409efc;
}

.setting-tabs :deep(.el-tabs__content) {
  padding: 16px 4px 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 400;
}

.setting-section + .setting-section {
  margin-top: 24px;
}

.setting-section :deep(.el-divider__text) {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  font-weight: 600;
}
</style>
