<script setup>
import { State } from '@/plugins/indexedDB'
import {computed, ref} from "vue";

const pages = ref([])

const generationTextFilter = computed(() => {

  return pages.value
})
const progressBar = computed(()=>{
  return  Math.floor((pages.value.length * 100 / length.value) * 100);
})

const allPages = computed(()=> {
  return pages.value.length
})
const pause = computed({
    get: () => stop.value,
    set: (newVal) => {
      stop.value = newVal
      localStorage.setItem('pause', newVal)
    }
})
const loading = computed({
    get: () => isLoading.value,
    set: (newVal) => {
        isLoading.value = newVal
        localStorage.setItem('loading', newVal)
    }
})
const page = ref(JSON.parse(localStorage.getItem('page')))
const setPage = computed({
    get: () => page.value,
    set: (newVal) => {
        page.value = newVal
        localStorage.setItem('page', newVal)
    }
})

const isLoading = ref(JSON.parse(localStorage.getItem('loading'))),
      db = new State(),
      length = ref(10000000),
      lastGenerationString = ref(0),
      stop = ref(JSON.parse(localStorage.getItem('pause'))),
      search = ref('')
const reset = async () => {
    lastGenerationString.value = 0
    pause.value = false
    loading.value = false
    pages.value = []
    setPage.value = 1
    await db.deleteAll()
}

async function generateRandomString() {
    let result = '';
    loading.value = true
    const stringLength = 100
    let arrPages = []
    let page = 1
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let string = lastGenerationString.value;
    do {
          if(pause.value || !isLoading.value && !pause.value  && !pages.value.length) {
              lastGenerationString.value = string
              loading.value = false
              break;
          }
          for (let i = 0; i < stringLength; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          await db.set(string, result)
          if(arrPages.length >= 100){
              pages.value.push(arrPages)
              page++
              arrPages = []
          }
          arrPages.push({page: page, index: string + 1,string:result})


          result = ''
          if(string == length.value) {
              loading.value = false
              pause.value = false
          }

    } while(string++ < length.value)
    // for (let string = lastGenerationString.value; string < length.value; string++) {
    //     if(pause.value || !isLoading.value && !pause.value  && !pages.value.length) {
    //         lastGenerationString.value = string
    //         loading.value = false
    //         break;
    //     }
    //     for (let i = 0; i < stringLength; i++) {
    //       result += characters.charAt(Math.floor(Math.random() * characters.length));
    //     }
    //     await db.set(string, result)
    //     if(arrPages.length >= 100){
    //         pages.value.push(arrPages)
    //         page++
    //         arrPages = []
    //     }
    //     arrPages.push({page: page, index: string + 1,string:result})
    //
    //
    //     result = ''
    //     if(string == length.value) {
    //         loading.value = false
    //         pause.value = false
    //     }
    //   }
}
const getAll = async (firstLoad = false) => {
    const data = await db.getAll()
    let arrPages = []
    let page = 1
    if(firstLoad) {
        for(let i = 0; i < data.length; i++) {
            if(arrPages.length >= 100){
                pages.value.push(arrPages)
                page++
                arrPages = []
            }
            arrPages.push({page:page, index: i + 1,string:data[i]})

        }
    }
    lastGenerationString.value = !data.length ? data.length : data.length - 1
    if(firstLoad && !pause.value && lastGenerationString.value){
        generateRandomString()
    }
}

getAll(true)

</script>

<template>
  <v-row >
    <v-col cols="2">
      <v-card rounded class="text-center py-10 mb-10">
        <v-card-title class="mb-10">Прогресс генерации</v-card-title>
        <v-progress-circular
          class="mb-5"
          :rotate="360"
          :size="100"
          :width="15"
          :model-value="progressBar"
          color="primary"
        >
          {{ progressBar }}
        </v-progress-circular>
      </v-card>
      <div class="d-flex flex-column gap-8">
        {{lastGenerationString}} {{ pages.length}} {{pause}}
        <v-btn v-if="!loading && !pause " @click="generateRandomString()" block variant="flat" color="success">Сгенерировать</v-btn>
        <v-btn v-else-if="pause === false" @click="pause = true; getAll();" variant="flat" color="red">Пауза</v-btn>
        <v-btn v-else @click="pause = false; generateRandomString()" variant="flat" color="success">Продолжить</v-btn>
        <v-btn @click="reset" block variant="flat" color="primary">Сбросить</v-btn>
      </div>
    </v-col>

    <v-divider vertical></v-divider>
    <v-col>
        <v-text-field
            density="compact"
            v-model="search"
            variant="outlined"
            clearable
            label="Поиск"
            append-inner-icon="mdi-magnify"

            hide-details
        ></v-text-field>
        <v-pagination
          v-model="setPage"
          :length="allPages"
        ></v-pagination>
        <div class="d-flex flex-column-reverse flex-wrap gap-8 pt-8">
            <v-sheet
                v-for="item in generationTextFilter[page - 1]"
                border="md" rounded="lg"
                color="blue-lighten-5"
                class="pa-6"
            >
        <span class="mb-8">
          <v-card-title>{{item.page}}</v-card-title>{{item.index}} {{item.string}} {{item.string.length}}
        </span>
            </v-sheet>
        </div>

    </v-col>
  </v-row>
</template>

<style scoped>

</style>
