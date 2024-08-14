<template>
  <client-only>
    <div class="dndflow">
      <Sidebar/>

      <FlowMCD/>

      <FlowMLD/>
    </div>
  </client-only>
</template>
<script setup lang="ts">
import FlowMCD from "~/components/flow/FlowMCD.vue";
import FlowMLD from "~/components/flow/FlowMLD.vue";
import Sidebar from "~/components/flow/Sidebar.vue";
</script>
