<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ConfigDialog from './components/ConfigDialog.vue'
import type { ExceptionNodeConfig, ListDisplayRow } from './types/exception-config'

const nodeOptions = [
  '订单校验节点',
  '审批流节点',
  '回调通知节点',
  '库存同步节点',
  '财务对账节点',
]

const roleOptions = ['风控专员', '业务主管', '系统管理员', '仓储运营', '财务专员', '客服专员']

let nodeIdSeed = 100

const sourceData = ref<ExceptionNodeConfig[]>([])
const configDialogRef = ref<InstanceType<typeof ConfigDialog> | null>(null)

const cloneNode = (node: ExceptionNodeConfig): ExceptionNodeConfig => ({
  ...node,
  details: node.details.map((detail) => ({ ...detail, roles: [...detail.roles] })),
})

const syncNodeIdSeed = (nodeId: number) => {
  nodeIdSeed = Math.max(nodeIdSeed, nodeId)
}

const openAddDialog = () => {
  configDialogRef.value?.open()
}

const openEditDialog = (nodeId: number, detailId: number) => {
  const targetNode = sourceData.value.find((item) => item.id === nodeId)
  const targetDetail = targetNode?.details.find((item) => item.id === detailId)
  if (!targetNode || !targetDetail) return
  configDialogRef.value?.open({
    mode: 'edit',
    nodeId,
    detailId,
    data: [
      {
        id: targetNode.id,
        node: targetNode.node,
        details: [{ ...targetDetail, roles: [...targetDetail.roles] }],
      },
    ],
  })
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

const handleDialogSubmit = (payload: {
  mode: 'add' | 'edit'
  nodeId: number | null
  detailId: number | null
  data: ExceptionNodeConfig[]
}) => {
  if (payload.mode === 'add') {
    payload.data.forEach((item) => {
      const clonedNode = cloneNode(item)
      syncNodeIdSeed(clonedNode.id)
      const existedNode = sourceData.value.find((sourceItem) => sourceItem.node === clonedNode.node)

      if (existedNode) {
        existedNode.details.push(...clonedNode.details)
        return
      }

      sourceData.value.push(clonedNode)
    })
  } else {
    const [target] = payload.data
    const sourceNodeIndex = sourceData.value.findIndex((item) => item.id === payload.nodeId)
    if (sourceNodeIndex === -1 || payload.detailId === null) return
    const sourceNode = sourceData.value[sourceNodeIndex]
    const sourceDetailIndex = sourceNode.details.findIndex((item) => item.id === payload.detailId)
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

    <ConfigDialog
      ref="configDialogRef"
      :node-options="nodeOptions"
      :role-options="roleOptions"
      @submit="handleDialogSubmit"
    />
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
</style>
