<template>
	<el-icon class="bookmark-icon" @click="showBookmark = true" color="#ccc">
		<CollectionTag />
	</el-icon>
	<el-drawer v-model="showBookmark" title="bookmark" :with-header="false" :size="400">
		<el-text size="large">
			Bookmarks
			<el-button size="small" :icon="Plus" circle @click="addBookmark" />
		</el-text>
		<el-tree :data="bookInfo!.bookmarks" node-key="id" @node-click="onNodeClick">
			<template #default="{ node }">
				<span class="custom-tree-node">
					<span>{{ node.label }}</span>
					<el-button type="primary" link :icon="Close" @click.stop="removeBookmark(node.data)" />
				</span>
			</template>
		</el-tree>
	</el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Close, CollectionTag } from '@element-plus/icons-vue'
import { rendition } from '@/hooks/useRendition'
import useProgress from '@/hooks/useProgress'
import useStore, { type Bookmark } from '@/hooks/useStore'
const showBookmark = ref(false)
const { bookInfo } = useStore()

const addBookmark = () => {
	const { lastLocation } = rendition.value
	const { cfi, fraction, tocItem } = lastLocation;
	const label = `${tocItem?.label || ''} : At ${(fraction * 100).toFixed(2)}%`;
	bookInfo.value!.bookmarks.push({
		label,
		cfi,
	});
}

const removeBookmark = (node: Bookmark) => {
	bookInfo.value!.bookmarks = bookInfo.value!.bookmarks.filter((bookmark) => bookmark.cfi !== node.cfi)
}

const onNodeClick = (item: Bookmark) => {
	rendition.value.goTo?.(item.cfi)
}
</script>

<style scoped>
.bookmark-icon {
	cursor: pointer;
	z-index: 5;
}

.bookmark-icon:hover {
	color: #409efc;
}

.el-popover__title {
	margin-bottom: 5px;
}

.custom-tree-node {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 14px;
	padding-right: 8px;
	margin: 5px;
}
</style>