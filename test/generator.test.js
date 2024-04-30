import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import optimize from "../src/optimizer.js";
import generate from "../src/generator.js";

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim();
}

const fixtures = [
  {
    name: "small",
    source: `
      let Int x = 3 * 7
      x = x+1
      x = x-1
      let Boo y = ripe
      y = 5 ** -x / -100 > - x || rotten
      Plant((y && y) || rotten || (x*2) != 5)|
    `,
    expected: dedent`
      let x_1 = 21;
      x_1++;
      x_1--;
      let y_2 = true;
      y_2 = (((5 ** -(x_1)) / -(100)) > -(x_1));
      console.log(((y_2 && y_2) || ((x_1 * 2) !== 5)));
    `,
  },
  {
    name: "if",
    source: `
      let Int x = 0
      if (x == 0) : Plant(1)|
      if (x == 0) : Plant(1)| else: Plant(2)|
      if (x == 0) : Plant(1)| else if (x==2): Plant(3)|
      if (x == 0) : Plant(1)| else if (x==2): Plant(3)| else: Plant(4)|
    `,
    expected: dedent`
      let x_1 = 0;
      if ((x_1 === 0)) {
        console.log("1");
      }
      if ((x_1 === 0)) {
        console.log(1);
      } else {
        console.log(2);
      }
      if ((x_1 === 0)) {
        console.log(1);
      } else
        if ((x_1 === 2)) {
          console.log(3);
        }
      if ((x_1 === 0)) {
        console.log(1);
      } else
        if ((x_1 === 2)) {
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
          y = y + 1
          Plant(x * y)|
        x = x + 1
      |
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
  {
    name: "functions",
    source: `
      let Int z = 5
      pick f( Int x, Boo y) -> Nothing :
      if x>10:
	  Plant(x)|
      serve Nothing|
      
      pick g()-> Boo :
      serve rotten|
      
      f(z, g()) 
    `,
    expected: dedent`
      let z_1 = 5;
      function f_2(x_3, y_4) {
        if x >10{
            print(x);
        }
        return;
      }
      function g_5() {
        return false;
      }
      f_2(z_1, g_5());
    `,
  },
  {
    name: "arrays",
    source: `
      let Bunch (Boo) a = [ripe, rotten, ripe]
      let Bunch (Int) b = [10, 20, 30]
      const Bunch c = []
      const d = random b;
      print(a[1] || (b[0] < 88 ? rotten : ripe));
    `,
    expected: dedent`
      let a_1 = [true,false,true];
      let b_2 = [10,(a_1.length - 20),30];
      let c_3 = [];
      let d_4 = ((a=>a[~~(Math.random()*a.length)])(b_2));
      console.log((a_1[1] || (((b_2[0] < 88)) ? (false) : (true))));
    `,
  },
  {
    name: "for loops",
    source: `
      let Bunch(Int) b = (0, 7, 14) 
      for i in b: 
      Plant(i)|
      
      for i in (0,7,4):
      for j in (4,5,6):
      Plant(i+j)|
      |
      
    `,
    expected: dedent`
      let b_1 = [0,7,14]
      for i in b_1{
        console.log(i);
      }

      for i in [0,7,4]{
        for j in [4,5,6]{
            console.log(i+j);
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
