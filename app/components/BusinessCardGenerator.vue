<template>
    <GeneratorLayout label="Visitekaartje">
        <template #inputs>
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

        </template>

        <template #preview>
        <div class="space-y-4">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h2 class="text-lg font-semibold">Voorbeeld</h2>
                </div>
                <div class="flex items-center gap-2">
                    <Switch id="show-guides" v-model="showGuides" />
                    <Label for="show-guides">Snijlijnen</Label>
                </div>
            </div>

            <!--
                A container query, not a screen breakpoint: what decides whether
                both sides fit next to each other is the width of this column,
                and that depends on the sidebar as much as on the window. The
                cap keeps a card at a readable size instead of letting it grow
                to a hand's width on a big screen, and stops it from shrinking
                when the second column appears.
            -->
            <div class="@container">
                <div class="mx-auto grid w-full max-w-[880px] gap-4 @[880px]:grid-cols-2">
                    <figure v-for="side in SIDES" :key="side.id" class="mx-auto w-full max-w-[432px] space-y-2">
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
            </div>

            <p v-if="showGuides" class="text-xs text-muted-foreground">
                De rode lijn is het snijformaat. Alles daarbuiten is afloop en wordt weggesneden.
            </p>
            <PreviewActions>
                <template #details>
                    <dt class="text-muted-foreground">Snijformaat</dt>
                    <dd class="tabular-nums">{{ CARD.trimWidth }} × {{ CARD.trimHeight }} mm</dd>
                    <dt class="text-muted-foreground">Met afloop</dt>
                    <dd class="tabular-nums">
                        {{ CARD.trimWidth + CARD.bleed * 2 }} × {{ CARD.trimHeight + CARD.bleed * 2 }} mm
                    </dd>
                    <dt class="text-muted-foreground">JPG</dt>
                    <dd class="tabular-nums">{{ exportSize.width }} × {{ exportSize.height }} px</dd>
                </template>

                <Button class="flex-1 gap-2" size="lg" :disabled="busy" @click="downloadPdf">
                    <FileTextIcon />
                    Download PDF voor de drukker
                </Button>
                <Button variant="outline" size="lg" :disabled="busy" @click="downloadImage('front')">Voorkant JPG</Button>
                <Button variant="outline" size="lg" :disabled="busy" @click="downloadImage('back')">Achterkant JPG</Button>

                <template #note>
                    De PDF is het bestand dat je doorstuurt: twee pagina's, tekst als vector. Browsers exporteren
                    enkel RGB — vraagt je drukker CMYK, geef dat er dan bij.
                </template>
            </PreviewActions>
        </div>
        </template>
    </GeneratorLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { DownloadIcon, FileTextIcon } from '@lucide/vue'
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

// The JPG is the fallback for people who cannot use the PDF, so it renders at
// double the print resolution: at 300 dpi the 4.8pt footer lands on about 20
// pixels, which is exactly where JPEG's block artefacts start eating letters.
const IMAGE_EXPORT_DPI = 600

const { app: { baseURL }, public: { assetRoot } } = useRuntimeConfig()
// assetRoot is set for the single-file build, which has no sibling files.
const root = assetRoot || baseURL
const assetUrl = (path) => `${root}${path}`

const person = usePerson()
const company = computed(() => COMPANIES[props.initialCompanyId] || COMPANIES[DEFAULT_COMPANY_ID])

const canvases = reactive({ front: null, back: null })

// Rendered at the resolution the cards are actually displayed at, so the
// preview never looks softer than the artwork really is. Measured on one card
// rather than on the row: the two are the same width, and whether they sit
// side by side or stacked changes with the container.
const cardRef = computed(() => canvases.front)
const { measure: measurePreviewDpi } = useCrispDpi(cardRef, CARD.trimWidth + CARD.bleed * 2)
const showGuides = ref(true)
const busy = ref(false)

const exportSize = computed(() => cardPixelSize(IMAGE_EXPORT_DPI))

const guideStyle = computed(() => {
    const insetX = (CARD.bleed / (CARD.trimWidth + CARD.bleed * 2)) * 100
    const insetY = (CARD.bleed / (CARD.trimHeight + CARD.bleed * 2)) * 100
    return { inset: `${insetY}% ${insetX}%` }
})

const drawPreviews = async () => {
    await ensureCardFonts()
    const dpi = measurePreviewDpi()

    for (const side of SIDES) {
        try {
            await renderCard(canvases[side.id], {
                side: side.id,
                company: company.value,
                person: person.value,
                assetUrl,
                dpi
            })
        } catch (err) {
            console.error(err)
        }
    }
}

/** Renders one side at export resolution on an off-screen canvas. */
const renderForPrint = async (side) => {
    await ensureCardFonts()
    const canvas = document.createElement('canvas')
    await renderCard(canvas, { side, company: company.value, person: person.value, assetUrl, dpi: IMAGE_EXPORT_DPI })
    return canvas
}

const fileName = (side) => {
    const who = (person.value.name || 'visitekaartje').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (side === 'pdf') return `${company.value.slug}-${who}-visitekaartje.pdf`
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

const downloadImage = async (side) => {
    busy.value = true
    try {
        const canvas = await renderForPrint(side)
        const blob = await canvasToJpeg(canvas, 0.98)
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

const downloadPdf = async () => {
    busy.value = true
    try {
        const blob = await buildCardPdf({ company: company.value, person: person.value, assetUrl })
        saveBlob(blob, fileName('pdf'))
        toast.success('PDF gedownload', { description: 'Twee pagina\u2019s: voorkant en achterkant.' })
    } catch (err) {
        console.error(err)
        toast.error('PDF maken mislukt', { description: err.message })
    } finally {
        busy.value = false
    }
}

onMounted(drawPreviews)
watch([person, company], drawPreviews, { deep: true })
useRedrawOnResize(drawPreviews)
</script>
