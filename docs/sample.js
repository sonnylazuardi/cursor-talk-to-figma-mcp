// --- Helper: Deep Equality Check ---
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  if (Array.isArray(obj1)) {
    if (!Array.isArray(obj2) || obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }
  if (Array.isArray(obj2)) return false;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!Object.prototype.hasOwnProperty.call(obj2, key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
}

// --- Helper: Get Properties to Compare ---
function getComparableProperties(node) {
    const commonProps = [
        'visible', 'locked', 'opacity', 'blendMode', 'isMask', 'effects',
        'relativeTransform', 'x', 'y', 'rotation', 'width', 'height',
        'layoutAlign', 'layoutGrow', 'constraints'
    ];
    const excludedProps = new Set(['id', 'type', 'parent', 'children', 'mainComponent', 'masterComponent']);
    let typeSpecificProps = [];
    switch (node.type) {
        case 'FRAME':
        case 'COMPONENT':
        case 'INSTANCE':
        case 'RECTANGLE':
        case 'GROUP':
             typeSpecificProps = [
                'fills', 'strokes', 'strokeWeight', 'strokeAlign', 'cornerRadius',
                'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius',
                'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom',
                'itemSpacing', 'layoutMode', 'primaryAxisSizingMode', 'counterAxisSizingMode',
                'primaryAxisAlignItems', 'counterAxisAlignItems', 'clipsContent'
            ]; break;
        case 'TEXT':
            typeSpecificProps = [
                'characters', 'fills', 'fontSize', 'fontName',
                'letterSpacing', 'lineHeight', 'paragraphIndent', 'paragraphSpacing',
                'textAlignHorizontal', 'textAlignVertical', 'textAutoResize', 'textCase', 'textDecoration',
            ]; break;
        case 'VECTOR':
            typeSpecificProps = [
                'fills', 'strokes', 'strokeWeight', 'strokeAlign', 'strokeCap', 'strokeJoin', 'strokeMiterLimit',
                'vectorNetwork', 'vectorPaths'
            ]; break;
    }
    return [...commonProps, ...typeSpecificProps].filter(prop => !excludedProps.has(prop));
}


// --- Recursive Function to Compare Nodes and Collect Overrides ---
async function collectOverrides(instanceNode, mainComponentNode, currentPath = []) {
    const overrides = {}; // Object to store overrides for the current node level

    // --- Initial Checks ---
    if (!mainComponentNode) {
        console.warn(`  - Cannot collect overrides at [${currentPath.join(' / ') || 'Root'}]: Corresponding main node not found.`);
        return overrides; // Return empty if no main node
    }

    const instanceIsContainer = ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'SECTION'].includes(instanceNode.type);
    const mainIsContainer = mainComponentNode && ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'SECTION'].includes(mainComponentNode.type); // Check mainComponentNode exists

    let typesMatch = instanceNode.type === mainComponentNode.type;
    if (!typesMatch && currentPath.length > 0) { // Log type mismatch for children only
        console.warn(`  ! Type mismatch at [${currentPath.join(' / ')}] (Instance: ${instanceNode.type} vs Main: ${mainComponentNode.type}). Skipping direct property comparison.`);
    }

    // 1. Compare Direct Properties - Only if types match
    if (typesMatch) {
        const propertiesToCompare = getComparableProperties(instanceNode);
        for (const prop of propertiesToCompare) {
            try {
                const instanceValue = instanceNode[prop];
                const mainValue = mainComponentNode[prop];

                if (instanceValue === figma.mixed || !Object.prototype.hasOwnProperty.call(mainComponentNode, prop)) {
                    continue;
                }

                if (!deepEqual(instanceValue, mainValue)) {
                    // Store the instance value as the override
                    overrides[prop] = JSON.parse(JSON.stringify(instanceValue)); // Store cloned value
                }
            } catch (e) {
                 console.warn(`    ! Error comparing property '${prop}' at [${currentPath.join(' / ') || 'Root'}]: ${e.message}`);
            }
        }
    }

    // 2. Compare Variant Properties - Special handling
     if (instanceNode.type === 'INSTANCE' && (mainComponentNode.type === 'COMPONENT' || mainComponentNode.type === 'COMPONENT_SET')) {
        const instanceVariantProps = instanceNode.variantProperties;
        const mainComponentDefaultProps = mainComponentNode.variantGroupProperties ?
            Object.entries(mainComponentNode.variantGroupProperties).reduce((defaults, [key, propInfo]) => {
                if (propInfo.defaultValue !== undefined) {
                     defaults[key] = propInfo.defaultValue;
                }
                return defaults;
            }, {}) : {};

        // Store the entire instance variant object if it differs from defaults
        if (instanceVariantProps && !deepEqual(instanceVariantProps, mainComponentDefaultProps)) {
            overrides['variantProperties'] = JSON.parse(JSON.stringify(instanceVariantProps));
        } else if (!instanceVariantProps && Object.keys(mainComponentDefaultProps).length > 0) {
             // Case where variants were reset to null/undefined but defaults exist
             overrides['variantProperties'] = null; // Explicitly record the reset
        }
     } else if (!typesMatch && instanceNode.type === 'INSTANCE') {
          // If instance is INSTANCE but main is not COMPONENT/SET (type mismatch)
          const instanceVariantProps = instanceNode.variantProperties;
          if (instanceVariantProps && Object.keys(instanceVariantProps).length > 0) {
              console.warn(`    ! Storing variantProperties override for INSTANCE node at [${currentPath.join(' / ') || 'Root'}] due to type mismatch (Main: ${mainComponentNode.type})`);
              overrides['variantProperties'] = JSON.parse(JSON.stringify(instanceVariantProps));
          }
     }


    // 3. Recursively Compare Children - Proceed if BOTH are containers
    if (instanceIsContainer && mainIsContainer && "children" in instanceNode && "children" in mainComponentNode) {
        const instanceChildren = instanceNode.children || [];
        const mainChildren = mainComponentNode.children || [];
        const childOverrides = {}; // Store overrides from children

        const mainChildrenMap = new Map();
        mainChildren.forEach((child, index) => {
            const key = `${child.name}_${index}`;
            mainChildrenMap.set(key, child);
        });

        for (let i = 0; i < instanceChildren.length; i++) {
            const instanceChild = instanceChildren[i];
            const mainChildKey = `${instanceChild.name}_${i}`;
            const mainChild = mainChildrenMap.get(mainChildKey) || mainChildren[i];
            const childPath = [...currentPath, instanceChild.name || `${instanceChild.type} ${i}`];

            // Recurse and get overrides object from child
            const nestedOverrides = await collectOverrides(instanceChild, mainChild, childPath);

            // Store child overrides only if they are not empty
            if (nestedOverrides && Object.keys(nestedOverrides).length > 0) {
                // Use index 'i' as key to maintain structure relative to instance
                childOverrides[i] = {
                     // Optionally add name/type for context, but focus on overrides
                     // name: instanceChild.name,
                     // type: instanceChild.type,
                    overrides: nestedOverrides
                };
            }
        }

        // Add collected child overrides to the current node's overrides object
        if (Object.keys(childOverrides).length > 0) {
            overrides['children'] = childOverrides;
        }
    }

    return overrides; // Return the collected overrides for this level
}


