import {
  voidType,
  standardLibrary,
  variableDeclaration,
  program,
  functionDeclaration,
  variable,
  assignment,
  returnStatement,
  longIfStatement,
  shortIfStatement,
  forStatement,
  conditional,
  arrayExpression,
  functionCall,
} from "./core";
// export default function generate() {
//   throw new Error("Not yet implemented")
// }
export default function generate() {
  const output = [];

  //const standardFunctions
  const targetName = ((mapping) => {
    return (entity) => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1);
      }
      return `${entity.name}_${mapping.get(entity)}`;
    };
  })(new Map());

  const gen = (node) => generators?.[node?.kind]?.(node) ?? node;

  const generators = {
    Program(p) {
      p.statements.forEach(gen);
    },
    VariableDeclaration(d) {
      output.push(`let ${gen(d.variable)} = ${gen(d.initializer)};`);
    },
    FunDeclaration(d) {
      output.push(`function ${gen(d.func)}(${d.params.map(gen).join(", ")}) {`);
      d.body.forEach(gen);
      output.push("}");
    },
    Variable(v) {
      return targetName(v);
    },
    Function(f) {
      return targetName(f);
    },
    Assignment(s) {
      output.push(`${gen(s.id)} = ${gen(s.exp)};`);
    },
    ReturnStatement(s) {
      output.push(`return ${gen(s.exp)};`);
    },
    LongIfStatement(s) {
      output.push(`if (${gen(s.test)}) {`);
      s.consequent.forEach(gen);
      if (s.alternate?.kind?.endsWith?.("IfStatement")) {
        output.push("} else");
        gen(s.alternate);
      } else {
        output.push("} else {");
        s.alternate.forEach(gen);
        output.push("}");
      }
    },
    ShortIfStatement(s) {
      output.push(`if (${gen(s.test)}) {`);
      s.consequent.forEach(gen);
      output.push("}");
    },
    ForStatement(s) {
      output.push(`for (let ${gen(s.id)} of ${gen(s.exp)}) {`);
      s.body.forEach(gen);
      output.push("}");
    },
    Conditional(e) {
      return `((${gen(e.test)}) ? (${gen(e.consequent)}) : (${gen(e.alternate)}))`;
    },
    BinaryExpression(e) {
      //const op = { "==": "===", "!=": "!==" }[e.op] ?? e.op
      return `(${gen(e.left)} ${e.op} ${gen(e.right)})`;
    },
    UnaryExpression(e) {
      const operand = gen(e.operand);
      return `${e.op}(${operand})`;
    },
    ArrayExpression(E) {
      return `[${e.elements.map(gen).join(",")}]`;
    },
    FunctionCall(c) {
      const targetCode = standardFunctions.has(c.callee) ? standardFunctions.get(c.callee)(c.args.map(gen)) : `${gen(c.callee)}(${c.args.map(gen).join(", ")})`;
      // Calls in expressions vs in statements are handled differently
      if (c.callee.type.returnType !== voidType) {
        return targetCode;
      }
      output.push(`${targetCode};`);
    },
  };
  gen(program);
  return output.join("\n");
}
