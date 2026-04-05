<template>
  <div class="container">
    <el-card class="card" shadow="hover">
      <template #header>
        <div class="card-header">Vue 3 + Element Plus 基础项目</div>
      </template>
      <p>项目已成功初始化 🎉</p>
      <el-button type="primary">Element Plus 按钮</el-button>
    </el-card>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f5f7fa;
}

.card {
  width: min(90vw, 480px);
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}
</style>
