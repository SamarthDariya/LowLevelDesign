# Abstract Factory

## Problem it solves

Your app supports **light** and **dark** themes. Every screen renders buttons, checkboxes, and scrollbars — and each widget has a light variant and a dark variant. If screens instantiate widgets directly (`new DarkButton()`, `new LightCheckbox()`), two things go wrong. First, every screen repeats the theme decision, so theme checks (`if (theme === "dark")`) metastasize across the UI code. Second — and worse — nothing stops a bug like a `DarkButton` next to a `LightCheckbox` on the same screen. The compiler/runtime is perfectly happy to let you mix families; your designer is not.

The core pain: you have **families of related objects** that must be used *together and consistently*, and the family in play is decided at runtime (user preference, OS setting, platform, region). The same shape appears everywhere: Windows/Mac/Linux widget sets, MySQL/Postgres/SQLite drivers (connection + query builder + transaction must all match), or a game's medieval/sci-fi asset packs.

Abstract Factory solves this by grouping the creation of a whole family behind one factory object. A screen receives *a factory* and asks it for a button, a checkbox, a scrollbar — never knowing which family it got. Consistency becomes structural: a `DarkThemeFactory` is *incapable* of producing a light widget, so mixed families can't happen. Switching themes means swapping one factory object in one place.

## The Pattern

Provide an interface for creating **families of related objects** without specifying their concrete classes. It is essentially a set of Factory Methods (one per product type) bundled into one object, with the guarantee that all products from one factory belong together.

**Participants:**

| Role | In our example |
|---|---|
| Abstract Products | `Button`, `Checkbox`, `ScrollBar` |
| Concrete Products | `LightButton`/`DarkButton`, `LightCheckbox`/`DarkCheckbox`, ... |
| Abstract Factory | `ThemeFactory` — one `createX()` per product type |
| Concrete Factories | `LightThemeFactory`, `DarkThemeFactory` — each builds one full family |
| Client | `SettingsPage` — uses only the abstract factory + abstract products |

```
                    ThemeFactory (abstract)
                 +------------------------+
      client --> | + createButton()       |
                 | + createCheckbox()     |
                 | + createScrollBar()    |
                 +------------------------+
                    ^                ^
         +----------+--+          +--+-----------+
         | LightTheme   |         | DarkTheme    |
         | Factory      |         | Factory      |
         +--------------+         +--------------+
           |    |                    |    |
           v    v                    v    v
     LightButton LightCheckbox  DarkButton DarkCheckbox   <- concrete products
           \       /                  \       /
            v     v                    v     v
           Button, Checkbox (abstract products — all the client sees)

One row = one FAMILY. A factory can only ever produce its own row.
```

## Code Example

```javascript
// ---------- Abstract Products (interfaces by convention) ----------
class Button {
  render() { throw new Error("render() not implemented"); }
}

class Checkbox {
  render() { throw new Error("render() not implemented"); }
}

class ScrollBar {
  render() { throw new Error("render() not implemented"); }
}

// ---------- Concrete Products: Light family ----------
class LightButton extends Button {
  render() { return `<button style="background:#fff;color:#111">OK</button>`; }
}
class LightCheckbox extends Checkbox {
  render() { return `<input type="checkbox" class="light-checkbox">`; }
}
class LightScrollBar extends ScrollBar {
  render() { return `[light scrollbar: thin, grey thumb]`; }
}

// ---------- Concrete Products: Dark family ----------
class DarkButton extends Button {
  render() { return `<button style="background:#111;color:#eee">OK</button>`; }
}
class DarkCheckbox extends Checkbox {
  render() { return `<input type="checkbox" class="dark-checkbox">`; }
}
class DarkScrollBar extends ScrollBar {
  render() { return `[dark scrollbar: thick, slate thumb]`; }
}

// ---------- Abstract Factory ----------
// One method per product type. Each concrete factory returns products
// that are guaranteed to belong to the SAME family.
class ThemeFactory {
  createButton()    { throw new Error("not implemented"); }
  createCheckbox()  { throw new Error("not implemented"); }
  createScrollBar() { throw new Error("not implemented"); }
}

// ---------- Concrete Factories ----------
class LightThemeFactory extends ThemeFactory {
  createButton()    { return new LightButton(); }
  createCheckbox()  { return new LightCheckbox(); }
  createScrollBar() { return new LightScrollBar(); }
}

class DarkThemeFactory extends ThemeFactory {
  createButton()    { return new DarkButton(); }
  createCheckbox()  { return new DarkCheckbox(); }
  createScrollBar() { return new DarkScrollBar(); }
}

// ---------- Client ----------
// The client receives A factory and never knows (or cares) which family
// it is building. Consistency across the family is automatic.
class SettingsPage {
  #factory;

  constructor(factory) {
    this.#factory = factory;
  }

  render() {
    const button    = this.#factory.createButton();
    const checkbox  = this.#factory.createCheckbox();
    const scrollbar = this.#factory.createScrollBar();
    return [button.render(), checkbox.render(), scrollbar.render()].join("\n");
  }
}

// ---------- Demo ----------
// Selecting a family is a single decision at one place (e.g. user prefs).
function factoryFor(theme) {
  const factories = {
    light: new LightThemeFactory(),
    dark:  new DarkThemeFactory(),
  };
  const factory = factories[theme];
  if (!factory) throw new Error(`Unknown theme: ${theme}`);
  return factory;
}

console.log("--- Light theme ---");
console.log(new SettingsPage(factoryFor("light")).render());

console.log("--- Dark theme ---");
console.log(new SettingsPage(factoryFor("dark")).render());
```

