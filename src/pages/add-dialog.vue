<template>
 <div class="exceptionTypeForm" v-if="dialogVisible">
  <el-scrollbar scroll-y style="background-color: #ffffff;padding-bottom: 70px;">
   <div class="drawerItem">
    <div class="drawTitle">异常类型配置</div>
   </div>

   <!-- 异常配置表格 -->
   <div class="drawerItem">
    <el-table :data="editableRows" border :span-method="tableSpanMethod" row-key="detailId">
     <el-table-column label="上报节点">
      <template #default="scope">
       <el-select v-model="scope.row.nodeRef.exceptionNodeCode" placeholder="请选择" filterable style="width: 100%"
        @change="handleNodeChange(scope.row.nodeId, $event)">
        <el-option v-for="item in props.nodeOptions" :key="item" :label="item.label" :value="item.value" />
       </el-select>
      </template>
     </el-table-column>

     <el-table-column label="异常类型">
      <template #default="scope">
       <div class="cell-editor">
        <el-input v-model="scope.row.detail.exceptionTypeName" maxlength="10" show-word-limit
         @focus="handleExceptionTypeFocus(scope.row.nodeId, scope.row.detailIndex)"
         @input="handleExceptionTypeInput(scope.row.nodeId, scope.row.detailIndex, $event)"
         placeholder="最多10字" />
        <el-button class="table-btn" v-if="dialogMode === 'add' && scope.row.detailIndex === 0" circle type="primary" plain
         @click="addDetailRow(scope.row.nodeId, scope.row.detailIndex, 'type')">+</el-button>
        <el-button class="table-btn" v-if="dialogMode === 'add' && canRemoveTypeGroup(scope.row.nodeId, scope.row.detailIndex)" circle type="danger" plain
         @click="removeTypeGroup(scope.row.nodeId, scope.row.detailIndex)">
         -
        </el-button>
       </div>
      </template>
     </el-table-column>

     <el-table-column label="异常原因">
      <template #default="scope">
       <div class="cell-editor">
        <el-input v-model="scope.row.detail.exceptionReason" maxlength="15" show-word-limit
         placeholder="最多15字" />
        <el-button class="table-btn" v-if="dialogMode === 'add' && getTypeGroupRange(scope.row.nodeRef, scope.row.detailIndex).startIndex === scope.row.detailIndex" circle type="primary" plain
         @click="addDetailRow(scope.row.nodeId, scope.row.detailIndex, 'reason')">+</el-button>
        <el-button class="table-btn" v-if="dialogMode === 'add' && canRemoveReasonRow(scope.row.nodeId)" circle type="danger" plain
         @click="removeReasonRow(scope.row.nodeId, scope.row.detailIndex)">
         -
        </el-button>
       </div>
      </template>
     </el-table-column>

     <el-table-column label="异常处理角色">
      <template #default="scope">
       <el-select v-model="scope.row.detail.exceptionHandleUser" multiple collapse-tags collapse-tags-tooltip
        :max-collapse-tags="3" placeholder="请选择" style="width: 100%">
        <el-option v-for="item in props.roleOptions" :key="item.value" :label="item.label"
         :value="item.value" />
       </el-select>
      </template>
     </el-table-column>
    </el-table>
    <div v-if="dialogMode === 'add'" class="toolbar-row" @click="addNode">
     <el-icon class="icon">
      <CirclePlus />
     </el-icon>
     <span>新增上报节点</span>
    </div>
   </div>
  </el-scrollbar>

  <div class="footer">
   <el-button @click="dialogVisible = false" size="large">
    <span class="footerBtn">取消</span>
   </el-button>
   <el-button type="primary" @click="onSubmit" size="large" :disabled="refreshLoading" :loading="refreshLoading">
    <span class="footerBtn">提交</span>
   </el-button>
  </div>
 </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { addObj, updateObj } from '/@/api/scs/exceptionType'

const props = defineProps({
 nodeOptions: {
  type: Array as any,
  default: () => {
   return [];
  },
 },
 roleOptions: {
  type: Array as any,
  default: () => {
   return [];
  },
 },
})

const emit = defineEmits(['refresh'])

let nodeIdSeed = 100;
let detailIdSeed = 1000;
let typeGroupSeed = 1000;
const refreshLoading = ref(false)
const dialogVisible = ref(false);
const dialogMode = ref('add');
const editingNodeId = ref<number | null>(null);
const editingDetailId = ref<number | null>(null);
const editingData = ref<any[]>([]);
const editingTypeGroup = ref<any>(null);

