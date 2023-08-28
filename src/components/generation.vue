<script setup>
import { State } from '@/plugins/indexedDB'
import {computed, onBeforeUnmount, onMounted, ref} from "vue";

const pages = ref([])

const generationTextFilter = computed(() => {

  return pages.value
})
const progressBar = computed(()=>{
  return  Math.floor((lastGenerationString.value / length.value) * 100);
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
function generateString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = ''
  for (let i = 0; i < 100; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result
}
async function generateRandomString() {
    let result = '';
    loading.value = true
    let arrStrings = []
    let page = 1
    let string = lastGenerationString.value;
    do {
        try {
            if(pause.value || (!isLoading.value && !pause.value && !pages.value.length)) {
                loading.value = false
                return

            }
            lastGenerationString.value = string
            result = generateString()
            if(arrStrings.length >= 1000){
                await db.set(string, arrStrings)
                pages.value.push(arrStrings)
                page++
                arrStrings = []
            }
            arrStrings.push({page: page, index: string + 1,string:result})

            result = ''
            if(string == length.value) {
                loading.value = false
                pause.value = false
            }
        } catch(e) {
            alert(e)
        }
    } while(string++ < length.value)
}
const getAll = async (firstLoad = false) => {
    try {
        const data = await db.getAll()
        pages.value = data
        let lastPage = data[data.length - 1] || []
        lastGenerationString.value = !lastPage.length ? 0 : lastPage[lastPage.length - 1].index
        if(firstLoad && !pause.value && lastGenerationString.value){
            generateRandomString()
        }
    } catch (e) {
        alert(e)
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
        <v-divider></v-divider>
        прошло время: {{ timer }}
        <br>
        Строк сгенерированно: <strong>{{ lastGenerationString }}</strong> из <strong>{{ length }}</strong> <br><br>
        <span>Страниц: {{ pages.length }}</span>
      </v-card>
      <div class="d-flex flex-column gap-8">
        <v-btn v-if="!loading && !pause" @click="generateRandomString()" block variant="flat" color="success">Сгенерировать</v-btn>
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
