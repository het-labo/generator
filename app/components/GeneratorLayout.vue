<template>
    <div class="flex gap-6">
        <!--
            Wide screens: the inputs sit next to the preview and can be
            collapsed to a rail, expanded by default.
        -->
        <aside
            v-if="isWide"
            class="shrink-0 transition-[width] duration-300 ease-out"
            :class="expanded ? 'w-[420px]' : 'w-12'"
        >
            <div class="sticky top-24">
                <div class="mb-3 flex items-center gap-2" :class="!expanded && 'justify-center'">
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Button variant="ghost" size="icon" class="size-8 shrink-0" @click="toggle">
                                <PanelLeftIcon v-if="expanded" class="size-4" />
                                <PanelLeftOpenIcon v-else class="size-4" />
                                <span class="sr-only">{{ expanded ? 'Velden inklappen' : 'Velden uitklappen' }}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {{ expanded ? 'Velden inklappen' : 'Velden uitklappen' }}
                        </TooltipContent>
                    </Tooltip>
                    <span v-if="expanded" class="text-xs font-medium text-muted-foreground">{{ label }}</span>
                </div>

                <div
                    class="overflow-hidden transition-opacity duration-200"
                    :class="expanded ? 'opacity-100' : 'pointer-events-none h-0 opacity-0'"
                    :aria-hidden="!expanded"
                >
                    <div class="max-h-[calc(100vh-9rem)] space-y-6 overflow-y-auto pr-2 pb-2">
                        <slot name="inputs" />
                    </div>
                </div>
            </div>
        </aside>

        <div class="min-w-0 flex-1 space-y-4">
            <!--
                Below the breakpoint there is not enough room for two columns,
                and the preview is the part worth seeing. The inputs move into
                an overlay so they cost no width at all.
            -->
            <Button v-if="!isWide" variant="outline" size="sm" class="gap-2" @click="sheetOpen = true">
                <SlidersHorizontalIcon class="size-4" />
                {{ label }} bewerken
            </Button>

            <slot name="preview" />
        </div>

        <!--
            Rendered only on narrow screens, so the inputs slot is never in the
            tree twice. The values themselves live in the parent component, so
            switching between the two placements keeps whatever was typed.
        -->
        <Sheet v-if="!isWide" v-model:open="sheetOpen">
            <SheetContent side="left" class="w-[min(420px,92vw)] gap-0 overflow-y-auto p-0 sm:max-w-none">
                <SheetHeader class="border-b">
                    <SheetTitle>{{ label }}</SheetTitle>
                    <SheetDescription>Wijzigingen zie je meteen in het voorbeeld.</SheetDescription>
                </SheetHeader>
                <div class="space-y-6 p-4">
                    <slot name="inputs" />
                </div>
            </SheetContent>
        </Sheet>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { PanelLeftIcon, PanelLeftOpenIcon, SlidersHorizontalIcon } from '@lucide/vue'

defineProps({
    label: {
        type: String,
        default: 'Instellingen'
    }
})

// 1280px: below that, a 420px sidebar leaves the signature preview (580px of
// content) too little room to be judged properly.
const isWide = useMediaQuery('(min-width: 1280px)')

const expanded = ref(true)
const sheetOpen = ref(false)

// Collapsing changes how wide the preview is drawn, but no window resize fires
// for it. The canvases re-measure on 'resize', so tell them once the width
// transition has finished.
const toggle = () => {
    expanded.value = !expanded.value
    setTimeout(() => window.dispatchEvent(new Event('resize')), 350)
}

// Growing past the breakpoint while the overlay is open would otherwise leave
// it stranded over the inline sidebar.
watch(isWide, (wide) => {
    if (wide) sheetOpen.value = false
})
</script>
