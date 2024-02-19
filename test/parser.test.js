import assert from "node:assert/strict"
import parse from "../src/parser.js"

//TODO: Add tests
const syntaxChecks = [
  [],
]

//TODO: Add tests
const syntaxErrors = [
  [],
]

describe("The parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`properly specifies ${scenario}`, () => {
      assert(parse(source).succeeded())
    })
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`does not permit ${scenario}`, () => {
      assert.throws(() => parse(source), errorMessagePattern)
    })
  }
})