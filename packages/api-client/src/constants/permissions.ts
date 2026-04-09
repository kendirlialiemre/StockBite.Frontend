export const Permissions = {
  Menu: { View: 'Menu.View', Edit: 'Menu.Edit' },
  Orders: {
    View: 'Orders.View',
    Create: 'Orders.Create',
    Close: 'Orders.Close',
    Cancel: 'Orders.Cancel',
  },
  Stock: {
    View: 'Stock.View',
    AddItem: 'Stock.AddItem',
    EditItem: 'Stock.EditItem',
    AddMovement: 'Stock.AddMovement',
  },
  ProfitLoss: { View: 'ProfitLoss.View' },
  Tables: { View: 'Tables.View', Manage: 'Tables.Manage' },
  Memberships: { View: 'Memberships.View', Manage: 'Memberships.Manage' },
} as const;

export const ModuleType = {
  Menu: 1,
  Orders: 2,
  Stock: 3,
  ProfitLoss: 4,
  Tables: 5,
  Memberships: 6,
} as const;
