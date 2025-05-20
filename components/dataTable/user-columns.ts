import type { ColumnDef } from '@tanstack/vue-table'
import type { User } from '@/components/dataTable/data/schema'

import { Checkbox } from '@/components/ui/checkbox'
import { h } from 'vue'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

export function getUserColumns({ editUserDialog, confirmDeleteUser, createWorkspaceDialog }: {
  editUserDialog: (user: User) => void
  confirmDeleteUser: (user: User) => void,
  createWorkspaceDialog: (user: User) => void
}): ColumnDef<User>[] {

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
      return h('div', { class: 'flex space-x-2' }, row.getValue('roles')[0]?.role?.name)
    },
  },
  {
    id: 'actions',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Action' }),
    cell: ({ row }) => h(DataTableRowActions, {
      row,
      actions: [
        { label: 'Éditer', onClick: r => editUserDialog(r.original) },
        { label: 'Créer une classe', onClick: r => createWorkspaceDialog(r.original) },
        { label: 'Supprimer', onClick: r => confirmDeleteUser(r.original), class: 'text-red-500' },
      ]
    })
  },
]
}

