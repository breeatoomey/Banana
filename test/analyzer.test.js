import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import { program, variableDeclaration, variable, binary, intType } from "../src/core.js";

// Programs that are semantically correct
const semanticChecks = [
  ["variable declarations", "let Int x = 1 let Boo y = rotten"],
  ["complex array types", "pick f(Bunch(Bunch(Int)) x) -> Bunch(Bunch(Int)): serve x |"],
  ["increment and decrement", "let Int x = 10 x-- x++"],
  ["initialize array with correct types", "let Bunch(int) a = (1,2,3)"],
  ["assign arrays", "let Bunch(Int) a = (1) let Bunch(Int) b = (2) a = b b = a"],
  ["void return", "pick f() -> Nothing: serve Nothing |"],
  ["boolean return", "pick f() -> Boo: serve ripe |"],
  [
    "call of assigned function within print statement",
    `pick f(Int x) -> Int: serve x + 1|
    Plant(f(1))`,
  ],
  ["void function assign and call", "pick f() -> Nothing: serve Nothing| f()"],
  ["array parameters", "pick f(Int x, Boo y) -> Int: serve x - 1|"],
  ["ternary", "let Boo result = (3 > 0)? -> 'Positive' ->> 'Negative'"],
  ["call of assigned functions", "pick f(Int x) -> Int: serve x+2 | let Int y = f(1)"],
  ["call of assigned function out of var declaration", "pick f(Boo banana) -> Boo: serve banana | f(rotten)"],
  ["assigned functions", "pick f() -> Nothing: serve Nothing | let Nothing g = f g = f"],
  ["||", "Plant(ripe||1<2||rotten||ripe)"],
  ["&&", "Plant(ripe&&1<7&&rotten&&ripe)"],
  ["void parameter in void function", "pick f(Nothing g) -> Nothing: serve g |"],
  ["for loop", "let Bunch(Int) bananas = (0, 7, 14) for i in bananas: Plant(i)|"],
  ["while loop", "let Int x = 0 while x < 3: x = x + 1|"],
  ["nested loops", "for i in (1,2,3): for j in (4,5,6): Plant(i+j)||"],
  ["nested if", "if ripe: if rotten: Plant(1)| else: Plant(2)|| else: Plant(3)|"],
  ["nested if with return", "pick banana() -> Int: if ripe: if rotten: serve 1| else: serve 2|| else: serve 3||"],
  ["nested if with for", "for i in (1,2,3): if ripe: Plant(1)| else: Plant(2)||"],
  ["nested if with while", "let Int x = 0 while x < 3: if ripe: Plant(1)| else: Plant(2)|| x = x + 1"],
  ["nested if with nested for", "for i in (1,2,3): if ripe: for j in (4,5,6): Plant(i+j)|| else: Plant(2)||"],
  ["nested if with nested while", "let Int x = 0 while x < 3: if ripe: while ripe: Plant(1) x = x + 1|| else: Plant(2)||"],
  ["nested if with nested if", "if ripe: if ripe: Plant(1)| else: Plant(2)|| else: Plant(3)|"],
  ["nested if in for loop", 
  `pick banana(Int quota, Bunch(Int) bananas_collected) -> Boo:
	  for i in bananas_collected:
    	if i > quota:
        	Plant('👍')|
        else if i < quota:
        	Plant('👎')
          serve rotten|
          
    Plant('Enough bananas collected this week!')
    serve ripe
	|
|`],
["unary expression assignment", "let Boo banana = rotten let Boo x = !banana"],
["variable declarations", "let Int x = 1 let Boo y = rotten"],
["ternary operator", "let Int x = 1 let Int y = 2 let Int z = (x > y)? -> x ->> y"],
["nested if with nested return", "pick f() -> Int: if ripe: if ripe: serve 1| else: serve 2|| else: serve 3||"],
["nested if with nested break", "while ripe: if ripe: full| else: Plant(1)||"],
["nested if with nested for", "for i in (1,2,3): if ripe: Plant(1)| else: Plant(2)||"],
];

// Programs that are syntactically correct but have semantic errors
const semanticErrors = [
  ["non-int increment", "let Boo x = rotten x = x + 1", /Expected a number or string/],
  ["redeclared id", "let Int x = 1 let Int x = 1", /Identifier x already declared/],
  ["undeclared id", "pick f() -> Int: serve x|", /Identifier x not declared/],
  ["assign bad type", "let Int x = 1 x = rotten", /Cannot assign a boolean to a int/],
  ["return outside function", "serve Nothing", /Return can only appear in a function/],
  ["return nothing from non-void", "pick f() -> Int: serve Nothing|", /Cannot assign a void to a int/],
  ["Parameter type mismatch", "pick f(Int x) -> Int: serve x + 1| f(rotten)", /Cannot assign a boolean to a int/],
  ["bad types for ||", "Plant(rotten||1)", /Expected a boolean/],
  ["bad types for &&", "Plant(rotten&&1)", /Expected a boolean/],
  ["bad types for ==", "Plant(rotten==1)", /Operands do not have the same type/],
  ["bad types for !=", "Plant(rotten==1)", /Operands do not have the same type/],
  ["bad types for +", "Plant(rotten+1)", /Expected a number or string/],
  ["bad types for -", "Plant(rotten-1)", /Expected a number/],
  ["bad types for *", "Plant(rotten*1)", /Expected a number/],
  ["bad types for /", "Plant(rotten/1)", /Expected a number/],
  ["bad types for **", "Plant(rotten**1)", /Expected a number/],
  ["bad types for <", "Plant(rotten<1)", /Expected a number or string/],
  ["bad types for <=", "Plant(rotten<=1)", /Expected a number or string/],
  ["bad types for >", "Plant(rotten>1)", /Expected a number or string/],
  ["bad types for >=", "Plant(rotten>=1)", /Expected a number or string/],
  ["return type mismatch", "pick f() -> Int: serve rotten|", /boolean to a int/],
  ["diff type array elements", "Plant((3,ripe))", /Not all elements have the same type/],
  ["let Bunch(String) s = (Nothing) s++", /an integer/],
  ["assign bad array type", "let Int x = 1 x = ripe", /Cannot assign a boolean to a int/],
  ["break outside loop", "full", /Full can only appear in a loop/],
  [
    "break inside function",
    "pick f() -> Nothing: full|",
    /Full can only appear in a loop/,
  ],
  [
    "return value from Nothing function",
    "pick f() -> Nothing: serve 1|",
    /Cannot assign a int to a void/,
  ],
];

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(parse(source)));
    });
  }
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(parse(source)), errorMessagePattern);
    });
  }
  it("produces the expected representation for a trivial program", () => {
    assert.deepEqual(analyze(parse("let Int x = 5 + 2")), program([variableDeclaration(variable("x", intType), binary("+", 5, 2, intType))]));
  });
});