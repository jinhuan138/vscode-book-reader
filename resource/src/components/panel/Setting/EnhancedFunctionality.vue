<template>
  <el-form label-width="auto" style="max-width: 100%">
    <el-form-item label="Grayscale Mode">
      <el-switch v-model="grayscale" />
    </el-form-item>
    <el-form-item label="Disguise">
      <el-tooltip content="Space → Toggle Disguise" placement="top">
        <el-switch v-model="disguise" />
      </el-tooltip>
    </el-form-item>
    <el-form-item label="Text To Speech">
      <el-switch v-model="isReading" />
    </el-form-item>
    <el-form-item label="Speed">
      <el-select class="font-select" width="50" size="small" v-model="speed">
        <el-option v-for="(item, index) in speedList" :key="index" :label="item" :value="item"> </el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="Voice">
      <el-select class="font-select" width="50" size="small" v-model="voiceIndex">
        <el-option v-for="(item, index) in voices" :key="item.name" :label="item.name" :value="index"> </el-option>
      </el-select>
    </el-form-item>
  </el-form>
</template>
<script setup>
import useGrayscale from '@/hooks/useGrayscale'
import useDisguise from '@/hooks/useDisguise'
import useSpeak from '@/hooks/useSpeak'
const { isReading, voiceIndex, voices, speed, speedList } = useSpeak()
const grayscale = useGrayscale()
const { disguise } = useDisguise()
</script>
