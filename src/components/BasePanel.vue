<script setup lang="ts">
withDefaults(
  defineProps<{
    tag?: string
    title?: string
    tagLabel?: string
    tagColor?: string
    subtitle?: string
    flush?: boolean
  }>(),
  {
    tag: 'section',
    tagColor: 'blue',
  }
)
</script>

<template>
  <component
    :is="tag"
    class="rounded-xl border border-border bg-surface overflow-hidden"
  >
    <header
      v-if="title || tagLabel || $slots.header"
      class="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-surface-2"
    >
      <span
        v-if="tagLabel"
        :class="[
          'text-xs font-semibold px-2 py-0.5 rounded-md font-mono',
          {
            blue: 'bg-accent-soft text-accent',
            green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
            cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
            teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
            purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            dark: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
          }[tagColor],
        ]"
      >
        {{ tagLabel }}
      </span>
      <slot name="header">
        <h2 class="text-sm font-semibold text-text">{{ title }}</h2>
      </slot>
      <span v-if="subtitle" class="text-xs text-text-muted ml-auto font-mono">{{ subtitle }}</span>
      <div v-if="$slots.action" class="ml-auto"><slot name="action" /></div>
    </header>
    <div :class="flush ? '' : 'p-5'">
      <slot />
    </div>
  </component>
</template>
