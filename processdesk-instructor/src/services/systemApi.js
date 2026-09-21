import { getBridge } from './bridge.js';

export const systemApi = {
  summary: () => getBridge().getSystemSummary(),
};
