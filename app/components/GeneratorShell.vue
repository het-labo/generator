<template>
    <div class="flex min-h-screen flex-col">
        <Tabs v-model="activeTab" class="flex flex-1 flex-col gap-0">
            <header class="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
                <!--
                    Below lg the header is two rows: identity on top, tabs under
                    it. On one row the tabs need about 800px next to the logo,
                    so before that they pushed the logo out of the header
                    entirely and ran off the right edge of a phone.
                -->
                <div
                    class="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8"
                >
                    <div class="flex min-w-0 flex-1 items-center gap-3">
                        <!--
                            A standalone build (NUXT_COMPANY=md) is one company at
                            the root; there is no overview to go back to.
                        -->
                        <Tooltip v-if="hasOverview">
                            <TooltipTrigger as-child>
                                <Button variant="ghost" size="icon" class="size-8 shrink-0" as-child>
                                    <NuxtLink to="/" aria-label="Naar het bedrijvenoverzicht">
                                        <ArrowLeftIcon class="size-4" />
                                    </NuxtLink>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Ander bedrijf kiezen</TooltipContent>
                        </Tooltip>

                        <img
                            :src="asset(company.navLogo)"
                            :alt="company.name"
                            class="h-6 max-w-[120px] shrink-0 object-contain"
                        />
                        <Separator orientation="vertical" class="hidden h-6 sm:block" />
                        <span class="hidden truncate text-sm font-semibold sm:block">{{ company.name }}</span>
                    </div>

                    <TabsList class="w-full lg:w-fit">
                        <TabsTrigger
                            v-for="tab in tabs"
                            :key="tab.id"
                            :value="tab.id"
                            class="gap-0 min-[520px]:gap-1.5"
                        >
                            <component :is="tab.icon" class="size-4 min-[520px]:size-3.5" />
                            <span class="sr-only min-[520px]:not-sr-only">{{ tab.label }}</span>
                        </TabsTrigger>
                    </TabsList>

                    <div class="hidden flex-1 justify-end lg:flex">
                        <a href="https://www.het-labo.be" target="_blank" rel="noopener" class="flex flex-col items-end gap-0.5">
                            <span class="text-[9px] uppercase tracking-widest text-muted-foreground">Gemaakt door</span>
                            <img :src="asset('assets/logos/logo-het-labo.svg')" alt="Het Labo" class="h-5 w-auto dark:invert" />
                        </a>
                    </div>
                </div>
            </header>

            <main class="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
                <TabsContent v-if="isOn('signature')" value="signature" class="mt-0">
                    <EmailSignatureGenerator :initial-company-id="company.id" hide-selection />
                </TabsContent>
                <TabsContent v-if="isOn('profile')" value="profile" class="mt-0">
                    <ProfilePhotoGenerator :initial-company-id="company.id" />
                </TabsContent>
                <TabsContent v-if="isOn('card')" value="card" class="mt-0">
                    <BusinessCardGenerator :initial-company-id="company.id" />
                </TabsContent>
                <TabsContent v-if="isOn('sticker')" value="sticker" class="mt-0">
                    <StickerGenerator :initial-company-id="company.id" />
                </TabsContent>
            </main>
        </Tabs>

        <SiteFooter />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowLeftIcon, CreditCardIcon, MailIcon, StickerIcon, UserRoundIcon } from '@lucide/vue'

const props = defineProps({
    company: {
        type: Object,
        required: true
    }
})

const { app: { baseURL }, public: { assetRoot, companyId, tabs: enabled } } = useRuntimeConfig()

const ALL_TABS = [
    { id: 'signature', label: 'Handtekening', icon: MailIcon },
    { id: 'profile', label: 'Profielfoto', icon: UserRoundIcon },
    { id: 'card', label: 'Visitekaartje', icon: CreditCardIcon },
    { id: 'sticker', label: 'Sticker', icon: StickerIcon }
]

// Switched off per build with NUXT_TAB_* in that company's .env — see the
// README. Turning everything off is a misconfiguration rather than a wish, so
// that falls back to the full set instead of shipping an empty app.
const wanted = ALL_TABS.filter((tab) => enabled?.[tab.id] !== false)

if (!wanted.length) {
    console.warn('Alle tabbladen staan uit in .env; ze worden allemaal getoond.')
}

const tabs = wanted.length ? wanted : ALL_TABS
const isOn = (id) => tabs.some((tab) => tab.id === id)

const activeTab = ref(tabs[0].id)

// Only the shared build has a company picker to return to.
const hasOverview = !companyId
// assetRoot is set for the single-file build, which has no sibling files.
const root = assetRoot || baseURL
const asset = (path) => `${root}${path}`

useHead({
    title: `${props.company.name} — Handtekening & profielfoto`
})
</script>
