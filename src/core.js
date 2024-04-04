export function program(statements) {
  return { kind: "Program", statements };
}

export function variableDeclaration(type, id, exp) {
  return { kind: "VariableDeclaration", type, id, exp };
}

export const arrayType = { kind: "ArrayType" };
export const boolType = { kind: "BoolType" };
export const voidType = { kind: "VoidType" };
export const intType = { kind: "IntType" };
export const stringType = { kind: "StringType" };

export function functionDeclaration(func, params, body) {
  return { kind: "FunDecl", func, params, body };
}

export function func(id, type) {
  return { kind: "Func", id, type };
}

export function params(param) {
  return { kind: "Params", param };
}

export function params(type, id, exp) {
  return { kind: "Param", type, id, exp };
}

export const standardLibrary = Object.freeze({
  array: arrayType,
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

export function returnStatment(id, exp) {
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
