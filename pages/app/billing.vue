<template>
  <div class="px-6 py-6 lg:px-8 max-w-4xl mx-auto w-full">
    <div class="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Facturation</CardTitle>
          <CardDescription>
            Gérez votre abonnement et vos informations de paiement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard class="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p class="text-sm text-muted-foreground">
              La gestion de la facturation sera bientôt disponible.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { CreditCard } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

definePageMeta({
  layout: 'sidebar-account',
})
</script>
