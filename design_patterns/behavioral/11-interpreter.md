# Interpreter

## Problem it solves

Your pricing team wants to configure discount rules without deploying code: `"total - total * discount"`, `"price * qty + shipping"`. Your alerting product lets users write conditions like `"cpu > 80 and disk > 90"`. Your search box supports `"author:kim AND (tag:js OR tag:node)"`. In each case, users express logic in a small textual language, and your program must evaluate it — repeatedly, against different data.

You could `eval()` the strings — a security hole and an instant interview fail. You could regex-hack each case — collapses the moment expressions nest (`(3 + 4) * 2`). The structured answer: define a **grammar** for your mini-language, and represent each grammar rule as a class. An expression then becomes a *tree of objects* — an Abstract Syntax Tree (AST) — where leaves are terminal expressions (numbers, variables) and internal nodes are non-terminal expressions (add, multiply). Every node implements one method, `interpret(context)`, which evaluates itself, recursively interpreting its children. The `context` carries external data such as variable values.

The Interpreter pattern is really the Composite pattern plus an `interpret` operation, usually fed by a small parser that turns text into the tree. Its killer feature: the AST is a *reusable object* — parse `"total - total * discount"` once, then interpret it against thousands of different contexts. It's the rarest GoF pattern in day-to-day code, but it's the conceptual foundation of every regex engine, template language, and query DSL you use.

## The Pattern

**Intent:** Given a language, define a representation for its grammar along with an interpreter that uses the representation to interpret sentences in the language.

Participants:

- **AbstractExpression** (`Expression`): declares `interpret(context)`.
- **TerminalExpressions** (`NumberExpression`, `VariableExpression`): leaves; interpret themselves directly (a variable looks itself up in the context).
- **NonterminalExpressions** (`AddExpression`, `MultiplyExpression`, ...): one per grammar rule; hold child expressions and combine their results.
- **Context:** data the interpretation needs (variable bindings).
- **Client / Parser:** builds the AST from the input text (the GoF pattern assumes the tree exists; in practice you write a small parser).

```
  Grammar:  expression := term (('+'|'-') term)*
            term       := factor (('*'|'/') factor)*
            factor     := NUMBER | VARIABLE | '(' expression ')'

  "price * qty + shipping"   --parse-->        AddExpression
                                                /          \
                                     MultiplyExpression   Variable("shipping")
                                        /        \
                              Variable("price")  Variable("qty")

  evaluate: root.interpret({price: 20, qty: 10, shipping: 50})  // 250
```

## Code Example

An arithmetic evaluator with variables and precedence. Save as `interpreter.js` and run with `node interpreter.js`.

```javascript
// Grammar (classic recursive-descent, * and / bind tighter than + and -):
//   expression := term (('+' | '-') term)*
//   term       := factor (('*' | '/') factor)*
//   factor     := NUMBER | VARIABLE | '(' expression ')'

// ----- Abstract Expression -----
class Expression {
  interpret(context) {
    throw new Error('interpret() must be implemented');
  }
}

// ----- Terminal expressions: leaves of the AST -----
class NumberExpression extends Expression {
  #value;
  constructor(value) {
    super();
    this.#value = value;
  }
  interpret() {
    return this.#value;
  }
}

class VariableExpression extends Expression {
  #name;
  constructor(name) {
    super();
    this.#name = name;
  }
  interpret(context) {
    if (!(this.#name in context)) {
      throw new Error(`Undefined variable: ${this.#name}`);
    }
    return context[this.#name];
  }
}

// ----- Non-terminal expressions: internal nodes of the AST -----
class BinaryExpression extends Expression {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }
}

class AddExpression extends BinaryExpression {
  interpret(ctx) { return this.left.interpret(ctx) + this.right.interpret(ctx); }
}
class SubtractExpression extends BinaryExpression {
  interpret(ctx) { return this.left.interpret(ctx) - this.right.interpret(ctx); }
}
class MultiplyExpression extends BinaryExpression {
  interpret(ctx) { return this.left.interpret(ctx) * this.right.interpret(ctx); }
}
class DivideExpression extends BinaryExpression {
  interpret(ctx) { return this.left.interpret(ctx) / this.right.interpret(ctx); }
}

// ----- Parser: turns "x + 4 * 2" into an AST of Expression objects -----
class Parser {
  #tokens;
  #position = 0;

  constructor(input) {
    // Tokenize: numbers, identifiers, operators, parentheses.
    this.#tokens = input.match(/\d+(\.\d+)?|[a-zA-Z_]\w*|[-+*/()]/g) ?? [];
  }

  parse() {
    const ast = this.#parseExpression();
    if (this.#position < this.#tokens.length) {
      throw new Error(`Unexpected token: ${this.#peek()}`);
    }
    return ast;
  }

  #peek() { return this.#tokens[this.#position]; }
  #next() { return this.#tokens[this.#position++]; }

