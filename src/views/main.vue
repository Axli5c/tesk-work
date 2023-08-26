<template>
  <v-card>
    <v-layout>
      <v-navigation-drawer
        permanent
        location="right"
      >
        <template #prepend>
          <v-list-item
            lines="two"
            prepend-avatar="https://randomuser.me/api/portraits/men/1.jpg"
            title="Абоба Вьюшный"
            subtitle="тест тестов"
          ></v-list-item>
        </template>

        <v-divider></v-divider>

        <v-list >
          <v-list-item href="generation" prepend-icon="mdi-alarm-panel-outline" title="Генирация" value="home"></v-list-item>
          <v-list-item href="account" prepend-icon="mdi-account" title="Мой аккаунт" value="account"></v-list-item>

        </v-list>
      </v-navigation-drawer>
      <v-main >

        <v-container fluid>
          <router-view />
        </v-container>

      </v-main>
    </v-layout>
  </v-card>
</template>
<script setup>
</script>
