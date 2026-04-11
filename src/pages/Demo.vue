<template>
 <div class="layout-padding w100">
  <div class="layout-padding-auto layout-padding-view" style="padding: 24px;">
   <el-row class="title-view">
    <div>
     <el-divider direction="vertical" />
     <span>异常类型配置</span>
    </div>
    <div>
     <el-button icon="Plus" type="primary" @click="handleAdd">添加异常类型配置</el-button>
    </div>
   </el-row>

   <!-- 查询表单 -->
   <el-row style="margin: 15px 25px;">
    <el-form :model="state.queryForm" ref="queryRef" :inline="true" @keyup.enter="getDataList">
     <el-form-item label="异常节点">
      <el-select v-model="state.queryForm.exceptionNodeCode" placeholder="请选择" clearable>
       <el-option v-for="item in transportation_exception_type" :value="item.value" :label="item.label"
        :key="item.value"></el-option>
      </el-select>
     </el-form-item>
     <el-form-item label="异常类型">
      <el-input v-model="state.queryForm.exceptionTypeNam" placeholder="请输入" clearable>
      </el-input>
     </el-form-item>
     <el-form-item>
      <el-button icon="search" type="primary" @click="getDataList">
       查询
      </el-button>
      <el-button icon="Refresh" @click="onReset">重置</el-button>
     </el-form-item>
    </el-form>
   </el-row>

   <!-- 数据表格 -->
   <el-table :data="tableData" row-key="id" border stripe :span-method="listSpanMethod" v-loading="state.loading">
    <el-table-column prop="exceptionNodeCode" label="上报节点" min-width="180">
     <template #default="scope">
      <span>{{ useDictLabel('transportation_exception_type', scope.row.exceptionNodeCode) }}</span>
     </template>
    </el-table-column>
    <el-table-column prop="exceptionTypeName" label="异常类型" min-width="140" />
    <el-table-column prop="exceptionReason" label="异常原因" min-width="240" />
    <el-table-column prop="exceptionHandleUser" label="异常处理角色" min-width="220" show-overflow-tooltip>
     <template #default="scope">
      <span>{{ getRoleLabels(scope.row.exceptionHandleUser) }}</span>
     </template>
    </el-table-column>
    <el-table-column label="操作" width="120" align="center">
     <template #default="scope">
      <el-button link type="primary" @click="handleEdit(scope.row.nodeId, scope.row.id)">
       修改
      </el-button>
      <el-button link type="danger" @click="handleDelete(scope.row)">
       删除
      </el-button>
     </template>
    </el-table-column>
   </el-table>
  </div>
  <AddDialog ref="addDialogRef" :node-options="transportation_exception_type" :role-options="roleOptions"
   @refresh="getDataList" />
 </div>
</template>

<script setup lang="ts" name="exceptionTypeConfig">
import { reactive, defineAsyncComponent, nextTick, ref, onMounted } from 'vue';
import { pageList, delObj } from '/@/api/scs/exceptionType';
import { useDict, useDictLabel } from '/@/hooks/dict';
import { ElMessageBox, ElMessage } from 'element-plus';

// 组件
const AddDialog = defineAsyncComponent(() => import('./add-dialog.vue'));

const { transportation_exception_type } = useDict('transportation_exception_type');

// 定义变量
const addDialogRef = ref();
const state = reactive({
 queryForm: {
  exceptionNodeCode: '',
  exceptionTypeNam: '',
 },
 dataList: [],
 pagination: {
  pageSize: 1000,
  currentPage: 1,
 },
 loading: false,
});
const roleOptions = [
 { value: 1, label: '下单人' },
 { value: 2, label: '发货人' },
 { value: 3, label: '调度员' }
]

// 创建角色映射
const roleMap = new Map(roleOptions.map(item => [item.value, item.label]))
// 反向映射：中文标签 -> 数字
const labelToValueMap = new Map(roleOptions.map(item => [item.label, item.value]))

// 转换角色数值为中文标签
const getRoleLabels = (roles: any) => {
 if (!roles) return ''
 if (typeof roles === 'string') {
  return roles.split('、').map(role => {
   const num = Number(role)
   return roleMap.get(num) || role
  }).join('、')
 }
 if (Array.isArray(roles)) {
  return roles.map(role => {
   const num = Number(role)
   return roleMap.get(num) || role
  }).join('、')
 }
 return roles
}
const tableData = ref<any[]>([])