const createDetail = () => ({
 id: ++detailIdSeed,
 _typeGroupKey: ++typeGroupSeed,
 exceptionTypeName: '',
 exceptionReason: '',
 exceptionHandleUser: [],
});

const createEmptyNode = () => ({
 id: ++nodeIdSeed,
 exceptionNodeCode: '',
 exceptionNodeName: '',
 details: [createDetail()],
});

const cloneNode = (node: any) => {
 let currentTypeGroupKey = ++typeGroupSeed;
 let previousTypeName: any = null;

 return {
  ...node,
  details: node.details.map((detail: any, index: number) => {
   if (index === 0) {
    previousTypeName = detail.exceptionTypeName;
   } else if (detail.exceptionTypeName !== previousTypeName) {
    currentTypeGroupKey = ++typeGroupSeed;
    previousTypeName = detail.exceptionTypeName;
   }

   return {
    ...detail,
    _typeGroupKey: currentTypeGroupKey,
    exceptionHandleUser: [...detail.exceptionHandleUser],
   }
  }),
 }
};

const open = (payload: any = {}) => {
 dialogMode.value = payload.mode ?? 'add';
 editingNodeId.value = payload.nodeId ?? null;
 editingDetailId.value = payload.detailId ?? null;
 editingData.value = payload.data?.length
  ? payload.data.map(item => {
   const clonedNode = cloneNode(item)
   if (!clonedNode.exceptionNodeName && clonedNode.exceptionNodeCode) {
    const selectedOption = props.nodeOptions.find((option: any) => option.value === clonedNode.exceptionNodeCode)
    clonedNode.exceptionNodeName = selectedOption?.label || ''
   }
   return clonedNode
  })
  : [createEmptyNode()];
 dialogVisible.value = true;
};

const handleNodeChange = (nodeId: number, nodeValue: string) => {
 if (!nodeValue) return;
 const current = editingData.value.find(item => item.id === nodeId);
 const existed = editingData.value.find(item => item.id !== nodeId && item.exceptionNodeCode === nodeValue);

 // 从 nodeOptions 中获取节点名称
 const selectedOption = props.nodeOptions.find((item: any) => item.value === nodeValue);
 if (current) {
  current.exceptionNodeName = selectedOption?.label || '';
 }

 if (!current || !existed) return;

 existed.details.push(...current.details);
 editingData.value = editingData.value.filter(item => item.id !== nodeId);
};

const addDetailRow = (nodeId: number, detailIndex: number, flag: string) => {
 const target = editingData.value.find(item => item.id === nodeId);
 if (!target) return;
 if (flag == 'reason') {
  // 点击异常原因的+，新增到当前异常类型组的末尾
  const prevDetail = target.details[detailIndex];
  if (prevDetail) {
   const { endIndex } = getTypeGroupRange(target, detailIndex);
   const newDetail = createDetail();
   newDetail.exceptionTypeName = prevDetail.exceptionTypeName;
   newDetail._typeGroupKey = prevDetail._typeGroupKey;
   target.details.splice(endIndex + 1, 0, newDetail)
   return;
  }
 } else {
  target.details.push(createDetail())
 }
};

const addNode = () => {
 editingData.value.push(createEmptyNode());
};

// 获取当前明细所属的类型组范围
const getTypeGroupRange = (node: any, detailIndex: number) => {
 const details = node.details;
 const targetTypeGroupKey = details[detailIndex]._typeGroupKey;
 let start = detailIndex;
 let end = detailIndex;
 while (start > 0 && details[start - 1]._typeGroupKey === targetTypeGroupKey) start--;
 while (end < details.length - 1 && details[end + 1]._typeGroupKey === targetTypeGroupKey) end++;
 return { startIndex: start, endIndex: end, count: end - start + 1 };
};

// 删除整个异常类型组
const removeTypeGroup = (nodeId: number, detailIndex: number) => {
 const targetNode = editingData.value.find(item => item.id === nodeId);
 if (!targetNode) return;
 const { startIndex, count } = getTypeGroupRange(targetNode, detailIndex);
 const remainingCount = targetNode.details.length - count;
 if (remainingCount === 0 && editingData.value.length === 1) {
  ElMessage.warning('每个节点至少保留一个异常类型');
  return;
 }
 targetNode.details.splice(startIndex, count);
 // 如果节点details为空，则删除整个节点（可选）
 if (targetNode.details.length === 0) {
  editingData.value = editingData.value.filter(item => item.id !== nodeId);
 }
};

