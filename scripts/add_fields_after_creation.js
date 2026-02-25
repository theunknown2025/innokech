import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword('admin@innokech.com', 'adminINOOKECH@2025');

        console.log('Fetching clients collection...');
        const collection = await pb.collections.getOne('clients');
        console.log('Collection ID:', collection.id);
        console.log('Current fields:', collection.fields?.length || 0);

        // Define all fields to add
        const fieldsToAdd = [
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

        const existingFieldNames = (collection.fields || []).map(f => f.name);
        const missingFields = fieldsToAdd.filter(f => !existingFieldNames.includes(f.name));

        if (missingFields.length === 0) {
            console.log('All fields already exist!');
            return;
        }

        console.log(`\nAdding ${missingFields.length} fields one by one...\n`);

        // Try adding fields one by one using the admin API
        for (const field of missingFields) {
            try {
                console.log(`Adding field: ${field.name} (${field.type})...`);
                
                // Get current collection state
                const currentCollection = await pb.collections.getOne('clients');
                const currentFields = [...(currentCollection.fields || [])];
                
                // Add the new field
                const newField = {
                    name: field.name,
                    type: field.type,
                    required: field.required || false
                };
                
                if (field.type === 'select' && field.options) {
                    newField.options = field.options;
                }
                
                currentFields.push(newField);
                
                // Update collection with new field
                await pb.collections.update(collection.id, {
                    schema: currentFields
                });
                
                console.log(`  ✅ Added: ${field.name}`);
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (err) {
                console.error(`  ❌ Failed to add ${field.name}:`, err.message);
            }
        }

        // Final verification
        console.log('\nFinal verification...');
        const final = await pb.collections.getOne('clients');
        console.log('Total fields:', final.fields?.length || 0);
        
        if (final.fields && final.fields.length > 1) {
            console.log('\n✅ Success! All fields:');
            final.fields.forEach(f => {
                console.log(`  - ${f.name} (${f.type})`);
            });
        } else {
            console.log('\n⚠️  Fields were not added. Please add them manually through the admin UI.');
        }
        
    } catch (err) {
        console.error('Error:', err);
        if (err.response) {
            console.error('Response:', err.response);
        }
        process.exit(1);
    }
}

main();
