# Template Method

## Problem it solves

Your team generates several kinds of reports: a plain-text sales summary, an HTML dashboard export, maybe a PDF later. Look at any two of the generators and you see the same skeleton: clean the raw records, parse them, run some aggregation, format the output, append a footer. The *steps and their order* are identical; only *how* certain steps work differs (parsing CSV vs JSON, formatting text vs HTML).

Copy-pasting the pipeline into each report class duplicates the invariant parts. When the cleaning rule changes ("also drop records with negative values"), you must hunt down every copy. Worse, copies drift: one report validates, another forgot to. The opposite extreme — one class with flags like `format: 'html' | 'text'` — turns every step into a conditional mess.

The Template Method pattern fixes the skeleton in a base class as a single method (the *template method*) that calls a sequence of steps. Invariant steps are implemented in the base class (and kept private so nobody overrides them). Variant steps are declared abstract — subclasses *must* fill them in. Optional steps become *hooks* — methods with a sensible default that subclasses *may* override. The algorithm's structure is written exactly once; variation happens only at the designated extension points. This is the "Hollywood Principle": *don't call us, we'll call you* — the base class calls the subclass, not the other way around.

## The Pattern

**Intent:** Define the skeleton of an algorithm in a base class, deferring some steps to subclasses. Subclasses redefine certain steps without changing the algorithm's structure.

Participants:

- **Abstract Class** (`ReportGenerator`): implements the template method (`generate`) that fixes the step order; implements invariant steps; declares abstract steps; provides hooks with defaults.
- **Concrete Classes** (`CsvSalesReport`, `HtmlSalesReport`): implement the abstract steps, optionally override hooks. They never override the template method itself.

```
+-----------------------------------+
|        AbstractClass              |
|  ReportGenerator                  |
|  + generate(raw)     <- TEMPLATE  |   generate() {
|      (fixed step order)           |     cleaned = #removeEmpty(raw)  // fixed
|  - #removeEmptyRecords()  fixed   |     data    = parse(cleaned)     // abstract
|  + parse()            abstract    |     result  = analyze(data)      // hook
|  + format()           abstract    |     out     = format(result)     // abstract
|  + analyze()          hook        |     if (shouldAddFooter()) ...   // hook
|  + shouldAddFooter()  hook        |   }
+----------------^------------------+
                 |
        +--------+---------+
        |                  |
+-------+-------+  +-------+--------+
| CsvSalesReport|  | HtmlSalesReport|
| parse, format |  | parse, format, |
|               |  | analyze, hooks |
+---------------+  +----------------+
```

## Code Example

A report-generation pipeline. Save as `template-method.js` and run with `node template-method.js`.

```javascript
// ----- Abstract class: owns the algorithm's skeleton -----
class ReportGenerator {
  // THE template method. It fixes the order of steps.
  // Subclasses customize steps, but can never reorder or skip them.
  generate(rawRecords) {
    const cleaned = this.#removeEmptyRecords(rawRecords); // fixed step
    const data = this.parse(cleaned);                     // abstract step
    const analyzed = this.analyze(data);                  // hook w/ default
    const output = this.format(analyzed);                 // abstract step
    if (this.shouldAddFooter()) {                         // hook
      return output + this.footer();
    }
    return output;
  }

  // A private, invariant step no subclass can touch.
  #removeEmptyRecords(records) {
    return records.filter((r) => r && r.trim().length > 0);
  }

  // --- Abstract steps: subclasses MUST implement these ---
  parse(records)  { throw new Error('parse() must be implemented'); }
  format(result)  { throw new Error('format() must be implemented'); }

  // --- Hooks: optional overrides with sensible defaults ---
  analyze(data) {
    // Default analysis: count and sum.
    const values = data.map((d) => d.value);
    return {
      rows: data,
      count: values.length,
      total: values.reduce((a, b) => a + b, 0),
    };
  }

  shouldAddFooter() { return true; }
  footer()          { return '\n-- end of report --'; }
}

// ----- Concrete class 1: plain-text sales report from CSV lines -----
class CsvSalesReport extends ReportGenerator {
  parse(records) {
    return records.map((line) => {
      const [product, value] = line.split(',');
      return { product: product.trim(), value: Number(value) };
    });
  }

  format({ rows, count, total }) {
    const lines = rows.map((r) => `${r.product.padEnd(12)} $${r.value}`);
    return [`SALES REPORT (${count} items)`, ...lines, `TOTAL: $${total}`].join('\n');
  }
}

// ----- Concrete class 2: HTML report, custom analysis, no footer -----
class HtmlSalesReport extends ReportGenerator {
  parse(records) {
    return records.map((line) => {
      const [product, value] = line.split(',');
      return { product: product.trim(), value: Number(value) };
    });
  }

  analyze(data) {
    // Override the hook: also compute the best seller.
    const base = super.analyze(data);
    const best = data.reduce((a, b) => (a.value >= b.value ? a : b));
    return { ...base, best };
  }

  format({ rows, total, best }) {
    const items = rows
      .map((r) => `  <li>${r.product}: $${r.value}</li>`)
      .join('\n');
    return `<ul>\n${items}\n</ul>\n<p>Total: $${total}. Best seller: ${best.product}</p>`;
  }

  shouldAddFooter() { return false; } // HTML report opts out of the footer
}

// ----- Client code: same input, same skeleton, different reports -----
const rawData = ['Keyboard, 120', '', 'Mouse, 45', '   ', 'Monitor, 300'];

console.log(new CsvSalesReport().generate(rawData));
console.log();
console.log(new HtmlSalesReport().generate(rawData));
```

