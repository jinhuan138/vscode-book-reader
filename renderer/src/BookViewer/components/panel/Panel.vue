<template>
  <!-- panel -->
  <div class="panel-box">
    <Voice />
    <Info />
    <Search />
    <Bookmark />
    <Setting />
  </div>
</template>

<script setup>
import Search from './Search.vue'
import Info from './Info.vue'
import Setting from './Setting/Setting.vue'
import Bookmark from './Bookmark.vue'
import Voice from './Voice.vue'
</script>
<style scoped>
/* panel */
.panel-box {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 5px;
}
</style>
