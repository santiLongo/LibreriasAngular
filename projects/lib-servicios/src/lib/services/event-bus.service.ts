import { Injectable } from '@angular/core';
import { EMPTY, Observable, isObservable, of } from 'rxjs';

export type EventHandler<T = any, TResponse = any> =
  (payload: T) => TResponse | Observable<TResponse>;

export interface ListenerToken {
  key: string;
  unregister(): void;
}

type DuplicatePolicy = 'throw' | 'replace' | 'ignore';

@Injectable({ providedIn: 'root' })
export class EventBusService {
  private listeners = new Map<string, EventHandler>();

  register<T = any, TResponse = any>(          // ← ahora también lleva TResponse
    key: string,
    handler: EventHandler<T, TResponse>,
    onDuplicate: DuplicatePolicy = 'throw',
  ): ListenerToken {
    if (this.listeners.has(key)) {
      switch (onDuplicate) {
        case 'throw':
          throw new Error(`[EventBus] Ya hay un oyente con la clave "${key}"`);
        case 'ignore':
          return { key, unregister: () => {} };
        case 'replace':
          break;
      }
    }

    this.listeners.set(key, handler as EventHandler);

    return {
      key,
      unregister: () => {
        if (this.listeners.get(key) === handler) {
          this.listeners.delete(key);
        }
      },
    };
  }

  // sincrónico: usalo SOLO para handlers sincrónicos
  emit<T = any, TResponse = any>(key: string, payload?: T): TResponse | undefined {
    const handler = this.listeners.get(key);
    if (!handler) {
      console.warn(`[EventBus] No hay oyente para "${key}"`);
      return undefined;
    }
    return handler(payload) as TResponse;
  }

  // aplana: si el handler ya devuelve Observable, lo pasa tal cual
  emit$<T = any, TResponse = any>(key: string, payload?: T): Observable<TResponse> {
    const handler = this.listeners.get(key);
    if (!handler) {
      console.warn(`[EventBus] No hay oyente para "${key}"`);
      return EMPTY;
    }
    const result = handler(payload);
    return isObservable(result) ? result as Observable<TResponse> : of(result as TResponse);
  }

  has(key: string): boolean {
    return this.listeners.has(key);
  }
}