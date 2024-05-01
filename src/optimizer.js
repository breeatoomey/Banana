// The optimizer module for the Banana language.

import * as core from "./core.js";

export default function optimize(node) {
  return optimizers?.[node.kind]?.(node) ?? node;
}

const optimizers = {
  Program(p) {
    p.statements = p.statements.flatMap(optimize);
    return p;
  },
  VariableDeclaration(d) {
    d.initializer = optimize(d.initializer);
    return d;
  },
  Increment(s) {
    s.variable = optimize(s.variable);
    return s;
  },
  Decrement(s) {
    s.variable = optimize(s.variable);
    return s;
  },
  Assignment(s) {
    s.id = optimize(s.id);
    s.exp = optimize(s.exp);
    if (s.id === s.exp) {
      return [];
    }
    return s;
  },
  FullStatement(s) {
    return s;
  },
  ReturnStatement(s) {
    s.exp = optimize(s.exp);
    return s;
  },
  LongIfStatement(s) {
    s.test = optimize(s.test);
    s.consequent = s.consequent.flatMap(optimize);
    if (s.alternate?.kind?.endsWith?.("IfStatement")) {
      s.alternate = optimize(s.alternate);
    } else {
      s.alternate = s.alternate.flatMap(optimize);
    }
    if (s.test.constructor === Boolean) {
      return s.test ? s.consequent : s.alternate;
    }
    return s;
  },
  ShortIfStatement(s) {
    s.test = optimize(s.test);
    s.consequent = s.consequent.flatMap(optimize);
    if (s.test.constructor === Boolean) {
      return s.test ? s.consequent : [];
    }
    return s;
  },
  WhileStatement(s) {
    s.test = optimize(s.test);
    if (s.test === false) {
      return [];
    }
    s.body = s.body.flatMap(optimize);
    return s;
  },
  ForStatement(s) {
    s.id = optimize(s.id);
    s.exp = optimize(s.exp);
    s.body = s.body.flatMap(optimize);
    return s;
  },
  Conditional(e) {
    e.test = optimize(e.test);
    e.consequent = optimize(e.consequent);
    e.alternate = optimize(e.alternate);
    if (e.test.constructor === Boolean) {
      return e.test ? e.consequent : e.alternate;
    }
    return e;
  },
  BinaryExpression(e) {
    e.left = optimize(e.left);
    e.right = optimize(e.right);
    if (e.op === "&&") {
      // Optimize boolean constants in && and ||
      if (e.left === true) return e.right;
      if (e.right === true) return e.left;
    } else if (e.op === "||") {
      if (e.left === false) return e.right;
      if (e.right === false) return e.left;
    } else if ([Number, BigInt].includes(e.left.constructor)) {
      // Numeric constant folding when left operand is constant
      if ([Number, BigInt].includes(e.right.constructor)) {
        if (e.op === "+") return e.left + e.right;
        if (e.op === "-") return e.left - e.right;
        if (e.op === "*") return e.left * e.right;
        if (e.op === "/") return e.left / e.right;
        if (e.op === "**") return e.left ** e.right;
        if (e.op === "<") return e.left < e.right;
        if (e.op === "<=") return e.left <= e.right;
        if (e.op === "==") return e.left === e.right;
        if (e.op === "!=") return e.left !== e.right;
        if (e.op === ">=") return e.left >= e.right;
        if (e.op === ">") return e.left > e.right;
      }
      if (e.left === 0 && e.op === "+") return e.right;
      if (e.left === 1 && e.op === "*") return e.right;
      if (e.left === 0 && e.op === "-") return core.unary("-", e.right);
      if (e.left === 1 && e.op === "**") return 1;
      if (e.left === 0 && ["*", "/"].includes(e.op)) return 0;
    } else if ([Number, BigInt].includes(e.right.constructor)) {
      // Numeric constant folding when right operand is constant
      if (["+", "-"].includes(e.op) && e.right === 0) return e.left;
      if (["*", "/"].includes(e.op) && e.right === 1) return e.left;
      if (e.op === "*" && e.right === 0) return 0;
      if (e.op === "**" && e.right === 0) return 1;
    }
    return e;
  },
  UnaryExpression(e) {
    e.operand = optimize(e.operand);
    if (e.operand.constructor === Number) {
      if (e.op === "-") {
        return -e.operand;
      }
    }
    return e;
  },
  ArrayExpression(e) {
    e.elements = e.elements.map(optimize);
    return e;
  },
  FunctionCall(c) {
    c.callee = optimize(c.callee);
    c.args = c.args.map(optimize);
    return c;
  },
};