Output:

```
--- Light theme ---
<button style="background:#fff;color:#111">OK</button>
<input type="checkbox" class="light-checkbox">
[light scrollbar: thin, grey thumb]
--- Dark theme ---
<button style="background:#111;color:#eee">OK</button>
<input type="checkbox" class="dark-checkbox">
[dark scrollbar: thick, slate thumb]
```

Note how `SettingsPage` contains **zero** theme logic. Adding a "high-contrast" family means adding three product classes and one factory class — no existing file changes.

## When to use / When NOT to use

**Use when:**
- You create **multiple related products** that must be consistent with each other (theme widgets, matched DB driver components, platform-specific implementations).
- The family is chosen at runtime or by configuration, and you want that choice made in exactly one place.
- You want to be able to add a whole new family (new theme, new platform) without touching client code.

**Do NOT use when:**
- There is only **one product type** — that's Factory Method territory; Abstract Factory would be an empty shell around it.
- Families won't realistically multiply — the parallel class hierarchy (N families x M products) is real overhead.
- Products in a "family" don't actually need to be consistent with each other — you're grouping for tidiness, not correctness, and simple factories would do.
- Beware the weak spot: adding a new **product type** (say, `Slider`) forces a change in the abstract factory *and every* concrete factory. Abstract Factory is easy to extend with families, expensive to extend with product types.

## Real-world usages

- **UI component libraries with theming** — MUI/Chakra-style `ThemeProvider`s hand every component a consistent family of styles/tokens.
- **Database drivers** — Knex.js picks a dialect "family" (Postgres/MySQL/SQLite) that produces matching query compiler, schema builder, and connection objects.
- **Cross-platform toolkits** — Electron/React Native style layers that produce the platform-appropriate set of native widgets.
- **Cloud SDK abstraction layers** — a `CloudProviderFactory` returning matched storage + queue + compute clients for AWS vs GCP.

## Interview Notes

- The must-know question: *"Factory Method vs Abstract Factory?"* — Factory Method creates **one product** via subclassing one method; Abstract Factory creates **a family of related products** via an object exposing several factory methods. An abstract factory is typically *implemented with* factory methods.
- *"What's the main drawback?"* — adding a new product type ripples through every factory (interface change); adding a new family is cheap. Know this asymmetry.
- Machine-coding problems that use it: **cross-theme UI kits**, **multi-database support layers**, **Pizza store with regional franchises** (NY/Chicago ingredient factories — the Head First classic), **game asset packs** (medieval vs sci-fi unit sets).
- Interviewers may ask you to *start* with Factory Method and then extend to Abstract Factory when a second related product appears — practice that refactor narrative.
- Point out the consistency guarantee explicitly: the pattern makes mixed families **unrepresentable**, which is a stronger claim than "it organizes creation".

## Quick Recap

- Abstract Factory = **one object that creates an entire family** of related products; the client never names concrete classes.
- Guarantees family **consistency** structurally — a dark factory cannot emit a light widget.
- Swap the whole product family by swapping a single factory object at one composition point.
- Cheap to add families, expensive to add product types (every factory must change).
- Think of it as Factory Method's plural: several factory methods, bundled, with a togetherness guarantee.
