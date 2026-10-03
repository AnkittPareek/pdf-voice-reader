/**
 * Mock for expo-modules-core in Jest unit and integration tests.
 */

export function requireNativeModule(_name: string) {
  return null;
}

export class EventEmitter {
  addListener() {
    return { remove: () => {} };
  }
  removeListener() {}
  emit() {}
}

export type EventSubscription = {
  remove(): void;
};
