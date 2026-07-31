<template>
  <el-form label-width="auto" style="max-width: 100%">
    <!-- media-display-select -->
    <el-form-item :label="t('settings.imageDisplay')">
      <el-select v-model="imageDisplayMode" class="font-select" width="50" size="small">
        <el-option v-for="mode in imageDisplayModeOptions" :key="mode" :label="t(`settings.imageMode.${mode}`)" :value="mode" />
      </el-select>
    </el-form-item>
    <el-form-item :label="t('settings.miniMediaScale')" v-if="imageDisplayMode === 'Mini'">
      <el-slider v-model="miniMediaScale" :format-tooltip="formatOpacity" :min="0" :max="100" :step="1" />
    </el-form-item>
  </el-form>
</template>
<script setup lang="ts">
import useImage from '@/hooks/useImage'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { imageDisplayModeOptions, imageDisplayMode, miniMediaScale } = useImage()

const formatOpacity = (val: number) => {
  return Math.trunc(val) + '%'
}
</script>
