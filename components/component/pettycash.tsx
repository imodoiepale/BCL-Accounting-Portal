/* eslint-disable react/no-unescaped-entities */
// @ts-nocheck
"use client";

import PettyCashManager from './pettycash/pettycash';

export function PettyCash() {

  return (
    <div className="flex w-full bg-muted/40">
      <main className="flex-1 w-full">
        <PettyCashManager/>
      </main>
    </div>
  );
}