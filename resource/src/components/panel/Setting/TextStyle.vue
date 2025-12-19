<template>
  <el-form :model="theme" label-width="auto" style="max-width: 100%">
    <el-form-item label="WritingMode">
      <el-radio-group v-model="theme.writingMode" size="small" style="flex-wrap: nowrap">
        <el-radio-button value="horizontal-tb" border> horizontal </el-radio-button>
        <el-radio-button value="vertical-rl" border> vertical </el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="Text Color">
      <el-color-picker v-model="theme.textColor" show-alpha />
      <li
        class="color-circle"
        v-for="color in textList"
        :key="color"
        :style="{ backgroundColor: color }"
        @click="theme.textColor = color"
      ></li>
    </el-form-item>
    <el-form-item label="Background Color">
      <el-color-picker v-model="theme.backgroundColor" show-alpha />
      <li
        class="color-circle"
        v-for="color in backgroundList"
        :key="color"
        :style="{ backgroundColor: color }"
        @click="theme.backgroundColor = color"
      ></li>
    </el-form-item>
    <el-form-item label="Line Spacing">
      <el-input-number
        v-model="theme.lineHeight"
        :precision="2"
        :step="0.1"
        :min="1"
        :max="2.0"
        size="small"
      ></el-input-number>
    </el-form-item>
    <el-form-item label="Opacity">
      <el-slider v-model="theme.opacity" :format-tooltip="formatOpacity" :min="0" :max="1" :step="0.01" />
    </el-form-item>
    <el-form-item label="Text Align">
      <el-select v-model="theme.textAlign" class="font-select" width="50" size="small">
        <el-option v-for="item in textAlignList" :key="item" :label="item" :value="item" />
      </el-select>
    </el-form-item>
    <el-form-item label="Font Size">
      <el-input-number v-model="theme.fontSize" :step="2" :min="10" :max="300" size="small"></el-input-number>
    </el-form-item>
    <el-form-item label="Font">
      <el-select v-model="theme.font" class="font-select" width="50" size="small">
        <el-option v-for="{ label, value } in fontFamilyList" :key="value" :label="label" :value="value">
          <span :style="{ fontFamily: value }">{{ label }}</span>
        </el-option>
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="restore">Restore default settings</el-button>
    </el-form-item>
  </el-form>
</template>
<script setup lang="ts">
//textStyle setting
import useTheme from '@/hooks/useTheme'

const { theme, textList, backgroundList, fontFamilyList, textAlignList, restore } = useTheme(false)
const formatOpacity = (val: number) => {
  return val * 100 + '%'
}
</script>
<style scoped>
.setting-icon {
  cursor: pointer;
  z-index: 5;
}
.setting-icon:hover {
  color: #409efc;
}
.color-circle {
  display: inline-block;
  width: 35px;
  height: 35px;
  font-size: 20px;
  border-radius: 50%;
  opacity: 1;
  cursor: pointer;
  margin: 7px;
  margin-top: 3px;
  box-sizing: border-box;
  position: relative;
  box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.18);
}
</style>
