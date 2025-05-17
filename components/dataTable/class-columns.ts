import type { ColumnDef } from '@tanstack/vue-table'
import type { Class } from '@/components/dataTable/data/schema'

import { Checkbox } from '@/components/ui/checkbox'
import { h } from 'vue'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

export function getClassColumns({ confirmDeleteClass, createClassDialog }: {
  confirmDeleteClass: (classObj: Class) => void,
  createClassDialog: (classObj: Class) => void
}): ColumnDef<Class>[] {

  return [
  {
    id: 'select',
    header: ({ table }) => h(Checkbox, {
      'modelValue': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
      'onUpdate:modelValue': value => table.toggleAllPageRowsSelected(!!value),
      'ariaLabel': 'Select all',
      'class': 'translate-y-0.5',
    }),
    cell: ({ row }) => h(Checkbox, { 'modelValue': row.getIsSelected(), 'onUpdate:modelValue': value => row.toggleSelected(!!value), 'ariaLabel': 'Select row', 'class': 'translate-y-0.5' }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Nom de classe' }),
    cell: ({ row }) => h('div', { class: 'w-26' }, row.getValue('name')),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: 'ownerId',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Professeur' }),
    cell: ({ row }) => {      
      return h('div', { class: 'flex space-x-2' }, row.original.owner.first_name + ' ' + row.original.owner.name)
    },
  },
  {
    accessorKey: 'joinCode',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: "Code d'accès" }),
    cell: ({ row }) => {
      return h('div', { class: 'flex space-x-2' }, row.getValue('joinCode'))
    },
  },
  {
    id: 'actions',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Action' }),
    cell: ({ row }) => h(DataTableRowActions, {
      row,
      actions: [
        { label: 'Supprimer', onClick: r => confirmDeleteClass(r.original), class: 'text-red-500' },
      ]
    })
  },
]
}

