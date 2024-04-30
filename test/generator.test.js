import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import optimize from "../src/optimizer.js";
import generate from "../src/generator.js";

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim();
}

//NOTE: optimizer breaks small and for loop

const fixtures = [
  {
    name: "small",
    source: `
      let Int x = 3 * 7
      x++
      x--
      let Boo y = ripe
      y = ((5 ** (-x) / (-100)) > (-x))
      Plant((y && y) || (x*2) != 5)
    `,
    expected: dedent`
      let x_1 = 21;
      x_1++;
      x_1--;
      let y_2 = true;
      y_2 = (((5 ** -(x_1)) / -100) > -(x_1));
      console.log(((y_2 && y_2) || ((x_1 * 2) != 5)));
    `,
  },
  {
    name: "if",
    source: `
      let Int x = 0
      if (x == 0): Plant('1')|
      if (x == 0): Plant(1)| else: Plant(2)|
      if (x == 0): Plant(1)| else if (x==2): Plant(3)|
      if (x == 0): Plant(1)| else if (x==2): Plant(3)| else: Plant(4)|
    `,
    expected: dedent`
      let x_1 = 0;
      if ((x_1 == 0)) {
        console.log('1');
      }

      if ((x_1 == 0)) {
        console.log(1);
      } else {
        console.log(2);
      }

      if ((x_1 == 0)) {
        console.log(1);
      } else
        if ((x_1 == 2)) {
          console.log(3);
        }

      if ((x_1 == 0)) {
        console.log(1);
      } else
        if ((x_1 == 2)) {
          console.log(3);
        } else {
          console.log(4);
        }
    `,
  },
  {
    name: "while",
    source: `
      let Int x = 0
      while x < 5:
        let Int y = 0
        while y < 5:
          Plant(x * y)
          y = y + 1
          full|
        x = x + 1|
    `,
    expected: dedent`
      let x_1 = 0;
      while ((x_1 < 5)) {
        let y_2 = 0;
        while ((y_2 < 5)) {
          console.log((x_1 * y_2));
          y_2 = (y_2 + 1);
          break;
        }
        x_1 = (x_1 + 1);
      }
    `,
  },
  //function code broken
  {
    name: "functions",
    source: `
      let Int z = 5
      pick f( Int x, Boo y) -> Boo :
        if x>10:
	        Plant(x)
        serve ripe|
      serve y|

      pick g()-> Boo :
        serve rotten|
      
      f(z, g()) 
    `,
    expected: dedent`
      let z_1 = 5;
      function f_2(x_3, y_4) {
        if ((x_3 > 10)) {
            console.log(x_3);
            return true;
        }
        return y_4;
      }
      function g_5() {
        return false;
      }
      f_2(z_1, g_5());
    `,
  },
  //Add to arrays code:
  {
    name: "arrays",
    source: `
      let Bunch (Boo) a = (ripe, rotten, ripe)
      let Bunch (Int) b = (10, 1 - 20, 30)
    `,
    expected: dedent`
      let a_1 = [true,false,true];
      let b_2 = [10,-19,30];
    `,
  },
  {
    name: "for loops",
    source: `
      let Bunch(Int) b = (0,7,14)
      for i in b:
      Plant(i)|
     
      for i in (0,7,4):
      for j in (4,5,6):
      Plant(i+j)|
      |    
    `,
    expected: dedent`
    let b_1 = [0,7,14];
    for (let i_2 of b_1) {
      console.log(i_2);
    }

    for (let i_3 of [0,7,4]) {
      for (let j_4 of [4,5,6]) {
        console.log((i_3 + j_4));
      }
    }
    `,
  },
];

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(parse(fixture.source))));
      assert.deepEqual(actual, fixture.expected);
    });
  }
});
