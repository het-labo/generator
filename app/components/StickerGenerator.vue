<template>
    <GeneratorLayout label="Sticker">
        <template #inputs>
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2 text-base">
                        <span class="flex size-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">1</span>
                        Tekst
                    </CardTitle>
                    <CardDescription>Alles op de sticker is vrij in te vullen.</CardDescription>
                </CardHeader>
                <CardContent class="grid gap-4">
                    <div class="grid gap-2">
                        <Label for="sticker-title">Titel</Label>
                        <Input id="sticker-title" v-model="content.title" placeholder="Lorem ipsum dolor" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="sticker-body">Tekst</Label>
                        <textarea
                            id="sticker-body"
                            v-model="content.body"
                            rows="4"
                            class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            placeholder="Korte begeleidende tekst."
                        />
                        <p class="text-xs text-muted-foreground">Loopt automatisch door over meerdere regels.</p>
                    </div>
                    <div class="grid gap-2">
                        <Label for="sticker-footer">Voettekst</Label>
                        <Input id="sticker-footer" v-model="content.footer" placeholder="Lorem ipsum dolor sit amet" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2 text-base">
                        <span class="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold">2</span>
                        Drukklaar downloaden
                    </CardTitle>
                    <CardDescription>Eén pagina, tekst als vector.</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <dt class="text-muted-foreground">Snijformaat</dt>
                        <dd class="tabular-nums">{{ STICKER.widthMm }} × {{ STICKER.heightMm }} mm</dd>
                        <dt class="text-muted-foreground">Met afloop</dt>
                        <dd class="tabular-nums">
                            {{ STICKER.widthMm + STICKER.bleed * 2 }} × {{ STICKER.heightMm + STICKER.bleed * 2 }} mm
                        </dd>
                        <dt class="text-muted-foreground">JPG</dt>
                        <dd class="tabular-nums">{{ exportSize.width }} × {{ exportSize.height }} px</dd>
                    </dl>

                    <div class="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                        Het Figma-bestand geeft geen millimeters; dit gaat uit van 10 designeenheden per mm. Klopt dat
                        niet, geef het formaat door — het is één regel in <code>sticker.js</code>.
                    </div>

                    <Button class="w-full gap-2" size="lg" :disabled="busy" @click="downloadPdf">
                        <FileTextIcon />
                        Download PDF voor de drukker
                    </Button>

                    <Separator />

                    <Button variant="outline" size="sm" :disabled="busy" @click="downloadImage">Download JPG</Button>
                </CardContent>
            </Card>

        </template>

        <template #preview>
        <div class="space-y-4">
            <div>
                <h2 class="text-lg font-semibold">Voorbeeld</h2>
                <p class="text-sm text-muted-foreground">Op ware verhouding, inclusief afloop.</p>
            </div>
            <div class="overflow-hidden rounded-lg border bg-muted/30">
                <canvas ref="canvasRef" class="block w-full" />
            </div>
        </div>
        </template>
    </GeneratorLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { FileTextIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

const props = defineProps({
    initialCompanyId: {
        type: String,
        default: DEFAULT_COMPANY_ID
    }
})

const PREVIEW_DPI = 96
const IMAGE_EXPORT_DPI = 600

const { app: { baseURL }, public: { assetRoot } } = useRuntimeConfig()
// assetRoot is set for the single-file build, which has no sibling files.
const root = assetRoot || baseURL
const assetUrl = (path) => `${root}${path}`

const company = computed(() => COMPANIES[props.initialCompanyId] || COMPANIES[DEFAULT_COMPANY_ID])

const content = reactive({
    title: 'Lorem ipsum dolor',
    body: 'Nam eu tortor tincidunt, facilisis augue ut, placerat mauris. Ut a est risus. Curabitur ac congue mauris, sed pulvinar augue.',
    footer: 'Lorem ipsum dolor sit amet'
})

const canvasRef = ref(null)
const busy = ref(false)

const exportSize = computed(() => stickerPixelSize(IMAGE_EXPORT_DPI))

const draw = async () => {
    await ensureCardFonts()
    try {
        await renderSticker(canvasRef.value, { company: company.value, content, assetUrl, dpi: PREVIEW_DPI })
    } catch (err) {
        console.error(err)
    }
}

const fileName = (ext) => {
    const slug = (content.title || 'sticker').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `${company.value.slug}-sticker-${slug || 'sticker'}.${ext}`
}

const saveBlob = (blob, name) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const downloadPdf = async () => {
    busy.value = true
    try {
        const blob = await buildStickerPdf({ company: company.value, content, assetUrl })
        saveBlob(blob, fileName('pdf'))
        toast.success('PDF gedownload')
    } catch (err) {
        console.error(err)
        toast.error('PDF maken mislukt', { description: err.message })
    } finally {
        busy.value = false
    }
}

const downloadImage = async () => {
    busy.value = true
    try {
        await ensureCardFonts()
        const canvas = document.createElement('canvas')
        await renderSticker(canvas, { company: company.value, content, assetUrl, dpi: IMAGE_EXPORT_DPI })
        const blob = await canvasToJpeg(canvas, 0.98)
        if (!blob) throw new Error('Kon geen JPG maken')
        saveBlob(blob, fileName('jpg'))
        toast.success('JPG gedownload')
    } catch (err) {
        console.error(err)
        toast.error('Downloaden mislukt', { description: err.message })
    } finally {
        busy.value = false
    }
}

watch([content, company], draw, { deep: true })
onMounted(draw)
</script>
