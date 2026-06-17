import NodeCache from 'node-cache';

export const publicCache = new NodeCache({ stdTTL: 300, checkperiod: 310 });
