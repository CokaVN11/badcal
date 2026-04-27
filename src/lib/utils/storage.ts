// ABOUTME: Reactive localStorage/sessionStorage wrapper using Svelte 5 createSubscriber
// Provides type-safe, SSR-safe, cross-tab synced storage with minimal boilerplate

import { createSubscriber } from 'svelte/reactivity';

// https://hackernoon.com/mastering-type-safe-json-serialization-in-typescript
type JSONPrimitive = string | number | boolean | null | undefined;
type JSONValue =
    | JSONPrimitive
    | JSONValue[]
    | {
            [key: string]: JSONValue;
      };

interface ReactiveStorageConfig {
    prefix: string;
    storage: 'local' | 'session';
    onSet?: (key: string, newValue: JSONValue) => void;
}

interface ReactiveStorageItemConfig extends ReactiveStorageConfig {
    init: JSONValue;
}

interface ReactiveStorageItem extends Omit<ReactiveStorageItemConfig, 'storage'> {
    key: string;
    storage: Storage | null;
    value: JSONValue;
    update?: () => void;
}

type ReactiveStorage<ValueMap extends Record<string, JSONValue>> = ValueMap & {
    /**
     * set each item back to initial value (if any)
     **/
    reset: () => void;
};

export function createReactiveStorage<ValueMap extends Record<string, JSONValue>>(
    values: (keyof ValueMap | [key: keyof ValueMap, config: Partial<ReactiveStorageItemConfig>])[],
    config: Partial<ReactiveStorageConfig> = {}
): ReactiveStorage<ValueMap> {
    const globalConfig: ReactiveStorageConfig = {
        prefix: '',
        storage: 'local',
        ...config
    };

    // resolve config for each item
    const items = values.reduce(
        (acc, value) => {
            let key: string;
            let config: ReactiveStorageItemConfig;
            if (Array.isArray(value)) {
                config = { init: null, ...globalConfig, ...value[1] };
                key = value[0].toString();
            } else {
                config = { ...globalConfig, init: null };
                key = value.toString();
            }

            let storage: Storage | null = null;
            if (config.storage === 'local' && 'localStorage' in globalThis) {
                storage = localStorage;
            } else if (config.storage === 'session' && 'sessionStorage' in globalThis) {
                storage = sessionStorage;
            }

            const keyWithPrefix = config.prefix + key;
            acc[keyWithPrefix] = {
                ...config,
                key,
                storage,
                value: config.init,
                update: undefined
            };
            return acc;
        },
        {} as Record<string, ReactiveStorageItem>
    );

    const reactive = {} as ReactiveStorage<ValueMap>;
    for (const [keyWithPrefix, item] of Object.entries(items)) {
        const { storage, init, key } = item;

        // create subscriber — calls update() whenever storage changes
        const subscribe = createSubscriber((update) => {
            items[keyWithPrefix].update = update;
        });

        // initialize from storage
        const json = storage?.getItem(keyWithPrefix);
        if (json) {
            item.value = JSON.parse(json) as JSONValue;
        } else if (init !== null && init !== undefined) {
            storage?.setItem(keyWithPrefix, JSON.stringify(init));
        }

        // proxy via getter/setter — subscribes on read, persists on write
        Object.defineProperty(reactive, key, {
            enumerable: true,
            get() {
                subscribe();
                return item.value;
            },
            set(newValue: JSONValue) {
                item.value = newValue;
                if (!storage) return;
                if (newValue === null) {
                    storage.removeItem(keyWithPrefix);
                } else {
                    storage.setItem(keyWithPrefix, JSON.stringify(newValue));
                }
                globalConfig.onSet?.(key, newValue);
                item.update?.();
            }
        });
    }

    // implement reset method
    Object.defineProperty(reactive, 'reset', {
        enumerable: false,
        writable: false,
        configurable: false,
        value: () => {
            for (const item of Object.values(items)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (reactive as any)[item.key] = item.init;
            }
        }
    });

    // listen for storage changes from other documents
    if ('addEventListener' in globalThis) {
        globalThis.addEventListener('storage', (event) => {
            const { key: keyWithPrefix, storageArea, newValue } = event;
            if (!keyWithPrefix || !storageArea) return;
            const item = items[keyWithPrefix];
            if (!item || item.storage !== storageArea) return;
            item.value = JSON.parse(newValue || 'null') as JSONValue;
            item.update?.();
        });
    }

    return reactive;
}