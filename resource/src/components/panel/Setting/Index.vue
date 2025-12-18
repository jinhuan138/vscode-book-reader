<template>
  <!-- setting -->
  <el-icon class="setting-icon" color="#ccc" @click="setting = true">
    <Setting />
  </el-icon>
  <el-drawer v-model="setting" title="setting" :with-header="false" :size="isVscode ? 460 : 420">
    <el-tabs v-model="activeTab" class="setting-tabs">
      <el-tab-pane label="TextStyle" name="textStyle"><TextStyle /></el-tab-pane>
      <el-tab-pane label="Layout" name="layout"><Layout /></el-tab-pane>
      <el-tab-pane label="EnhancedFunctionality" name="enhancedFunctionality"><EnhancedFunctionality /></el-tab-pane>
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
const vscode = useVscode()
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
.setting-tabs > .el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}
</style>
