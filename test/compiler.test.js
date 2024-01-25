import * as assert from "node:assert"
import { compile } from "../src/compiler.js"

describe("Compiler", () => {
    it("should compile", () => {
        assert.equal(compile(), "eventually this will return compiled code");
    })
})