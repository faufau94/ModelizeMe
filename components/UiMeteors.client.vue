<template>
  <div ref="meteorContainer" class="relative w-full h-full">
    <span v-for="(s, i) in meteorStyles" :key="i" :class="localStyles().wrapper()" :style="s">
      <div :class="localStyles().tail()"></div>
    </span>
  </div>
</template>

<script lang="ts" setup>
import type { CSSProperties } from "vue";
import { ref, watch, onMounted } from "vue";
import { tv } from 'tailwind-variants';

const props = withDefaults(
    defineProps<{
      number?: number;
      class?: any;
    }>(),
    {
      number: 20,
    }
);

const meteorStyles = ref<CSSProperties[]>([]);
const meteorContainer = ref<HTMLElement | null>(null);

const setStyles = () => {
  if (meteorContainer.value) {
    const { offsetWidth, offsetHeight } = meteorContainer.value;

    const meteorCount = Math.floor(Math.random() * props.number) + 1; // Générer un nombre aléatoire de météores entre 1 et props.number

    meteorStyles.value = [...new Array(meteorCount)].map(() => ({
      top: Math.floor(Math.random() * offsetHeight) + "px",
      left: Math.floor(Math.random() * (offsetWidth - 50)) - 20 + "px", // Décalage vers la gauche pour plus d'espace négatif
      animationDelay: (Math.random() * 1 + 0.5) + "s", // Augmenter légèrement le délai d'animation
      animationDuration: Math.random() * 4 + 8 + "s", // Durée d'animation entre 8 et 12 secondes pour rendre le tout plus rapide
    }));
  }
};

onMounted(() => {
  setStyles();
});

watch(() => props.number, setStyles, { immediate: true });

const localStyles = tv({
  slots: {
    wrapper:
        "pointer-events-none absolute h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-[9999px] bg-muted-foreground shadow-[0_0_0_1px_#ffffff10]",
    tail: "pointer-events-none absolute top-1/2 -z-10 h-[1px] w-[50px] -translate-y-1/2 bg-gradient-to-r from-muted-foreground to-transparent",
  },
});
</script>

<style scoped>
.meteorContainer {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
