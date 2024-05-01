import assert from "node:assert/strict";
import optimize from "../src/optimizer.js";
import * as core from "../src/core.js";

// Make some test cases easier to read
const x = core.variable("x", false, core.intType);
const a = core.variable("a", false, core.arrayType(core.intType));
const xpp = core.increment(x);
const xmm = core.decrement(x);
const return1p1 = core.returnStatement(core.binary("+", 1, 1, core.intType));
const return2 = core.returnStatement(2);
const returnX = core.returnStatement(x);
const returnArrayAssignment = core.returnStatement(core.assignment(a, core.arrayExpression([1, 2, 3])));
const onePlusTwo = core.binary("+", 1, 2, core.intType);
const identity = Object.assign(core.func("id", core.anyType), { body: returnX });
const voidInt = core.functionType([], core.intType);
const intFun = body => core.functionDeclaration("f", core.func("f", voidInt), [], [body])
const arrayFun = (body) =>
  core.functionDeclaration("f", core.func("f", core.arrayType(core.intType)), [], [body]);
const callIdentity = (args) => core.functionCall(identity, args);
const or = (...d) => d.reduce((x, y) => core.binary("||", x, y));
const and = (...c) => c.reduce((x, y) => core.binary("&&", x, y));
const less = (x, y) => core.binary("<", x, y);
const eq = (x, y) => core.binary("==", x, y);
const times = (x, y) => core.binary("*", x, y);x
const neg = (x) => core.unary("-", x);
const array = (...elements) => core.arrayExpression(elements);
const assign = (v, e) => core.assignment(v, e);
const unwrapElse = (o, e) => core.binary("??", o, e);
const some = (x) => core.unary("some", x);
const program = core.program;

const tests = [
  ["folds +", core.binary("+", 5, 8), 13],
  ["folds -", core.binary("-", 5n, 8n), -3n],
  ["folds *", core.binary("*", 5, 8), 40],
  ["folds /", core.binary("/", 5, 8), 0.625],
  ["folds **", core.binary("**", 5, 8), 390625],
  ["folds <", core.binary("<", 5, 8), true],
  ["folds <=", core.binary("<=", 5, 8), true],
  ["folds ==", core.binary("==", 5, 8), false],
  ["folds !=", core.binary("!=", 5, 8), true],
  ["folds >=", core.binary(">=", 5, 8), false],
  ["folds >", core.binary(">", 5, 8), false],
  ["optimizes +0", core.binary("+", x, 0), x],
  ["optimizes -0", core.binary("-", x, 0), x],
  ["optimizes *1", core.binary("*", x, 1), x],
  ["optimizes /1", core.binary("/", x, 1), x],
  ["optimizes *0", core.binary("*", x, 0), 0],
  ["optimizes 0*", core.binary("*", 0, x), 0],
  ["optimizes 0/", core.binary("/", 0, x), 0],
  ["optimizes 0+", core.binary("+", 0, x), x],
  ["optimizes 0-", core.binary("-", 0, x), neg(x)],
  ["optimizes 1*", core.binary("*", 1, x), x],
  ["folds negation", core.unary("-", 8), -8],
  ["optimizes 1**", core.binary("**", 1, x), 1],
  ["optimizes **0", core.binary("**", x, 0), 1],
  ["removes left false from ||", or(false, less(x, 1)), less(x, 1)],
  ["removes right false from ||", or(less(x, 1), false), less(x, 1)],
  ["removes left true from &&", and(true, less(x, 1)), less(x, 1)],
  ["removes right true from &&", and(less(x, 1), true), less(x, 1)],
  [
    "removes x=x at beginning",
    program([core.assignment(x, x), xpp]),
    program([xpp]),
  ],
  ["removes x=x at end", program([xpp, core.assignment(x, x)]), program([xpp])],
  [
    "removes x=x in middle",
    program([xpp, assign(x, x), xpp]),
    program([xpp, xpp]),
  ],
  ["optimizes if-true", core.longIfStatement(true, [xpp], []), [xpp]],
  ["optimizes if-false", core.longIfStatement(false, [], [xpp]), [xpp]],
  ["optimizes short-if-true", core.shortIfStatement(true, [xmm]), [xmm]],
  ["optimizes short-if-false", core.shortIfStatement(false, [xpp]), []],
  [
    "optimizes while-false",
    program([core.whileStatement(false, [xpp])]),
    program([]),
  ],
  [
    "applies if-false after folding",
    core.shortIfStatement(eq(1, 1), [xpp]),
    [xpp],
  ],
  ["optimizes left conditional true", core.conditional(true, 55, 89), 55],
  ["optimizes left conditional false", core.conditional(false, 55, 89), 89],
  ["optimizes in functions", program([intFun(return1p1)]), program([intFun(return2)])],
  ["optimizes in array function declaration", program([arrayFun(returnArrayAssignment)]), program([arrayFun(core.returnStatement(a))])],
  ["optimizes in array literals", array(0, onePlusTwo, 9), array(0, 3, 9)],
  ["optimizes in arguments", callIdentity([times(3, 5)]), callIdentity([15])],
  ["optimizes in return statements", core.program([return1p1]), core.program([core.returnStatement(2)])],
  ["optimizes function declaration", core.program([core.functionDeclaration("f", voidInt, [], [return1p1])]), core.program([core.functionDeclaration("f", voidInt, [], [core.returnStatement(2)])])],
  ["optimizes within function declaration", core.program([core.functionDeclaration("f", voidInt, [], [core.assignment(x, 5), return1p1])]), core.program([core.functionDeclaration("f", voidInt, [], [core.assignment(x, 5), core.returnStatement(2)])])],
  ["optimizes within body of function declaration", core.program([core.functionDeclaration("f", voidInt, [], [core.assignment(x, 5), return1p1, core.assignment(x, 6)])]), core.program([core.functionDeclaration("f", voidInt, [], core.assignment(x, 5), core.returnStatement(2), core.assignment(x, 6))])],
  [
    "passes through nonoptimizable constructs",
    ...Array(2).fill([
      core.variableDeclaration("x", true, "z"),
      core.assignment(x, core.binary("*", x, "z")),
      core.assignment(x, core.unary("not", x)),
      core.whileStatement(true, [core.fullStatement]),
      core.conditional(x, 1, 2),
      unwrapElse(some(x), 7),
      core.longIfStatement(x, [], []),
      core.shortIfStatement(x, []),
      core.forStatement(x, array(1, 2, 3), []),
    ]),
  ],
];

describe("The optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(`${scenario}`, () => {
      assert.deepEqual(optimize(before), after);
    });
  }
});
