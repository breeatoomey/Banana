export function program(statements) {
  return { kind: "Program", statements };
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer};
}

export function variable(name, type) {
  return { kind: "Variable", name, type }
}

export const boolType = { kind: "BoolType" };
export const voidType = { kind: "VoidType" };
export const intType = { kind: "IntType" };
export const stringType = { kind: "StringType" };

export function arrayType(base_type) {
  return { kind: "ArrayType", base_type }
}

export function functionDeclaration(func, params, body) {
  return { kind: "FunDecl", func, params, body };
}

export function func(id, type) {
  return { kind: "Function", id, type };
}

export function functionType(paramTypes, returnType, paramCount) {
  return { kind: "FunctionType", paramTypes, returnType, paramCount }
}

export function params(param) {
  return { kind: "Params", param };
}

export function param(type, id, exp) {
  return { kind: "Param", type, id, exp };
}

export const standardLibrary = Object.freeze({
  bool: boolType,
  void: voidType,
  int: intType,
  string: stringType,
});

export function ifStatement(exp, body) {
  return { kind: "IfStatement", exp, body };
}

export function whileStatement(id, exp, body) {
  return { kind: "WhileStatement", id, exp, body };
}

export function forStatement(id, exp, body) {
  return { kind: "ForStatement", id, exp, body };
}

export function printStatement(id, exp) {
  return { kind: "PrintStatement", id, exp };
}

export function returnStatement(id, exp) {
  return { kind: "ReturnStatement", id, exp };
}

export function callStatement(call) {
  return { kind: "CallStatement", call };
}

export function call(id, args) {
  return { kind: "Call", id, args };
}

export function args(exp) {
  return { kind: "Args", exp };
}

export function assignment(id, exp) {
  return { kind: "Assignement", id, exp };
}

export function unary(op, operand, type) {
  return { kind: "UnaryExpression", op, operand, type }
}

export function binary(op, left, right, type) {
  return { kind: "BinaryExpression", op, left, right, type }
}

export function conditional(test, consequent, alternate, type) {
  return { kind: "Conditional", test, consequent, alternate, type }
}

export function arrayExpression(elements) {
  return { kind: "ArrayExpression", elements, type: arrayType(elements[0].type) }
}

String.prototype.type = stringType
Number.prototype.type = intType
Boolean.prototype.type = boolType
