// HACK: passing both `<Client list={items} sortedList={items.toSorted()} />`
// (or any pair of derivations of the same source) doubles the bytes
// React serializes across the RSC wire. The client gets two copies of
// roughly the same array; one of the props is redundant. Have the
// client derive what it needs from the single source prop instead.

export const MUTABLE_CONTAINER_CONSTRUCTORS = new Set(["Map", "Set", "WeakMap", "WeakSet"]);
