<template>
    <div class="flex min-h-screen flex-col">
        <Tabs v-model="activeTab" class="flex flex-1 flex-col gap-0">
            <header class="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
                <div class="mx-auto flex w-full max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
                    <div class="flex min-w-0 flex-1 items-center gap-3">
                        <img :src="asset(company.navLogo)" :alt="company.name" class="h-6 max-w-[120px] object-contain" />
                        <Separator orientation="vertical" class="hidden h-6 sm:block" />
                        <span class="hidden truncate text-sm font-semibold sm:block">{{ company.name }}</span>
                    </div>

                    <TabsList>
                        <TabsTrigger value="signature" class="gap-1.5">
                            <MailIcon class="size-3.5" />
                            Handtekening
                        </TabsTrigger>
                        <TabsTrigger value="profile" class="gap-1.5">
                            <UserRoundIcon class="size-3.5" />
                            Profielfoto
                        </TabsTrigger>
                        <TabsTrigger value="card" class="gap-1.5">
                            <CreditCardIcon class="size-3.5" />
                            Visitekaartje
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
                <TabsContent value="signature" class="mt-0">
                    <EmailSignatureGenerator :initial-company-id="company.id" hide-selection />
                </TabsContent>
                <TabsContent value="profile" class="mt-0">
                    <ProfilePhotoGenerator :initial-company-id="company.id" />
                </TabsContent>
                <TabsContent value="card" class="mt-0">
                    <BusinessCardGenerator :initial-company-id="company.id" />
                </TabsContent>
            </main>
        </Tabs>

        <SiteFooter />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { CreditCardIcon, MailIcon, UserRoundIcon } from '@lucide/vue'

const props = defineProps({
    company: {
        type: Object,
        required: true
    }
})

const activeTab = ref('signature')

const { app: { baseURL }, public: { assetRoot } } = useRuntimeConfig()
// assetRoot is set for the single-file build, which has no sibling files.
const root = assetRoot || baseURL
const asset = (path) => `${root}${path}`

useHead({
    title: `${props.company.name} — Handtekening & profielfoto`
})
</script>
