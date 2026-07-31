<template>
  <!-- setting -->
  <el-icon class="setting-icon" color="#ccc" :title="t('settings.title')" @click="setting = true">
    <Setting />
  </el-icon>
  <el-drawer v-model="setting" resizable :title="t('settings.title')" :with-header="false" :size="isVscode ? 460 : 420">
    <el-tabs v-model="activeTab" class="setting-tabs">
      <el-tab-pane :label="t('settings.textStyle')" name="textStyle">
        <TextStyle />
      </el-tab-pane>
      <el-tab-pane :label="t('settings.image')" name="Image">
        <Image />
      </el-tab-pane>
      <el-tab-pane :label="t('settings.layout')" name="layout">
        <Layout />
      </el-tab-pane>
      <el-tab-pane :label="t('settings.enhanced')" name="enhancedFunctionality">
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
const activeTab = ref('textStyle')
</script>
<style scoped>
.setting-icon {
  cursor: pointer;
  z-index: 5;
}

.setting-icon:hover {
  color: #409efc;
}

.setting-tabs>.el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}
</style>
