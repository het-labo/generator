<template>
    <GeneratorShell v-if="company" :company="company" />

    <div v-else class="flex min-h-screen flex-col">
        <main class="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center">
            <h1 class="text-xl font-semibold text-muted-foreground">Dit bedrijf kennen we niet.</h1>
            <Button as-child>
                <NuxtLink to="/">Naar de startpagina</NuxtLink>
            </Button>
        </main>

        <SiteFooter />
    </div>
</template>

<script setup>
import { computed } from 'vue'

const route = useRoute()
const company = computed(() => companyBySlug(route.params.company))

useHead({
    title: () => (company.value ? `${company.value.name} — Handtekening & profielfoto` : 'Generator')
})
</script>
