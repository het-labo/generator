<template>
    <GeneratorLayout label="Handtekening">
        <template #inputs>
            <Card v-if="!hideSelection">
                <CardHeader>
                    <CardTitle class="text-base">Bedrijf</CardTitle>
                    <CardDescription>Bepaalt logo, kleuren en bedrijfsgegevens.</CardDescription>
                </CardHeader>
                <CardContent class="flex flex-wrap gap-2">
                    <button
                        v-for="c in COMPANY_LIST"
                        :key="c.id"
                        type="button"
                        class="cursor-pointer rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors"
                        :class="
                            selectedCompanyId === c.id
                                ? 'text-white'
                                : 'border-border bg-muted/40 text-muted-foreground hover:border-foreground/20'
                        "
                        :style="
                            selectedCompanyId === c.id
                                ? { borderColor: c.colorPrimary, backgroundColor: c.colorPrimary }
                                : undefined
                        "
                        @click="selectCompany(c.id)"
                    >
                        {{ c.name }}
                    </button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2 text-base">
                        <span class="flex size-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">1</span>
                        Je gegevens
                    </CardTitle>
                    <CardDescription>Gedeeld met het visitekaartje — één keer invullen volstaat.</CardDescription>
                </CardHeader>
                <CardContent class="grid gap-4 sm:grid-cols-2">
                    <div class="grid gap-2">
                        <Label for="sig-name">Naam</Label>
                        <Input id="sig-name" v-model="person.name" placeholder="Voornaam Familienaam" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="sig-job">Functie</Label>
                        <Input id="sig-job" v-model="person.job" placeholder="bv. Zaakvoerder" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="sig-email">E-mail</Label>
                        <Input id="sig-email" v-model="person.email" type="email" :placeholder="comp.emailPlaceholder" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="sig-phone">Telefoon</Label>
                        <Input id="sig-phone" v-model="person.phone" type="tel" placeholder="+32 000 00 00 00" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2 text-base">
                        <span class="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold">2</span>
                        Bedrijfsgegevens
                    </CardTitle>
                    <CardDescription>Voor iedereen binnen {{ comp.name }} hetzelfde.</CardDescription>
                    <CardAction>
                        <UnlockDialog v-model:locked="companyFieldsLocked" :expected="config.unlockCode" />
                    </CardAction>
                </CardHeader>

                <CardContent class="grid gap-4">
                    <div class="grid gap-4 sm:grid-cols-[1fr_140px]">
                        <div class="grid gap-2">
                            <Label for="sig-company">Bedrijfsnaam</Label>
                            <Input id="sig-company" v-model="formData.companyName" :disabled="companyFieldsLocked" />
                        </div>
                        <div class="grid gap-2">
                            <Label for="sig-addendum">Rechtsvorm</Label>
                            <Select v-model="formData.companyAddendum" :disabled="companyFieldsLocked">
                                <SelectTrigger id="sig-addendum" class="w-full">
                                    <SelectValue placeholder="(geen)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="f in LEGAL_FORMS" :key="f" :value="f">{{ f }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div class="grid gap-2">
                        <Label for="sig-address">Adres</Label>
                        <Input id="sig-address" v-model="formData.address" :disabled="companyFieldsLocked" />
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="grid gap-2">
                            <Label for="sig-cemail">Bedrijfs-e-mail</Label>
                            <Input id="sig-cemail" v-model="formData.companyEmail" type="email" :disabled="companyFieldsLocked" />
                        </div>
                        <div class="grid gap-2">
                            <Label for="sig-cphone">Bedrijfstelefoon</Label>
                            <Input id="sig-cphone" v-model="formData.companyPhone" type="tel" :disabled="companyFieldsLocked" />
                        </div>
                    </div>

                    <div class="grid gap-2">
                        <Label for="sig-vat">BTW-nummer</Label>
                        <Input id="sig-vat" v-model="formData.vat" :disabled="companyFieldsLocked" />
                    </div>

                    <Separator />

                    <div v-for="field in URL_FIELDS" :key="field.key" class="grid gap-2">
                        <Label :for="`sig-${field.key}`">{{ field.label }}</Label>
                        <div class="flex">
                            <span class="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">https://</span>
                            <Input
                                :id="`sig-${field.key}`"
                                v-model="formData[field.key]"
                                :disabled="companyFieldsLocked"
                                :placeholder="field.placeholder"
                                class="rounded-l-none"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

        </template>

        <template #preview>
        <div class="space-y-4">
            <div>
                <h2 class="text-lg font-semibold">Voorbeeld</h2>
                <p class="text-sm text-muted-foreground">Kopieer en plak in Outlook, Gmail of Apple Mail.</p>
            </div>

            <SignaturePreview :html="signatureHtml" />

            <PreviewActions>
                <!--
                    Alle drie even breed: basis-48 laat ze op een smal scherm
                    onder elkaar vallen in plaats van de langste knop te
                    verminken.
                -->
                <Button class="flex-1 basis-48 gap-2" size="lg" @click="copySignature">
                    <CheckIcon v-if="copied === 'signature'" />
                    <ClipboardCheckIcon v-else />
                    {{ copied === 'signature' ? 'Gekopieerd!' : 'Kopieer handtekening' }}
                </Button>
                <Button variant="outline" size="lg" class="flex-1 basis-48 gap-2" @click="copyHtml">
                    <CheckIcon v-if="copied === 'html'" />
                    <CodeIcon v-else />
                    {{ copied === 'html' ? 'Gekopieerd!' : 'HTML' }}
                </Button>
                <Button variant="outline" size="lg" class="flex-1 basis-48 gap-2" :disabled="busy" @click="downloadImage">
                    <ImageIcon />
                    Download PNG
                </Button>

                <template #note>
                    Kopiëren is de juiste manier voor e-mail. De PNG is er alleen voor systemen die geen HTML
                    accepteren: daarin werken de links niet meer, en veel mailprogramma's blokkeren afbeeldingen
                    standaard.
                </template>
            </PreviewActions>
        </div>
        </template>
    </GeneratorLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CheckIcon, ClipboardCheckIcon, CodeIcon, ImageIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

