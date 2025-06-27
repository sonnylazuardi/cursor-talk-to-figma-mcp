# Console Home (AI-Generated Specification)

## Overview

This document outlines the AI-generated specifications for the Console Home, providing example implementations and data structures for the central hub of Tech Infrastructure platforms at Grab. While these specifications serve as a helpful reference, developers should treat them as guidelines rather than strict requirements.

> **Note**: The code examples, types, and implementations in this document were generated with the assistance of AI to provide a conceptual framework. Actual implementation details may vary based on specific requirements and best practices. Developers are encouraged to adapt and modify these examples according to their needs.

## Full Design Specs [WIP]

https://www.figma.com/design/IMquhLc5IVZqTZbskGKlpV/GrabConsole?node-id=34-1221&t=ym9YzDNNPDDBSvOe-11

![image](/uploads/981736194deac24993638c4a02731a9b/image.png)

## Suggested Core Principles

1. **Intuitive Discovery & Access**
   - Smart search and comprehensive filtering
   - Favorite platforms pinned to top
   - Clear categorization and status indicators

2. **Streamlined Workflow**
   - Quick access to frequently used platforms
   - Customizable sorting and layout options
   - Seamless integration with tools

3. **Informed Decision Making**
   - Latest platform updates and announcements
   - Access to documentation and resources
   - Role-specific content and recommendations

## Example Data Structures

### Platform Card Data
```typescript
interface PlatformData {
  icons?: Blob;                   // Platform icons
  name: string;                   // Unique platform identifier
  display_name: string;           // Platform name (human readable)
  description: string;            // Platform description
  production_url: URL;            // Platform's production URL
  staging_url: URL;               // Platform's staging URL
  concedo_client_id: string;      // Concedo client ID
  categories?: string[];          // Platform categories
  primary_pic: string;            // Primary contact email
  useful_links?: LinkedText[];    // List of useful links, news and learning materials
  helix_entity_ref: string;       // Platform's Helix Entity Reference
  integration_level: 'l0' | 'l1' | 'l2';  // Integration level
}

interface LinkedText {
  id: string;
  type: 'news' | 'learn';        // Discriminator for item type
  title: string;
  description: string;
  url: URL;
  created: Date;                 // For sorting and "time ago" display
  created_by?: string;           // Optional author for news items
  action_required?: boolean;     // Indicates mandatory viewing
}
```

### Category Filter Data
```typescript
interface CategoryFilterData {
  visibleGroups: CategoryGroup[];    // Groups shown by default
  invisibleGroups: CategoryGroup[];  // Groups shown after clicking "more"
}

interface CategoryGroup {
  id: string;               // Unique identifier for the group
  name: string;            // Display name for the group
  options: CategoryOption[];// Array of category options
}

interface CategoryOption {
  id: string;                 // Unique identifier for the option
  name: string;              // Display name
  description?: string;      // Tooltip or detailed description
  metadata?: {
    highlight?: boolean;     // Whether to highlight the option
    badge?: {
      text: string;         // Badge display text
      status: BadgeStatus;  // Badge status
    };
  };
}

type BadgeStatus = 'success' | 'processing' | 'error' | 'warning' | 'default';
```

## Layout

![image](/uploads/dae8b3ffce1ee0263f28d0838bddfccc/image.png)

https://www.figma.com/design/IMquhLc5IVZqTZbskGKlpV/GrabConsole?node-id=34-1221&t=ym9YzDNNPDDBSvOe-11


The Console Home interface consists of six main sections:

1. **Top Navigation (Global)**
   - GrabConsole logo and Home navigation
   - Global search and settings
   - User profile menu

2. **Page Title / Description**
   - Main heading "Platforms"
   - Descriptive text explaining the platform's purpose

3. **Left Sidebar: Platform Filter Categories**
   - Recommend section (Favorites, New Grabbers, etc.)
   - Platform categories (Access Control, Data Observability, etc.)
   - Expandable category list with "More" option

4. **Quick Filter Bar**
   - Text search input for platforms
   - Sort options dropdown (Default, Last Updated, Recently Used)

5. **Platform Cards Grid**
   - 2-column responsive grid layout
   - Individual platform cards with detailed information
   - Interactive elements (View Details, Launch, Favorite)

6. **Pagination**
   - Page navigation controls
   - 10 platforms per page
   - Current page indicatorq

## UI Components

### ❶ \<PlatformFilterCategories />
Component for filtering and categorizing platforms.

#### Design

![image](/uploads/f72471ae9c7ea70085072e37a7921a17/image.png)

https://www.figma.com/design/IMquhLc5IVZqTZbskGKlpV/GrabConsole?node-id=34-1221&t=ym9YzDNNPDDBSvOe-11

#### Props
| Prop | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| userRole | string | Yes | User's role/function |
| selectedFilters | string[] | No | Selected filter IDs |
| onFilterChange | (filters: string[]) => void | Yes | Filter change handler |
| isLoading | boolean | No | Loading state |

#### Usage Example
```typescript
import { PlatformFilterCategories } from '@/components/Console';
import { useState } from 'react';

function ConsolePage() {
  const { userRole } = useUserContext();
  const searchParams = useSearchParams();
  const selectedFilters = searchParams.get('categories')?.split(',') || [];
  const [loading, setLoading] = useState(false);

  return (
    <PlatformFilterCategories
      userRole={userRole}
      selectedFilters={selectedFilters}
      onFilterChange={(filters) => {/* handle filter change */}}
      isLoading={loading}
    />
  );
}
```

#### Category Filter API

##### Request Parameters
| Parameter | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| userRole | string | Yes | User's role/function |