// 判断能否删除整个类型组
const canRemoveTypeGroup = (nodeId: number, detailIndex: number) => {
 const targetNode = editingData.value.find(item => item.id === nodeId);
 if (!targetNode) return false;
 const { count } = getTypeGroupRange(targetNode, detailIndex);
 if (targetNode.details.length > count) return true;
 return editingData.value.length > 1;
};

// 删除单个异常原因
const removeReasonRow = (nodeId: number, detailIndex: number) => {
 const targetNode = editingData.value.find(item => item.id === nodeId);
 if (!targetNode) return;
 const details = targetNode.details;
 if (details.length === 1) {
  if (editingData.value.length === 1) {
   ElMessage.warning('至少保留一个上报节点');
   return;
  }
  editingData.value = editingData.value.filter(item => item.id !== nodeId);
  return;
 }
 details.splice(detailIndex, 1);
};

// 判断能否删除单个原因
const canRemoveReasonRow = (nodeId: number) => {
 const targetNode = editingData.value.find(item => item.id === nodeId);
 if (!targetNode) return false;
 if (editingData.value.length === 1 && targetNode.details.length === 1) return false;
 return true;
};

// 在指定类型组下新增一个原因行（同类型）
const addReasonToType = (nodeId: number, detailIndex: number) => {
 const targetNode = editingData.value.find(item => item.id === nodeId);
 if (!targetNode) return;
 const { endIndex } = getTypeGroupRange(targetNode, detailIndex);
 const newDetail = createDetail();
 // 复制当前行的异常类型名称
 const currentType = targetNode.details[detailIndex].exceptionTypeName;
 newDetail.exceptionTypeName = currentType;
 targetNode.details.splice(endIndex + 1, 0, newDetail);
};

