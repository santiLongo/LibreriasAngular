export const ICONS = {
  // acciones básicas
  add: 'add',
  remove: 'close',
  edit: 'edit',
  delete: 'delete',
  save: 'save',
  view: 'visibility',

  // búsqueda
  search: 'search',
  filter: 'filter_list',
  sort: 'sort',

  // navegación
  home: 'home',
  back: 'arrow_back',
  next: 'arrow_forward',

  // usuarios
  user: 'person',
  users: 'groups',
  employee: 'badge',

  // empresa
  company: 'business',
  warehouse: 'warehouse',
  inventory: 'inventory',

  // logística
  truck: 'local_shipping',
  route: 'route',
  map: 'map',
  location: 'location_on',
  schedule: 'schedule',

  // estados
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',

  // comunicación
  phone: 'phone',
  email: 'email',
  notifications: 'notifications',

  // sistema
  settings: 'settings',
  advanced: 'tune',
  close: 'close',
  assignment_add: 'assignment_add',
  worker:'person_apron',
  engineering: 'engineering',
  caja_herr:'home_repair_service',
  dolar: 'attach_money',
  billete: 'payments',
  billetera: 'wallet',
  bank: 'account_balance',
  apps: 'apps',
  folder: 'folder_copy',
  download: 'download'
} as const;

export type IconKey = keyof typeof ICONS;
export type IconValue = typeof ICONS[IconKey];