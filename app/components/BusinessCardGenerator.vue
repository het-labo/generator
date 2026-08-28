<template>
    <div class="grid gap-8 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)] xl:items-start">
        <div class="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2 text-base">
                        <span class="flex size-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">1</span>
                        Je gegevens
                    </CardTitle>
                    <CardDescription>Gedeeld met de handtekening — één keer invullen volstaat.</CardDescription>
                </CardHeader>
                <CardContent class="grid gap-4 sm:grid-cols-2">
                    <div class="grid gap-2">
                        <Label for="card-name">Naam</Label>
                        <Input id="card-name" v-model="person.name" placeholder="Voornaam Familienaam" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="card-job">Functie</Label>
                        <Input id="card-job" v-model="person.job" placeholder="bv. Sales Manager" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="card-phone">Telefoon</Label>
                        <Input id="card-phone" v-model="person.phone" type="tel" placeholder="+32 498 365 238" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="card-email">E-mail</Label>
                        <Input id="card-email" v-model="person.email" type="email" :placeholder="company.emailPlaceholder" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2 text-base">
                        <span class="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold">2</span>
                        Drukklaar downloaden
                    </CardTitle>
                    <CardDescription>Twee JPG's op {{ CARD.dpi }} dpi, met {{ CARD.bleed }} mm afloop.</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <dt class="text-muted-foreground">Snijformaat</dt>
                        <dd class="tabular-nums">{{ CARD.trimWidth }} × {{ CARD.trimHeight }} mm</dd>
                        <dt class="text-muted-foreground">Met afloop</dt>
                        <dd class="tabular-nums">
                            {{ CARD.trimWidth + CARD.bleed * 2 }} × {{ CARD.trimHeight + CARD.bleed * 2 }} mm
                        </dd>
                        <dt class="text-muted-foreground">Pixels</dt>
                        <dd class="tabular-nums">{{ exportSize.width }} × {{ exportSize.height }} px</dd>
                        <dt class="text-muted-foreground">Kleurruimte</dt>
                        <dd>sRGB</dd>
                    </dl>

                    <div class="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                        Browsers exporteren enkel RGB. Vraagt je drukker CMYK, lever deze JPG's dan aan met de vraag om
                        te converteren — of laat ons een PDF-versie maken.
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <Button class="flex-1 gap-2" :disabled="busy" @click="downloadBoth">
                            <DownloadIcon />
                            Download voor- en achterkant
                        </Button>
                        <Button variant="outline" :disabled="busy" @click="download('front')">Voorkant</Button>
                        <Button variant="outline" :disabled="busy" @click="download('back')">Achterkant</Button>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div class="space-y-4 xl:sticky xl:top-24">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h2 class="text-lg font-semibold">Voorbeeld</h2>
                    <p class="text-sm text-muted-foreground">Voorkant en achterkant, op ware verhouding.</p>
                </div>
                <div class="flex items-center gap-2">
                    <Switch id="show-guides" v-model="showGuides" />
                    <Label for="show-guides">Snijlijnen</Label>
                </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
                <figure v-for="side in SIDES" :key="side.id" class="space-y-2">
                    <div class="relative overflow-hidden rounded-lg border bg-muted/30">
                        <canvas :ref="(el) => (canvases[side.id] = el)" class="block w-full" />
                        <!--
                            Guides are an overlay, never part of the export: the
                            printer gets clean artwork. Inset equals the bleed as
                            a fraction of the full canvas.
                        -->
                        <div
                            v-if="showGuides"
                            class="pointer-events-none absolute border border-dashed border-red-500/70"
                            :style="guideStyle"
                        />
                    </div>
                    <figcaption class="text-xs text-muted-foreground">{{ side.label }}</figcaption>
                </figure>
            </div>

            <p v-if="showGuides" class="text-xs text-muted-foreground">
                De rode lijn is het snijformaat. Alles daarbuiten is afloop en wordt weggesneden.
            </p>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { DownloadIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

const props = defineProps({
    initialCompanyId: {
        type: String,
        default: DEFAULT_COMPANY_ID
    }
})

const SIDES = [
    { id: 'front', label: 'Voorkant — logo' },
    { id: 'back', label: 'Achterkant — jouw gegevens' }
]

// The preview only has to look right on screen; rendering it at full 300 dpi
// would redraw four megapixels on every keystroke.
const PREVIEW_DPI = 96

const { app: { baseURL } } = useRuntimeConfig()
const assetUrl = (path) => `${baseURL}${path}`

const person = usePerson()
const company = computed(() => COMPANIES[props.initialCompanyId] || COMPANIES[DEFAULT_COMPANY_ID])

const canvases = reactive({ front: null, back: null })
const showGuides = ref(true)
const busy = ref(false)

const exportSize = computed(() => cardPixelSize(CARD.dpi))

const guideStyle = computed(() => {
    const insetX = (CARD.bleed / (CARD.trimWidth + CARD.bleed * 2)) * 100
    const insetY = (CARD.bleed / (CARD.trimHeight + CARD.bleed * 2)) * 100
    return { inset: `${insetY}% ${insetX}%` }
})

// Canvas draws with whatever is loaded at that moment, so a render started
// before the webfonts arrive silently uses the fallback stack.
const fontsReady = () => (document.fonts ? document.fonts.ready : Promise.resolve())

const drawPreviews = async () => {
    await fontsReady()

    for (const side of SIDES) {
        try {
            await renderCard(canvases[side.id], {
                side: side.id,
                company: company.value,
                person: person.value,
                assetUrl,
                dpi: PREVIEW_DPI
            })
        } catch (err) {
            console.error(err)
        }
    }
}

/** Renders one side at full print resolution on an off-screen canvas. */
const renderForPrint = async (side) => {
    await fontsReady()
    const canvas = document.createElement('canvas')
    await renderCard(canvas, { side, company: company.value, person: person.value, assetUrl })
    return canvas
}

const fileName = (side) => {
    const who = (person.value.name || 'visitekaartje').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `${company.value.slug}-${who}-${side === 'front' ? 'voorkant' : 'achterkant'}.jpg`
}

const saveBlob = (blob, name) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    // Revoking straight after click() can cut the download off before the
    // browser has read the blob; give it a moment.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const download = async (side) => {
    busy.value = true
    try {
        const canvas = await renderForPrint(side)
        const blob = await canvasToJpeg(canvas)
        if (!blob) throw new Error('Kon geen JPG maken')
        saveBlob(blob, fileName(side))
        toast.success(`${side === 'front' ? 'Voorkant' : 'Achterkant'} gedownload`)
    } catch (err) {
        console.error(err)
        toast.error('Downloaden mislukt', { description: err.message })
    } finally {
        busy.value = false
    }
}

const downloadBoth = async () => {
    await download('front')
    await download('back')
}

onMounted(drawPreviews)
watch([person, company], drawPreviews, { deep: true })
</script>