  #parseExpression() {
    let left = this.#parseTerm();
    while (this.#peek() === '+' || this.#peek() === '-') {
      const op = this.#next();
      const right = this.#parseTerm();
      left = op === '+'
        ? new AddExpression(left, right)
        : new SubtractExpression(left, right);
    }
    return left;
  }

  #parseTerm() {
    let left = this.#parseFactor();
    while (this.#peek() === '*' || this.#peek() === '/') {
      const op = this.#next();
      const right = this.#parseFactor();
      left = op === '*'
        ? new MultiplyExpression(left, right)
        : new DivideExpression(left, right);
    }
    return left;
  }

  #parseFactor() {
    const token = this.#next();
    if (token === '(') {
      const expr = this.#parseExpression();
      if (this.#next() !== ')') throw new Error('Expected closing parenthesis');
      return expr;
    }
    if (/^\d/.test(token)) return new NumberExpression(parseFloat(token));
    if (/^[a-zA-Z_]/.test(token)) return new VariableExpression(token);
    throw new Error(`Unexpected token: ${token}`);
  }
}

// ----- Client code -----
const evaluate = (input, context = {}) =>
  new Parser(input).parse().interpret(context);

console.log(evaluate('3 + 4 * 2'));                 // 11 (precedence works)
console.log(evaluate('(3 + 4) * 2'));               // 14
console.log(evaluate('10 / 4 - 1'));                // 1.5
console.log(evaluate('price * qty + shipping', {    // 250
  price: 20, qty: 10, shipping: 50,
}));

// The AST is a reusable object: build once, interpret many times.
const discountRule = new Parser('total - total * discount').parse();
console.log(discountRule.interpret({ total: 200, discount: 0.1 }));  // 180
console.log(discountRule.interpret({ total: 500, discount: 0.25 })); // 375
```

Notice how operator precedence falls out of the grammar structure: `#parseTerm` (which handles `*` `/`) is called *inside* `#parseExpression` (which handles `+` `-`), so multiplication binds tighter with zero special-casing. That grammar-to-methods mapping is called *recursive descent parsing*.

## When to use / When NOT to use

**Use when:**

- Users or configuration need to express logic as text: discount rules, alert conditions, feature-flag targeting, search filters, spreadsheet formulas.
- The language is *small* and its grammar is *stable* — a handful of rules.
- You'd otherwise reach for `eval()` — Interpreter gives you evaluation with a strictly controlled, safe vocabulary.
- Expressions are evaluated repeatedly against varying data (parse once, interpret many).

**Avoid when:**

- The grammar is large or evolving — a class per rule explodes; use a parser generator (PEG.js/peggy, nearley, ANTLR) or an existing language.
- Performance is critical — tree-walking interpretation is slow; real engines compile to bytecode or closures.
- A simpler representation suffices — if rules are just `{field, op, value}` triples, a data-driven rules array beats a language.
- You only ever evaluate one hard-coded expression — just write the code.

## Real-world usages

- Regular expressions — `new RegExp("a(b|c)+")` parses a pattern language into an internal matcher structure; the classic Interpreter example.
- Template engines (Handlebars, Nunjucks, JSX via Babel) and expression evaluators like `mathjs` or spreadsheet formula engines.
- Query languages and filters — SQL `WHERE` fragments, MongoDB query objects, GraphQL queries, JSONPath/XPath, Jira JQL — parsed into expression trees and interpreted against data.
- Business-rules engines — insurance eligibility, pricing, and promotion rules written by non-engineers and interpreted at runtime.

## Interview Notes

- **Realistic framing:** full Interpreter is rarely demanded in machine coding, but "design a rule/expression evaluator" or "calculator with precedence and parentheses" appears regularly — and this exact recursive-descent structure is the expected answer. It also backs "design a spreadsheet" (formula cells) and "design a search filter".
- **Interpreter vs Visitor:** Interpreter puts `interpret()` *on* the AST nodes; production compilers instead keep nodes dumb and use *Visitor* to walk them, so many operations (type-check, optimize, evaluate, pretty-print) can share one tree. Know that these two patterns are teammates.
- **Interpreter vs Composite:** the AST *is* a Composite; Interpreter = Composite + a grammar-driven structure + an `interpret` operation.
- Be ready to explain how precedence and parentheses are handled (grammar layering, as above) — this is where candidates crumble.
- Security talking point: Interpreter is the principled alternative to `eval()` for user-supplied expressions — you control exactly what the language can do.

## Quick Recap

- Represent a mini-language's grammar as classes; sentences become object trees (ASTs).
- Terminals (numbers, variables) are leaves; non-terminals (add, multiply) combine children; all implement `interpret(context)`.
- Context supplies external data (variable values); parse once, interpret against many contexts.
- Precedence comes from grammar layering in a recursive-descent parser.
- Rare pattern, big concept: regexes, templates, and query languages all live on this idea.
