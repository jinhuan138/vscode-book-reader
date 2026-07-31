<template>
  <el-form label-width="auto" style="max-width: 100%">
    <el-form-item :label="t('settings.language')">
      <el-select v-model="appLocale" style="width: 100%">
        <el-option :label="t('settings.english')" value="en" />
        <el-option :label="t('settings.chinese')" value="zh-CN" />
      </el-select>
    </el-form-item>
    <el-form-item :label="t('settings.grayscale')">
      <el-switch v-model="theme.grayscale" />
    </el-form-item>
    <el-form-item :label="t('settings.codeDisguise')">
      <el-tooltip :content="t('settings.codeDisguiseTip')" placement="top">
        <el-switch v-model="codeDisguise" />
      </el-tooltip>
    </el-form-item>
    <el-form-item :label="t('settings.sidebarDisguise')">
      <el-switch v-model="sidebarDisguise" />
    </el-form-item>
  </el-form>
</template>
<script setup>
import useDisguise from '@/hooks/useDisguise'
import useTheme from '@/hooks/useTheme'
import { appLocale } from '@/locales'
import { useI18n } from 'vue-i18n'


const { theme } = useTheme()
const { codeDisguise, sidebarDisguise } = useDisguise()
const { t } = useI18n()
</script>
