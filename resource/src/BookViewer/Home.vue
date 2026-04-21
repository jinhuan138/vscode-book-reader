<template>
  <el-container direction="vertical">
    <el-header height="40px">
      <el-upload :auto-upload="false" accept=".epub" :on-change="addBook" :multiple="false" :show-file-list="false">
        <el-button size="small" :icon="Plus" circle title="import book"></el-button>
      </el-upload>
    </el-header>
    <!-- 书籍列表 -->
    <el-main class="main">
      <div class="grid">
        <div v-for="(info, index) in bookList" :key="index" @click="openBook(info.id)">
          <el-card shadow="hover" class="box-card" :body-style="{ padding: '0px' }">
            <el-image :src="111" fit="fill" class="el-image">
              <template #error>
                <div class="image-slot">
                  <el-icon>
                    <Picture />
                  </el-icon>
                </div>
              </template>
            </el-image>
            <div
              class="title"
              :style="{
                background: info.color || '#6d6d6d',
              }"
            >
              {{ trunc(info.title, 30) }}
            </div>
          </el-card>
        </div>
      </div>
    </el-main>
  </el-container>
</template>
<script setup>
import { Plus, Picture } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import MagicGrid from 'magic-grid'
import useStore from '@/hooks/useStore'
import { onMounted, watch } from 'vue'

const { bookList, addBook, removeBook } = useStore()

let magicGrid = null

onMounted(() => {
  magicGrid = new MagicGrid({
    container: '.grid', // Required. Can be a class, id, or an HTMLElement.
    items: bookList.value.length, // Required for static content.
    animate: true, // Optional.
  })
  magicGrid.listen()
})

watch(
  () => bookList.value.length,
  () => {
    magicGrid.positionItems()
  },
)

const router = useRouter()

const trunc = (str, n) => {
  if (!str) return ''
  return str.length > n ? `${str.substr(0, n - 3)}...` : str
}

const openBook = (id) => {
  const routeData = router.resolve({
    name: 'Reader',
    params: { id },
  })
  window.open(routeData.href, '_blank')
}
</script>

<style scoped lang="scss">
::-webkit-scrollbar {
  display: none;
}

.main {
  .grid {
    margin: 40px;

    .box-card {
      width: 170px;
      height: 250px;
      cursor: pointer;
      user-select: none;
      overflow: hidden;

      .el-image {
        height: 200px;
        width: 100%;

        .image-slot {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          background: var(--el-fill-color-light);
          color: var(--el-text-color-secondary);
          font-size: 30px;
        }
      }

      .title {
        box-sizing: border-box;
        width: 100%;
        padding: 0 10px;
        height: 45px;
        font-size: 14px;
        line-height: 45px;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
