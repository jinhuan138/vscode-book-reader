<template>
  <el-form label-width="auto" style="max-width: 100%">
    <el-form-item label="Flow">
      <el-radio-group v-model="flow" size="small" style="flex-wrap: nowrap">
        <el-radio-button value="paginated" border> Paged </el-radio-button>
        <el-radio-button value="scrolled-doc" border> Scrolled </el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="Paging Animation">
      <el-switch v-model="animation" />
    </el-form-item>
    <el-form-item label="View Spread">
      <el-radio-group v-model="spread" size="small" style="flex-wrap: nowrap">
        <el-radio-button value="auto" border> auto </el-radio-button>
        <el-radio-button value="none" border> none </el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="Process Display">
      <el-select class="font-select" width="50" size="small" v-model="progressDisplay">
        <el-option v-for="item in displayType" :key="item" :label="item" :value="item"> </el-option>
      </el-select>
    </el-form-item>
  </el-form>
</template>
<script setup>
import useFlow from '@/hooks/useFlow'
import useAnimation from '@/hooks/useAnimation'
import useSpread from '@/hooks/useSpread'
import useProcessDisplay from '@/hooks/useProcessDisplay'

const flow = useFlow()
const animation = useAnimation()
const { displayType, progressDisplay } = useProcessDisplay()
const spread = useSpread()
</script>