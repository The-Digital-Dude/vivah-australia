import { Types } from 'mongoose';

export function pairKeyForUsers(
  firstUserId: Types.ObjectId | string,
  secondUserId: Types.ObjectId | string,
) {
  return [String(firstUserId), String(secondUserId)].sort().join(':');
}
