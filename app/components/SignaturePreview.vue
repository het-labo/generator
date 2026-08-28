<template>
    <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
                <Button
                    v-for="w in WIDTHS"
                    :key="w.id"
                    :variant="width === w.id ? 'default' : 'ghost'"
                    size="sm"
                    class="h-7 gap-1.5"
                    @click="width = w.id"
                >
                    <component :is="w.icon" />
                    {{ w.label }}
                </Button>
            </div>

            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                    <Switch id="preview-dark" v-model="onDark" />
                    <Label for="preview-dark" class="text-xs text-muted-foreground">Donkere mail</Label>
                </div>

                <Tooltip>
                    <TooltipTrigger as-child>
                        <Badge :variant="sizeVariant" class="tabular-nums">{{ length.toLocaleString('nl-BE') }}</Badge>
                    </TooltipTrigger>
                    <TooltipContent class="max-w-[260px]">
                        Lengte van de HTML. Gmail staat 10.000 tekens toe; onder de 5.000 blijven laadt sneller en
                        rendert betrouwbaarder op mobiel.
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>

        <!--
            The preview is deliberately not styled by the app: .signature-preview
            reverts Tailwind's preflight so the markup renders the way a mail
            client would. The wrapper below only simulates the viewport width and
            the client's background color.
        -->
        <div
            class="overflow-x-auto rounded-xl border p-4 transition-colors"
            :class="onDark ? 'bg-zinc-900' : 'bg-white'"
        >
            <div class="mx-auto transition-[max-width] duration-300" :style="{ maxWidth: activeWidth }">
                <div ref="previewRef" class="signature-preview" v-html="html" />
            </div>
        </div>

        <p class="text-xs text-muted-foreground">
            Voorbeeld op {{ width === 'mobile' ? '375px — zoals op een telefoon' : 'volle breedte — zoals op desktop' }}.
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MonitorIcon, SmartphoneIcon } from '@lucide/vue'

const props = defineProps<{ html: string }>()

const WIDTHS = [
    { id: 'desktop', label: 'Desktop', icon: MonitorIcon, value: '100%' },
    { id: 'mobile', label: 'Mobiel', icon: SmartphoneIcon, value: '375px' }
] as const

const width = ref<'desktop' | 'mobile'>('desktop')
const onDark = ref(false)
const previewRef = ref<HTMLElement | null>(null)

const activeWidth = computed(() => WIDTHS.find((w) => w.id === width.value)!.value)
const length = computed(() => props.html.length)

// Mirrors the thresholds an e-mail signature validator flags.
const sizeVariant = computed(() => (length.value > 10000 ? 'destructive' : length.value > 5000 ? 'outline' : 'secondary'))

defineExpose({ previewRef })
</script>
