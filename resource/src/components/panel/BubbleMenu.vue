<template>
	<el-popover v-model:visible="isVisible" popper-class="bubble">
		<template #reference>
			<span style="position: absolute; visibility: hidden;"></span>
		</template>
		<el-button-group>
			<el-button :icon="Brush" @click="onHLBtn"></el-button>
			<el-button :icon="CopyDocument" @click="copy"></el-button>
			<el-popover width="200" trigger="hover">
				<template #reference>
					<el-button icon="el-icon-collection"></el-button>
				</template>
				<div class="el-popover__title">
					<el-input v-model="translateTo" placeholder="Language Code" width="30" size="small">
						<template slot="prepend">
							Translate to
						</template>
					</el-input>
				</div>
				{{ translatedText }}
			</el-popover>
		</el-button-group>
	</el-popover>
</template>

<script setup>
import { useClipboard, useTextSelection } from '@vueuse/core'
import { Brush, CopyDocument } from '@element-plus/icons-vue'
import { ref, watch } from 'vue'
import { ClickOutside as vClickOutside } from 'element-plus'
import { rendition, isEpub } from '@/hooks/useRendition'

// console.dir(rendition.value.renderer['#view']['#iframe'].contentWindow)
console.dir(rendition.value.renderer)

const emit = defineEmits(['highlight-btn-click'])

const { text } = useTextSelection({
	// window: rendition.value.renderer
})

watch(text, (text) => {
	console.log('text_____', text)
})

const isVisible = ref(false)
const translateTo = ref('gu')
const translatedText = ref('')
const cfiRange = ref('')
const popRef = ref(null | HTMLElement)
const { copy } = useClipboard({ text })

const setProps = (react, textValue, cfiRangeValue) => {
	const referenc = popRef.value
	referenc.style.left = react.left
	referenc.style.top = react.top
	referenc.style.width = react.width
	referenc.style.height = react.height

	console.log(react)

	text.value = textValue
	cfiRange.value = cfiRangeValue
	translateText()
	isVisible.value = true
}

const hide = () => {
	isVisible.value = false
	text.value = ''
	translatedText.value = 'No Data'
	cfiRange.value = ''
}

const show = () => {
	isVisible.value = true
}

const onHLBtn = () => {
	if (cfiRange.value !== '') {
		emit('highlight-btn-click', cfiRange.value)
	}
}

const translateText = () => {
	try {
		translate(text.value, { to: translateTo.value }).then((res) => {
			translatedText.value = res.text
		})
	} catch (e) {
		console.error(e)
	}
}

defineExpose({
	setProps,
	hide,
	show,
})
</script>

<style lang="scss" scoped>
.bubble {
	padding: 0px;
}
</style>
