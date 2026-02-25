import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword('admin@innokech.com', 'adminINOOKECH@2025');

        console.log('Fetching clients collection...');
        const collection = await pb.collections.getOne('clients');
        
        console.log('Current fields:', collection.fields?.map(f => f.name).join(', ') || 'None');
        
        // Define fields to add
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
        
        console.log(`Adding ${missingFields.length} fields...`);
        
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
            
            updatedFields.push(fieldDef);
            console.log(`  - Added: ${field.name} (${field.type})`);
        }
        
        // Update collection using the raw API endpoint
        console.log('Updating collection...');
        const response = await pb.send('/api/collections/' + collection.id, {
            method: 'PATCH',
            body: JSON.stringify({
                schema: updatedFields
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Update response status:', response.status);
        
        // Verify
        const updated = await pb.collections.getOne('clients');
        console.log('\nVerification:');
        console.log('Total fields:', updated.fields?.length || 0);
        console.log('Field names:', updated.fields?.map(f => f.name).join(', '));
        
    } catch (err) {
        console.error('Error:', err);
        if (err.response) {
            console.error('Response data:', err.response);
        }
        if (err.data) {
            console.error('Error data:', err.data);
        }
        process.exit(1);
    }
}

main();
