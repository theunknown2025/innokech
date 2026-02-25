import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword('admin@innokech.com', 'adminINOOKECH@2025');

        console.log('Checking if quotes collection exists...');
        let collection;
        try {
            collection = await pb.collections.getOne('quotes');
            console.log('Collection "quotes" already exists.');
        } catch (e) {
            console.log('Creating "quotes" collection...');
            collection = await pb.collections.create({
                name: 'quotes',
                type: 'base',
                schema: [
                    { name: 'type', type: 'select', options: { values: ['devis', 'facture'] }, required: true },
                    { name: 'clientId', type: 'relation', options: { collectionId: 'clients', maxSelect: 1 }, required: true },
                    { name: 'client', type: 'json', required: false },
                    { name: 'items', type: 'json', required: true },
                    { name: 'totalHT', type: 'number', required: true },
                    { name: 'tva', type: 'number', required: true },
                    { name: 'totalTTC', type: 'number', required: true },
                    { name: 'date', type: 'date', required: true }
                ]
            });
            console.log('Collection "quotes" created successfully.');
        }

        console.log('Quotes collection is ready!');
        
    } catch (err) {
        console.error('Error:', err);
        if (err.response) {
            console.error('Response:', err.response);
        }
        process.exit(1);
    }
}

main();
