<script setup>
import { State } from '@/plugins/indexedDB'
import {computed, ref} from "vue";

// eslint-disable-next-line no-unused-vars
const searchInput = ref(null)
const generationText = ref([])

const generationTextFilter = computed(() => {

  return search.value ? generationText.value.filter(item => item == search.value) : generationText.value
})
const progressBar = computed(()=>{
  return  Math.floor((generationText.value.length * 1000 / length.value) * 100);
})
const AllPages = computed(()=> {
  return generationText.value.length
})
const pause = computed({
    get: () => stop.value,
    set: (newVal) => {
      stop.value = newVal
      localStorage.setItem('pause', newVal)
    }
})

const isLoading = ref(false),
      db = new State(),
      length = ref(10000000),
      lastGenerationString = ref(0),
      stop = ref(Number(localStorage.getItem('pause'))),
      search = ref(''),
      page = ref(1)
const reset = async () => {
  await db.deleteAll()
  pause.value = 0
  isLoading.value = false
  generationText.value = []
  lastGenerationString.value = 0
}

async function generateRandomString() {
    let result = '';
    isLoading.value = true
    const stringLength = 100
    let arrPages = []
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let string = lastGenerationString.value; string < length.value; string++) {
        if(pause.value == 1 || !isLoading.value && pause.value != 1  && !generationText.value.length) {
            isLoading.value = false
            lastGenerationString.value = string
            break;
        }
        for (let i = 0; i < stringLength; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        await db.set(string, result)
        arrPages.push(await db.get(string, result))

        if(string === 10){
          await generationText.value.push(arrPages)
          arrPages.length = 0
        }

        result = ''
        if(string == length.value) {
          isLoading.value = false
        }
      }
}
const getAll = async (firstLoad = false) => {
    const data = await db.getAll()
    let arrPages = []
    if(firstLoad) {
        for(let i = 0; i < data.length; i++) {
            arrPages.push(data[i])
            if(i === 10){
                generationText.value.push(arrPages)
                arrPages.length = 0
            }
        }
    }
    lastGenerationString.value = !data.length ? data.length : data.length - 1
    console.log(generationText.value);
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
        {{lastGenerationString}} {{ generationText.length}}
        <v-btn v-if="!isLoading && pause != 1" @click="generateRandomString()" block variant="flat" color="success">Сгенерировать</v-btn>
        <v-btn v-else-if="pause === 0" @click="pause = 1; getAll();" variant="flat" color="red">Пауза</v-btn>
        <v-btn v-else @click="pause = 0; generateRandomString()" variant="flat" color="success">Продолжить</v-btn>
        <v-btn @click="reset" block variant="flat" color="primary">Сбросить</v-btn>
      </div>
    </v-col>

    <v-divider vertical>
    </v-divider>
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
          v-model="page"
          :length="AllPages"
        ></v-pagination>
        <div class="d-flex flex-column-reverse flex-wrap gap-8 pt-8">
            <v-sheet
                v-for="string in generationTextFilter[page - 1]"
                border="md" rounded="lg"
                color="blue-lighten-5"
                class="pa-6"
            >
        <span class="mb-8">
          {{string}}
        </span>
            </v-sheet>
        </div>

    </v-col>
  </v-row>
</template>

<style scoped>

</style>
