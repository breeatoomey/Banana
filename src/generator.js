import { voidType, standardLibrary } from "./core.js";

export default function generate(program) {
  const output = [];

  const standardFunctions = new Map([
    [standardLibrary.Plant, (x) => `console.log(${x})`],
    [standardLibrary.Banana, (x) => `console.log("bello ${x}")`],
  ]);

  const targetName = ((mapping) => {
    return (entity) => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1);
      }
      return `${entity.name ?? entity.id}_${mapping.get(entity)}`;
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
    FunDecl(d) {
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
    Increment(s) {
      output.push(`${gen(s.variable)}++;`);
    },
    Decrement(s) {
      output.push(`${gen(s.variable)}--;`);
    },
    Assignment(s) {
      output.push(`${gen(s.id)} = ${gen(s.exp)};`);
    },
    FullStatement(s) {
      output.push("break;");
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
    WhileStatement(s) {
      output.push(`while (${gen(s.test)}) {`);
      s.body.forEach(gen);
      output.push("}");
    },
    ForStatement(s) {
      output.push(`for (let ${gen(s.id)} of ${gen(s.exp)}) {`);
      s.body.forEach(gen);
      output.push("}");
    },
    Conditional(e) {
      return `((${gen(e.test)}) ? -> (${gen(e.consequent)}) ->> (${gen(
        e.alternate
      )}))`;
    },
    BinaryExpression(e) {
      return `(${gen(e.left)} ${e.op} ${gen(e.right)})`;
    },
    UnaryExpression(e) {
      const operand = gen(e.operand);
      return `${e.op}(${operand})`;
    },
    ArrayExpression(e) {
      return `[${e.elements.map(gen).join(",")}]`;
    },
    FunctionCall(c) {
      const targetCode = standardFunctions.has(c.callee)
        ? standardFunctions.get(c.callee)(c.args.map(gen))
        : `${gen(c.callee)}(${c.args.map(gen).join(", ")})`;

      if (c.callee.type.returnType !== voidType) {
        return targetCode;
      }
      output.push(`${targetCode};`);
    },
  };
  gen(program);
  return output.join("\n");
}
