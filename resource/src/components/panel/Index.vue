<template>
  <!-- panel -->
  <div class="panel-box">
    <Info />
    <Search />
    <Setting />
  </div>
</template>

<script setup>
import Search from './Search.vue'
import Info from './Info.vue'
import Setting from './Setting/Index.vue'

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
