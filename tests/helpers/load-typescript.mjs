import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);

export function loadTypeScript(relativePath, mocks = {}) {
  const filename = resolve(process.cwd(), relativePath);
  const source = readFileSync(filename, "utf8");
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });
  const errors = (diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (errors.length) {
    throw new Error(ts.formatDiagnostics(errors, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: process.cwd,
      getNewLine: () => "\n",
    }));
  }

  const compiledModule = { exports: {} };
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    return nodeRequire(id);
  };
  new Function("require", "module", "exports", outputText)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
