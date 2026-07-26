# ADR-0001: GIS LayerController

- Status: Accepted
- Date: 2026-07-26
- Milestone: M2 GIS Core
- Phase: 1

## Context

JCWS maintains GIS layer state in a framework-independent
LayerRegistry, while the operational map is rendered by OpenLayers.

Directly connecting React components to OpenLayers would duplicate
logic and tightly couple the user interface to the rendering library.

## Decision

Introduce LayerController as the orchestration boundary between:

1. LayerRegistry
2. OpenLayersAdapter
3. OpenLayers map layers

The controller subscribes to registry snapshots and applies visibility,
opacity, z-index, locking, classification and feature metadata to bound
OpenLayers layers.

## Responsibilities

- Bind and unbind OpenLayers layers
- Synchronize visibility
- Synchronize opacity
- Synchronize z-index
- Maintain active-layer state
- Apply JCWS metadata to OpenLayers layers
- Remove bindings for deleted registry layers
- Release subscriptions during disposal

## Consequences

### Benefits

- React does not manipulate OpenLayers directly
- Rendering infrastructure remains replaceable
- Synchronization logic has one owner
- Future Cesium and MapLibre adapters can reuse the domain model
- Replay and persistence engines can operate through the registry

### Trade-offs

- Adds an additional orchestration class
- OpenLayers layers must be explicitly bound to registry IDs
- Bidirectional OpenLayers-to-registry synchronization remains a
  separate future capability
