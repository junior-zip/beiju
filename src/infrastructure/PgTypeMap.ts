import { ColumnSchema } from "@core/interfaces/IDataSourceAdapter.js"

export const PG_TYPE_MAP: Record<string, ColumnSchema['type']> = {
  integer:          'number',
  int4:             'number',
  int8:             'number',
  bigint:           'number',
  smallint:         'number',
  numeric:          'number',
  decimal:          'number',
  real:             'number',
  float4:           'number',
  float8:           'number',
  'double precision': 'number',

  text:             'string',
  varchar:          'string',
  'character varying': 'string',
  char:             'string',
  bpchar:           'string',
  uuid:             'string',

  date:             'date',
  timestamp:        'date',
  timestamptz:      'date',
  'timestamp without time zone': 'date',
  'timestamp with time zone':    'date',

  bool:             'boolean',
  boolean:          'boolean',
}