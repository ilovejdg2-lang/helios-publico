import type { Resource, Role } from '../../shared/types';
import { uiLang } from '../locale';

export interface UsePlan {
  quantity: number;
  useCount: number;
  quantityDelta: number;
  note: string;
}

export type PlanResult =
  { ok: true; plan: UsePlan } | { ok: false; error: string };

export function planResourceUse(
  resource: Resource,
  quantity: number,
): PlanResult {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return {
      ok: false,
      error: 'La cantidad debe ser un entero mayor que cero.',
    };
  }
  if (resource.kind === 'consumable') {
    if (quantity > resource.quantity) {
      return {
        ok: false,
        error:
          'No hay existencias suficientes. El inventario no quedó en negativo.',
      };
    }
    return {
      ok: true,
      plan: {
        quantity: resource.quantity - quantity,
        useCount: resource.useCount + 1,
        quantityDelta: -quantity,
        note: 'Consumo registrado.',
      },
    };
  }
  return {
    ok: true,
    plan: {
      quantity: resource.quantity,
      useCount: resource.useCount + 1,
      quantityDelta: 0,
      note:
        uiLang() === 'en'
          ? 'Reusable equipment use. Units are not deducted.'
          : 'Uso de equipo reutilizable. Las unidades no se descuentan.',
    },
  };
}

export function planAdjustment(
  resource: Resource,
  nextQuantity: number,
): PlanResult {
  if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
    return {
      ok: false,
      error: 'La existencia debe ser un entero igual o mayor que cero.',
    };
  }
  return {
    ok: true,
    plan: {
      quantity: nextQuantity,
      useCount: resource.useCount,
      quantityDelta: nextQuantity - resource.quantity,
      note: 'Ajuste de existencias.',
    },
  };
}

export function actorMayUseInventory(role: Role): boolean {
  return role === 'medical' || role === 'ops';
}