const props = defineProps({
    initialCompanyId: {
        type: String,
        default: DEFAULT_COMPANY_ID
    },
    hideSelection: {
        type: Boolean,
        default: false
    }
})

const { public: config, app: { baseURL } } = useRuntimeConfig()
// The image export loads assets from the app's own origin, so the canvas is
// never tainted by the CDN (which sends no CORS headers).
const assetUrl = (path) => `${config.assetRoot || baseURL}${path}`

const LEGAL_FORMS = ['bv', 'bvba', 'nv']

// These sit behind a fixed "https://" prefix in the UI, so a pasted full URL
// would read as "https://https://…". The watcher below strips the scheme as it
// is typed rather than validating on submit.
const URL_FIELDS = [
    { key: 'websiteUrl', label: 'Website', placeholder: 'www.mdbouw.be' },
    { key: 'addressUrl', label: 'Adres-link (Google Maps)', placeholder: 'www.google.be/maps/...' },
    { key: 'bannerUrl', label: 'Banner-link', placeholder: 'www.mdbouw.be' },
    { key: 'facebookUrl', label: 'Facebook', placeholder: 'facebook.com/...' },
    { key: 'instagramUrl', label: 'Instagram', placeholder: 'instagram.com/...' },
    { key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'linkedin.com/company/...' }
]

const selectedCompanyId = ref(props.initialCompanyId)
const comp = computed(() => COMPANIES[selectedCompanyId.value] || COMPANIES[DEFAULT_COMPANY_ID])

const companyFieldsLocked = ref(true)
const busy = ref(false)

// Confirmation belongs on the button that was just clicked; a toast in the
// corner is easy to miss when you are looking at your cursor.
const copied = ref(null)
let copiedTimer = null

const markCopied = (which) => {
    copied.value = which
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied.value = null), 2000)
}

onBeforeUnmount(() => clearTimeout(copiedTimer))

// Name/job/e-mail/phone are shared with the other generators, so filling them
// in once is enough. Only the company block lives locally.
const person = usePerson()

const formData = ref({
    companyName: '',
    companyAddendum: 'bv',
    address: '',
    addressUrl: '',
    websiteUrl: '',
    vat: '',
    companyEmail: '',
    companyPhone: '',
    bannerUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    linkedinUrl: ''
})

const selectCompany = (id) => {
    const c = COMPANIES[id]
    if (!c) return

    selectedCompanyId.value = id

    // Keep whatever the user already typed about themselves (name, job,
    // e-mail, phone) — only the company block is reset.
    Object.assign(formData.value, companyFormDefaults(c))
}

onMounted(() => selectCompany(props.initialCompanyId))

watch(
    () => props.initialCompanyId,
    (newId) => {
        if (newId) selectCompany(newId)
    }
)

watch(
    formData,
    (form) => {
        for (const { key } of URL_FIELDS) {
            const stripped = stripScheme(form[key])
            if (stripped !== form[key]) form[key] = stripped
        }
    },
    { deep: true }
)

const signatureHtml = computed(() =>
    buildSignatureHtml({
        company: comp.value,
        form: { ...person.value, ...formData.value },
        assetBase: config.assetBase
    })
)

// Writes the generated e-mail-safe HTML straight to the clipboard as
// text/html. Copying the rendered preview instead would let the browser
// re-serialize the DOM, wrapping the signature in app markup — Outlook's Word
// engine then drops colors and shifts the layout on paste.
const copySignature = async () => {
    const html = signatureHtml.value

    if (navigator.clipboard && window.ClipboardItem) {
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([html], { type: 'text/html' }),
                    'text/plain': new Blob([html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()], { type: 'text/plain' })
                })
            ])
            markCopied('signature')
            toast.success('Handtekening gekopieerd', { description: 'Plak in je e-mailprogramma met Cmd/Ctrl + V.' })
            return
        } catch (err) {
            console.error('Clipboard API copy failed', err)
        }
    }

    toast.error('Kopiëren mislukt', { description: 'Selecteer het voorbeeld en kopieer handmatig.' })
}

// PNG rather than JPG: the signature is text and hairline rules on a flat
// background, exactly what JPEG's block artefacts damage most.
const downloadImage = async () => {
    busy.value = true
    try {
        const { blob, width, height } = await buildSignatureImage({
            company: comp.value,
            form: { ...person.value, ...formData.value },
            assetUrl
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const who = (person.value.name || 'handtekening').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        link.href = url
        link.download = `${comp.value.slug}-${who || 'handtekening'}-handtekening.png`
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)

        toast.success('Handtekening gedownload', { description: `PNG, ${width} × ${height} px.` })
    } catch (err) {
        console.error(err)
        toast.error('Afbeelding maken mislukt', { description: err.message })
    } finally {
        busy.value = false
    }
}

const copyHtml = async () => {
    try {
        await navigator.clipboard.writeText(signatureHtml.value)
        markCopied('html')
        toast.success('HTML gekopieerd', { description: 'De broncode van de handtekening staat op je klembord.' })
    } catch (err) {
        console.error('Copy failed', err)
        toast.error('Kopiëren mislukt')
    }
}
</script>
