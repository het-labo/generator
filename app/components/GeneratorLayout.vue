<template>
    <div class="flex gap-6">
        <!--
            Inputs live in a sidebar that collapses, so the preview can take the
            full width when someone is judging the result rather than editing.
            Expanded by default: filling the form is the first thing you do.
        -->
        <aside
            class="shrink-0 transition-[width] duration-300 ease-out"
            :class="open ? 'w-full max-w-[420px]' : 'w-12'"
        >
            <div class="sticky top-24">
                <div class="mb-3 flex items-center gap-2" :class="!open && 'justify-center'">
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Button variant="ghost" size="icon" class="size-8 shrink-0" @click="open = !open">
                                <PanelLeftIcon v-if="open" class="size-4" />
                                <PanelLeftOpenIcon v-else class="size-4" />
                                <span class="sr-only">{{ open ? 'Velden inklappen' : 'Velden uitklappen' }}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">{{ open ? 'Velden inklappen' : 'Velden uitklappen' }}</TooltipContent>
                    </Tooltip>
                    <span v-if="open" class="text-xs font-medium text-muted-foreground">{{ label }}</span>
                </div>

                <div
                    class="overflow-hidden transition-opacity duration-200"
                    :class="open ? 'opacity-100' : 'pointer-events-none h-0 opacity-0'"
                    :aria-hidden="!open"
                >
                    <div class="max-h-[calc(100vh-9rem)] space-y-6 overflow-y-auto pr-2 pb-2">
                        <slot name="inputs" />
                    </div>
                </div>
            </div>
        </aside>

        <div class="min-w-0 flex-1">
            <slot name="preview" />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { PanelLeftIcon, PanelLeftOpenIcon } from '@lucide/vue'

defineProps({
    label: {
        type: String,
        default: 'Instellingen'
    }
})

const open = ref(true)
</script>