// 在指定节点下新增一个全新的异常类型（带一个空原因行）
const addNewTypeToNode = (nodeId: number) => {
 const targetNode = editingData.value.find(item => item.id === nodeId);
 if (!targetNode) return;
 const newDetail = createDetail();
 // 插入到该节点所有明细的末尾（或当前行之后，根据喜好）
 targetNode.details.push(newDetail);
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

const getTypeGroupRangeByName = (node: any, detailIndex: number, typeName: string) => {
 const details = node.details;
 const targetTypeGroupKey = details[detailIndex]._typeGroupKey;
 let start = detailIndex;
 let end = detailIndex;
 while (start > 0 && details[start - 1]._typeGroupKey === targetTypeGroupKey) start--;
 while (end < details.length - 1 && details[end + 1]._typeGroupKey === targetTypeGroupKey) end++;
 return { startIndex: start, endIndex: end };
};

const handleExceptionTypeFocus = (nodeId: number, detailIndex: number) => {
 const targetNode = editingData.value.find(item => item.id === nodeId);
 if (!targetNode) return;
 const { count } = getTypeGroupRange(targetNode, detailIndex);
 const currentTypeName = targetNode.details[detailIndex]?.exceptionTypeName ?? '';
 editingTypeGroup.value = {
  nodeId,
  detailIndex,
  originalTypeName: currentTypeName,
  syncEnabled: count > 1,
 };
};

const handleExceptionTypeInput = (nodeId: number, detailIndex: number, value: string) => {
 const targetNode = editingData.value.find(item => item.id === nodeId);
 if (!targetNode) return;

 const currentGroup = editingTypeGroup.value;
 const syncEnabled = Boolean(
  currentGroup &&
   currentGroup.nodeId === nodeId &&
   currentGroup.detailIndex === detailIndex &&
   currentGroup.syncEnabled,
 );
 const originalTypeName =
  currentGroup && currentGroup.nodeId === nodeId && currentGroup.detailIndex === detailIndex
   ? currentGroup.originalTypeName
   : targetNode.details[detailIndex]?.exceptionTypeName;

 if (syncEnabled) {
  const { startIndex, endIndex } = getTypeGroupRangeByName(targetNode, detailIndex, originalTypeName);
  for (let index = startIndex; index <= endIndex; index++) {
   targetNode.details[index].exceptionTypeName = value;
  }
 }

 editingTypeGroup.value = {
  nodeId,
  detailIndex,
  originalTypeName: value,
  syncEnabled,
 };
};

const editableRows = computed<any[]>(() => {
 const rows: any[] = [];
 editingData.value.forEach(node => {
  node.details.forEach((detail: any, detailIndex: any) => {
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

// const tableSpanMethod = ({ row, columnIndex }: { row: any; columnIndex: number }) => {
//  if (columnIndex === 0) {
//   return {
//    rowspan: row.rowSpan,
//    colspan: row.rowSpan > 0 ? 1 : 0,
//   };
//  }
//  return { rowspan: 1, colspan: 1 };
// };

// 计算属性：为每一行预计算异常类型列的 rowspan 和是否隐藏
const exceptionTypeSpanInfo = computed(() => {
 const rows = editableRows.value;
 const len = rows.length;
 const spans = new Array(len).fill(1); // 默认每行 rowspan = 1
 const hidden = new Array(len).fill(false); // 默认不隐藏

 for (let i = 0; i < len;) {
  const currentNodeId = rows[i].nodeId;
  const currentTypeGroupKey = rows[i].detail._typeGroupKey;
  const currentType = rows[i].detail.exceptionTypeName;

  // 只有异常类型非空且相同时才进行合并

  let span = 1;

  // 查找连续相同节点和异常类型的行数
  while (i + span < len) {
   const next = rows[i + span];
   if (next.nodeId === currentNodeId && next.detail._typeGroupKey === currentTypeGroupKey) {
    span++;
   } else {
    break;
   }
  }

  // 设置组内第一行的 rowspan，其余行标记为隐藏
  spans[i] = span;
  for (let j = 1; j < span; j++) {
   spans[i + j] = 0;
   hidden[i + j] = true;
  }

  i += span;
 }

 return { spans, hidden };
});

const tableSpanMethod = ({ row, columnIndex, rowIndex }: { row: any; columnIndex: number; rowIndex: number }) => {
 // 第一列（上报节点）：沿用原有逻辑
 if (columnIndex === 0) {
  return {
   rowspan: row.rowSpan,
   colspan: row.rowSpan > 0 ? 1 : 0,
  };
 }

 // 第二列（异常类型）：使用预计算数据
 if (columnIndex === 1) {
  const { spans, hidden } = exceptionTypeSpanInfo.value;
  const span = spans[rowIndex] ?? 1;
  return {
   rowspan: span,
   colspan: span > 0 ? 1 : 0,
  };
 }

 // 其他列
 return { rowspan: 1, colspan: 1 };
};

const onSubmit = async () => {
 console.log(editingData.value, 'editingData.value');
 if (!editingData.value.length) {
  ElMessage.warning('请至少保留一条上报节点配置');
  return;
 }

 const invalidNode = editingData.value.find(item => !item.exceptionNodeCode);
 if (invalidNode) {
  ElMessage.warning('请选择上报节点');
  return;
 }

 const invalidRole = editingData.value.find(item => item.details.some(detail => !detail.exceptionHandleUser.length));
 if (invalidRole) {
  ElMessage.warning('请至少选择一个异常处理角色');
  return;
 }

 const invalidDetail = editingData.value.find(item => item.details.some(detail => !detail.exceptionTypeName.trim() || !detail.exceptionReason.trim()));
 if (invalidDetail) {
  ElMessage.warning('异常类型和异常原因不能为空');
  return;
 }

 // return
 // 数据格式转换
 // const transformedData = editingData.value.map(node => ({
 //  exceptionNodeCode: node.exceptionNodeCode,
 //  exceptionNodeName: node.exceptionNodeName,
 //  exceptionTypeDTOS: node.details.map(detail => ({
 //   exceptionTypeName: detail.exceptionTypeName,
 //   exceptionReasonList: [{
 //    exceptionReason: detail.exceptionReason,
 //    exceptionHandleUser: detail.exceptionHandleUser
 //   }]
 //  }))
 // }));
 // 数据格式转换：将扁平 details 按相同节点和异常类型分组
 const transformedData = editingData.value.map(node => {
  // 按异常类型分组，并保持原有顺序
  const typeGroupMap = new Map<any, any>();
  const typeGroupOrder: any[] = [];

  node.details.forEach(detail => {
   const typeGroupKey = detail._typeGroupKey;
   if (!typeGroupMap.has(typeGroupKey)) {
    typeGroupMap.set(typeGroupKey, {
     exceptionTypeName: detail.exceptionTypeName,
     exceptionReasonList: [],
    });
    typeGroupOrder.push(typeGroupKey);
   }
   typeGroupMap.get(typeGroupKey).exceptionReasonList.push({
    exceptionReason: detail.exceptionReason,
    exceptionHandleUser: detail.exceptionHandleUser,
   });
  });

  // 构建 exceptionTypeDTOS，并保留类型顺序（按首次出现顺序）
  const exceptionTypeDTOS = typeGroupOrder.map((typeGroupKey) => typeGroupMap.get(typeGroupKey));

  return {
   exceptionNodeCode: node.exceptionNodeCode,
   exceptionNodeName: node.exceptionNodeName,
   exceptionTypeDTOS,
  };
 });

 refreshLoading.value = true
 try {
  let res: any
  if (dialogMode.value == 'add') {
    console.log(transformedData,'新增传参');
    return
   res = await addObj(transformedData)
  } else {
   // 编辑模式：按当前异常类型组聚合，避免把同一类型组拆散
   const updateData = editingData.value.map(node => {
    const typeGroupMap = new Map<any, any>();
    const typeGroupOrder: any[] = [];

    node.details.forEach(detail => {
     const typeGroupKey = detail._typeGroupKey;
     if (!typeGroupMap.has(typeGroupKey)) {
      typeGroupMap.set(typeGroupKey, {
       id: editingDetailId.value,
       exceptionTypeName: detail.exceptionTypeName,
       exceptionReasonList: [],
      });
      typeGroupOrder.push(typeGroupKey);
     }

     typeGroupMap.get(typeGroupKey).exceptionReasonList.push({
      id: detail.reasonId,
      exceptionReason: detail.exceptionReason,
      exceptionHandleUser: detail.exceptionHandleUser
     });
    });

    return {
     id: editingNodeId.value,
     exceptionNodeCode: node.exceptionNodeCode,
     exceptionNodeName: node.exceptionNodeName,
     exceptionTypeDTOS: typeGroupOrder.map((typeGroupKey) => typeGroupMap.get(typeGroupKey))
    }
   })
   console.log(updateData[0],'修改传参');
   
return
   res = await updateObj(updateData[0])
  }

  if (res.code == 0) {
   ElMessage.success('保存成功')
   emit('refresh')
   dialogVisible.value = false
  } else {
   ElMessage.error(res.message || '保存失败')
  }
 } catch (error) {
  ElMessage.error('保存失败')
 } finally {
  refreshLoading.value = false
 }

 return
};

// 暴露变量
defineExpose({
 open
});
</script>

<style lang="scss" scoped>
.cell-editor {
 display: flex;
 align-items: center;
 gap: 8px;

 .table-btn {
  margin: 0;
  padding: 0;
  width: 28px;
  height: 28px;
 }
}

.cell-editor :deep(.el-input) {
 flex: 1;
 min-width: 0;
}

.drawerItem {
 background: #fff;
 border-radius: 15px;
 overflow: hidden;
 padding: 15px;

 .drawTitle {
  border-left: #2877ff solid 3px;
  padding-left: 15px;
  margin-bottom: 15px;
  font-weight: 600;
  font-size: 16px;
  color: #333333;
  line-height: 22px;
 }
}

.exceptionTypeForm {
 display: flex;
 position: absolute;
 width: 100%;
 height: 100%;
 z-index: 999;
 padding-bottom: 80px;
 overflow: auto;
 top: 0;
 left: 0;
 right: 0;
 border-radius: 12px;
 padding: 10px 15px 15px 15px;
 flex-direction: column;
}

.reason-container {
 display: flex;
 gap: 4px;
 align-items: center;

 :deep(.el-input) {
  flex: 1;
 }

 .btn-add,
 .btn-delete {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;

  &:hover {
   color: #2877ff;
  }
 }

 .btn-delete {
  &:hover {
   color: #f56c6c;
  }
 }
}

.type-container {
 display: flex;
 gap: 4px;
 align-items: center;

 :deep(.el-input) {
  flex: 1;
 }

 .btn-add {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;

  &:hover {
   color: #2877ff;
  }
 }
}

.toolbar-row {
 width: 100%;
 display: flex;
 align-items: center;
 text-align: center;
 justify-content: center;
 border: 1px solid #ebeef5;
 border-top: 0;
 height: 49px;
 cursor: pointer;

 span {
  margin-left: 10px;
  font-size: 14px;
  color: #2877ff;
 }

 .icon {
  font-size: 21px;
  color: #2877ff;
 }
}

.add-node-btn {
 margin-top: 15px;
 text-align: center;

 :deep(.el-button) {
  color: #2877ff;
 }
}

.footer {
 position: absolute;
 width: 100%;
 height: 69px;
 box-shadow: 0px -2px 10px 0px rgba(32, 32, 35, 0.08);
 background: #ffffff;
 padding-left: 48px;
 padding-top: 17px;
 bottom: 0;
 left: 0;
 right: 0;
 z-index: 1000;
 padding: 10px 15px 15px 15px;

 .footerBtn {
  display: inline-block;
  padding: 0 10px;
 }
}
</style>
