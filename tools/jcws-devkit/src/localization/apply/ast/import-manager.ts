import {
  Node,
  SyntaxKind,
  type ArrowFunction,
  type Block,
  type FunctionDeclaration,
  type FunctionExpression,
  type ImportDeclaration,
  type SourceFile,
  type VariableDeclaration,
} from "ts-morph";

import type {
  LocalizationImportManagementResult,
  LocalizationRewriteOptions,
} from "./types.js";

type TranslationScope =
  | ArrowFunction
  | FunctionDeclaration
  | FunctionExpression;

type ScopeBindingOutcome =
  | "external"
  | "existing-hook"
  | "inserted-hook"
  | "updated-hook"
  | "unsupported";

function localImportName(importDeclaration: ImportDeclaration): string | undefined {
  const namedImport = importDeclaration
    .getNamedImports()
    .find((candidate) => candidate.getName() === "useTranslation");

  return namedImport?.getAliasNode()?.getText() ?? namedImport?.getName();
}

function findTranslationImport(
  sourceFile: SourceFile,
  moduleName: string,
): ImportDeclaration | undefined {
  return sourceFile
    .getImportDeclarations()
    .find((declaration) => declaration.getModuleSpecifierValue() === moduleName);
}

function translationHookLocalName(
  sourceFile: SourceFile,
  options: LocalizationRewriteOptions,
): string {
  const existingImport = findTranslationImport(
    sourceFile,
    options.translationModule,
  );

  return existingImport === undefined
    ? options.translationHook
    : localImportName(existingImport) ?? options.translationHook;
}

function ensureTranslationImport(
  sourceFile: SourceFile,
  options: LocalizationRewriteOptions,
): "added" | "existing" | "updated" {
  const existingImport = findTranslationImport(
    sourceFile,
    options.translationModule,
  );

  if (existingImport === undefined) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: options.translationModule,
      namedImports: [options.translationHook],
    });
    return "added";
  }

  if (localImportName(existingImport) !== undefined) {
    return "existing";
  }

  existingImport.addNamedImport(options.translationHook);
  return "updated";
}

function scopeName(scope: TranslationScope): string | undefined {
  if (Node.isFunctionDeclaration(scope)) {
    return scope.getName();
  }

  const parent = scope.getParent();
  return Node.isVariableDeclaration(parent) ? parent.getName() : undefined;
}

function returnsJsx(scope: TranslationScope): boolean {
  const body = scope.getBody();

  if (!Node.isBlock(body)) {
    return (
      Node.isJsxElement(body) ||
      Node.isJsxSelfClosingElement(body) ||
      Node.isJsxFragment(body)
    );
  }

  return (
    body.getFirstDescendantByKind(SyntaxKind.JsxElement) !== undefined ||
    body.getFirstDescendantByKind(SyntaxKind.JsxSelfClosingElement) !== undefined ||
    body.getFirstDescendantByKind(SyntaxKind.JsxFragment) !== undefined
  );
}

function isReactComponentScope(scope: TranslationScope): boolean {
  const name = scopeName(scope);
  const hasComponentName = name !== undefined && /^[A-Z]/u.test(name);
  return hasComponentName || returnsJsx(scope);
}

function nearestTranslationScope(node: Node): TranslationScope | undefined {
  return node.getFirstAncestor((ancestor): ancestor is TranslationScope => {
    if (
      !Node.isArrowFunction(ancestor) &&
      !Node.isFunctionDeclaration(ancestor) &&
      !Node.isFunctionExpression(ancestor)
    ) {
      return false;
    }

    return isReactComponentScope(ancestor);
  });
}

function isDeclarationInsideScope(
  declaration: VariableDeclaration,
  scope: TranslationScope,
): boolean {
  return declaration.getFirstAncestor((ancestor) => ancestor === scope) === scope;
}

function objectBindingHasName(
  declaration: VariableDeclaration,
  name: string,
): boolean {
  const nameNode = declaration.getNameNode();
  return (
    Node.isObjectBindingPattern(nameNode) &&
    nameNode.getElements().some((element) => element.getName() === name)
  );
}

function sourceHasImportedTranslationFunction(
  sourceFile: SourceFile,
  translationFunction: string,
): boolean {
  return sourceFile.getImportDeclarations().some((declaration) =>
    declaration.getNamedImports().some((namedImport) => {
      const localName = namedImport.getAliasNode()?.getText() ?? namedImport.getName();
      return localName === translationFunction;
    }),
  );
}

function scopeHasTranslationParameter(
  scope: TranslationScope,
  translationFunction: string,
): boolean {
  return scope.getParameters().some((parameter) => {
    const nameNode = parameter.getNameNode();

    if (Node.isObjectBindingPattern(nameNode)) {
      return nameNode
        .getElements()
        .some((element) => element.getName() === translationFunction);
    }

    return parameter.getName() === translationFunction;
  });
}

