<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface ExceptionDetail {
  id: number
  type: string
  reason: string
  roles: string[]
}

interface ExceptionNodeConfig {
  id: number
  node: string
  details: ExceptionDetail[]
}

interface EditableRow {
  nodeId: number
  detailId: number
  detailIndex: number
  rowSpan: number
  nodeRef: ExceptionNodeConfig
  detail: ExceptionDetail
}

interface ListDisplayRow {
  id: number
  nodeId: number
  rowSpan: number
  node: string
  type: string
  reason: string
  roles: string
}

const nodeOptions = [
  '订单校验节点',
  '审批流节点',
  '回调通知节点',
  '库存同步节点',
  '财务对账节点',
]

const roleOptions = ['风控专员', '业务主管', '系统管理员', '仓储运营', '财务专员', '客服专员']

let nodeIdSeed = 100
let detailIdSeed = 1000

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingNodeId = ref<number | null>(null)
const editingDetailId = ref<number | null>(null)

const sourceData = ref<ExceptionNodeConfig[]>([])
const editingData = ref<ExceptionNodeConfig[]>([])

const createDetail = (): ExceptionDetail => ({
  id: ++detailIdSeed,
  type: '',
  reason: '',
  roles: [],
})

const createEmptyNode = (): ExceptionNodeConfig => ({
  id: ++nodeIdSeed,
  node: '',
  details: [createDetail()],
})

const cloneNode = (node: ExceptionNodeConfig): ExceptionNodeConfig => ({
  ...node,
  details: node.details.map((detail) => ({ ...detail, roles: [...detail.roles] })),
})

const openAddDialog = () => {
  dialogMode.value = 'add'
  editingNodeId.value = null
  editingDetailId.value = null
  editingData.value = [createEmptyNode()]
  dialogVisible.value = true
}

const openEditDialog = (nodeId: number, detailId: number) => {
  const targetNode = sourceData.value.find((item) => item.id === nodeId)
  const targetDetail = targetNode?.details.find((item) => item.id === detailId)
  if (!targetNode || !targetDetail) return
  dialogMode.value = 'edit'
  editingNodeId.value = nodeId
  editingDetailId.value = detailId
  editingData.value = [
    {
      id: targetNode.id,
      node: targetNode.node,
      details: [{ ...targetDetail, roles: [...targetDetail.roles] }],
    },
  ]
  dialogVisible.value = true
}

const handleNodeChange = (nodeId: number, nodeValue: string) => {
  if (!nodeValue) return
  const current = editingData.value.find((item) => item.id === nodeId)
  const existed = editingData.value.find((item) => item.id !== nodeId && item.node === nodeValue)
  if (!current || !existed) return

  existed.details.push(...current.details)
  editingData.value = editingData.value.filter((item) => item.id !== nodeId)
}

const addDetailRow = (nodeId: number, detailIndex: number) => {
  const target = editingData.value.find((item) => item.id === nodeId)
  if (!target) return
  target.details.splice(detailIndex + 1, 0, createDetail())
}

const addNode = () => {
  editingData.value.push(createEmptyNode())
}

const removeNode = (nodeId: number) => {
  if (editingData.value.length <= 1) return
  editingData.value = editingData.value.filter((item) => item.id !== nodeId)
}

const removeDetailRow = (nodeId: number, detailIndex: number) => {
  const target = editingData.value.find((item) => item.id === nodeId)
  if (!target || editableRows.value.length <= 1) return
  if (target.details.length === 1) {
    editingData.value = editingData.value.filter((item) => item.id !== nodeId)
    return
  }
  target.details.splice(detailIndex, 1)
}

const canRemoveDetailRow = (nodeId: number) => {
  if (editableRows.value.length <= 1) return false
  const target = editingData.value.find((item) => item.id === nodeId)
  return Boolean(target)
}

const editableRows = computed<EditableRow[]>(() => {
  const rows: EditableRow[] = []
  editingData.value.forEach((node) => {
    node.details.forEach((detail, detailIndex) => {
      rows.push({
        nodeId: node.id,
        detailId: detail.id,
        detailIndex,
        rowSpan: detailIndex === 0 ? node.details.length : 0,
        nodeRef: node,
        detail,
      })
    })
  })
  return rows
})

const tableSpanMethod = ({ row, columnIndex }: { row: EditableRow; columnIndex: number }) => {
  if (columnIndex === 0) {
    return {
      rowspan: row.rowSpan,
      colspan: row.rowSpan > 0 ? 1 : 0,
    }
  }
  return { rowspan: 1, colspan: 1 }
}

const listTableData = computed<ListDisplayRow[]>(() => {
  const rows: ListDisplayRow[] = []
  sourceData.value.forEach((node) => {
    node.details.forEach((detail, index) => {
      rows.push({
        id: detail.id,
        nodeId: node.id,
        rowSpan: index === 0 ? node.details.length : 0,
        node: node.node,
        type: detail.type,
        reason: detail.reason,
        roles: detail.roles.join('、'),
      })
    })
  })
  return rows
})

const listSpanMethod = ({ row, columnIndex }: { row: ListDisplayRow; columnIndex: number }) => {
  if (columnIndex === 0) {
    return {
      rowspan: row.rowSpan,
      colspan: row.rowSpan > 0 ? 1 : 0,
    }
  }
  return { rowspan: 1, colspan: 1 }
}

