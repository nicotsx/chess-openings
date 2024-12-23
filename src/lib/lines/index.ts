import { ruyLopezDAG } from './ruy-lopez';

export const OPENING_LINES = {
  'Ruy Lopez': ruyLopezDAG,
};

export type Opening = keyof typeof OPENING_LINES;
