import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword('admin@innokech.com', 'adminINOOKECH@2025');

        console.log('Checking if collection exists...');
        let collection;
        try {
            collection = await pb.collections.getOne('clients');
            console.log('Collection exists. Deleting it...');
            await pb.collections.delete(collection.id);
            console.log('Collection deleted.');
        } catch (e) {
            console.log('Collection does not exist.');
        }

        console.log('\nCreating clients collection with schema...');
        
        // Use the raw send method to create collection with schema
        const collectionData = {
            name: 'clients',
            type: 'base',
            schema: [
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
            ]
        };

        console.log('Creating collection using SDK...');
        const result = await pb.collections.create(collectionData);
        
        console.log('Created collection:', result.name);
        console.log('Collection ID:', result.id);

        // Verify by fetching the collection
        console.log('\nVerifying collection...');
        const verify = await pb.collections.getOne('clients');
        console.log('Total fields:', verify.fields?.length || 0);
        
        if (verify.fields && verify.fields.length > 1) {
            console.log('\n✅ Success! Fields added:');
            verify.fields.forEach(f => {
                if (f.name !== 'id') {
                    console.log(`  - ${f.name} (${f.type})`);
                }
            });
        } else {
            console.log('\n⚠️  Warning: Only ID field found. Schema may not have been applied.');
            console.log('You may need to add fields manually through the admin UI.');
        }
        
    } catch (err) {
        console.error('Error:', err);
        if (err.response) {
            console.error('Response:', err.response);
        }
        if (err.data) {
            console.error('Error data:', JSON.stringify(err.data, null, 2));
        }
        process.exit(1);
    }
}

main();
