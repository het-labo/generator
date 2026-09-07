<template>
    <Dialog v-model:open="open">
        <DialogTrigger as-child>
            <!--
                On a narrow overlay the label plus the unbreakable card title
                does not fit on one row, and the button was pushed off the
                panel. sr-only rather than hidden so the button keeps its name.
            -->
            <Button variant="outline" size="sm" class="gap-0 min-[360px]:gap-2">
                <component :is="locked ? LockIcon : LockOpenIcon" />
                <span class="sr-only min-[360px]:not-sr-only">{{ locked ? 'Ontgrendel' : 'Vergrendel' }}</span>
            </Button>
        </DialogTrigger>

        <DialogContent class="sm:max-w-[420px]">
            <form @submit.prevent="submit">
                <DialogHeader>
                    <DialogTitle>Bedrijfsgegevens ontgrendelen</DialogTitle>
                    <DialogDescription>
                        Deze velden staan vast zodat ze niet per ongeluk wijzigen. Vraag de code aan je beheerder.
                    </DialogDescription>
                </DialogHeader>

                <div class="grid gap-2 py-4">
                    <Label for="unlock-code">Code</Label>
                    <Input
                        id="unlock-code"
                        v-model="code"
                        type="password"
                        autocomplete="off"
                        :aria-invalid="error || undefined"
                        placeholder="••••••••"
                    />
                    <p v-if="error" class="text-sm text-destructive">Onjuiste code.</p>
                </div>

                <DialogFooter>
                    <DialogClose as-child>
                        <Button type="button" variant="ghost">Annuleer</Button>
                    </DialogClose>
                    <Button type="submit" :disabled="!code">Ontgrendel</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { LockIcon, LockOpenIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

const props = defineProps<{ locked: boolean; expected: string }>()
const emit = defineEmits<{ 'update:locked': [boolean] }>()

const open = ref(false)
const code = ref('')
const error = ref(false)

// Clicking the trigger while unlocked should just re-lock, not open a dialog.
watch(open, (isOpen) => {
    if (!isOpen) {
        code.value = ''
        error.value = false
        return
    }

    if (!props.locked) {
        open.value = false
        emit('update:locked', true)
        toast.info('Bedrijfsgegevens vergrendeld')
    }
})

const submit = () => {
    if (code.value !== props.expected) {
        error.value = true
        return
    }

    emit('update:locked', false)
    open.value = false
    toast.success('Bedrijfsgegevens ontgrendeld')
}
</script>
