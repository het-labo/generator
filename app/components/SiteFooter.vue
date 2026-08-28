<template>
    <footer class="border-t py-8">
        <div class="mx-auto max-w-[1400px] px-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
            &copy; {{ year }}
            <a href="https://www.het-labo.be" target="_blank" rel="noopener" class="font-medium hover:text-foreground">Het Labo</a>.
            Alle rechten voorbehouden.
        </div>
    </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>
