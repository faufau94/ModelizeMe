import type { ColumnDef } from '@tanstack/vue-table'
import type { User } from '@/components/dataTable/data/schema'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { h } from 'vue'
import { labels, priorities, statuses } from '@/components/dataTable/data/data'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

export const columns: ColumnDef<User>[] = [
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
    accessorKey: 'email',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Email' }),
    cell: ({ row }) => h('div', { class: 'w-20' }, row.getValue('email')),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: 'first_name',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Prénom' }),
    cell: ({ row }) => {
      return h('div', { class: 'flex space-x-2' }, row.getValue('first_name'))
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Nom' }),
    cell: ({ row }) => {
      return h('div', { class: 'flex space-x-2' }, row.getValue('name'))
    },
  },{
    accessorKey: 'roles',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Role' }),
    cell: ({ row }) => {
      console.log(row.getValue('roles'));
      
      return h('div', { class: 'flex space-x-2' }, row.getValue('roles')[0]?.role?.name)
    },
  },
  {
    id: 'actions',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Action' }),
    cell: ({ row }) => h(DataTableRowActions, { row }),
  },
]
