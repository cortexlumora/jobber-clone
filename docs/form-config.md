# Form Builder Configuration Storage

## Overview

The request form builder stores its configuration (sections, fields, and their properties) as a single JSONB column (`config`) on the `request_forms` table. This approach was chosen because:

- The form config is always loaded and saved as a complete unit
- No need to query individual fields across forms
- The structure is flexible and may evolve
- Avoids complex joins to reconstruct form state

## Database Schema

```sql
-- request_forms table
id          UUID PRIMARY KEY
user_id     UUID NOT NULL (FK -> users)
name        VARCHAR(255) NOT NULL
description VARCHAR(1000)
config      JSONB                    -- <-- form builder config
is_default  BOOLEAN DEFAULT false
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

## Config JSON Shape

```json
{
  "sections": [
    {
      "id": "section-contact",
      "title": "Contact information",
      "fields": [
        {
          "id": "field-name",
          "type": "name_group",
          "label": "Name",
          "required": false
        },
        {
          "id": "field-email",
          "type": "email",
          "label": "Email",
          "required": true
        },
        {
          "id": "field-lead",
          "type": "lead_source",
          "label": "How did you hear about us?",
          "options": ["Google", "Facebook", "Referral", "Other"]
        },
        {
          "id": "field-area",
          "type": "area",
          "label": "Property size",
          "unit": "sq ft"
        }
      ]
    }
  ]
}
```

## Field Types

| Type               | Description                   | Extra Properties       |
|--------------------|-------------------------------|------------------------|
| `short_answer`     | Single-line text input        |                        |
| `long_answer`      | Multi-line textarea           |                        |
| `dropdown_single`  | Single-choice dropdown        | `options: string[]`    |
| `dropdown_multi`   | Multi-choice dropdown         | `options: string[]`    |
| `checkbox`         | Checkbox group                | `options: string[]`    |
| `radio`            | Radio button group            | `options: string[]`    |
| `number`           | Numeric input                 |                        |
| `image_upload`     | Image upload area             |                        |
| `yes_no`           | Yes/No toggle                 |                        |
| `date`             | Date picker                   |                        |
| `area`             | Length x Width input           | `unit: string`         |
| `name_group`       | First + Last name fields      |                        |
| `company_name`     | Company name input            |                        |
| `email`            | Email input + marketing opt-in|                        |
| `phone`            | Phone input + SMS opt-in      |                        |
| `address`          | Full address fields           |                        |
| `lead_source`      | Lead source dropdown          | `options: string[]`    |
| `products_services`| Product/service picker        |                        |

## Common Field Properties

| Property   | Type       | Required | Description                            |
|------------|------------|----------|----------------------------------------|
| `id`       | `string`   | Yes      | Unique identifier (e.g. `field-xxx`)   |
| `type`     | `string`   | Yes      | One of the field types above           |
| `label`    | `string`   | Yes      | Question/field label shown to user     |
| `required` | `boolean`  | No       | Whether the field is required          |
| `options`  | `string[]` | No       | Choices for dropdown/checkbox/radio    |
| `unit`     | `string`   | No       | Unit label for area fields             |

## API Endpoints

### Get a form (with config)
```
GET /api/v1/requests-bookings/forms/:id
```

### Update form config
```
PUT /api/v1/requests-bookings/forms/:id
Content-Type: application/json

{
  "config": {
    "sections": [...]
  }
}
```

## Auto-Save Behavior

The form builder automatically saves the config 1 second after any change (debounced). Changes that trigger a save:

- Adding/removing/reordering sections
- Adding/removing/reordering fields
- Updating field labels, required status, options, or units
- Updating section titles
- Drag-and-drop operations

On page load, the saved config is fetched from the API and hydrated into React state. If no config exists (new form), the default sections are used.

## Zod Validation

The config is validated on the backend using Zod:

```typescript
const formFieldSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  unit: z.string().optional(),
});

const formSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  fields: z.array(formFieldSchema),
});

const formConfigSchema = z.object({
  sections: z.array(formSectionSchema),
});
```
