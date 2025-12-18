<template>
  <!-- info -->
  <el-icon class="setting-icon" color="#ccc" @click="info = true">
    <WarningFilled />
  </el-icon>
  <el-drawer v-model="info" title="search" :with-header="false" :size="400"
    :style="{ backgroundColor: information?.color }">
    <div v-if="information" class="information">
      <el-image :src="information.cover" :alt="information.title" :preview-src-list="[information.cover]" />
      <p v-if="information.title">标题:{{ information.title }}</p>
      <p v-if="information.creator">作者:{{ information.creator }}</p>
      <p v-if="information.publisher">出版社:{{ information.publisher }}</p>
      <p v-if="information.language">语言:{{ information.language }}</p>
      <p v-if="information.pubdate">出版日期:{{ information.pubdate }}</p>
      <p v-if="information.modified_date">修改日期:{{ information.modified_date }}</p>
      <p v-if="information.description">介绍:{{ information.description }}</p>
    </div>
  </el-drawer>
</template>
<script setup>
import { ref } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import useInfo from '@/hooks/useInfo'

const info = ref(false)
const information = useInfo()
</script>
<style scoped>
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
</style>
