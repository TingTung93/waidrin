// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { readFile } from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";

const PLUGINS_DIR = process.env.PLUGINS_DIR || path.join(process.cwd(), "plugins");

// Endpoint /plugins/[path]: Serve JavaScript files from plugins directory.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    let filePath = (await params).path.join("/");

    // SECURITY: This is *extremely* important because it allows us to detect
    //           path traversal attacks (see below). Next.js already seems to
    //           prevent traversal by resolving paths inside its routing system,
    //           but we're not taking any chances.
    filePath = path.resolve(PLUGINS_DIR, filePath);

    if (!filePath.startsWith(PLUGINS_DIR)) {
      throw new Error(`Attempted path traversal outside of plugins directory: ${filePath}`);
    }

    if (!filePath.endsWith(".js")) {
      throw new Error(`Attempted access of non-JS file in plugins directory: ${filePath}`);
    }

    const fileContent = await readFile(filePath, "utf-8");

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "text/javascript",
      },
    });
  } catch (error) {
    console.error(error);

    // SECURITY: This is not a public API, so we return the same response
    //           regardless of the error to prevent any information leakage.
    return NextResponse.json({}, { status: 500 });
  }
}
