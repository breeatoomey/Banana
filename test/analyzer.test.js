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

  // ["nested if with nested return", "if true {if true {serve 1} else {serve 2}} else {serve 3}"],
  // ["nested if with nested break", "while true {if true {break} else {Plant(1)}}"],
  // ["nested if with nested for", "for i in [1,2,3] {if true {Plant(1)} else {Plant(2)}}"],
  // ["assign to array element", "let Bunch(Int) a = (1,2,3) a(1)=100"],
  //   ["assign optionals", "let a = no int;let b=some 1;a=b;b=a;"],
  //   ["return in nested if", "function f() {if true {return;}}"],
  //   ["break in nested if", "while false {if true {break;}}"],
  //   ["long if", "if true {print(1);} else {print(3);}"],
  //   ["elsif", "if true {print(1);} else if true {print(0);} else {print(3);}"],
  //   ["for over collection", "for i in [2,3,5] {print(1);}"],
  //   ["repeat", "repeat 3 {let a = 1; print(a);}"],
  //   ["conditionals with ints", "print(true ? 8 : 5);"],
  //   ["conditionals with floats", "print(1<2 ? 8.0 : -5.22);"],
  //   ["conditionals with strings", 'print(1<2 ? "x" : "y");'],
  //   ["??", "print(some 5 ?? 0);"],
  //   ["nested ??", "print(some 5 ?? 8 ?? 0);"],
  //   ["bit ops", "print((1&2)|(9^3));"],
  //   ["relations", 'print(1<=2 && "x">"y" && 3.5<1.2);'],
  //   ["ok to == arrays", "print([1]==[5,8]);"],
  //   ["ok to != arrays", "print([1]!=[5,8]);"],
  //   ["shifts", "print(1<<3<<5<<8>>2>>0);"],
  //   ["arithmetic", "let x=1;print(2*3+5**-3/2-5%8);"],
  //   ["array length", "print(#[1,2,3]);"],
  //   ["optional types", "let x = no int; x = some 100;"],
  //   ["random with array literals, ints", "print(random [1,2,3]);"],
  //   ["random with array literals, strings", 'print(random ["a", "b"]);'],
  //   ["random on array variables", "let a=[true, false];print(random a);"],
  //   ["pseudo recursive struct", "struct S {z: S?} let x = S(no S);"],
  //   ["nested structs", "struct T{y:int} struct S{z: T} let x=S(T(1)); print(x.z.y);"],
  //   ["member exp", "struct S {x: int} let y = S(1);print(y.x);"],
  //   ["optional member exp", "struct S {x: int} let y = some S(1);print(y?.x);"],
  //   ["subscript exp", "let a=[1,2];print(a[0]);"],
  //   ["array of struct", "struct S{} let x=[S(), S()];"],
  //   ["struct of arrays and opts", "struct S{x: [int] y: string??}"],
  //   ["type equivalence of nested arrays", "function f(x: [[int]]) {} print(f([[1],[2]]));"],
  //   [
  //     "pass a function to a function",
  //     `function f(x: int, y: (boolean)->void): int { return 1; }
  //      function g(z: boolean) {}
  //      f(2, g);`,
  //   ],
  //   [
  //     "function return types",
  //     `function square(x: int): int { return x * x; }
  //      function compose(): (int)->int { return square; }`,
  //   ],
  //   ["struct parameters", "struct S {} function f(x: S) {}"],
  //   ["empty optional types", "print(no [int]); print(no string);"],
  //   ["types in function type", "function f(g: (int?, float)->string) {}"],
  //   ["outer variable", "let x=1; while(false) {print(x);}"],
  //   ["built-in constants", "print(25.0 * π);"],
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

  //   ["non-distinct fields", "struct S {x: boolean x: int}", /Fields must be distinct/],
  //   ["non-int decrement", 'let x=some[""];x++;', /an integer/],
  //   ["recursive struct", "struct S { x: int y: S }", /must not be self-containing/],
  //   ["assign to const", "const x = 1;x = 2;", /Cannot assign to constant/],
  //   ["assign bad array type", "let x=1;x=[true];", /Cannot assign a \[boolean\] to a int/],
  //   ["assign bad optional type", "let x=1;x=some 2;", /Cannot assign a int\? to a int/],
  //   ["break outside loop", "break;", /Break can only appear in a loop/],
  //   [
  //     "break inside function",
  //     "while true {function f() {break;}}",
  //     /Break can only appear in a loop/,
  //   ],
  //   [
  //     "return value from void function",
  //     "function f() {return 1;}",
  //     /Cannot return a value/,
  //   ],
  //   ["non-boolean short if test", "if 1 {}", /Expected a boolean/],
  //   ["non-boolean if test", "if 1 {} else {}", /Expected a boolean/],
  //   ["non-boolean while test", "while 1 {}", /Expected a boolean/],
  //   ["non-integer repeat", 'repeat "1" {}', /Expected an integer/],
  //   ["non-integer low range", "for i in true...2 {}", /Expected an integer/],
  //   ["non-integer high range", "for i in 1..<no int {}", /Expected an integer/],
  //   ["non-array in for", "for i in 100 {}", /Expected an array/],
  //   ["non-boolean conditional test", "print(1?2:3);", /Expected a boolean/],
  //   ["diff types in conditional arms", "print(true?1:true);", /not have the same type/],
  //   ["unwrap non-optional", "print(1??2);", /Expected an optional/],
  //   ["bad types for ==", "print(2==2.0);", /not have the same type/],
  //   ["bad types for !=", "print(false!=1);", /not have the same type/],
  //   ["bad types for negation", "print(-true);", /Expected a number/],
  //   ["bad types for length", "print(#false);", /Expected an array/],
  //   ["bad types for not", 'print(!"hello");', /Expected a boolean/],
  //   ["bad types for random", "print(random 3);", /Expected an array/],
  //   ["non-integer index", "let a=[1];print(a[false]);", /Expected an integer/],
  //   ["no such field", "struct S{} let x=S(); print(x.y);", /No such field/],
  //   ["shadowing", "let x = 1;\nwhile true {let x = 1;}", /Identifier x already declared/],
  //   ["call of uncallable", "let x = 1;\nprint(x());", /Call of non-function/],
  //   [
  //     "Too many args",
  //     "function f(x: int) {}\nf(1,2);",
  //     /1 argument\(s\) required but 2 passed/,
  //   ],
  //   [
  //     "Too few args",
  //     "function f(x: int) {}\nf();",
  //     /1 argument\(s\) required but 0 passed/,
  //   ],
  //   [
  //     "function type mismatch",
  //     `function f(x: int, y: (boolean)->void): int { return 1; }
  //      function g(z: boolean): int { return 5; }
  //      f(2, g);`,
  //     /Cannot assign a \(boolean\)->int to a \(boolean\)->void/,
  //   ],
  //   ["bad param type in fn assign", "function f(x: int) {} function g(y: float) {} f = g;"],
  //   [
  //     "bad return type in fn assign",
  //     'function f(x: int): int {return 1;} function g(y: int): string {return "uh-oh";} f = g;',
  //     /Cannot assign a \(int\)->string to a \(int\)->int/,
  //   ],
  //   ["bad call to sin()", "print(sin(true));", /Cannot assign a boolean to a float/],
  //   ["Non-type in field type", "let x=1;struct S {y:x}", /Type expected/],
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