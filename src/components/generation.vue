<script setup>
import { State } from '@/plugins/indexedDB'
import {computed, onBeforeUnmount, onDeactivated, onMounted, ref} from "vue";
import {onBeforeRouteLeave, onBeforeRouteUpdate} from "vue-router";

const pages = ref({})

const generationTextFilter = computed(() => {

  // return pages.value.map(x=> x.filter(y=> {
  //     if(y?.string.toLowerCase().startsWith(search.value)){
  //       page.value = y.page
  //       return y
  //     }
  //   }
  // ))
  return pages.value
})


const progressBar = computed(()=>{
  return  Math.floor((lastGenerationString.value / length.value) * 100);
})
const allPages = ref(JSON.parse(localStorage.getItem('allPages')) || 0)
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
      if(newVal != page.value) {
        (async () => {
          let nextPage = await db.get(newVal)
          pages.value[newVal] = nextPage
        })()
      }
      console.log(pages.value)
      page.value = newVal
        localStorage.setItem('page', newVal)
    }
})

const isLoading = ref(JSON.parse(localStorage.getItem('loading'))),
      db = new State(),
      length = ref(10000000),
      lastGenerationString = ref(JSON.parse(localStorage.getItem('lastGenerationString'))),
      stop = ref(JSON.parse(localStorage.getItem('pause'))),
      search = ref('')

const reset = async () => {
    lastGenerationString.value = 0
    pause.value = false
    loading.value = false
    pages.value = {}
    localStorage.setItem('allPages', 0)
    allPages.value = 0
    localStorage.setItem('lastGenerationString', 0)
    lastGenerationString.value = 10000000
    lastGenerationString.value = 0
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
    localStorage.setItem('allPages', allPages.value)
    localStorage.setItem('lastGenerationString', lastGenerationString.value)
    for(lastGenerationString.value; lastGenerationString.value < length.value;) {
      try {
          lastGenerationString.value++
          if(lastGenerationString.value === length.value) {
              loading.value = false
              pause.value = false
              localStorage.setItem('allPages', allPages.value)
              localStorage.setItem('lastGenerationString', lastGenerationString.value)
          }
          result = generateString()
          arrStrings.push({index: lastGenerationString.value, string:result})
          if(arrStrings.length === 100) {
              allPages.value++
              await db.set(allPages.value, arrStrings)
              arrStrings = []
              if(!isLoading.value || pause.value) {
                  loading.value = false
                  return false
              }
          }
          if(lastGenerationString.value === 100) {
              pages.value[setPage.value] = await db.get(1)
          }
          result = ''
      } catch(e) {
        throw(e)
      }
    }
}
const getAll = async (firstLoad = false) => {
    try {
        let lastOpenPage = await db.get(setPage.value)
        if(lastOpenPage) {
          pages.value[setPage.value] = lastOpenPage
        }
        if(firstLoad && !pause.value && lastGenerationString.value){
            generateRandomString()
        }
    } catch (e) {
        throw(e)
    }

}
getAll(true)

onMounted(()=> {
    window.addEventListener("beforeunload", function() {
        localStorage.setItem('lastGenerationString', lastGenerationString.value)
        localStorage.setItem('allPages', allPages.value)
    });
})
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
          {{ progressBar }}%
        </v-progress-circular>
        <v-divider></v-divider>

        <br>
        Строк сгенерированно: <strong>{{ lastGenerationString }}</strong> из <strong>{{ length }}</strong> <br><br>
        <span>Страниц: {{ allPages }}</span>
      </v-card>
      <div class="d-flex flex-column gap-8">
        <v-btn v-if="!loading && !pause" @click="generateRandomString()" block variant="flat" color="success">Сгенерировать</v-btn>
        <v-btn v-else-if="pause === false" @click="pause = true; getAll();" variant="flat" color="red">Пауза</v-btn>
        <v-btn v-else @click="pause = false; generateRandomString()" variant="flat" color="success">Продолжить</v-btn>
        <v-btn @click="reset" block variant="flat" color="primary">Сбросить</v-btn>
      </div>
    </v-col>

    <v-divider vertical></v-divider>
    <v-col cols="10">
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
                    v-for="item in generationTextFilter[page]"
                    border="md" rounded="lg"
                    color="blue-lighten-5"
                    class="pa-6"
            >
                <span class="mb-8">
                  <v-card-title>{{item.page}}</v-card-title>{{item.index}} <span v-html="item.string"></span>
                </span>
            </v-sheet>
        </div>
    </v-col>
  </v-row>
</template>

<style scoped>

</style>