// 获取数据列表
const getDataList = async () => {
 const params = {
  ...state.queryForm,
  current: state.pagination.currentPage,
  size: state.pagination.pageSize
 }
 state.loading = true
 try {
  const res = await pageList(params)
  if (res.code == 0) {
   const flattenedData: any[] = []

   res.data?.forEach(node => {
    node.exceptionTypeVOList?.forEach(typeItem => {
     typeItem.exceptionReasonList?.forEach(reason => {
      flattenedData.push({
       id: reason.id,
       nodeId: node.id,
       detailId: typeItem.id,
       exceptionNodeCode: node.exceptionNodeCode,
       exceptionTypeName: typeItem.exceptionTypeName,
       exceptionReason: reason.exceptionReason,
       exceptionHandleUser: Array.isArray(reason.exceptionHandleUser)
        ? reason.exceptionHandleUser.join('、')
        : reason.exceptionHandleUser,
      })
     })
    })
   })

   // 计算合并行
   const nodeGroups = new Map()
   const typeGroups = new Map()

   flattenedData.forEach(row => {
    if (!nodeGroups.has(row.nodeId)) {
     nodeGroups.set(row.nodeId, 0)
    }
    nodeGroups.set(row.nodeId, nodeGroups.get(row.nodeId) + 1)

    if (!typeGroups.has(row.detailId)) {
     typeGroups.set(row.detailId, 0)
    }
    typeGroups.set(row.detailId, typeGroups.get(row.detailId) + 1)
   })

   // 应用合并行
   let currentNodeId = null
   let currentDetailId = null

   tableData.value = flattenedData.map(row => {
    const isFirstInNode = row.nodeId !== currentNodeId
    const isFirstInType = row.detailId !== currentDetailId

    if (isFirstInNode) {
     currentNodeId = row.nodeId
    }
    if (isFirstInType) {
     currentDetailId = row.detailId
    }

    return {
     ...row,
     nodeRowSpan: isFirstInNode ? nodeGroups.get(row.nodeId) : 0,
     typeRowSpan: isFirstInType ? typeGroups.get(row.detailId) : 0,
    }
   })
  }
 } catch {
  // 错误处理
 } finally {
  state.loading = false
 }
};

// 重置
const onReset = () => {
 nextTick(() => {
  state.queryForm = {
   exceptionNodeCode: '',
   exceptionTypeNam: '',
  };
  state.pagination.pageSize = 1000
  state.pagination.currentPage = 1
  getDataList();
 });
};

const listSpanMethod = ({ row, columnIndex }: { row: any; columnIndex: number }) => {
 if (columnIndex === 0) {
  // 上报节点列合并
  return {
   rowspan: row.nodeRowSpan,
   colspan: row.nodeRowSpan > 0 ? 1 : 0,
  }
 } else if (columnIndex === 1) {
  // 异常类型列合并
  return {
   rowspan: row.typeRowSpan,
   colspan: row.typeRowSpan > 0 ? 1 : 0,
  }
 }
 return { rowspan: 1, colspan: 1 }
}

// 编辑
const handleEdit = (nodeId: number, reasonId: number) => {
 // 从表格数据中获取该行的信息
 const targetRow = tableData.value.find(item => item.nodeId === nodeId && item.id === reasonId)
 if (!targetRow) return

 // 只回显点击的这一行数据
 const detail = {
  id: targetRow.detailId,
  reasonId: targetRow.id,
  exceptionTypeName: targetRow.exceptionTypeName,
  exceptionReason: targetRow.exceptionReason,
  exceptionHandleUser: targetRow.exceptionHandleUser
   ? (typeof targetRow.exceptionHandleUser === 'string'
    ? targetRow.exceptionHandleUser.split('、').map((role: string) => labelToValueMap.get(role) || role)
    : targetRow.exceptionHandleUser)
   : []
 }

 addDialogRef.value?.open({
  mode: 'edit',
  nodeId,
  detailId: targetRow.detailId,
  data: [
   {
    id: nodeId,
    exceptionNodeCode: targetRow.exceptionNodeCode,
    details: [detail],
   },
  ],
 })
};

