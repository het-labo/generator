<template>
    <!--
        Two modes share this route: a standalone build (NUXT_COMPANY=md) drops
        straight into that company's generator, while the shared build shows the
        picker with /:slug per company.
    -->
    <GeneratorShell v-if="company" :company="company" />

    <div v-else class="flex min-h-screen flex-col">
        <header class="border-b">
            <div class="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:text-left">
                <img :src="asset('assets/logos/logo-het-labo.svg')" alt="Het Labo" class="h-8 dark:invert" />
                <div>
                    <h1 class="text-2xl font-bold tracking-tight">Generator</h1>
                    <p class="text-sm text-muted-foreground">Handtekeningen, profielfoto's, visitekaartjes en stickers in de juiste huisstijl.</p>
                </div>
            </div>
        </header>

        <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-14">
            <h2 class="mb-6 text-sm font-medium text-muted-foreground">Kies je bedrijf</h2>
            <div class="grid gap-5 sm:grid-cols-2">
                <NuxtLink v-for="c in COMPANY_LIST" :key="c.id" :to="`/${c.slug}`" class="group">
                    <Card class="h-full transition-all group-hover:border-foreground/20 group-hover:shadow-lg">
                        <CardContent class="flex flex-col items-center gap-5 py-8 text-center">
                            <div class="flex h-20 items-center justify-center">
                                <img
                                    :src="asset(c.navLogo)"
                                    :alt="c.name"
                                    class="max-h-full max-w-[180px] object-contain transition-transform group-hover:scale-105"
                                />
                            </div>
                            <div class="space-y-1">
                                <h3 class="text-lg font-semibold">{{ c.name }}</h3>
                                <p class="text-sm text-muted-foreground">{{ c.description }}</p>
                            </div>
                            <span class="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                                Openen
                                <ArrowRightIcon class="size-4 transition-transform group-hover:translate-x-0.5" />
                            </span>
                        </CardContent>
                    </Card>
                </NuxtLink>
            </div>
        </main>

        <SiteFooter />
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRightIcon } from '@lucide/vue'

const { public: { companyId, assetRoot }, app: { baseURL } } = useRuntimeConfig()
// assetRoot is set for the single-file build, which has no sibling files.
const root = assetRoot || baseURL

const company = computed(() => companyById(companyId))
const asset = (path) => `${root}${path}`

useHead({
    title: () => (company.value ? `${company.value.name} — Handtekening & profielfoto` : 'Generator — Kies je bedrijf')
})
</script>
