"use client";

/**
 * JoshBucks — the shared cross-game wallet (POND sells fish into it,
 * DERBY will bet out of it). One localStorage key, safe defaults,
 * and a React hook that stays in sync across components and tabs.
 */
import { useSyncExternalStore } from "react";

const KEY = "joshos.wallet.v1";
const EVENT = "joshos-wallet-changed";
export const STARTING_BALANCE = 1000;

function readBalance(): number {
  if (typeof window === "undefined") return STARTING_BALANCE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return STARTING_BALANCE;
    const value = Number(JSON.parse(raw).balance);
    return Number.isFinite(value)
      ? Math.max(0, Math.round(value))
      : STARTING_BALANCE;
  } catch {
    return STARTING_BALANCE;
  }
}

function writeBalance(balance: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ balance }));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Storage full/blocked: the game keeps working, balance just won't persist.
  }
}

export function getBalance(): number {
  return readBalance();
}

export function deposit(amount: number): void {
  if (amount <= 0) return;
  writeBalance(readBalance() + Math.round(amount));
}

/** Returns false (and changes nothing) when funds are insufficient. */
export function withdraw(amount: number): boolean {
  const rounded = Math.round(amount);
  if (rounded <= 0) return false;
  const balance = readBalance();
  if (balance < rounded) return false;
  writeBalance(balance - rounded);
  return true;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange); // cross-tab sync
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Live wallet balance for React components. */
export function useWallet(): number {
  return useSyncExternalStore(subscribe, readBalance, () => STARTING_BALANCE);
}
