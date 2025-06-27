# Instance Swapping Strategy (`setComponentFromSource`)

This document outlines the strategy for swapping the main component of a target Figma instance based on a selected source instance.

## Core API: `InstanceNode.swapComponent()`

The primary method for this operation is `InstanceNode.swapComponent(componentNode: ComponentNode)`. 

*   It replaces the instance's `mainComponent` with the provided `componentNode`.
*   Crucially, it **attempts to preserve overrides** using the same heuristics as the Figma editor's "Swap instance" feature (primarily based on layer names and hierarchy).
*   The exact override preservation behavior is not fully documented and may change.

## Basic Workflow (Using `swapComponent` directly)

This is the simplest approach, relying on Figma's built-in override preservation.

1.  **Select Source Instance:** User selects the instance with the desired main component.
2.  **Copy Source Component ID:** The plugin gets the `mainComponentId` from the source instance (`await sourceInstance.getMainComponentAsync()`) and stores it (e.g., in `clientStorage`).
3.  **Select Target Instance:** User selects the instance to modify.
4.  **Apply Component:** The plugin retrieves the target instance and the stored `sourceMainComponentId`. It fetches the source `ComponentNode` (using `getNodeByIdAsync` or `importComponentByIdAsync`).
5.  **Execute Swap:** The plugin calls `targetInstance.swapComponent(sourceComponentNode)`. Figma handles the swap and attempts to preserve overrides.

## Advanced Workflow (Explicit Override Handling - Especially for Variant Properties)

This approach provides more control but is significantly more complex. It aims to replicate the source instance's state more precisely, particularly regarding **nested variant property overrides**.

1.  **Select Source Instance:** User selects the source instance.
2.  **Copy Enhanced Source Information:**
    *   Get `mainComponentId`.
    *   Get top-level `variantProperties` of the source instance.
    *   **Recursively traverse** the source instance's children.
    *   For each **nested `InstanceNode`**, record its **relative path** (e.g., `["Card Body", "Button"]`) and its current `variantProperties`.
    *   Store all this data (`mainComponentId`, `topLevelVariantProperties`, `nestedVariantOverrides` array) together.
3.  **Select Target Instance:** User selects the target instance.
4.  **Apply Component and Overrides:**
    *   Retrieve the target instance and the stored source data.
    *   Fetch the source `ComponentNode`.
    *   Call `targetInstance.swapComponent(sourceComponentNode)`. (Base swap)
    *   Apply the stored `topLevelVariantProperties` to the `targetInstance` using `targetInstance.setProperties(...)`.
    *   Iterate through the stored `nestedVariantOverrides` array:
        *   For each entry, use the `path` to find the corresponding nested instance within the (now swapped) `targetInstance` (e.g., using a helper like `findNodeByPath`).
        *   If the nested instance is found, apply its stored `variantProperties` using `nestedTargetInstance.setProperties(...)`.
5.  **Feedback:** Report success, including any errors encountered while applying nested overrides.

## Implementation Notes & Challenges

*   **`setProperties()`:** Applying variant properties must use `InstanceNode.setProperties()`, as `variantProperties` is read-only.
*   **Nested Node Matching:** Finding nested nodes by path after `swapComponent` can be unreliable if layer names are not unique or if the component structure differs significantly. Using IDs might be more robust but requires more complex data mapping during copy/paste.
*   **Memory Errors (`RuntimeError: memory access out of bounds`):** During development of the advanced workflow (specifically the recursive collection of nested overrides in `handleCopyStyle`), persistent memory errors occurred upon plugin startup. This indicates potential issues with:
    *   Handling very large/deeply nested component data within Figma's plugin sandbox (WASM limitations).
    *   Internal Figma API behavior when accessing properties (`variantProperties`, `children`) of complex instances recursively.
    *   Storing large/complex data structures in `clientStorage`.
    *   This error prevented the successful implementation and testing of the advanced workflow.
*   **Recommendation:** Start with the **Basic Workflow**. If `swapComponent`'s default override preservation is insufficient (especially for critical nested variants), carefully implement the **Advanced Workflow**, paying close attention to data structure size, recursion depth, and robust error handling, potentially needing to limit the scope of copied overrides.

## Naming Convention

The function implementing the workflow is named `setComponentFromSource` in `code.js`. 