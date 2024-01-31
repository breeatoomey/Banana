import * as assert from "node:assert"
import { compile } from "../src/banana.js"

describe("Compiler", () => {
    it("should compile", () => {
        assert.equal(compile(), "eventually this will return compiled code");
    })
});
    
describe("Equality Test", () => {
    it("should assert that 1 === 1", () => {
        assert.equal(1, 1);
    })
});

