<template>
  <el-form label-width="auto" style="max-width: 100%">
    <el-form-item :label="t('settings.flow')">
      <el-radio-group v-model="flow" size="small" style="flex-wrap: nowrap">
        <el-radio-button value="paginated" border> {{ t('settings.paged') }} </el-radio-button>
        <el-radio-button value="scrolled-doc" border> {{ t('settings.scrolled') }} </el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item :label="t('settings.pagingAnimation')">
      <el-switch v-model="animation" />
    </el-form-item>
    <!-- <el-form-item label="View Spread">
      <el-radio-group v-model="spread" size="small" style="flex-wrap: nowrap">
        <el-radio-button value="auto" border> auto </el-radio-button>
        <el-radio-button value="none" border> none </el-radio-button>
      </el-radio-group>
    </el-form-item> -->
    <el-form-item :label="t('settings.progressDisplay')">
      <el-select class="font-select" width="50" size="small" v-model="progressDisplay">
        <el-option v-for="item in displayType" :key="item" :label="t(`settings.progress.${item}`)" :value="item" />
      </el-select>
    </el-form-item>
  </el-form>
</template>
<script setup>
import useFlow from '@/hooks/useFlow'
import useAnimation from '@/hooks/useAnimation'
import useProcessDisplay from '@/hooks/useProcessDisplay'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const flow = useFlow()
const animation = useAnimation()
const { displayType, progressDisplay } = useProcessDisplay()
</script>