// --- Updated handleCopyStyle to collect and log the final overrides object ---
async function handleCopyStyle() {
  console.log("1. handleCopyStyle function called!");

  const selection = figma.currentPage.selection;
  console.log("2. Selection obtained:", selection.length, "item(s)");

  if (selection.length !== 1 || selection[0].type !== 'INSTANCE') {
    figma.notify("Please select exactly one instance node.");
    return;
  }
  const instanceNode = selection[0];
  console.log("4. Instance node identified:", instanceNode.id, instanceNode.name);

  try {
    console.log("5. Getting main component...");
    const mainComponent = await instanceNode.getMainComponentAsync();
    if (!mainComponent) {
        figma.notify("Error: Could not find the main component.");
        return;
    }
    console.log("8. Main component obtained:", mainComponent.id, mainComponent.name);

    // 9. Start collecting overrides
    console.log("9. Starting override collection...");
    const collectedOverrides = await collectOverrides(instanceNode, mainComponent); // Start recursion and get result

    // 10. Log the final collected overrides object
    console.log("10. Override collection finished.");

    // Log the raw object for interactive inspection in the browser console
    console.log("--- Collected Overrides (Raw Object) ---");
    console.log(collectedOverrides);

    // Log the pretty-printed JSON string for easy reading/copying
    console.log("--- Collected Overrides (JSON String) ---");
    try {
        const jsonString = JSON.stringify(collectedOverrides, null, 2); 
        console.log(jsonString);
        console.log(collectedOverrides);

        if (Object.keys(collectedOverrides).length > 0) {
             figma.notify("Override collection complete. Check console for details.");
        } else {
             figma.notify("No overrides found.");
        }
    } catch(e) {
         console.error("!!! Error stringifying collected overrides:", e);
         // Log the raw object again if stringify fails, as it might still be useful
         console.log("Raw collected overrides (stringify failed):", collectedOverrides);
         figma.notify("Collected overrides, but failed to display as JSON. Check console.");
    }

  } catch (error) {
    console.error("!!! Error caught in handleCopyStyle:", error);
    figma.notify(`Error collecting overrides: ${error.message}. Check console.`);
  }
}

// ... (rest of the code, including initializePlugin) ...
