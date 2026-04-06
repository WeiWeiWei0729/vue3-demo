<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { EditableRow, ExceptionDetail, ExceptionNodeConfig } from '../types/exception-config';

interface OpenDialogPayload {
    mode?: 'add' | 'edit';
    nodeId?: number | null;
    detailId?: number | null;
    data?: ExceptionNodeConfig[];
}

const props = defineProps<{
    nodeOptions: string[];
    roleOptions: string[];
}>();

const emit = defineEmits<{
    submit: [payload: { mode: 'add' | 'edit'; nodeId: number | null; detailId: number | null; data: ExceptionNodeConfig[] }];
}>();

let nodeIdSeed = 100;
let detailIdSeed = 1000;

const dialogVisible = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');
const editingNodeId = ref<number | null>(null);
const editingDetailId = ref<number | null>(null);
const editingData = ref<ExceptionNodeConfig[]>([]);

const createDetail = (): ExceptionDetail => ({
    id: ++detailIdSeed,
    type: '',
    reason: '',
    roles: [],
});

const createEmptyNode = (): ExceptionNodeConfig => ({
    id: ++nodeIdSeed,
    node: '',
    details: [createDetail()],
});

const cloneNode = (node: ExceptionNodeConfig): ExceptionNodeConfig => ({
    ...node,
    details: node.details.map(detail => ({ ...detail, roles: [...detail.roles] })),
});

const open = (payload: OpenDialogPayload = {}) => {
    dialogMode.value = payload.mode ?? 'add';
    editingNodeId.value = payload.nodeId ?? null;
    editingDetailId.value = payload.detailId ?? null;
    editingData.value = payload.data?.length ? payload.data.map(item => cloneNode(item)) : [createEmptyNode()];
    dialogVisible.value = true;
};

const handleNodeChange = (nodeId: number, nodeValue: string) => {
    if (!nodeValue) return;
    const current = editingData.value.find(item => item.id === nodeId);
    const existed = editingData.value.find(item => item.id !== nodeId && item.node === nodeValue);
    if (!current || !existed) return;

    existed.details.push(...current.details);
    editingData.value = editingData.value.filter(item => item.id !== nodeId);
};

const addDetailRow = (nodeId: number, detailIndex: number) => {
    const target = editingData.value.find(item => item.id === nodeId);
    if (!target) return;
    target.details.splice(detailIndex + 1, 0, createDetail());
};

const addNode = () => {
    editingData.value.push(createEmptyNode());
};

const removeDetailRow = (nodeId: number, detailIndex: number) => {
    const target = editingData.value.find(item => item.id === nodeId);
    if (!target || editableRows.value.length <= 1) return;
    if (target.details.length === 1) {
        editingData.value = editingData.value.filter(item => item.id !== nodeId);
        return;
    }
    target.details.splice(detailIndex, 1);
};

const canRemoveDetailRow = (nodeId: number) => {
    if (editableRows.value.length <= 1) return false;
    const target = editingData.value.find(item => item.id === nodeId);
    return Boolean(target);
};

const editableRows = computed<EditableRow[]>(() => {
    const rows: EditableRow[] = [];
    editingData.value.forEach(node => {
        node.details.forEach((detail, detailIndex) => {
            rows.push({
                nodeId: node.id,
                detailId: detail.id,
                detailIndex,
                rowSpan: detailIndex === 0 ? node.details.length : 0,
                nodeRef: node,
                detail,
            });
        });
    });
    return rows;
});

const tableSpanMethod = ({ row, columnIndex }: { row: EditableRow; columnIndex: number }) => {
    if (columnIndex === 0) {
        return {
            rowspan: row.rowSpan,
            colspan: row.rowSpan > 0 ? 1 : 0,
        };
    }
    return { rowspan: 1, colspan: 1 };
};

