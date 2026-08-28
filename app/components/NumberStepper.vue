<template>
    <div class="flex items-center rounded-md border">
        <Button
            variant="ghost"
            size="icon"
            class="size-8 shrink-0 rounded-r-none"
            :disabled="modelValue <= min"
            :aria-label="`${label} verkleinen`"
            @click="nudge(-step)"
        >
            <MinusIcon class="size-3.5" />
        </Button>

        <input
            :value="modelValue"
            type="number"
            :min="min"
            :max="max"
            :step="step"
            :aria-label="label"
            class="w-full min-w-0 border-x bg-transparent px-2 py-1 text-center text-sm tabular-nums outline-none [appearance:textfield] focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            @input="onInput"
        />

        <Button
            variant="ghost"
            size="icon"
            class="size-8 shrink-0 rounded-l-none"
            :disabled="modelValue >= max"
            :aria-label="`${label} vergroten`"
            @click="nudge(step)"
        >
            <PlusIcon class="size-3.5" />
        </Button>
    </div>
</template>

<script setup>
import { MinusIcon, PlusIcon } from '@lucide/vue'

const props = defineProps({
    modelValue: { type: Number, required: true },
    min: { type: Number, default: 1 },
    max: { type: Number, default: 200 },
    step: { type: Number, default: 1 },
    label: { type: String, default: 'Waarde' }
})

const emit = defineEmits(['update:modelValue'])

const clamp = (value) => Math.min(Math.max(value, props.min), props.max)

const nudge = (by) => emit('update:modelValue', clamp(props.modelValue + by))

const onInput = (event) => {
    const value = Number(event.target.value)
    // Typing a partial number ('' while clearing the field) must not reset the
    // preview to zero.
    if (Number.isFinite(value) && event.target.value !== '') emit('update:modelValue', clamp(value))
}
</script>
