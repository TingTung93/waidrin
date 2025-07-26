// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import type { WritableDraft } from "immer";
import type React from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface BackendUI {
  backendName: string;
  configurationTab: React.ReactNode;
  configurationPage: React.ReactNode;
}

export interface PluginsState {
  backendUIs: BackendUI[];
  set: (
    nextStateOrUpdater: PluginsState | Partial<PluginsState> | ((state: WritableDraft<PluginsState>) => void),
    shouldReplace?: false,
  ) => void;
}

export const usePluginsStateStore = create<PluginsState>()(
  immer((set) => ({
    backendUIs: [],
    set: set,
  })),
);

export function getPluginsState(): PluginsState {
  return usePluginsStateStore.getState();
}

export class Context {
  pluginName: string;

  constructor(pluginName: string) {
    this.pluginName = pluginName;
  }

  addBackendUI(backendName: string, configurationTab: React.ReactNode, configurationPage: React.ReactNode): void {
    getPluginsState().set((state) => {
      state.backendUIs.push({
        backendName,
        configurationTab,
        configurationPage,
      });
    });
  }
}
