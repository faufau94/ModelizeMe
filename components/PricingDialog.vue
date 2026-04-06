<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button class=" w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md px-4 py-2 inline-flex items-center">
        <Crown class="mr-2 h-4 w-4 text-yellow-400 fill-yellow-400"/>
        Mettre à niveau
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[95%] sm:max-h-[95%] w-full h-full overflow-y-auto">
        <section class="py-24 px-4 min-h-screen bg-background" aria-labelledby="pricing-heading">
          <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-16">
              <h1 id="pricing-heading" class="text-4xl font-bold text-balance mb-4">
                Choose Your Plan
              </h1>
              <p class="text-xl text-muted-foreground text-balance mb-8">
                Select the perfect plan for your needs. Upgrade or downgrade at any time.
              </p>

              <!-- Toggle -->
              <div class="flex flex-col items-center gap-4 mb-8">
                <div class="flex items-center justify-center gap-4">
            <span
                :class="['text-sm font-medium w-16 text-center', !isYearly ? 'text-foreground' : 'text-muted-foreground']"
                id="monthly-label"
            >
              Monthly
            </span>
                  <button
                      @click="isYearly = !isYearly"
                      :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                isYearly ? 'bg-primary' : 'bg-accent'
              ]"
                      role="switch"
                      :aria-checked="isYearly"
                      aria-label="Toggle between monthly and yearly billing"
                  >
              <span
                  :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                ]"
                  aria-hidden="true"
              />
                  </button>
                  <span
                      :class="['text-sm font-medium w-16 text-center', isYearly ? 'text-foreground' : 'text-muted-foreground']"
                      id="yearly-label"
                  >
              Yearly
            </span>
                </div>
                <div class="min-h-[24px] flex justify-center">
                  <Badge v-if="isYearly" variant="secondary" aria-label="17% savings with yearly billing">
                    Save 17%
                  </Badge>
                </div>
              </div>
            </div>

            <!-- Pricing Cards -->
            <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" role="list" aria-label="Pricing plans">
              <Card
                  v-for="(plan, index) in pricingPlans"
                  :key="plan.name"
                  :class="[
            'relative flex flex-col h-[600px]',
            plan.popular ? 'border-primary shadow-lg scale-105' : ''
          ]"
                  role="listitem"
                  :aria-labelledby="`plan-${index}-title`"
                  :aria-describedby="`plan-${index}-description plan-${index}-price`"
              >
                <Badge
                    v-if="plan.popular"
                    class="absolute -top-3 left-1/2 -translate-x-1/2"
                    aria-label="Most popular plan"
                >
                  Most Popular
                </Badge>

                <CardHeader class="text-center pb-8">
                  <CardTitle class="text-2xl font-bold" :id="`plan-${index}-title`">
                    {{ plan.name }}
                  </CardTitle>
                  <CardDescription class="text-balance" :id="`plan-${index}-description`">
                    {{ plan.description }}
                  </CardDescription>
                  <div class="mt-4" :id="`plan-${index}-price`">
              <span
                  class="text-4xl font-bold"
                  :aria-label="`${isYearly ? plan.yearlyPrice : plan.monthlyPrice} dollars per ${isYearly ? 'year' : 'month'}`"
              >
                ${{ isYearly ? plan.yearlyPrice : plan.monthlyPrice }}
              </span>
                    <span class="text-muted-foreground" aria-hidden="true">
                /{{ isYearly ? 'year' : 'month' }}
              </span>
                    <div
                        v-if="isYearly"
                        class="text-sm text-muted-foreground mt-1"
                        :aria-label="`Equivalent to ${Math.round(plan.yearlyPrice / 12)} dollars per month when billed annually`"
                    >
                      ${{ Math.round(plan.yearlyPrice / 12) }}/month billed annually
                    </div>
                  </div>
                </CardHeader>

                <CardContent class="flex-grow">
                  <ul class="space-y-3" :aria-label="`${plan.name} plan features`">
                    <li v-for="(feature, featureIndex) in plan.features" :key="featureIndex" class="flex items-start gap-3">
                      <Check class="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span class="text-sm">{{ feature }}</span>
                    </li>
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                      :class="[
                'w-full',
                !plan.popular ? 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:border-gray-600' : ''
              ]"
                      :variant="plan.popular ? 'default' : 'outline'"
                      size="lg"
                      :aria-label="`Get started with ${plan.name} plan for $${isYearly ? plan.yearlyPrice : plan.monthlyPrice} per ${isYearly ? 'year' : 'month'}`"
                  >
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <!-- Footer -->
            <div class="text-center mt-16">
              <p class="text-muted-foreground">All plans include a 14-day free trial. No credit card required.</p>
            </div>
          </div>
        </section>
    </DialogContent>
  </Dialog>
</template>

<script setup>

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import {Crown, Check} from "lucide-vue-next";
import { ref } from 'vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

  const isYearly = ref(false)

  const pricingPlans = [
  {
    name: 'Starter',
    description: 'Perfect for individuals and small projects',
    monthlyPrice: 9,
    yearlyPrice: 90,
    features: ['Up to 5 projects', '10GB storage', 'Basic support', 'Standard templates', 'Email notifications'],
    popular: false,
  },
  {
    name: 'Professional',
    description: 'Ideal for growing teams and businesses',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
    'Unlimited projects',
    '100GB storage',
    'Priority support',
    'Premium templates',
    'Advanced analytics',
    'Team collaboration',
    'Custom integrations',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with advanced needs',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
    'Everything in Professional',
    'Unlimited storage',
    '24/7 dedicated support',
    'Custom development',
    'Advanced security',
    'SSO integration',
    'API access',
    'White-label options',
    ],
    popular: false,
  }]
</script>