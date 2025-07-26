// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { readFile } from "node:fs/promises";
import path from "node:path";
import { glob } from "fast-glob";
import { NextResponse } from "next/server";

export interface Manifest {
  path: string;
  name: string;
  main: string;
  settings: Record<string, unknown>;
}

const PLUGINS_DIR = process.env.PLUGINS_DIR || path.join(process.cwd(), "plugins");

// Endpoint /plugins: Return manifests for all plugins in plugins directory.
export async function GET() {
  try {
    const manifests: Manifest[] = [];
    const manifestFiles = await glob("*/manifest.json", { cwd: PLUGINS_DIR });

    for (const manifestFile of manifestFiles) {
      const manifestContent = await readFile(path.join(PLUGINS_DIR, manifestFile), "utf-8");
      const manifest: Manifest = JSON.parse(manifestContent);
      manifest.path = path.dirname(manifestFile);
      manifests.push(manifest);
    }

    return NextResponse.json(manifests);
  } catch (error) {
    console.error(error);

    // SECURITY: This is not a public API, so we return the same response
    //           regardless of the error to prevent any information leakage.
    return NextResponse.json({}, { status: 500 });
  }
}
