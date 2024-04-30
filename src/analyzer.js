// The semantic analyzer exports a single function, analyze(match), that
// accepts a grammar match object (the CST) from Ohm and produces the
// internal representation of the program (pretty close to what is usually
// called the AST). This representation also includes entities from the
// standard library, as needed.

import * as core from "./core.js";

// A few declarations to save typing
const INT = core.intType;
const FLOAT = core.floatType;
const STRING = core.stringType;
const BOOLEAN = core.boolType;
const VOID = core.voidType;
const ANY = core.anyType;

class Context {
  // Like most statically-scoped languages, Carlos contexts will contain a
  // map for their locally declared identifiers and a reference to the parent
  // context. The parent of the global context is null. In addition, the
  // context records whether analysis is current within a loop (so we can
  // properly check break statements), and reference to the current function
  // (so we can properly check return statements).
  constructor({
    parent = null,
    locals = new Map(),
    inLoop = false,
    function: f = null,
  }) {
    Object.assign(this, { parent, locals, inLoop, function: f });
  }
  add(name, entity) {
    this.locals.set(name, entity);
  }
  lookup(name) {
    return this.locals.get(name) || this.parent?.lookup(name);
  }
  static root() {
    return new Context({
      locals: new Map(Object.entries(core.standardLibrary)),
    });
  }
  newChildContext(props) {
    return new Context({ ...this, ...props, parent: this, locals: new Map() });
  }
}

