export function program(statements) {
  return { kind: "Program", statements };
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer };
}

export function variable(name, type) {
  return { kind: "Variable", name, type };
}

export function arrayType(base_type) {
  return { kind: "ArrayType", base_type };
}

export function functionDeclaration(func, params, body) {
  return { kind: "FunDecl", func, params, body };
}

export function func(id, type) {
  return { kind: "Function", id, type };
}

export function functionType(paramTypes, returnType, paramCount) {
  return { kind: "FunctionType", paramTypes, returnType, paramCount };
}

export function shortIfStatement(test, consequent) {
  return { kind: "ShortIfStatement", test, consequent };
}

export function longIfStatement(test, consequent, alternate) {
  return { kind: "LongIfStatement", test, consequent, alternate };
}

export function whileStatement(test, body) {
  return { kind: "WhileStatement", test, body };
}

export function forStatement(id, exp, body) {
  return { kind: "ForStatement", id, exp, body };
}

export function returnStatement(exp) {
  return { kind: "ReturnStatement", exp };
}

export const fullStatement = { kind: "FullStatement" };

export function functionCall(callee, args) {
  return { kind: "FunctionCall", callee, args, type: callee.type.returnType };
}

export function increment(variable) {
  return { kind: "Increment", variable };
}

export function decrement(variable) {
  return { kind: "Decrement", variable };
}

export function assignment(id, exp) {
  return { kind: "Assignment", id, exp };
}

export function unary(op, operand, type) {
  return { kind: "UnaryExpression", op, operand, type };
}

export function binary(op, left, right, type) {
  return { kind: "BinaryExpression", op, left, right, type };
}

export function conditional(test, consequent, alternate, type) {
  return { kind: "Conditional", test, consequent, alternate, type }
}

export function arrayExpression(elements) {
  return {
    kind: "ArrayExpression",
    elements,
    type: arrayType(elements[0].type),
  };
}

export const boolType = { kind: "BoolType" };
export const voidType = { kind: "VoidType" };
export const intType = { kind: "IntType" };
export const stringType = { kind: "StringType" };
export const anyType = { kind: "AnyType" };

String.prototype.type = stringType;
Number.prototype.type = intType;
Boolean.prototype.type = boolType;
voidType.type = voidType;

export const standardLibrary = Object.freeze({
  bool: boolType,
  void: voidType,
  int: intType,
  string: stringType,
  any: anyType,
  Plant: func("Plant", functionType([anyType], voidType, 1)),
  Banana: func("Banana", functionType([stringType], voidType, 1)),
});
