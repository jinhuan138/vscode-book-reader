<template>
  <!-- info -->
  <el-icon class="setting-icon" color="#ccc" @click="showInfo = true">
    <WarningFilled />
  </el-icon>
  <el-drawer v-model="showInfo" title="search" :with-header="false" :size="400">
    <div v-if="info" class="information">
      <el-image class="el-image" :src="coverUrls[info.id]" :alt="info.title" :preview-src-list="[coverUrls[info.id]]">
        <template #error>
          <div class="image-slot">
            <el-icon>
              <Picture />
            </el-icon>
          </div> </template
      ></el-image>
      <p v-if="info.title">title:{{ info.title }}</p>
      <p v-if="info.author.name">author:{{ info.author.name }}</p>
      <p v-if="info.published">publisher:{{ format(info.published) }}</p>
      <p v-if="info.language">language:{{ info.language }}</p>
      <p v-if="info.modified">modified:{{ info.modified }}</p>
      <p v-if="info.description">description:{{ info.description }}</p>
    </div>
  </el-drawer>
</template>
<script setup>
import { ref } from 'vue'
import { WarningFilled, Picture } from '@element-plus/icons-vue'
import { dayjs } from 'element-plus'
import useInfo from '@/hooks/useInfo'
import useStore from '@/hooks/useStore'

const { coverUrls } = useStore()
const showInfo = ref(false)
const info = useInfo()
const format = (time) => {
  if(!time) return ''
  dayjs(time).format('YYYY-MM-DD')
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