export default function analyze(match) {
  // Track the context manually via a simple variable. The initial context
  // contains the mappings from the standard library. Add to this context
  // as necessary. When needing to descent into a new scope, create a new
  // context with the current context as its parent. When leaving a scope,
  // reset this variable to the parent context.
  let context = Context.root();

  // The single gate for error checking. Pass in a condition that must be true.
  // Use errorLocation to give contextual information about the error that will
  // appear: this should be an object whose "at" property is a parse tree node.
  // Ohm's getLineAndColumnMessage will be used to prefix the error message. This
  // allows any semantic analysis errors to be presented to an end user in the
  // same format as Ohm's reporting of syntax errors.
  function must(condition, message, errorLocation) {
    if (!condition) {
      const prefix = errorLocation.at.source.getLineAndColumnMessage();
      throw new Error(`${prefix}${message}`);
    }
  }

  // Next come a number of carefully named utility functions that keep the
  // analysis code clean and readable. Without these utilities, the analysis
  // code would be cluttered with if-statements and error messages. Each of
  // the utilities accept a parameter that should be an object with an "at"
  // property that is a parse tree node. This is used to provide contextual
  // information in the error message.

  function mustNotAlreadyBeDeclared(name, at) {
    must(!context.lookup(name), `Identifier ${name} already declared`, at);
  }

  function mustHaveBeenFound(entity, name, at) {
    must(entity, `Identifier ${name} not declared`, at);
  }

  function mustHaveNumericType(e, at) {
    must([INT, FLOAT].includes(e.type), "Expected a number", at);
  }

  function mustHaveNumericOrStringType(e, at) {
    must(
      [INT, FLOAT, STRING].includes(e.type),
      "Expected a number or string",
      at
    );
  }

  function mustHaveBooleanType(e, at) {
    must(e.type === BOOLEAN, "Expected a boolean", at);
  }

  function mustHaveIntegerType(e, at) {
    must(e.type === INT, "Expected an integer", at);
  }

  function mustHaveAnArrayType(e, at) {
    must(e.type?.kind === "ArrayType", "Expected an array", at);
  }

  // function mustHaveAnOptionalType(e, at) {
  //   must(e.type?.kind === "OptionalType", "Expected an optional", at)
  // }

  // function mustHaveAStructType(e, at) {
  //   must(e.type?.kind === "StructType", "Expected a struct", at)
  // }

  // function mustHaveAnOptionalStructType(e, at) {
  //   // Used to check e?.x expressions, e must be an optional struct
  //   must(
  //     e.type?.kind === "OptionalType" && e.type.baseType?.kind === "StructType",
  //     "Expected an optional struct",
  //     at
  //   )
  // }

  function mustBothHaveTheSameType(e1, e2, at) {
    must(
      equivalent(e1.type, e2.type),
      "Operands do not have the same type",
      at
    );
  }

  function mustAllHaveSameType(expressions, at) {
    // Used to check the elements of an array expression, and the two
    // arms of a conditional expression, among other scenarios.
    must(
      expressions
        .slice(1)
        .every((e) => equivalent(e.type, expressions[0].type)),
      "Not all elements have the same type",
      at
    );
  }

  // function mustBeAType(e, at) {
  //   // This is a rather ugly hack
  //   must(e?.kind.endsWith("Type"), "Type expected", at)
  // }

  // function mustBeAnArrayType(t, at) {
  //   must(t?.kind === "ArrayType", "Must be an array type", at)
  // }

  // function mustBeAVariable(entity, at) {
  //   must(entity?.kind === "Variable", `Functions can not appear here`, at)
  // }

  function mustBeAFunction(entity, at) {
    must(entity?.kind === "Function", `${entity.name} is not a function`, at);
  }

  function equivalent(t1, t2) {
    return (
      t1 === t2 ||
      (t1?.kind === "ArrayType" &&
        t2?.kind === "ArrayType" &&
        equivalent(t1.baseType, t2.baseType)) ||
      (t1?.kind === "FunctionType" &&
        t2?.kind === "FunctionType" &&
        equivalent(t1.returnType, t2.returnType) &&
        t1.paramTypes.length === t2.paramTypes.length &&
        t1.paramTypes.every((t, i) => equivalent(t, t2.paramTypes[i])))
    );
  }

  function assignable(fromType, toType) {
    return (
      toType == ANY ||
      equivalent(fromType, toType) ||
      (fromType?.kind === "FunctionType" &&
        toType?.kind === "FunctionType" &&
        assignable(fromType.returnType, toType.returnType) &&
        fromType.paramTypes.length === toType.paramTypes.length &&
        toType.paramTypes.every((t, i) =>
          assignable(t, fromType.paramTypes[i])
        ))
    );
  }

  function typeDescription(type) {
    switch (type.kind) {
      case "IntType":
        return "int";
      // case "FloatType":
      //   return "float"
      case "StringType":
        return "string";
      case "BoolType":
        return "boolean";
      case "VoidType":
        return "void";
      case "AnyType":
        return "any";
      // case "StructType":
      //   return type.name
      case "FunctionType":
        const paramTypes = type.paramTypes.map(typeDescription).join(", ");
        const returnType = typeDescription(type.returnType);
        return `(${paramTypes})->${returnType}`;
      case "ArrayType":
        return `[${typeDescription(type.base_type)}]`;
      // case "OptionalType":
      //   return `${typeDescription(type.base_type)}?`
    }
  }

  function mustBeAssignable(e, { toType: type }, at) {
    const message = `Cannot assign a ${typeDescription(
      e.type
    )} to a ${typeDescription(type)}`;
    must(assignable(e.type, type), message, at);
  }

  function mustNotBeReadOnly(e, at) {
    must(!e.readOnly, `Cannot assign to constant ${e.name}`, at);
  }

  // function mustHaveMember(structType, field, at) {
  //   must(structType.fields.map(f => f.name).includes(field), "No such field", at)
  // }

  function mustBeInLoop(at) {
    must(context.inLoop, "Full can only appear in a loop", at);
  }

  function mustBeInAFunction(at) {
    must(context.function, "Return can only appear in a function", at);
  }

  // function mustBeCallable(e, at) {
  //   const callable = e?.kind === "StructType" || e.type?.kind === "FunctionType"
  //   must(callable, "Call of non-function or non-constructor", at)
  // }

  // function mustNotReturnAnything(f, at) {
  //   must(f.type.returnType === VOID, "Something should be returned", at)
  // }

  // function mustReturnSomething(f, at) {
  //   must(f.type.returnType !== VOID, "Cannot return a value from this function", at)
  // }

  function mustBeReturnable(e, { from: f }, at) {
    mustBeAssignable(e, { toType: f.type.returnType }, at);
  }

  function mustHaveCorrectArgumentCount(argCount, paramCount, at) {
    const message = `${paramCount} argument(s) required but ${argCount} passed`;
    must(argCount === paramCount, message, at);
  }

  // Building the program representation will be done together with semantic
  // analysis and error checking. In Ohm, we do this with a semantics object
  // that has an operation for each relevant rule in the grammar. Since the
  // purpose of analysis is to build the program representation, we will name
  // the operations "rep" for "representation". Most of the rules are straight-
  // forward except for those dealing with function and type declarations,
  // since types and functions need to be dealt with in two steps to allow
  // recursion.
  const builder = match.matcher.grammar.createSemantics().addOperation("rep", {
    Program(statements) {
      return core.program(statements.children.map((s) => s.rep()));
    },

    FunDecl(
      _func,
      id,
      _left_paren,
      parameters,
      _right_paren,
      _arrow,
      type,
      block
    ) {
      // Start by making the function, but we don't yet know its type.
      // Also add it to the context so that we can have recursion.
      const func = core.func(id.sourceString);
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });
      context.add(id.sourceString, func);

      // Parameters are part of the child context
      context = context.newChildContext({ inLoop: false, function: func });
      const params = parameters.rep();

      // Now that the parameters are known, we compute the function's type.
      // This is fine; we did not need the type to analyze the parameters,
      // but we do need to set it before analyzing the body.
      const paramTypes = params.map((param) => param.type);
      const returnType = type.children?.[0]?.rep() ?? VOID;
      const paramCount = params.length;
      func.type = core.functionType(paramTypes, returnType, paramCount);

      // Analyze body while still in child context
      const body = block.rep();

      // Go back up to the outer context before returning
      context = context.parent;
      return core.functionDeclaration(func, params, body);
    },

    Params(param_list) {
      // Returns a list of variable nodes
      return param_list.asIteration().children.map((p) => p.rep());
    },

    Param(type, id, _eq, _exp) {
      const param = core.variable(id.sourceString, type.rep());
      mustNotAlreadyBeDeclared(param.name, { at: id });
      context.add(param.name, param);
      return param;
    },

    VarDecl(_modifer, _type, id, _eq, exp) {
      const initializer = exp.rep();
      const variable = core.variable(id.sourceString, initializer.type);
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });
      context.add(id.sourceString, variable);
      return core.variableDeclaration(variable, initializer);
    },

    Bump(exp, operator) {
      const variable = exp.rep();
      mustHaveIntegerType(variable, { at: exp });
      return operator.sourceString === "++"
        ? core.increment(variable)
        : core.decrement(variable);
    },

    Assignment(variable, _eq, expression) {
      const source = expression.rep();
      const target = variable.rep();
      mustBeAssignable(source, { toType: target.type }, { at: variable });
      mustNotBeReadOnly(target, { at: variable });
      return core.assignment(target, source);
    },

    Body(_open, statements, _close) {
      // No need for a block node, just return the list of statements
      return statements.children.map((s) => s.rep());
    },

    ReturnStmt(return_keyword, exp) {
      mustBeInAFunction({ at: return_keyword });
      // mustReturnSomething(context.function, { at: return_keyword })
      const return_expression = exp.rep();
      mustBeReturnable(
        return_expression,
        { from: context.function },
        { at: exp }
      );
      return core.returnStatement(return_expression);
    },

    Stmt_call(call) {
      return call.rep();
    },

    FullStmt(fullKeyword) {
      mustBeInLoop({ at: fullKeyword });
      return core.fullStatement;
    },

    ForStmt_collection(_for, id, _in, exp, block) {
      const collection = exp.rep();
      mustHaveAnArrayType(collection, { at: exp });
      const iterator = core.variable(
        id.sourceString,
        collection.type.base_type
      );
      context = context.newChildContext({ inLoop: true });
      context.add(iterator.name, iterator);
      const body = block.rep();
      context = context.parent;
      return core.forStatement(iterator, collection, body);
    },

    WhileStmt(_while, exp, block) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext({ inLoop: true });
      const body = block.rep();
      context = context.parent;
      return core.whileStatement(test, body);
    },

    IfStmt_short(_if, exp, block) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext();
      const consequent = block.rep();
      context = context.parent;
      return core.shortIfStatement(test, consequent);
    },

    IfStmt_long(_if, exp, block1, _else, block2) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext();
      const consequent = block1.rep();
      context = context.parent;
      context = context.newChildContext();
      const alternate = block2.rep();
      context = context.parent;
      return core.longIfStatement(test, consequent, alternate);
    },

    IfStmt_elsif(_if, exp, block, _else, trailingIfStatement) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext();
      const consequent = block.rep();
      context = context.parent;
      const alternate = trailingIfStatement.rep();
      return core.longIfStatement(test, consequent, alternate);
    },

    Type_array(_arr, _left, base_type, _right) {
      return core.arrayType(base_type.rep());
    },

    Type_boolean(_boo_keyword) {
      return core.boolType;
    },

    Type_void(_void_keyword) {
      return core.voidType;
    },

    Type_int(_int_keyword) {
      return core.intType;
    },

    // Type_string(_str_keyword) {
    //   return core.stringType
    // },

    Exp_unary(unaryOp, exp) {
      const [op, operand] = [unaryOp.sourceString, exp.rep()];
      let type;
      if (op === "-") {
        mustHaveNumericType(operand, { at: exp });
        type = operand.type;
      } else if (op === "!") {
        mustHaveBooleanType(operand, { at: exp });
        type = BOOLEAN;
      }
      return core.unary(op, operand, type);
    },

    Exp_ternary(
      exp1,
      _questionMark,
      _rightArrow,
      exp2,
      _doubleRightArrow,
      exp3
    ) {
      return core.conditional(exp1.rep(), exp2.rep(), exp3.rep());
    },

    Exp1_binary(exp1, op, exp2) {
      let left = exp1.rep();
      mustHaveBooleanType(left, { at: exp1 });
      for (let e of exp2.children) {
        let right = e.rep();
        mustHaveBooleanType(right, { at: e });
        left = core.binary(op.sourceString, left, right, BOOLEAN);
      }
      return left;
    },

    Exp2_binary(exp1, op, exp2) {
      let left = exp1.rep();
      mustHaveBooleanType(left, { at: exp1 });
      for (let e of exp2.children) {
        let right = e.rep();
        mustHaveBooleanType(right, { at: e });
        left = core.binary(op.sourceString, left, right, BOOLEAN);
      }
      return left;
    },

    Exp3_binary(exp1, relop, exp2) {
      const [left, op, right] = [exp1.rep(), relop.sourceString, exp2.rep()];
      if (["<", "<=", ">", ">="].includes(op)) {
        mustHaveNumericOrStringType(left, { at: exp1 });
      }
      mustBothHaveTheSameType(left, right, { at: relop });
      return core.binary(op, left, right, BOOLEAN);
    },

    Exp4_binary(exp1, addOp, exp2) {
      const [left, op, right] = [exp1.rep(), addOp.sourceString, exp2.rep()];
      if (op === "+") {
        mustHaveNumericOrStringType(left, { at: exp1 });
      } else {
        mustHaveNumericType(left, { at: exp1 });
      }
      mustBothHaveTheSameType(left, right, { at: addOp });
      return core.binary(op, left, right, left.type);
    },

    Exp5_binary(exp1, mulOp, exp2) {
      const [left, op, right] = [exp1.rep(), mulOp.sourceString, exp2.rep()];
      mustHaveNumericType(left, { at: exp1 });
      mustBothHaveTheSameType(left, right, { at: mulOp });
      return core.binary(op, left, right, left.type);
    },

    Exp6_binary(exp1, powerOp, exp2) {
      const [left, op, right] = [exp1.rep(), powerOp.sourceString, exp2.rep()];
      mustHaveNumericType(left, { at: exp1 });
      mustBothHaveTheSameType(left, right, { at: powerOp });
      return core.binary(op, left, right, left.type);
    },

    Primitive_parens(_open, exp, _close) {
      return exp.rep();
    },

    Primitive_arrayexp(_open, args, _close) {
      const elements = args.asIteration().children.map((e) => e.rep());
      mustAllHaveSameType(elements, { at: args });
      return core.arrayExpression(elements);
    },

    Primitive_id(id, _postfix) {
      // ids used in expressions must have been already declared and must
      // be bound to variable entities, not function entities.
      const entity = context.lookup(id.sourceString);
      mustHaveBeenFound(entity, id.sourceString, { at: id });
      //mustBeAVariable(entity, { at: id });
      return entity;
    },

    Primitive_call(id, open, expList, _close) {
      // ids used in calls must have already been declared and must be
      // bound to function entities, not to variable entities.
      const callee = context.lookup(id.sourceString);
      mustHaveBeenFound(callee, id.sourceString, { at: id });
      mustBeAFunction(callee, { at: id });
      const exps = expList.asIteration().children;
      const targetTypes = callee.type.paramTypes;
      mustHaveCorrectArgumentCount(exps.length, callee.type.paramCount, {
        at: open,
      });
      const args = exps.map((exp, i) => {
        const arg = exp.rep();
        mustBeAssignable(arg, { toType: targetTypes[i] }, { at: exp });
        return arg;
      });
      return core.functionCall(callee, args);
    },

    Primitive_void(_) {
      return core.voidType;
    },

    Primitive_true(_) {
      return true;
    },

    Primitive_false(_) {
      return false;
    },

    num(_whole, _point, _fraction, _e, _sign, _exponent) {
      return Number(this.sourceString);
    },

    stringlit(_openQuote, _chars, _closeQuote) {
      // Carlos strings will be represented as plain JS strings, including
      // the quotation marks
      return this.sourceString;
    },
  });

  return builder(match).rep();
}
