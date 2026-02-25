import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword('admin@innokech.com', 'adminINOOKECH@2025');

        console.log('Fetching existing clients collection...');
        let collection;
        try {
            collection = await pb.collections.getOne('clients');
            console.log('Collection found. Current fields:', collection.fields?.length || 0);
            
            // Check if we need to update
            const fieldNames = (collection.fields || []).map(f => f.name);
            const requiredFields = ['type', 'company_name', 'ice', 'company_address', 'company_phone', 
                                   'company_email', 'representative_name', 'representative_email', 
                                   'representative_phone', 'full_name', 'address', 'email', 'phone'];
            
            const missingFields = requiredFields.filter(f => !fieldNames.includes(f));
            
            if (missingFields.length === 0) {
                console.log('All fields already exist!');
                return;
            }
            
            console.log('Missing fields:', missingFields.join(', '));
            
            // Delete the collection and recreate it with proper schema
            console.log('Deleting existing collection to recreate with proper schema...');
            await pb.collections.delete(collection.id);
            console.log('Collection deleted.');
            
        } catch (e) {
            console.log('Collection does not exist, will create new one.');
        }

        // Create collection with full schema
        console.log('Creating clients collection with full schema...');
        const newCollection = await pb.collections.create({
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
        });
        
        console.log('Collection created successfully!');
        console.log('Fields:', newCollection.schema?.map(f => f.name).join(', ') || 'N/A');
        
        // Verify
        const verify = await pb.collections.getOne('clients');
        console.log('Verification - Total fields:', verify.fields?.length || 0);
        console.log('Field names:', verify.fields?.map(f => f.name).join(', ') || 'N/A');
        
    } catch (err) {
        console.error('Error:', err);
        if (err.response) {
            console.error('Response:', JSON.stringify(err.response, null, 2));
        }
        process.exit(1);
    }
}

main();