##### Response Fields
| Field | Type | Description |
| :---- | :---- | :---- |
| userRole | string | Current user role |
| visibleGroups | CategoryGroup[] | Category groups shown by default |
| invisibleGroups | CategoryGroup[] | Category groups shown after clicking "more" |

##### Error Codes
| HTTP Status | Code | Message | Description |
| :---- | :---- | :---- | :---- |
| 400 | INVALID_ROLE | Invalid user role | User role not recognized |
| 401 | UNAUTHORIZED | Authentication required | User not authenticated |
| 403 | FORBIDDEN | Access denied | Insufficient permissions |
| 500 | INTERNAL_ERROR | Server error | Unexpected server error |

##### Error Handling
Even in error scenarios (invalid role, unauthorized access, etc.), the API ensures graceful degradation by returning a minimal set of category groups. This includes essential categories like 'Favorites' and 'Recently visited', allowing the UI to maintain basic functionality.

##### Example Response
```json
{
  "userRole": "software_engineer",
  "visibleGroups": [
    {
      "id": "quick_access",
      "name": "Quick Access",
      "options": [
        {
          "id": "favorites",
          "name": "Favorites"
        },
        {
          "id": "recommended_for_you",
          "name": "Recommended for you",
          "description": "Platforms tailored to your role as Software Engineer"
        },
        {
          "id": "action_required",
          "name": "Action Required",
          "metadata": {
            "badge": {
              "text": "3",
              "status": "warning"
            }
          }
        },
        {
          "id": "budgeting_cycle",
          "name": "Budgeting Cycle",
          "metadata": {
            "highlight": true,
            "badge": {
              "text": "Active",
              "status": "success"
            }
          }
        }
      ]
    },
    {
      "id": "platform_category",
      "name": "Platform category",
      "options": [
        {
          "id": "access_control",
          "name": "Access Control"
        },
        {
          "id": "discovery",
          "name": "Discovery"
        },
        {
          "id": "data_observability",
          "name": "Data Observability"
        }
        // ... other platform categories
      ]
    },
    {
      "id": "sw_engineering_workflow",
      "name": "SW engineering workflow",
      "options": [
        {
          "id": "infrastructure_setup",
          "name": "Infrastructure Setup"
        },
        {
          "id": "code_development",
          "name": "Code Development"
        }
        // ... other workflow options
      ]
    }
  ],
  "invisibleGroups": [
    {
      "id": "data_engineering_workflow",
      "name": "Data engineering workflow",
      "options": [
        {
          "id": "data_pipeline",
          "name": "Data Pipeline"
        },
        {
          "id": "data_quality",
          "name": "Data Quality"
        }
        // ... other data workflow options
      ]
    }
  ]
}
```

### ❷ \<PlatformGrid />

#### Design 

![image](/uploads/6d08cf20e622198867b4545926615106/image.png)

https://www.figma.com/design/IMquhLc5IVZqTZbskGKlpV/GrabConsole?node-id=34-1221&t=ym9YzDNNPDDBSvOe-11


#### Quick Filter 
Quick filter provides a single text input field that filters platforms across multiple fields including id, name, description, and categories.

#### Sort Options
Platform cards can be sorted in three different ways via a dropdown menu:

1. **Default**
   - Favorites first, then alphabetically (A to Z)
   - Example: Favorited 'CDP' appears before favorited 'Superset', and both appear before non-favorited 'Account Vending Machine'

2. **Last Updated**
   - Sorted by most recent update date
   - Shows latest platform changes and updates first
   - Helps users track recent platform modifications

3. **Recently Used**
   - Sorted by user's platform visit/usage frequency
   - Brings frequently used platforms to the top
   - Personalizes the view based on user behavior

#### Grid Layout
- Displays 10 platform cards per page
- Responsive 2-column grid layout
- Pagination controls at the bottom
- Loading states for each card while fetching data

### ❸ \<PlatformCard />
Platform Card displays comprehensive information about each platform, including its basic details, status, and recent updates. The card provides interactive elements for navigation and notification of important updates.

#### Key Features
- Platform identification (name, icon, description)
- Environment indicators (production/staging)
- Quick access to platform URLs
- Update notifications and badges
- Favorite toggle functionality
- Category labels

#### Design 

![image](/uploads/bb2a78ee1539c310f164c3205f90cd74/image.png)

https://www.figma.com/design/IMquhLc5IVZqTZbskGKlpV/GrabConsole?node-id=34-1221&t=ym9YzDNNPDDBSvOe-11

#### Props
| Prop | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| icons | Blob | No | Platform icons |
| name | string | Yes | Unique platform identifier |
| displayName | string | Yes | Platform name (human readable) |
| description | string | Yes | Platform description |
| productionUrl | URL | Yes | Platform's production URL |
| stagingUrl | URL | Yes | Platform's staging URL |
| concedoClientId | string | Yes | Concedo client ID |
| categories | string[] | No | Platform categories |
| primaryPic | string | Yes | Primary contact email |
| usefulLinks | LinkedText[] | No | List of useful links, news and learning materials |
| helixEntityRef | string | Yes | Platform's Helix Entity Reference |
| integrationLevel | 'l0' \| 'l1' \| 'l2' | Yes | Integration level |

#### Basic Usage
```typescript
import { PlatformCard } from '@/components/Console';

function PlatformGrid() {
  return (
    <PlatformCard
      icons="https://console.engtools.net/icons/superset.svg"
      name="superset"
      displayName="Superset"
      description="Superset is a data visualization platform"
      productionUrl={new URL('https://superset.grab.com')}
      stagingUrl={new URL('https://superset-stg.myteksi.com')}
      concedoClientId="stg-example-app"
      categories={['Analytics & Visualization', 'Query Platform']}
      primaryPic="platform-team@grab.com"
      helixEntityRef="component:superset"
      integrationLevel="l2"
    />
  );
}
```