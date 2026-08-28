<template>
    <!-- TooltipProvider must wrap anything that renders a Tooltip. -->
    <TooltipProvider :delay-duration="200">
        <NuxtPage />
        <Toaster position="bottom-right" rich-colors />
    </TooltipProvider>
</template>
