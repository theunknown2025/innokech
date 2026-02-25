# Manual Schema Setup Guide

Since automated schema updates aren't working, please add the fields manually through the PocketBase admin UI:

## Steps:

1. Open PocketBase Admin UI: `http://127.0.0.1:8090/_/`
2. Navigate to: **Collections** → **clients**
3. Click on **"Fields"** tab (or **"Schema"**)
4. Click **"+ New field"** button
5. Add each field one by one with these settings:

### Required Fields:

1. **type** (Select)
   - Type: Select
   - Options: `personne_morale`, `personne_physique`
   - Required: Yes

2. **company_name** (Text)
   - Type: Text
   - Required: No

3. **ice** (Text)
   - Type: Text
   - Required: No

4. **company_address** (Text)
   - Type: Text
   - Required: No

5. **company_phone** (Text)
   - Type: Text
   - Required: No

6. **company_email** (Email)
   - Type: Email
   - Required: No

7. **representative_name** (Text)
   - Type: Text
   - Required: No

8. **representative_email** (Email)
   - Type: Email
   - Required: No

9. **representative_phone** (Text)
   - Type: Text
   - Required: No

10. **full_name** (Text)
    - Type: Text
    - Required: No

11. **address** (Text)
    - Type: Text
    - Required: No

12. **email** (Email)
    - Type: Email
    - Required: No

13. **phone** (Text)
    - Type: Text
    - Required: No

After adding all fields, refresh the page and you should see all fields when creating a new client record.

---

## Quotes collection - docNumber (optional)

To store document numbers (e.g. DEV-2025-ABC123) for Devis/Factures:

1. Navigate to: **Collections** → **quotes**
2. Click **"+ New field"**
3. Add **docNumber** (Text), Required: No

The PDF generator will display a number either from this field or generate one from the record ID.

---

## Company Settings collection (admin profile)

For the Profile page (Logo, Name, Address, Zip code, Email, Phone):

1. Create a new collection: **Collections** → **New collection**
2. Name: `company_settings`
3. Click **Create**
4. Add the following fields (click **+ New field**):

| Field name | Type  | Required |
|------------|-------|----------|
| logo       | File  | No       |
| name       | Text  | No       |
| address    | Text  | No       |
| zipCode    | Text  | No       |
| email      | Email | No       |
| phone      | Text  | No       |

5. **API Rules**: Ensure "List" and "View" and "Create" and "Update" are allowed for authenticated admins (or your auth rules).

The Profile page uses a single record from this collection. Create one record manually if needed, or save from the Profile form to create it.
