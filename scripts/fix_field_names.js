import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword('admin@innokech.com', 'adminINOOKECH@2025');

        console.log('Fetching clients collection...');
        const collection = await pb.collections.getOne('clients');
        
        console.log('Current fields:', collection.fields.map(f => f.name).join(', '));
        
        // Field name corrections
        const corrections = [
            { id: 'email1542800728', oldName: 'field', newName: 'company_email' },
            { id: 'text1559021502', oldName: 'adress', newName: 'address' },
            { id: 'email2134807182', oldName: 'field2', newName: 'email' }
        ];
        
        // Update each field
        for (const correction of corrections) {
            const field = collection.fields.find(f => f.id === correction.id);
            if (field && field.name === correction.oldName) {
                console.log(`\nRenaming "${correction.oldName}" to "${correction.newName}"...`);
                
                // Update the field name in the schema
                const updatedFields = collection.fields.map(f => {
                    if (f.id === correction.id) {
                        return { ...f, name: correction.newName };
                    }
                    return f;
                });
                
                // Update collection
                await pb.collections.update(collection.id, {
                    schema: updatedFields
                });
                
                console.log(`  ✅ Renamed successfully`);
            } else {
                console.log(`\n⚠️  Field "${correction.oldName}" (${correction.id}) not found or already renamed`);
            }
        }
        
        // Verify
        console.log('\nVerifying changes...');
        const updated = await pb.collections.getOne('clients');
        console.log('\nUpdated field names:');
        updated.fields.forEach(f => {
            console.log(`  - ${f.name} (${f.type})`);
        });
        
        console.log('\n✅ Field names updated successfully!');
        
    } catch (err) {
        console.error('Error:', err);
        if (err.response) {
            console.error('Response:', err.response);
        }
        process.exit(1);
    }
}

main();
