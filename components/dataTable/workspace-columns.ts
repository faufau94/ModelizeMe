import type { ColumnDef } from '@tanstack/vue-table'
import type { Workspace } from '@/components/dataTable/data/schema'

import { Checkbox } from '@/components/ui/checkbox'
import { h } from 'vue'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

export function getWorkspaceColumns({ confirmDeleteWorkspace, createWorkspaceDialog }: {
  confirmDeleteWorkspace: (classObj: Workspace) => void,
  createWorkspaceDialog: (classObj: Workspace) => void
}): ColumnDef<Workspace>[] {

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
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Nom' }),
    cell: ({ row }) => h('div', { class: 'w-26' }, row.getValue('name')),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: 'ownerId',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Gérant' }),
    cell: ({ row }) => {      
      return h('div', { class: 'flex space-x-2' }, row.original.owner.first_name + ' ' + row.original.owner.name)
    },
  },
  {
    accessorKey: 'inviteCode',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: "Code d'accès" }),
    cell: ({ row }) => {
      return h('div', { class: 'flex space-x-2' }, row.getValue('inviteCode'))
    },
  },
  {
    id: 'actions',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Action' }),
    cell: ({ row }) => h(DataTableRowActions, {
      row,
      actions: [
        { label: 'Supprimer', onClick: r => confirmDeleteWorkspace(r.original), class: 'text-red-500' },
      ]
    })
  },
]
}