function findHookDeclaration(
  scope: TranslationScope,
  hookLocalName: string,
): VariableDeclaration | undefined {
  return scope
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .filter((declaration) => isDeclarationInsideScope(declaration, scope))
    .find((declaration) => {
      const initializer = declaration.getInitializer();
      return (
        initializer !== undefined &&
        Node.isCallExpression(initializer) &&
        initializer.getExpression().getText() === hookLocalName
      );
    });
}

function blockForScope(scope: TranslationScope): Block | undefined {
  const body = scope.getBody();
  return Node.isBlock(body) ? body : undefined;
}

function insertHookIntoScope(
  scope: TranslationScope,
  hookLocalName: string,
  translationFunction: string,
): boolean {
  const block = blockForScope(scope);
  const statement = `const { ${translationFunction} } = ${hookLocalName}();`;

  if (block !== undefined) {
    block.insertStatements(0, statement);
    return true;
  }

  if (!Node.isArrowFunction(scope)) {
    return false;
  }

  const body = scope.getBody();
  const expressionText = body.getText();
  body.replaceWithText(`{\n  ${statement}\n  return ${expressionText};\n}`);
  return true;
}

function appendObjectBindingElement(
  declaration: VariableDeclaration,
  translationFunction: string,
): boolean {
  const nameNode = declaration.getNameNode();
  if (!Node.isObjectBindingPattern(nameNode)) {
    return false;
  }

  const existingElements = nameNode.getElements().map((element) => element.getText());
  nameNode.replaceWithText(
    `{ ${[...existingElements, translationFunction].join(", ")} }`,
  );
  return true;
}

function ensureScopeTranslationBinding(
  scope: TranslationScope,
  sourceFile: SourceFile,
  hookLocalName: string,
  translationFunction: string,
): ScopeBindingOutcome {
  if (
    scopeHasTranslationParameter(scope, translationFunction) ||
    sourceHasImportedTranslationFunction(sourceFile, translationFunction)
  ) {
    return "external";
  }

  const hookDeclaration = findHookDeclaration(scope, hookLocalName);
  if (hookDeclaration !== undefined) {
    if (objectBindingHasName(hookDeclaration, translationFunction)) {
      return "existing-hook";
    }

    return appendObjectBindingElement(hookDeclaration, translationFunction)
      ? "updated-hook"
      : "unsupported";
  }

  return insertHookIntoScope(scope, hookLocalName, translationFunction)
    ? "inserted-hook"
    : "unsupported";
}

function generatedTranslationScopes(
  sourceFile: SourceFile,
  translationFunction: string,
  translatedKeys: ReadonlySet<string>,
): readonly TranslationScope[] {
  const scopes = new Map<number, TranslationScope>();

  for (const callExpression of sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )) {
    if (callExpression.getExpression().getText() !== translationFunction) {
      continue;
    }

    const firstArgument = callExpression.getArguments()[0];
    if (
      firstArgument === undefined ||
      !Node.isStringLiteral(firstArgument) ||
      !translatedKeys.has(firstArgument.getLiteralValue())
    ) {
      continue;
    }

    const scope = nearestTranslationScope(callExpression);
    if (scope !== undefined) {
      scopes.set(scope.getStart(), scope);
    }
  }

  return [...scopes.values()].sort(
    (left, right) => right.getStart() - left.getStart(),
  );
}

export function manageReactTranslationImports(
  sourceFile: SourceFile,
  translatedKeys: ReadonlySet<string>,
  options: LocalizationRewriteOptions,
): LocalizationImportManagementResult {
  if (
    !options.manageImports ||
    options.translationFunction.includes(".") ||
    !sourceFile.getFilePath().endsWith("x") ||
    translatedKeys.size === 0
  ) {
    return {
      attempted: false,
      importAdded: false,
      importUpdated: false,
      hookInsertions: 0,
      hookUpdates: 0,
      existingBindings: 0,
      unsupportedScopes: 0,
    };
  }

  const hookLocalName = translationHookLocalName(sourceFile, options);
  const scopes = generatedTranslationScopes(
    sourceFile,
    options.translationFunction,
    translatedKeys,
  );
  let hookInsertions = 0;
  let hookUpdates = 0;
  let existingBindings = 0;
  let unsupportedScopes = 0;
  let requiresHookImport = false;

  for (const scope of scopes) {
    const outcome = ensureScopeTranslationBinding(
      scope,
      sourceFile,
      hookLocalName,
      options.translationFunction,
    );

    switch (outcome) {
      case "inserted-hook":
        hookInsertions += 1;
        requiresHookImport = true;
        break;
      case "updated-hook":
        hookUpdates += 1;
        requiresHookImport = true;
        break;
      case "existing-hook":
        existingBindings += 1;
        requiresHookImport = true;
        break;
      case "external":
        existingBindings += 1;
        break;
      case "unsupported":
        unsupportedScopes += 1;
        break;
    }
  }

  const importOutcome = requiresHookImport
    ? ensureTranslationImport(sourceFile, options)
    : "existing";

  return {
    attempted: true,
    importAdded: importOutcome === "added",
    importUpdated: importOutcome === "updated",
    hookInsertions,
    hookUpdates,
    existingBindings,
    unsupportedScopes,
  };
}