const submitEdit = () => {
    if (!editingData.value.length) {
        ElMessage.warning('请至少保留一条上报节点配置');
        return;
    }

    const invalidNode = editingData.value.find(item => !item.node);
    if (invalidNode) {
        ElMessage.warning('请选择上报节点');
        return;
    }

    const invalidRole = editingData.value.find(item => item.details.some(detail => !detail.roles.length));
    if (invalidRole) {
        ElMessage.warning('请至少选择一个异常处理角色');
        return;
    }

    const invalidDetail = editingData.value.find(item => item.details.some(detail => !detail.type.trim() || !detail.reason.trim()));
    if (invalidDetail) {
        ElMessage.warning('异常类型和异常原因不能为空');
        return;
    }

    emit('submit', {
        mode: dialogMode.value,
        nodeId: editingNodeId.value,
        detailId: editingDetailId.value,
        data: editingData.value.map(item => cloneNode(item)),
    });

    dialogVisible.value = false;
};

defineExpose({
    open,
});
</script>

<template>
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增异常配置' : '修改异常配置'" width="1300px" destroy-on-close :close-on-click-modal="false" class="config-dialog">
        <el-table :data="editableRows" border :span-method="tableSpanMethod" row-key="detailId">
            <el-table-column label="上报节点" width="220">
                <template #default="scope">
                    <el-select v-model="scope.row.nodeRef.node" placeholder="请选择" filterable style="width: 100%" @change="handleNodeChange(scope.row.nodeId, $event)">
                        <el-option v-for="item in props.nodeOptions" :key="item" :label="item" :value="item" />
                    </el-select>
                </template>
            </el-table-column>

            <el-table-column label="异常类型">
                <template #default="scope">
                    <div class="cell-editor">
                        <el-input v-model="scope.row.detail.type" maxlength="10" show-word-limit placeholder="最多10字" />
                        <el-button v-if="dialogMode === 'add'" circle type="primary" plain @click="addDetailRow(scope.row.nodeId, scope.row.detailIndex)">+</el-button>
                        <el-button
                            v-if="dialogMode === 'add'"
                            circle
                            type="danger"
                            plain
                            :disabled="!canRemoveDetailRow(scope.row.nodeId)"
                            @click="removeDetailRow(scope.row.nodeId, scope.row.detailIndex)">
                            -
                        </el-button>
                    </div>
                </template>
            </el-table-column>

            <el-table-column label="异常原因" width="360">
                <template #default="scope">
                    <div class="cell-editor">
                        <el-input v-model="scope.row.detail.reason" maxlength="15" show-word-limit placeholder="最多15字" />
                        <el-button v-if="dialogMode === 'add'" circle type="primary" plain @click="addDetailRow(scope.row.nodeId, scope.row.detailIndex)">+</el-button>
                        <el-button
                            v-if="dialogMode === 'add'"
                            circle
                            type="danger"
                            plain
                            :disabled="!canRemoveDetailRow(scope.row.nodeId)"
                            @click="removeDetailRow(scope.row.nodeId, scope.row.detailIndex)">
                            -
                        </el-button>
                    </div>
                </template>
            </el-table-column>

            <el-table-column label="异常处理角色" width="260">
                <template #default="scope">
                    <el-select v-model="scope.row.detail.roles" multiple collapse-tags collapse-tags-tooltip placeholder="请选择" style="width: 100%">
                        <el-option v-for="item in props.roleOptions" :key="item" :label="item" :value="item" />
                    </el-select>
                </template>
            </el-table-column>
        </el-table>

        <div v-if="dialogMode === 'add'" class="toolbar-row">
            <el-button type="primary" plain @click="addNode">新增上报节点</el-button>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitEdit">保存</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style scoped>
.cell-editor {
    display: flex;
    align-items: center;
    gap: 8px;
}

.cell-editor :deep(.el-input) {
    flex: 1;
    min-width: 0;
}

.toolbar-row {
    margin-top: 12px;
}

.config-dialog :deep(.el-dialog) {
    width: min(1200px, calc(100vw - 32px));
    max-width: calc(100vw - 32px);
}

.config-dialog :deep(.el-dialog__body) {
    overflow-x: hidden;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
}
</style>
