<template>
    <div class="grid gap-8 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)] xl:items-start">
        <div class="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2 text-base">
                        <span class="flex size-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">1</span>
                        Je foto
                    </CardTitle>
                    <CardDescription>Een portretfoto werkt het best — het beeld wordt rond bijgesneden.</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <button
                        type="button"
                        class="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors hover:border-foreground/30 hover:bg-muted/40"
                        :class="isDragging && 'border-foreground/40 bg-muted/60'"
                        @click="fileInput?.click()"
                        @dragover.prevent="isDragging = true"
                        @dragleave="isDragging = false"
                        @drop.prevent="handleDrop"
                    >
                        <div class="flex size-10 items-center justify-center rounded-full bg-muted">
                            <UploadIcon class="size-5 text-muted-foreground" />
                        </div>
                        <span class="text-sm font-medium">Klik of sleep om te uploaden</span>
                        <span class="text-xs text-muted-foreground">JPG, PNG of WebP</span>
                    </button>

                    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleUpload" />

                    <div v-if="backgroundImage" class="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                        <img :src="backgroundImageUrl" alt="" class="size-9 rounded-full object-cover" />
                        <span class="flex-1 text-sm font-medium">Foto geladen</span>
                        <Button variant="ghost" size="sm" @click="clearPhoto">Verwijder</Button>
                    </div>
                </CardContent>
            </Card>

            <Card :class="!backgroundImage && 'pointer-events-none opacity-50'">
                <CardHeader>
                    <CardTitle class="flex items-center gap-2 text-base">
                        <span class="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold">2</span>
                        Stijl
                    </CardTitle>
                    <CardDescription>Huisstijl van {{ company.name }}.</CardDescription>
                </CardHeader>
                <CardContent class="space-y-6">
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <Label for="grayscale" class="text-sm font-medium">Zwart-wit</Label>
                            <p class="text-xs text-muted-foreground">Klassiek, en rustiger naast het logo.</p>
                        </div>
                        <Switch id="grayscale" v-model="isGrayscale" />
                    </div>

                    <Separator />

                    <div class="space-y-3">
                        <Label class="text-sm font-medium">Overlay</Label>
                        <div class="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                class="group flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition-colors"
                                :class="!selectedOverlay ? 'border-primary' : 'border-border hover:border-foreground/30'"
                                @click="handleOverlaySelect(null)"
                            >
                                <div class="flex aspect-square w-full items-center justify-center rounded-lg bg-muted">
                                    <XIcon class="size-5 text-muted-foreground" />
                                </div>
                                <span class="text-xs font-medium">Geen</span>
                            </button>

                            <button
                                v-for="overlay in overlays"
                                :key="overlay.id"
                                type="button"
                                class="flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition-colors"
                                :class="selectedOverlay?.id === overlay.id ? 'border-primary' : 'border-border hover:border-foreground/30'"
                                @click="handleOverlaySelect(overlay)"
                            >
                                <div class="aspect-square w-full overflow-hidden rounded-lg bg-muted">
                                    <img :src="getOverlaySrc(overlay.src)" :alt="overlay.label" class="size-full object-contain" />
                                </div>
                                <span class="text-xs font-medium">{{ overlay.label }}</span>
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div class="space-y-4 xl:sticky xl:top-24">
            <div>
                <h2 class="text-lg font-semibold">Voorbeeld</h2>
                <p class="text-sm text-muted-foreground">Wordt gedownload op 1200 × 1200 pixels.</p>
            </div>

            <div class="flex justify-center rounded-xl border bg-muted/30 p-6">
                <div class="relative">
                    <canvas
                        ref="canvasRef"
                        class="aspect-square w-[280px] rounded-full border-4 border-background bg-muted shadow-xl md:w-[380px]"
                    />
                    <div v-if="!backgroundImage" class="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span class="text-sm italic text-muted-foreground">Nog geen foto</span>
                    </div>
                </div>
            </div>

            <Button class="w-full gap-2" size="lg" :disabled="!backgroundImage" @click="handleDownload">
                <DownloadIcon />
                Download profielfoto
            </Button>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { DownloadIcon, UploadIcon, XIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

const props = defineProps({
    initialCompanyId: {
        type: String,
        default: DEFAULT_COMPANY_ID
    }
})

const { app: { baseURL }, public: { assetRoot } } = useRuntimeConfig()
// assetRoot is set for the single-file build, which has no sibling files.
const root = assetRoot || baseURL

const company = computed(() => COMPANIES[props.initialCompanyId] || COMPANIES[DEFAULT_COMPANY_ID])
const overlays = computed(() => company.value.overlays)

const backgroundImage = ref(null)
const backgroundImageUrl = ref('')
const isGrayscale = ref(true)
const isDragging = ref(false)
const selectedOverlay = ref(null)
const overlayImage = ref(null)
const canvasRef = ref(null)
const fileInput = ref(null)

// Rendered well above display size so the downloaded avatar stays sharp when
// a platform scales it back up.
const CANVAS_SIZE = 1200

const getOverlaySrc = (src) => (src.startsWith('http') ? src : `${root}${src}`)

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })

