import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword('admin@innokech.com', 'adminINOOKECH@2025');

        console.log('Fetching existing clients collection...');
        const collection = await pb.collections.getOne('clients');
        
        console.log('Collection data:', JSON.stringify(collection, null, 2));
        
        // Get existing schema (handle different API versions)
        const existingSchema = collection.schema || collection.fields || [];
        const existingFieldNames = existingSchema.map(f => f.name || f.id);
        
        console.log('Current fields:', existingFieldNames.join(', ') || 'None');
        
        // Define all the fields we need
        const requiredFields = [
            { name: 'type', type: 'select', options: { values: ['personne_morale', 'personne_physique'] }, required: true },
            { name: 'company_name', type: 'text', required: false },
            { name: 'ice', type: 'text', required: false },
            { name: 'company_address', type: 'text', required: false },
            { name: 'company_phone', type: 'text', required: false },
            { name: 'company_email', type: 'email', required: false },
            { name: 'representative_name', type: 'text', required: false },
            { name: 'representative_email', type: 'email', required: false },
            { name: 'representative_phone', type: 'text', required: false },
            { name: 'full_name', type: 'text', required: false },
            { name: 'address', type: 'text', required: false },
            { name: 'email', type: 'email', required: false },
            { name: 'phone', type: 'text', required: false }
        ];

        // Filter out fields that already exist
        const fieldsToAdd = requiredFields.filter(field => !existingFieldNames.includes(field.name));
        
        if (fieldsToAdd.length === 0) {
            console.log('All fields already exist. No updates needed.');
            return;
        }

        console.log(`Adding ${fieldsToAdd.length} new fields...`);
        
        // Build the schema update - keep existing fields and add new ones
        const updatedSchema = [...existingSchema];
        
        for (const field of fieldsToAdd) {
            const fieldConfig = {
                name: field.name,
                type: field.type,
                required: field.required || false,
                options: field.type === 'select' ? field.options : {}
            };
            
            updatedSchema.push(fieldConfig);
            console.log(`  - Adding field: ${field.name} (${field.type})`);
        }

        // Update the collection with the new schema
        // PocketBase requires fields to be formatted exactly as the API expects
        console.log('Updating collection schema...');
        
        // Format fields properly for PocketBase API - match the format from init_schema.js
        const formattedFields = updatedSchema.map(field => {
            // Keep existing fields as-is (they already have all properties)
            if (field.system || field.primaryKey) {
                return field;
            }
            
            // Format new fields according to PocketBase API spec
            const baseField = {
                name: field.name,
                type: field.type,
                required: field.required || false,
            };
            
            // Add type-specific options
            if (field.type === 'select' && field.options) {
                baseField.options = field.options;
            }
            
            return baseField;
        });
        
        console.log('Formatted fields:', JSON.stringify(formattedFields.slice(0, 3), null, 2));
        
        // Use the correct property name - PocketBase uses 'schema' for the field definitions
        const updateData = {
            schema: formattedFields
        };
        
        console.log('Updating with data:', JSON.stringify(updateData, null, 2).substring(0, 500));
        
        await pb.collections.update(collection.id, updateData);

        console.log('Collection schema updated successfully!');
        console.log('All fields:', updatedSchema.map(f => f.name).join(', '));
        
    } catch (err) {
        console.error('Error:', err);
        if (err.response) {
            console.error('Response:', err.response);
        }
        process.exit(1);
    }
}

main();
