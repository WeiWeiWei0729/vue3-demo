<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

type ExceptionItem = {
  id: number
  node: string
  type: string
  reason: string
  role: string
}

const tableData = ref<ExceptionItem[]>([
  {
    id: 1,
    node: '订单校验节点',
    type: '数据异常',
    reason: '订单金额与明细不一致',
    role: '风控专员',
  },
  {
    id: 2,
    node: '审批流节点',
    type: '超时异常',
    reason: '审批超时超过 24 小时',
    role: '业务主管',
  },
  {
    id: 3,
    node: '回调通知节点',
    type: '接口异常',
    reason: '第三方接口返回 500',
    role: '系统管理员',
  },
  {
    id: 4,
    node: '库存同步节点',
    type: '同步异常',
    reason: '库存数据同步失败',
    role: '仓储运营',
  },
])

const handleEdit = (row: ExceptionItem) => {
  ElMessage.success(`已点击修改：${row.node}`)
}

const handleDelete = async (row: ExceptionItem) => {
  await ElMessageBox.confirm(`确认删除「${row.node}」这条异常配置吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })

  tableData.value = tableData.value.filter((item) => item.id !== row.id)
  ElMessage.success('删除成功')
}
</script>

<template>
  <div class="page">
    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="header-row">
          <span class="title">异常配置列表</span>
          <el-tag type="info">共 {{ tableData.length }} 条</el-tag>
        </div>
      </template>

      <el-table :data="tableData" border stripe>
        <el-table-column prop="node" label="异常节点" min-width="160" />
        <el-table-column prop="type" label="异常类型" min-width="120" />
        <el-table-column prop="reason" label="异常原因" min-width="220" show-overflow-tooltip />
        <el-table-column prop="role" label="异常关联角色" min-width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">修改</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  background: #f5f7fa;
}

.list-card {
  width: min(1200px, 100%);
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