JS note: JavaScript has no `abstract` or `final` keywords, so conventions carry the design — throwing from "abstract" methods, and using `#private` methods for steps that must never be overridden. A functional alternative is passing step functions as parameters (`generate(raw, { parse, format })`), which shades into the Strategy pattern.

## When to use / When NOT to use

**Use when:**

- Several classes share the same multi-step algorithm and differ only in some steps — factor the skeleton up, push the differences down.
- You want to guarantee the step *order* is followed and can't be broken by subclasses (compliance, pipelines, protocols).
- You are building a framework: the framework owns the flow, users fill in the blanks (the Hollywood Principle).

**Avoid when:**

- The *sequence itself* differs between variants — Template Method fixes the order; if order varies, you need a different design.
- Nearly every step varies — the base class degenerates into empty scaffolding; use Strategy objects instead.
- You're in a codebase that prefers composition — deep inheritance hierarchies are harder to test and reuse than injected step functions; in JS, Strategy-by-function is often the more idiomatic choice.
- You need to vary behavior per *instance* at runtime — inheritance binds the variation at class-definition time; Strategy binds it at runtime.

## Real-world usages

- Testing frameworks — Jest/JUnit fix the flow `setup → test → teardown`; you implement the pieces (`beforeEach`, the test body, `afterEach`).
- React class components — React owns the lifecycle skeleton and calls *your* `render`, `componentDidMount`, `shouldComponentUpdate` (a hook, literally) at fixed points.
- Build tools and framework hooks — webpack plugin lifecycle, Vue lifecycle hooks (`created`, `mounted`), Rails/ORM callbacks (`beforeSave`, `afterCreate`).
- Data pipelines / ETL frameworks — extract/transform/load skeleton fixed, per-source steps overridden.

## Interview Notes

- **Template Method vs Strategy — the standard question:** both isolate varying behavior. Template Method uses *inheritance* and varies *parts* of an algorithm at class-definition time; Strategy uses *composition* and swaps the *entire* algorithm at runtime. One-liner: Template Method = "fill in the blanks", Strategy = "swap the whole page".
- Know the three kinds of steps: **fixed** (implemented in base, non-overridable), **abstract** (must override), **hooks** (may override; default provided). Interviewers probe whether you know hooks.
- Name-drop the **Hollywood Principle** ("don't call us, we'll call you") — the base class calls subclass methods, an inversion of control.
- **Machine-coding usage:** report/invoice generators, data importers with per-format parsing, game turn loops (setup → player moves → evaluate → cleanup), payment processing flows (validate → debit → notify) where the flow is fixed but steps differ per provider.
- Common pitfall to mention: the *fragile base class* problem — changes to the base can silently break subclasses; keep the skeleton small and stable.

## Quick Recap

- Base class owns the algorithm skeleton in one template method; subclasses fill in steps.
- Three step types: fixed (base-only), abstract (must implement), hook (optional override).
- Guarantees step order; removes duplicated pipelines across sibling classes.
- Inheritance-based cousin of Strategy — Strategy composes and swaps whole algorithms at runtime.
- In JS, enforce "abstract" by throwing, and "final" steps with `#private` methods.
