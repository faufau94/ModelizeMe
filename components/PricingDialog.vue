<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button class=" w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md px-4 py-2 inline-flex items-center">
        <Crown class="mr-2 h-4 w-4 text-yellow-400 fill-yellow-400"/>
        Mettre à niveau
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[95%] sm:max-h-[95%] w-full h-full overflow-y-auto">
      <div class="relative mt-5">
        <div class="">
          <p class="font-semibold text-primary text-3xl">Tarification</p>
          <h2 class="mb-4 mt-3 text-sm font-semibold lg:mb-5 lg:text-sm text-gray-500">
            Un tarif simple et transparent.
          </h2>
        </div>

        <div class="grid grid-cols-1 gap-y-10 py-10 lg:grid-cols-3 lg:gap-8 lg:gap-y-12 lg:py-10 overflow-y-auto">
          <template v-for="(p, i) in prices" :key="i">
            <Card
                class=""
                :class="[i === prices.length - 2 ? 'border-primary shadow-lg' : '']"
            >
              <CardContent class="flex w-full flex-col items-center mt-10 ">
<!--                <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">-->
<!--                  <Icon :name="p.icon" class="h-6 w-6 text-primary" />-->
<!--                </div>-->
                <h3 class="mb-2 text-xl font-semibold text-primary">{{ p.title }} </h3>
                <p class="text-4xl/loose font-semibold lg:text-5xl/snug">{{ p.price }} €/mois</p>
                <p class="mt-2 text-muted-foreground">Facturation annuelle</p>

                <ul class="flex w-full flex-col items-center gap-4 px-5 py-8 lg:items-start">
                  <li v-for="(perk, k) in p.perks" :key="k" class="flex items-center gap-3">
                    <Check />
                    <span class="opacity-80">{{ perk }}</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter class="border-t bg-muted !pt-6 dark:border-muted/50 dark:bg-muted/30">
                <Button class="w-full"> Commencer </Button>
              </CardFooter>
            </Card>
          </template>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import {Crown, Check} from "lucide-vue-next";


const prices = [
  {
    icon: "heroicons:bolt",
    title: "Gratuit",
    price: 0,
    perks: [
      "Accès aux outils essentiels",
      "Limité à 10 utilisateurs",
      "Stockage 20GB par utilisateur",
      "Support standard par email",
      "Rapports basiques",
    ],
  },
  {
    icon: "heroicons:bolt",
    title: "Pro",
    price: 18.99,
    perks: [
      "Accès aux intégrations avancées",
      "Rapports détaillés",
      "Jusqu'à 20 utilisateurs",
      "Stockage 40GB par utilisateur",
      "Support prioritaire",
    ],
  },
  {
    icon: "heroicons:bolt",
    title: "École",
    price: 'NC',
    perks: [
      "Champs et options de personnalisation",
      "Suivi complet des activités",
      "Utilisateurs illimités",
      "Stockage sans limite",
      "Accompagnement dédié",
    ],
  },
];

</script>