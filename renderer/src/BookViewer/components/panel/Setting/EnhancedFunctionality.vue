<template>
  <el-form label-width="auto" style="max-width: 100%">
    <el-form-item label="Grayscale Mode">
      <el-switch v-model="theme.grayscale" />
    </el-form-item>
    <el-form-item label="Code Disguise">
      <el-tooltip content="Space → Toggle Disguise" placement="top">
        <el-switch v-model="codeDisguise" />
      </el-tooltip>
    </el-form-item>
    <el-form-item label="Sidebar Disguise">
      <el-switch v-model="sidebarDisguise" />
    </el-form-item>
  </el-form>
</template>
<script setup>
import useDisguise from '@/hooks/useDisguise'
import useTheme from '@/hooks/useTheme'


const { theme } = useTheme()
const { codeDisguise, sidebarDisguise } = useDisguise()
</script>
