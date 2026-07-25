// Shared shape for useActionState-driven Server Actions across the app.
export type ActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export const IDLE_STATE: ActionState = { status: "idle" };
