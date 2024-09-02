import {computed, ref} from "vue";
import {defineStore} from "pinia";
import {getStraightPath, useVueFlow} from "@vue-flow/core";
import { useMCDStore } from "./mcd-store.js";

export const useMPDStore = defineStore('flow-mpd', () => {

    const flowMPD = ref(null)

    function setFlowInstance(instance) {
        flowMPD.value = instance;  // Assigner l'instance de useVueFlow
    }

    const generateMPD = () => {

    }


    return {
        flowMPD,
        generateMPD,
        setFlowInstance
    }
})