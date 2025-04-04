<script setup>
  import InputText from 'primevue/inputtext'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import Splitter from 'primevue/splitter'
  import SplitterPanel from 'primevue/splitterpanel'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import CodeEditor from '../components/code-editor.vue'
  import CodePreview from '../components/code-preview.vue'
  import SelectButton from 'primevue/selectbutton'
  import { useField } from 'vee-validate'
  import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

  defineProps(['previewData', 'lang'])
  const emit = defineEmits(['update:previewData', 'update:lang', 'update:name'])

  const SPLITTER_PROPS = {
    height: '50vh',
    layout: 'horizontal',
    panelsSizes: [66, 34]
  }
  const ARGS_INITIAL_STATE = '{}'

  const previewState = ref(true)
  const showPreview = computed(() => {
    return previewState.value && language.value !== 'lua'
  })

  const viewOptions = ref([
    { name: 'Form', value: 'form' },
    { name: 'JSON', value: 'json' }
  ])
  const selectedView = ref('form')
  const isMobile = ref(false)

  const checkScreenSize = () => {
    isMobile.value = window.innerWidth < 768 // md breakpoint do Tailwind
  }

  onMounted(() => {
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    updateGroupsFromJson(args.value)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkScreenSize)
  })

  const { value: name } = useField('name')

  const { value: isProprietaryCode } = useField('isProprietaryCode')
  const { value: args, errorMessage: argsError } = useField('args')
  const { value: code, errorMessage: codeError } = useField('code')
  const { value: language } = useField('language')

  // Estado reativo para os grupos
  const groupsState = ref({})

  let initialCodeValue = ''
  let initialJsonArgsValue = ARGS_INITIAL_STATE
  const unwatch = watch(name, () => {
    initialCodeValue = code.value
    initialJsonArgsValue = args.value

    emit('update:name', name.value)

    if (initialCodeValue) {
      unwatch()
    }
  })

  const languageLabel = computed(() => {
    const languageLabels = {
      javascript: 'JavaScript',
      lua: 'Lua'
    }

    emit('update:lang', language.value)
    return languageLabels[language.value]
  })

  const hasCodeError = computed(() => {
    return !!codeError.value
  })

  const hasArgsError = computed(() => {
    return !!argsError.value
  })

  const updateObject = computed(() => {
    const previewValues = {
      code: code.value,
      args: args.value
    }
    emit('update:previewData', previewValues)
    return previewValues
  })

  // Função para atualizar o estado dos grupos baseado no JSON
  const updateGroupsFromJson = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString || ARGS_INITIAL_STATE)
      const groups = {}

      const extractGroups = (obj, currentPath = []) => {
        Object.keys(obj).forEach((key) => {
          const value = obj[key]
          const newPath = [...currentPath, key]

          if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (
              Object.keys(value).some(
                (subKey) => typeof value[subKey] === 'object' && !Array.isArray(value[subKey])
              )
            ) {
              extractGroups(value, newPath)
            } else {
              const groupName = newPath[newPath.length - 1]
              if (!groups[groupName]) {
                groups[groupName] = {}
              }
              Object.keys(value).forEach((subKey) => {
                groups[groupName][subKey] = value[subKey]
              })
            }
          }
        })
      }

      extractGroups(parsed)
      groupsState.value = groups
    } catch (error) {
      // Silently handle parsing errors
    }
  }

  // Watch para atualizar o estado dos grupos quando o JSON mudar
  watch(
    args,
    (newValue) => {
      updateGroupsFromJson(newValue)
    },
    { immediate: true }
  )

  // Função para atualizar o JSON baseado no estado dos grupos
  const updateJsonFromGroups = () => {
    try {
      const currentJson = JSON.parse(args.value || ARGS_INITIAL_STATE)
      const updatedJson = { ...currentJson }

      Object.keys(groupsState.value).forEach((groupName) => {
        const groupPath = ['param', groupName]
        let current = updatedJson
        for (let index = 0; index < groupPath.length - 1; index++) {
          current = current[groupPath[index]]
        }
        current[groupPath[groupPath.length - 1]] = groupsState.value[groupName]
      })

      return JSON.stringify(updatedJson, null, 2)
    } catch (error) {
      // Silently handle parsing errors
      return args.value
    }
  }

  // Watch para atualizar o JSON quando os grupos mudarem
  watch(
    groupsState,
    () => {
      const newJson = updateJsonFromGroups()
      if (newJson !== args.value) {
        args.value = newJson
      }
    },
    { deep: true }
  )

  // Função para lidar com mudanças no editor
  const handleEditorChange = (value) => {
    updateGroupsFromJson(value)
  }

  const formatLabel = (text) => {
    return text
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatGroupTitle = (text) => {
    return text
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const initiatorTypeOptions = [
    {
      title: 'Edge Application',
      subtitle: 'Functions are executed at the edge to reduce latency and enhance performance.',
      inputValue: 'edge_application'
    },
    {
      title: 'Edge Firewall',
      subtitle: 'Functions are executed by a firewall to apply security policies.',
      inputValue: 'edge_firewall'
    }
  ]
</script>

<template>
  <TabView class="w-full">
    <TabPanel header="Main Settings">
      <FormHorizontal
        class="mt-8"
        title="General"
        description="Edit an edge function that runs closer to users to use with Edge Application or Edge Firewall."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <FieldText
              label="Name"
              required
              name="name"
              placeholder="My function"
              :value="name"
              description="Give a unique and descriptive name to identify the function."
            />
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        class="mt-8"
        title="Language"
        description="The language the edge function is written in."
      >
        <template #inputs>
          <div class="flex flex-col w-full sm:max-w-lg gap-2">
            <label
              for="language"
              class="text-color text-base font-medium"
              >Language</label
            >
            <span class="p-input-icon-right">
              <i class="pi pi-lock text-[var(--text-color-secondary)]" />
              <InputText
                v-model="languageLabel"
                id="language"
                type="text"
                class="w-full text-[var(--text-color-secondary)]"
                readonly
              />
            </span>
            <small class="text-xs text-color-secondary font-normal leading-5">
              Language isn't an editable field.</small
            >
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        class="mt-8"
        title="Initiator Type"
        description="Define the source or trigger that executes the edge function."
      >
        <template #inputs>
          <div class="flex flex-col w-full gap-2">
            <FieldGroupRadio
              required
              nameField="initiatorType"
              isCard
              :options="initiatorTypeOptions"
            />
          </div>
        </template>
      </FormHorizontal>

      <FormHorizontal
        class="mt-8"
        title="Status"
      >
        <template #inputs>
          <div class="flex w-full sm:max-w-lg gap-2">
            <FieldSwitchBlock
              nameField="active"
              name="active"
              auto
              :isCard="false"
              title="Active"
            />
          </div>
        </template>
      </FormHorizontal>
    </TabPanel>

    <TabPanel header="Code">
      <Splitter
        :style="{ height: SPLITTER_PROPS.height }"
        class="mt-8 surface-border border rounded-md hidden md:flex"
        @resizestart="previewState = false"
        @resizeend="previewState = true"
        :layout="SPLITTER_PROPS.layout"
      >
        <SplitterPanel
          :size="SPLITTER_PROPS.panelsSizes[0]"
          class="flex flex-col h-full gap-2"
        >
          <CodeEditor
            v-model="code"
            :initialValue="initialCodeValue"
            :language="language"
            :errors="hasCodeError"
            :readOnly="isProprietaryCode"
          />
          <small
            v-if="codeError"
            class="p-error text-xs font-normal"
          >
            {{ codeError }}
          </small>
        </SplitterPanel>

        <SplitterPanel
          v-if="showPreview"
          :size="SPLITTER_PROPS.panelsSizes[1]"
        >
          <CodePreview :updateObject="updateObject" />
        </SplitterPanel>
      </Splitter>

      <div class="flex flex-col mt-8 surface-border border rounded-md gap-2 md:hidden h-[50vh]">
        <CodeEditor
          v-model="code"
          :initialValue="initialCodeValue"
          :language="language"
          :errors="hasCodeError"
        />
        <small
          v-if="codeError"
          class="p-error text-xs font-normal"
        >
          {{ codeError }}
        </small>
      </div>
    </TabPanel>

    <TabPanel header="Arguments">
      <div class="flex flex-col md:flex-row mt-8 md:gap-8">
        <div class="md:hidden mb-4 w-full flex justify-start">
          <SelectButton
            v-model="selectedView"
            :options="viewOptions"
            optionLabel="name"
            optionValue="value"
          />
        </div>

        <div
          class="w-full md:w-3/4 h-[50vh]"
          :class="{ hidden: isMobile && selectedView !== 'json' }"
        >
          <CodeEditor
            v-model="args"
            :initialValue="initialJsonArgsValue"
            language="json"
            :errors="hasArgsError"
            @update:modelValue="handleEditorChange"
          />
        </div>

        <div
          class="flex flex-col gap-6 w-full md:w-3/6 md:h-[50vh] md:overflow-y-scroll"
          :class="{ hidden: isMobile && selectedView !== 'form' }"
        >
          <div class="border surface-border rounded-md p-6 md:p-8">
            <template
              v-for="(group, groupName) in groupsState"
              :key="groupName"
            >
              <div class="flex flex-col gap-5 md:gap-10 w-full">
                <div class="flex flex-col gap-2">
                  <h3 class="text-lg font-semibold">{{ formatGroupTitle(groupName) }}</h3>
                  <p class="text-sm text-color-secondary">
                    {{ `Configure the ${formatGroupTitle(groupName)} parameters.` }}
                  </p>
                </div>
                <div class="flex flex-col gap-6 w-full mb-10">
                  <div
                    v-for="(value, key) in group"
                    :key="key"
                    class="flex flex-col gap-2 w-full"
                  >
                    <FieldText
                      :label="formatLabel(key)"
                      :name="`arg_${groupName}_${key}`"
                      v-model="groupsState[groupName][key]"
                      :value="groupsState[groupName][key]"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </TabPanel>
  </TabView>
</template>