const submitEdit = () => {
  if (!editingData.value.length) {
    ElMessage.warning('请至少保留一条上报节点配置')
    return
  }

  const invalidNode = editingData.value.find((item) => !item.node)
  if (invalidNode) {
    ElMessage.warning('请选择上报节点')
    return
  }

  const invalidRole = editingData.value.find((item) =>
    item.details.some((detail) => !detail.roles.length),
  )
  if (invalidRole) {
    ElMessage.warning('请至少选择一个异常处理角色')
    return
  }

  const invalidDetail = editingData.value.find((item) =>
    item.details.some((detail) => !detail.type.trim() || !detail.reason.trim()),
  )
  if (invalidDetail) {
    ElMessage.warning('异常类型和异常原因不能为空')
    return
  }

  if (dialogMode.value === 'add') {
    sourceData.value.push(...editingData.value.map((item) => cloneNode(item)))
  } else {
    const [target] = editingData.value
    const sourceNodeIndex = sourceData.value.findIndex((item) => item.id === editingNodeId.value)
    if (sourceNodeIndex === -1 || editingDetailId.value === null) return
    const sourceNode = sourceData.value[sourceNodeIndex]
    const sourceDetailIndex = sourceNode.details.findIndex((item) => item.id === editingDetailId.value)
    if (sourceDetailIndex === -1) return

    const payloadDetail = {
      ...target.details[0],
      roles: [...target.details[0].roles],
    }

    if (target.node === sourceNode.node) {
      sourceNode.details.splice(sourceDetailIndex, 1, payloadDetail)
    } else {
      sourceNode.details.splice(sourceDetailIndex, 1)
      if (!sourceNode.details.length) {
        sourceData.value.splice(sourceNodeIndex, 1)
      }

      const existedNode = sourceData.value.find((item) => item.node === target.node)
      if (existedNode) {
        existedNode.details.push(payloadDetail)
      } else {
        sourceData.value.push({
          id: ++nodeIdSeed,
          node: target.node,
          details: [payloadDetail],
        })
      }
    }
  }

  dialogVisible.value = false
  ElMessage.success('保存成功')
}

const deleteNodeFromList = async (nodeId: number, detailId: number) => {
  const targetNode = sourceData.value.find((item) => item.id === nodeId)
  const targetDetail = targetNode?.details.find((item) => item.id === detailId)
  if (!targetNode || !targetDetail) return

  try {
    await ElMessageBox.confirm(
      `确认删除【${targetNode.node || '未命名节点'} - ${targetDetail.type || '未填写异常类型'}】吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
      },
    )

    targetNode.details = targetNode.details.filter((item) => item.id !== detailId)
    if (!targetNode.details.length) {
      sourceData.value = sourceData.value.filter((item) => item.id !== nodeId)
    }
    ElMessage.success('删除成功')
  } catch {
    // 用户取消删除
  }
}
</script>

<template>
  <div class="page">
    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="header-row">
          <span class="title">异常配置列表（合并展示）</span>
          <el-button type="primary" @click="openAddDialog">新增配置</el-button>
        </div>
      </template>

      <el-table :data="listTableData" row-key="id" border stripe :span-method="listSpanMethod">
        <el-table-column prop="node" label="上报节点" min-width="180" />
        <el-table-column prop="type" label="异常类型" min-width="140" />
        <el-table-column prop="reason" label="异常原因" min-width="240" />
        <el-table-column prop="roles" label="异常处理角色" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="openEditDialog(scope.row.nodeId, scope.row.id)">
              修改
            </el-button>
            <el-button link type="danger" @click="deleteNodeFromList(scope.row.nodeId, scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增异常配置' : '修改异常配置'"
      width="1300px"
      destroy-on-close
      class="config-dialog"
    >
      <el-table :data="editableRows" border :span-method="tableSpanMethod" row-key="detailId">
        <el-table-column label="上报节点" width="220">
          <template #default="scope">
            <el-select
              v-model="scope.row.nodeRef.node"
              placeholder="请选择"
              filterable
              style="width: 100%"
              @change="handleNodeChange(scope.row.nodeId, $event)"
            >
              <el-option v-for="item in nodeOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="异常类型">
          <template #default="scope">
            <div class="cell-editor">
              <el-input
                v-model="scope.row.detail.type"
                maxlength="10"
                show-word-limit
                placeholder="最多10字"
              />
              <el-button
                v-if="dialogMode === 'add'"
                circle
                type="primary"
                plain
                @click="addDetailRow(scope.row.nodeId, scope.row.detailIndex)"
              >
                +
              </el-button>
              <el-button
                v-if="dialogMode === 'add'"
                circle
                type="danger"
                plain
                :disabled="!canRemoveDetailRow(scope.row.nodeId)"
                @click="removeDetailRow(scope.row.nodeId, scope.row.detailIndex)"
              >
                -
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="异常原因" width="360">
          <template #default="scope">
            <div class="cell-editor">
              <el-input
                v-model="scope.row.detail.reason"
                maxlength="15"
                show-word-limit
                placeholder="最多15字"
              />
              <el-button
                v-if="dialogMode === 'add'"
                circle
                type="primary"
                plain
                @click="addDetailRow(scope.row.nodeId, scope.row.detailIndex)"
              >
                +
              </el-button>
              <el-button
                v-if="dialogMode === 'add'"
                circle
                type="danger"
                plain
                :disabled="!canRemoveDetailRow(scope.row.nodeId)"
                @click="removeDetailRow(scope.row.nodeId, scope.row.detailIndex)"
              >
                -
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="异常处理角色" width="260">
          <template #default="scope">
            <el-select
              v-model="scope.row.detail.roles"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择"
              style="width: 100%"
            >
              <el-option v-for="item in roleOptions" :key="item" :label="item" :value="item" />
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
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  background: #f5f7fa;
}

.list-card {
  width: min(1280px, 100%);
  margin: 0 auto;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

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
