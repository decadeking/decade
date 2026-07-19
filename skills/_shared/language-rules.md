# Language-Specific Rules

Code Shine applies generic decay-risk rules to every language, plus a small set of
language-specific extensions. Each extension activates only when the scanner encounters
files of that family. Generic rules still apply in every case.

> When in doubt, default to the generic rules in `decay-risks.md` and `test-decay-risks.md`.
> Language-specific rules sharpen, they do not replace.

---

## C-family (C, C++, C#, Java, Kotlin, Scala, Objective-C, Swift)

- **R1 Cognitive Overload:** Header includes / using directives that pull in transitive
  surface area beyond the file's own needs (C/C++); `@SuppressWarnings("all")` blanket
  suppression (Java); massive public class APIs (> 30 public methods) without grouping.
- **R2 Change Propagation:** Preprocessor macros (C/C++) that silently change call
  signatures; `partial` classes split across many files (C#) when one cohesive change
  touches > 3 partials; companion-object / extension-function sprawl (Kotlin).
- **R3 Knowledge Duplication:** String constants (error codes, log keys, SQL fragments)
  duplicated across files instead of a single constant class.
- **R4 Accidental Complexity:** Builder-only fluent APIs for value objects that have
  no validation logic; abstract base classes with one concrete subclass; interface-only
  modules with no implementation.
- **R5 Dependency Disorder:** Cyclic package dependencies; `Main-Class` self-imports;
  Kotlin circular module dependencies via `internal` cross-module references.
- **R6 Domain Model Distortion:** Java/Kotlin `data class`es used as DTOs that later
  gain business logic (anemic model drift); nullability rules inconsistent across
  the codebase (`@Nullable` ignored, `Optional` mixed with null).

## Systems (Rust, Go, Zig)

- **R1 Cognitive Overload:** Long match arms with > 4 conditions; deeply nested `if let`
  / `?` chains; trait/impl blocks > 100 lines.
- **R2 Change Propagation:** Public struct fields accessed across module boundaries
  (encapsulation loss); Go exported package-level `var` used as implicit global state.
- **R3 Knowledge Duplication:** Repeated error message strings; the same validation
  rule reimplemented in multiple crates/packages.
- **R4 Accidental Complexity:** `Box<dyn Trait>` for objects that have one concrete
  type; `Arc<Mutex<T>>` where a channel would be clearer; trait objects behind a
  generic parameter for no semantic reason.
- **R5 Dependency Disorder:** Crate/package dependency cycles; workspace members that
  re-export each other's internal modules; Go imports that bypass `internal/`.
- **R6 Domain Model Distortion:** `String` typed fields where the type system already
  has a domain-specific newtype available; Go structs with `interface{}` fields that
  carry domain semantics; type aliases used in place of distinct domain types.

## Web (TypeScript, JavaScript, HTML, CSS)

- **R1 Cognitive Overload:** JSX/TSX components with > 5 levels of nested children;
  inline arrow functions defined inside props (re-created on every render); CSS
  selectors > 4 levels deep.
- **R2 Change Propagation:** Prop drilling > 3 levels deep; `useEffect` cleanup
  responsibilities duplicated across components; global event listeners without
  teardown.
- **R3 Knowledge Duplication:** The same business rule expressed in client-side
  validation, server-side validation, and database constraints; the same color,
  spacing, or typography token repeated as a literal in CSS / styled-components.
- **R4 Accidental Complexity:** Wrapper HOCs / custom hooks that only forward props;
  barrel files (`index.ts`) that re-export everything in the module; premature
  generic abstraction around a single use case.
- **R5 Dependency Disorder:** Cyclic imports between ES modules; `any` types in
  TypeScript that propagate across the codebase; CSS-in-JS libraries mixed with
  vanilla CSS without a clear rule.
- **R6 Domain Model Distortion:** API response types reused as domain entities
  (no anti-corruption layer); string-typed union values (`type: "user" | "admin"`)
  without a discriminated-union type.

## Scripting (Python, Ruby, PHP, Perl, Lua, Shell)

- **R1 Cognitive Overload:** Functions > 30 lines; deeply nested comprehensions;
  dynamic `getattr` / `method_missing` chains; shell `if` / `case` > 4 levels.
- **R2 Change Propagation:** Monkey-patching a third-party module; `globals()` /
  `eval` used as cross-module communication; shell scripts that source each other
  in non-obvious ways.
- **R3 Knowledge Duplication:** The same regex or path normalization expressed
  in multiple modules; constants duplicated between Python source and Jinja templates.
- **R4 Accidental Complexity:** Abstract base classes with a single subclass;
  metaclasses used for validation; shell wrappers around simple commands.
- **R5 Dependency Disorder:** Python relative imports across > 3 packages;
  shell scripts that reach into another script's variables; `sys.path` manipulation
  in library code.
- **R6 Domain Model Distortion:** `dict` / `Hash` used as the only data structure
  for domain entities; no type hints on a Python module whose business logic is
  non-trivial.

## Functional (Haskell, Elixir, Erlang, Clojure, F#, OCaml)

- **R1 Cognitive Overload:** Point-free style that obscures data flow; long
  `do` / comprehension blocks; macros that hide obvious operations.
- **R2 Change Propagation:** Type classes / protocols added across many modules
  for a single concrete type; behaviour modules that re-export each other.
- **R3 Knowledge Duplication:** The same pure function defined in two utility
  modules; pattern matches that diverge from a canonical ADT definition.
- **R4 Accidental Complexity:** Monads / monad transformers introduced for
  one-off effects; macro-based DSLs that duplicate standard library features.
- **R5 Dependency Disorder:** Application supervisors reimplementing standard
  library supervision; circular module references in Clojure namespaces.
- **R6 Domain Model Distortion:** String-typed `Map` keys where a `newtype` /
  record would model the domain; `defrecord` with all-optional fields and
  no validation.

## Data / Config (SQL, YAML, TOML, JSON, XML)

- **R1 Cognitive Overload:** SQL queries > 30 lines; deeply nested JSON / XML
  with no schema; YAML anchors used to hide structural complexity.
- **R2 Change Propagation:** A schema change requiring coordinated updates in
  > 3 query files; environment-specific config spread across multiple YAML files
  without clear ownership.
- **R3 Knowledge Duplication:** The same column list or filter expression
  copy-pasted across queries; the same configuration key expressed in both
  environment variables and config files.
- **R4 Accidental Complexity:** Stored procedures / functions that reimplement
  application logic; ORM models with `on_delete=DO_NOTHING` / `null=True` defaults
  applied everywhere.
- **R5 Dependency Disorder:** Database views that depend on each other circularly;
  migration files that depend on later migrations.
- **R6 Domain Model Distortion:** Generic `value` / `data` JSON payloads where
  the domain has named concepts; SQL columns named after UI fields instead of
  domain entities.

## Other (Dart, R, Julia, MATLAB)

- Apply the generic rules with the same discipline. When a language has strong
  static typing (Dart, Julia), flag implicit-`any` / untyped patterns under R6.
  When a language is dynamically typed (R, MATLAB), flag missing input validation
  in entry points under R1 / R2.

---

## Reviewer Discipline

Generic rules apply to every language. The language-specific rules above are *nudges*:
- Use them when they sharpen an existing finding, not to manufacture new ones.
- A finding must still satisfy the Iron Law (Symptom → Source → Consequence → Remedy).
- A language-specific rule that is not backed by a real symptom in the code is not
  a finding — it is the rule of the month.
- If two rules pull in different directions for the same construct (e.g. a small
  generic wrapper may be R4 *and* helpful test isolation), state the tradeoff
  in the Consequence line rather than picking one side.