const clipToCircle = (ctx) => {
    ctx.beginPath()
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
}

const renderCanvas = () => {
    const canvas = canvasRef.value
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    if (!backgroundImage.value) {
        ctx.fillStyle = '#e4e4e7'
        ctx.beginPath()
        ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2)
        ctx.fill()
    } else {
        const { width, height } = backgroundImage.value

        ctx.save()
        clipToCircle(ctx)

        // Cover-fit: scale by the larger ratio so the photo always fills the
        // circle, then center it.
        const scale = Math.max(CANVAS_SIZE / width, CANVAS_SIZE / height)
        const x = CANVAS_SIZE / 2 - (width / 2) * scale
        const y = CANVAS_SIZE / 2 - (height / 2) * scale

        if (isGrayscale.value) ctx.filter = 'grayscale(100%)'
        ctx.drawImage(backgroundImage.value, x, y, width * scale, height * scale)
        ctx.filter = 'none'
        ctx.restore()
    }

    if (overlayImage.value) {
        ctx.save()
        clipToCircle(ctx)
        ctx.drawImage(overlayImage.value, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
        ctx.restore()
    }
}

const processFile = (file) => {
    const reader = new FileReader()
    reader.onload = async (event) => {
        backgroundImageUrl.value = event.target.result
        backgroundImage.value = await loadImage(event.target.result)
    }
    reader.readAsDataURL(file)
}

const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
}

const handleDrop = (e) => {
    isDragging.value = false
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
}

const clearPhoto = () => {
    backgroundImage.value = null
    backgroundImageUrl.value = ''
    if (fileInput.value) fileInput.value.value = ''
}

const handleOverlaySelect = async (overlay) => {
    if (!overlay) {
        selectedOverlay.value = null
        overlayImage.value = null
        return
    }

    try {
        selectedOverlay.value = overlay
        overlayImage.value = await loadImage(getOverlaySrc(overlay.src))
    } catch (err) {
        console.error('Failed to load overlay:', err)
        selectedOverlay.value = null
        overlayImage.value = null
        toast.error('Overlay kon niet geladen worden')
    }
}

const handleDownload = () => {
    const canvas = canvasRef.value
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `profielfoto${selectedOverlay.value ? `-${selectedOverlay.value.id}` : ''}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('Profielfoto gedownload')
}

watch([backgroundImage, overlayImage, isGrayscale], renderCanvas)

// Overlays are company-specific, so a company switch invalidates the current
// pick. Carry the choice over by matching on the overlay's shape ('full' vs
// 'half') rather than dropping back to no overlay at all.
watch(overlays, (list) => {
    if (!selectedOverlay.value) return

    const sameShape = list.find((o) => o.id.split('-')[0] === selectedOverlay.value.id.split('-')[0])
    handleOverlaySelect(sameShape || list[0] || null)
})

onMounted(renderCanvas)
</script>
