import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword('admin@innokech.com', 'adminINOOKECH@2025');

        console.log('Fetching quotes collection...');
        const collection = await pb.collections.getOne('quotes');
        console.log('Collection ID:', collection.id);
        console.log('Current fields:', collection.fields?.length || 0);

        const existingFieldNames = (collection.fields || []).map(f => f.name);
        console.log('Existing fields:', existingFieldNames.join(', '));

        // Fields to add
        const fieldsToAdd = [
            { name: 'type', type: 'select', options: { values: ['devis', 'facture'] }, required: true },
            { name: 'clientId', type: 'text', required: true }, // We'll use text instead of relation for simplicity
            { name: 'client', type: 'json', required: false },
            { name: 'items', type: 'json', required: true },
            { name: 'totalHT', type: 'number', required: true },
            { name: 'tva', type: 'number', required: true },
            { name: 'totalTTC', type: 'number', required: true },
            { name: 'date', type: 'date', required: true }
        ];

        const missingFields = fieldsToAdd.filter(f => !existingFieldNames.includes(f.name));

        if (missingFields.length === 0) {
            console.log('All fields already exist!');
            return;
        }

        console.log(`\nAdding ${missingFields.length} fields...`);

        // Get clients collection ID for relation
        let clientsCollectionId = null;
        try {
            const clientsCol = await pb.collections.getOne('clients');
            clientsCollectionId = clientsCol.id;
            console.log('Clients collection ID:', clientsCollectionId);
        } catch (e) {
            console.log('Could not find clients collection');
        }

        // Start with existing fields
        const updatedFields = [...(collection.fields || [])];

        // Add new fields
        for (const field of missingFields) {
            const fieldDef = {
                name: field.name,
                type: field.type,
                required: field.required || false
            };

            if (field.type === 'select' && field.options) {
                fieldDef.options = field.options;
            }

            // For relation field, use text instead (simpler)
            if (field.name === 'clientId' && clientsCollectionId) {
                // Keep as text for now - can be changed to relation later if needed
                fieldDef.type = 'text';
            }

            updatedFields.push(fieldDef);
            console.log(`  - Added: ${field.name} (${field.type})`);
        }

        // Update collection
        console.log('\nUpdating collection...');
        await pb.collections.update(collection.id, {
            schema: updatedFields
        });

        // Verify
        const updated = await pb.collections.getOne('quotes');
        console.log('\nVerification:');
        console.log('Total fields:', updated.fields?.length || 0);
        console.log('Field names:', updated.fields?.map(f => f.name).join(', '));

        console.log('\n✅ Fields added successfully!');
        console.log('\n⚠️  Note: You may need to add these fields manually through the PocketBase admin UI if the automated approach fails.');
        console.log('   Go to: http://127.0.0.1:8090/_/ and add the fields manually.');

    } catch (err) {
        console.error('Error:', err);
        if (err.response) {
            console.error('Response:', err.response);
        }
        process.exit(1);
    }
}

main();
