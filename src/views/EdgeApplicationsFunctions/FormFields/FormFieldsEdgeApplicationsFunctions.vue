<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import CodeEditor from '@/views/EdgeFunctions/components/code-editor.vue'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import PrimeButton from 'primevue/button'
  import Drawer from '@/views/EdgeFunctions/Drawer/index.vue'
  import SelectButton from 'primevue/selectbutton'

  import { useField } from 'vee-validate'
  import { computed, ref, watch, onMounted } from 'vue'

  const emit = defineEmits(['toggleDrawer'])
  const ARGS_INITIAL_STATE = '{}'

  const props = defineProps({
    listEdgeFunctionsService: {
      type: Function,
      required: true
    },
    loadEdgeFunctionService: {
      type: Function,
      required: true
    }
  })

  const drawerRef = ref('')
  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }

  const handleDrawerSuccess = (response) => {
    edgeFunctionID.value = response.functionId
  }

  const changeArgs = (target) => {
    if (target?.args) {
      args.value = target?.args
      updateGroupsFromJson(target.args)
    }
  }

  const listEdgeFunctionsServiceDecorator = (queryParams) => {
    return props.listEdgeFunctionsService({
      initiatorType: 'edge_application',
      ...queryParams
    })
  }

  const { value: name } = useField('name')
  const { value: edgeFunctionID } = useField('edgeFunctionID')
  const { value: args, errorMessage: argsError } = useField('args')

  const hasArgsError = computed(() => {
    return !!argsError.value
  })

  const viewOptions = ref([
    { name: 'JSON', value: 'json' },
    { name: 'Form', value: 'form' }
  ])
  const selectedView = ref('json')

  onMounted(() => {
    updateGroupsFromJson(args.value)
  })

  // Estado reativo para os grupos
  const groupsState = ref({})

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

  watch(
    () => drawerRef.value.showCreateDrawer,
    () => {
      emit('toggleDrawer', drawerRef.value.showCreateDrawer)
    }
  )
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="General"
    description="Instantiate a serverless function created with Edge Functions within the edge application. Use Rules Engine to activate the function."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="edge-application-function-instance-form__name-field"
          label="Name"
          required
          name="name"
          v-model="name"
          placeholder="My edge application function instance"
          description="Give a unique and descriptive name to identify the function instance."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Edge Function"
    description="Select an existing edge function and customize the arguments. Only edge functions previously created in the Edge Functions module can be instantiated."
  >
    <template #inputs>
      <div class="flex w-80 flex-col gap-2 sm:max-w-lg max-sm:w-full">
        <Drawer
          ref="drawerRef"
          @onSuccess="handleDrawerSuccess"
        />
        <FieldDropdownLazyLoader
          data-testid="edge-application-function-instance-form__edge-function"
          label="Edge Function"
          required
          name="edgeFunctionID"
          :service="listEdgeFunctionsServiceDecorator"
          :loadService="loadEdgeFunctionService"
          :moreOptions="['args']"
          disableEmitFirstRender
          optionLabel="label"
          optionValue="value"
          :value="edgeFunctionID"
          inputId="edgeFunctionID"
          @onSelectOption="changeArgs"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  class="w-full whitespace-nowrap flex"
                  data-testid="edge-applications-functions-form__create-function-button"
                  text
                  @click="openDrawer"
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Edge Function"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>

      <div class="flex flex-col gap-4 surface-border border rounded-md p-6 md:p-8">
        <div class="w-full flex mb-4 justify-between items-end">
          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-semibold">Arguments</h3>
            <p class="text-sm text-color-secondary">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.
            </p>
          </div>
          <SelectButton
            v-model="selectedView"
            :options="viewOptions"
            optionLabel="name"
            optionValue="value"
          />
        </div>

        <div
          class="w-full"
          :class="{ hidden: selectedView !== 'json' }"
        >
          <CodeEditor
            v-model="args"
            language="json"
            class="min-h-[200px] overflow-clip surface-border border rounded-md"
            :errors="hasArgsError"
            :minimap="false"
            @update:modelValue="handleEditorChange"
          />
          <small
            v-if="argsError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ argsError }}
          </small>
          <small class="text-xs text-color-secondary font-normal leading-5">
            Customize the arguments in JSON format. Once set, they can be called in code using
            <code>event.args("arg_name")</code>.
          </small>
        </div>

        <div
          class="flex flex-col gap-6 w-full"
          :class="{ hidden: selectedView !== 'form' }"
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
    </template>
  </FormHorizontal>
</template>