// 删除
const handleDelete = async (row: any) => {
 console.log(row, 'row');
 console.log(tableData.value, 'tableData');

 try {
  await ElMessageBox.confirm('确定删除该异常类型配置吗？', '提示', {
   confirmButtonText: '确定',
   cancelButtonText: '取消',
   type: 'warning',
  });

  // 统计同一nodeId下有多少行数据
  const sameNodeCount = tableData.value.filter(item => item.nodeId === row.nodeId).length;
  // 统计同一detailId(异常类型)下有多少行数据
  const sameTypeCount = tableData.value.filter(item => item.detailId === row.detailId).length;
  // 构建删除参数
  const deleteParams: any = {
   reasonIds: [row.id],
  };
  // 如果是一对一关系（同一nodeId只有1行），则传nodeIds
  if (sameNodeCount === 1) {
   deleteParams.nodeIds = [row.nodeId];
  }
  // 如果是一对一关系（同一detailId只有1行），则传detailIds
  if (sameTypeCount === 1) {
   deleteParams.typeIds = [row.detailId];
  }
  const res = await delObj(deleteParams);
  if (res.code === 0) {
   getDataList();
   ElMessage.success('删除成功');
  } else {
   ElMessage.error(res.msg || '删除失败');
  }
 } catch (error: any) {
  if (error !== 'cancel') {
   ElMessage.error('删除失败');
  }
 }
};

// 打开添加对话框
const handleAdd = () => {
 addDialogRef.value?.open();
};

const handleDialogSubmit = (payload: { mode: string; data: any[]; nodeId: any; detailId: null; }) => {
 // if (payload.mode === 'add') {
 //  payload.data.forEach((item) => {
 //   const clonedNode = cloneNode(item)
 //   syncNodeIdSeed(clonedNode.id)
 //   const existedNode = sourceData.value.find((sourceItem: any) => sourceItem.node === clonedNode.node)

 //   if (existedNode) {
 //    existedNode.details.push(...clonedNode.details)
 //    return
 //   }

 //   sourceData.value.push(clonedNode)
 //  })
 // } else {
 //  const [target] = payload.data
 //  const sourceNodeIndex = sourceData.value.findIndex((item: any) => item.id === payload.nodeId)
 //  if (sourceNodeIndex === -1 || payload.detailId === null) return
 //  const sourceNode = sourceData.value[sourceNodeIndex]
 //  const sourceDetailIndex = sourceNode.details.findIndex((item: any) => item.id === payload.detailId)
 //  if (sourceDetailIndex === -1) return

 //  const payloadDetail = {
 //   ...target.details[0],
 //   roles: [...target.details[0].roles],
 //  }

 //  if (target.node === sourceNode.node) {
 //   sourceNode.details.splice(sourceDetailIndex, 1, payloadDetail)
 //  } else {
 //   sourceNode.details.splice(sourceDetailIndex, 1)
 //   if (!sourceNode.details.length) {
 //    sourceData.value.splice(sourceNodeIndex, 1)
 //   }

 //   const existedNode = sourceData.value.find((item: any) => item.node === target.node)
 //   if (existedNode) {
 //    existedNode.details.push(payloadDetail)
 //   } else {
 //    sourceData.value.push({
 //     id: ++nodeIdSeed,
 //     node: target.node,
 //     details: [payloadDetail],
 //    })
 //   }
 //  }
 // }

 // ElMessage.success('保存成功')
}

onMounted(() => {
 getDataList()
})
</script>

<style lang="scss" scoped>
.title-view {
 margin-bottom: 16px;
 display: flex;
 justify-content: space-between;

 .el-divider--vertical {
  border-left: 3px solid #2877FF !important;
 }

 div:first-child {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 18px;
  color: #333333;
 }

 div:last-child {
  display: flex;
  justify-content: end;
 }
}

:deep(.el-form) {
 .el-form-item {
  margin-bottom: 16px;

  .el-select {
   width: 200px;
  }
 }
}

:deep(.el-table) {
 .el-table__header {
  thead tr th {
   background-color: #f7f8fa;
   color: #111a34;
  }
 }

 .el-table__body {
  tbody tr td {
   color: #40485d;
  }
 }
}
</style>