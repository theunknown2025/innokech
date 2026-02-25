import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        console.log('Testing PocketBase connection...');
        
        // Try to connect
        await pb.admins.authWithPassword('admin@innokech.com', 'adminINOOKECH@2025');
        console.log('✅ Connected to PocketBase');
        
        // Check clients collection
        try {
            const collection = await pb.collections.getOne('clients');
            console.log('\n✅ Clients collection exists');
            console.log('Collection ID:', collection.id);
            console.log('Total fields:', collection.fields?.length || 0);
            
            if (collection.fields && collection.fields.length > 1) {
                console.log('\n✅ Schema fields found:');
                collection.fields.forEach(f => {
                    if (f.name !== 'id') {
                        console.log(`  - ${f.name} (${f.type})`);
                    }
                });
            } else {
                console.log('\n⚠️  Only ID field found. Schema fields need to be added.');
                console.log('Please add fields manually through the admin UI at: http://127.0.0.1:8090/_/');
            }
        } catch (e) {
            console.log('\n⚠️  Clients collection does not exist');
            console.log('Run: node scripts/init_schema.js to create it');
        }
        
    } catch (err) {
        if (err.message?.includes('ECONNREFUSED') || err.message?.includes('fetch')) {
            console.error('❌ Cannot connect to PocketBase');
            console.error('Make sure PocketBase is running on http://127.0.0.1:8090');
            console.error('Start it with: npm run backend');
        } else {
            console.error('❌ Error:', err.message);
        }
        process.exit(1);
    }
}

main();
