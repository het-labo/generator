<template>
    <!--
        The block of download/copy actions that sits under every preview.
        Shared so the four tabs cannot drift apart again: same place, same
        order, same button sizes. Put the main action first — it gets the solid
        fill and the remaining width; anything after it renders as an outline
        button beside it.
    -->
    <div class="space-y-3 rounded-xl border bg-card p-4">
        <dl v-if="$slots.details" class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <slot name="details" />
        </dl>

        <div class="flex flex-wrap gap-2">
            <slot />
        </div>

        <p v-if="$slots.note" class="text-xs text-muted-foreground">
            <slot name="note" />
        </p>
    </div>
</template>
