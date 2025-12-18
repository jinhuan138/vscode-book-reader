<template>
  <!-- search -->
  <el-icon class="setting-icon" @click="searching = true" color="#ccc">
    <Search />
  </el-icon>
  <el-drawer v-model="searching" title="search" :with-header="false" :size="400">
    <el-input
      clearable
      v-model="searchText"
      size="small"
      width="300"
      placeholder="search"
      :suffix-icon="searchText ? '' : Search"
      @keyup.enter="search"
      class="search"
    />
    <el-table
      :key="searchResult.length"
      :show-header="false"
      :data="searchResult"
      @cell-click="onNodeClick"
      height="calc(100% - 26px)"
      v-loading="searchingLoading"
    >
      <el-table-column prop="label">
        <template #default="scope">
          <span v-html="scope.row.label" />
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<script setup>
import { Search } from '@element-plus/icons-vue'
import useSearch from '@/hooks/useSearch'
import useRendition from '@/hooks/useRendition'


const [rendition] = useRendition()
const { searching, searchText, searchingLoading, searchResult, search } = useSearch()

const onNodeClick = (item) => {
  if (!rendition.value.tagName) {
    rendition.value.display(item.cfi || item.href)
  } else {
    rendition.value.goTo?.(item.cfi)
  }
}
</script>

<style>
.setting-icon {
  cursor: pointer;
  z-index: 5;
}

.setting-icon:hover {
  color: #409efc;
}
</style>
