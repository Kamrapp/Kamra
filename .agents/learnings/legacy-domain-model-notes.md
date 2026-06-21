# Legacy Domain Model Notes

## Purpose

Capture which legacy entity ideas should influence future MongoDB and shared TypeScript contracts.

## Concepts Worth Preserving

### Canonical Product Direction

`Element` is the nearest current canonical-product concept:

- global/shared name
- manufacturer and distributor hints
- source URL and image
- source-specific distributor key

Future models should preserve the idea, but rename and reshape it for document storage and store-specific separation.

### Composition

`Component` models a parent product containing child products with a `Ratio`.

This is valuable because many grocery or household products are compound. The ratio itself should not be assumed to be sufficient for every use case. Future composition may need:

- quantity plus unit
- percentage or weight share
- optional preparation or packaging notes
- confidence or source of composition knowledge

Composition should stay visible even if `Element` is later renamed to product, catalog item, or something else. This is not just a technical relation. It is a core domain notion for search, substitutions, stock reasoning, and eventually household planning around things that are made of other things.

### Classification

`Tag`, `Tag2Tag`, and `Element2Tag` show a flexible taxonomy idea:

- tags can be hierarchical
- products can have weighted relationships to tags
- tags can imply extra properties

This is a strong fit for future product search and intent matching, even if the relational join shapes disappear.

The useful mental model is that many searchable terms may best live as tags or tag-like normalized signals rather than only as free text inside a product name. For example, `Pilos 3,8% Bio Tej` may later be decomposed into signals such as brand, product type, organic flag, and fat-content marker, with some of those represented through tags or searchable normalized attributes.

### Typed Flexible Properties

`Property` and `PropertyValue` show a typed extensibility pattern:

- scalar property types
- value-list property types
- per-product property assignments through tag inheritance

The future system should preserve the need for typed extensibility, but probably not the exact relational composite key design. A document-friendly variant is more likely:

- property definitions in one collection or shared contract area
- typed value arrays or normalized typed fields
- explicit value source and confidence metadata where needed

## Concepts To Split Apart

`Stock` currently mixes multiple roles:

- store offer or availability observation
- household inventory quantity
- possible future in-store stock or owned stock semantics

The future architecture should separate these into distinct concepts instead of reusing one overloaded model.

## Mapping Lesson

The old `ToDto` and `ToModel` methods are worth preserving as a boundary discipline:

- use shared contracts when shapes are truly shared
- still map explicitly when crossing raw, normalized, canonical, household, admin, or auth boundaries
- avoid accidental coupling between workflow payloads and public API responses
