import assert from "node:assert/strict";
import parse from "../src/parser.js";

//TODO: Add tests
const syntaxChecks = [
  ["all numeric literal forms", "plant(4 * 29.193)"],
  ["complex expressions", "plant(12 * ((((-((((134 / 22)))))))) + 1 - 0)"],
  ["all unary operators", "plant (-5) plant (!rotten)"],
  ["all binary operators", "plant (x && y || z * 1 / 2 ** 3 + 4 < 5)"],
  ["all arithmetic operators", "let Int x = (!3) * 2 + 4 - (-7.3) * 8 ** 13 / 1"],
  ["all relational operators", "let Boo x = 1<(2<=(3==(4!=(5 >= (6>7)))))"],
  ["all logical operators", "let Boo x = ripe && rotten || (!rotten)"],
  ["the conditional operator", "plant(x? -> y ->> z)"],
  ["end of program inside comment", "plant(0) // yay"],
  ["comments with no text are ok", "plant(1)//\nplant(0)//"],
  ["non-Latin letters in identifiers", "let Int コンパイラ = 100"],
  ["array declaration", "let Bunch(Boo) my-bananas = (ripe, rotten)"],
  ["ifelif statement", "if banana == rotten: plant('bad banana') elif banana == ripe: plant('good banana')"],
  ["array declaration", "let Bunch(Boo) my-bananas = (ripe, rotten)"],
  ["for loop", "for banana in tree: plant('love')"],
  ["model declaration", "model Banana: config(Boo ripeness): self.ripeness = ripeness"],
  ["model instantiation", "let Banana my-banana = Banana(ripe)"],
  ["method call", "my-banana.eat()"],
  ["method call with argument", "my-banana.peel('')"],
  ["function call", "pick Banana ( Int a, Int b) -> Boo: Banana(5,6)"],
  ["return call", "serve 'Bananas are yummy'"],
  ["function return", "pick fibonacci(Int n) -> Int: if (n <= 1): serve n else: serve fibonacci(n-1) + fibonacci(n-2)"],
  ["even number check", "pick iseven(Int n) -> Boo: if n % 2 == 0: serve ripe else: serve rotten"],
  ["while loop", "let Int count = 5 while count > 0: count = count - 1"],
  ["unary postfix dereference operator", "plant(banana!)"],
  ["variable declaration from method call", "let Bunch(String) words = sentence.peel(' ')"],
  ["variable declaration from function call", "let Int x = add(3, 4)"],
  ["expression as argument in function call", "fibonacci(5 + 2)"],
  ["function composition", "plant(fibonacci(7))"],
  ["multi function composition", "plant(fibonacci(add(5, 7)))"],
  ["function composition with method call", "plant(banana.peel(' '))"],
  ["function composition with multiple method calls", "plant(banana.peel(' ').eat())"],
  ["variable assignment with multiple method calls", "let Boo ate = banana.peel().eat()"]
];

//TODO: Add tests
const syntaxErrors = [
  ["non-letter in an identifier", "abc😭e = 3", /Line 1, col 4/],
  ["malformed number", "let Int x = 5.", /Line 1, col 15/],
  ["a missing right operand", "plant(6 -", /Line 1, col 10/],
  ["a non-operator", "plant(3 * ((8 _ 1)", /Line 1, col 15/],
  ["an expression starting with a )", "x = )", /Line 1, col 5/],
  ["a statement starting with expression", "x * 9", /Line 1, col 3/],
  ["an illegal statement on line 2", "plant(5)\nx * 5;", /Line 2, col 3/],
  ["a statement starting with a )", "plant(6)\n) * 6", /Line 2, col 1/],
  ["an expression starting with a *", "x = * 83", /Line 1, col 5/],
  ["missing parentheses", "plant 'Hello, World!'", /Line 1, col 7/],
  ["missing assignment operator", "x 5", /Line 1, col 3/],
  ["missing colon in for loop", "for i in range(10) plant('hungry')", /Line 1, col 20/],
  ["misplaced colon", "if: banana == ripe", /Line 1, col 3/],
  ["unexpected token", "let Int x = 5 @", /Line 1, col 15/],
  ["unexpected token arguments in a function call", "func(#)", /Line 1, col 6/],
  ["unbalanced parentheses", "let Int x = (5 + 3", /Line 1, col 19/],
  ["misplaced comma", "let Bunch(Int) my-list = [1, 2, 3,]", /Line 1, col 26/],
  ["missing colon after if statement", "if x == 5", /Line 1, col 10/],
  ["invalid operator", "let Int x = 10 %* 5", /Line 1, col 17/],
  ["use of double quotes", 'let String bad-string = "bad banana"', /Line 1, col 25/],
  ["use of double quotes", 'let String bad-string = "bad banana"', /Line 1, col 25/],
  ["assignment without variable name", "= 5", /Line 1, col 1/],
  ["missing type", "let my-banana = 'yummy'", /Line 1, col 15/],
  ["missing keyword", "Int banana-count = 77", /Line 1, col 1/],
  ["unrecognized keyword", "switch y", /Line 1, col 1/],
  ["missing functon return type", "func myFunction() -> : ", /Line 1, col 6/],
  ["unclosed string literal", "let String need = 'banana", /Line 1, col 26/],
  ["misplaced operator", "let Int x = 5!", /Line 1, col 14/],
  ["unexpected token", "model Person {", /Line 1, col 14/],
  ["missing config", "model Banana: pick eat() -> String: serve 'yummy'", /Line 1, col 15/],
];

describe("The parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`properly specifies ${scenario}`, () => {
      assert(parse(source).succeeded());
    });
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`does not permit ${scenario}`, () => {
      assert.throws(() => parse(source), errorMessagePattern);
    });
  }
});
